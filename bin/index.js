#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import toml from 'toml';
import { createIPFSClient, publishToIPFS } from './ipfs.js';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the source directory (one level up from bin)
const packageDir = path.resolve(__dirname, '..');
const sourceDir = path.resolve(packageDir, 'src');

// Import package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));

// Create the CLI program
const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

// Init command
program
  .command('init')
  .description('Installs hanuki in the current directory')
  .action(async () => {
    try {
      const targetDir = process.cwd();
      console.log(chalk.blue('Installing Hanuki in'), chalk.green(targetDir));
      
      // Check if hanuki is already installed
      if (fs.existsSync(path.join(targetDir, 'hanuki')) || 
          fs.existsSync(path.join(targetDir, 'index.html')) ||
          fs.existsSync(path.join(targetDir, 'hanuki.toml'))) {
        console.log(chalk.yellow('Hanuki seems to be already installed. Use'), 
                    chalk.green('hanuki update'), 
                    chalk.yellow('to update the installation.'));
        return;
      }
      
      // Copy hanuki directory
      await fs.copy(path.join(sourceDir, 'hanuki'), path.join(targetDir, 'hanuki'));
      console.log(chalk.green('✓'), 'Copied hanuki directory');
      
      // Copy index.html
      await fs.copy(path.join(sourceDir, 'index.html'), path.join(targetDir, 'index.html'));
      console.log(chalk.green('✓'), 'Copied index.html');
      
      // Create hanuki.toml with default values
      const tomlContent = `[ipfs]
# The Content ID (CID) of the project root on IPFS
cid = ""

# IPFS API version
api_version = "v0"
`;
      await fs.writeFile(path.join(targetDir, 'hanuki.toml'), tomlContent);
      console.log(chalk.green('✓'), 'Created hanuki.toml configuration file');
      
      console.log(chalk.green('\nHanuki has been successfully installed in the current directory.'));
      console.log(chalk.blue('To publish on IPFS, run:'), chalk.green('hanuki publish'));
    } catch (error) {
      console.error(chalk.red('Error during installation:'), error.message);
      process.exit(1);
    }
  });

// Update command
program
  .command('update')
  .description('Updates the hanuki installation in the current directory')
  .action(async () => {
    try {
      const targetDir = process.cwd();
      console.log(chalk.blue('Updating Hanuki in'), chalk.green(targetDir));
      
      // Check if hanuki is installed
      if (!fs.existsSync(path.join(targetDir, 'hanuki')) && 
          !fs.existsSync(path.join(targetDir, 'index.html'))) {
        console.log(chalk.yellow('Hanuki does not seem to be installed. Use'), 
                    chalk.green('hanuki init'), 
                    chalk.yellow('to install it first.'));
        return;
      }
      
      // Backup existing configuration
      let existingConfig = null;
      const configPath = path.join(targetDir, 'hanuki.toml');
      if (fs.existsSync(configPath)) {
        const configContent = await fs.readFile(configPath, 'utf8');
        try {
          existingConfig = toml.parse(configContent);
          console.log(chalk.green('✓'), 'Backed up existing configuration');
        } catch (e) {
          console.log(chalk.yellow('Warning: Could not parse existing configuration, will create a new one'));
        }
      }
      
      // Copy hanuki directory
      await fs.remove(path.join(targetDir, 'hanuki'));
      await fs.copy(path.join(sourceDir, 'hanuki'), path.join(targetDir, 'hanuki'));
      console.log(chalk.green('✓'), 'Updated hanuki directory');
      
      // Copy index.html
      await fs.copy(path.join(sourceDir, 'index.html'), path.join(targetDir, 'index.html'));
      console.log(chalk.green('✓'), 'Updated index.html');
      
      // Restore or create hanuki.toml with default values
      let tomlContent = `[ipfs]
# The Content ID (CID) of the project root on IPFS
cid = "${existingConfig?.ipfs?.cid || ''}"

# IPFS API version
api_version = "v0"
`;
      await fs.writeFile(configPath, tomlContent);
      console.log(chalk.green('✓'), 'Updated hanuki.toml configuration file');
      
      console.log(chalk.green('\nHanuki has been successfully updated in the current directory.'));
    } catch (error) {
      console.error(chalk.red('Error during update:'), error.message);
      process.exit(1);
    }
  });

// Publish command
program
  .command('publish')
  .description('Publishes the current directory on IPFS')
  .option('-g, --gateway <url>', 'IPFS API URL (default: http://localhost:5001)', 'http://localhost:5001')
  .action(async (options) => {
    try {
      const targetDir = process.cwd();
      console.log(chalk.blue('Publishing project to IPFS from'), chalk.green(targetDir));
      
      // Check if hanuki is installed
      if (!fs.existsSync(path.join(targetDir, 'hanuki')) || 
          !fs.existsSync(path.join(targetDir, 'index.html'))) {
        console.log(chalk.yellow('Hanuki does not seem to be installed. Use'), 
                    chalk.green('hanuki init'), 
                    chalk.yellow('to install it first.'));
        return;
      }
      
      // Connect to IPFS
      const ipfs = await createIPFSClient(options.gateway);
      if (!ipfs) {
        console.error(chalk.red('Failed to connect to IPFS. Make sure your IPFS daemon is running:'));
        console.error(chalk.green('ipfs daemon'));
        process.exit(1);
      }
      
      // Publish to IPFS
      const cid = await publishToIPFS(ipfs, targetDir);
      if (!cid) {
        console.error(chalk.red('Failed to publish to IPFS.'));
        process.exit(1);
      }
      
      // Update hanuki.toml with the new CID
      const configPath = path.join(targetDir, 'hanuki.toml');
      let config = {};
      
      if (fs.existsSync(configPath)) {
        const configContent = await fs.readFile(configPath, 'utf8');
        try {
          config = toml.parse(configContent);
        } catch (e) {
          console.log(chalk.yellow('Warning: Could not parse existing configuration, creating a new one'));
          config = { ipfs: {} };
        }
      } else {
        config = { ipfs: {} };
      }
      
      config.ipfs = config.ipfs || {};
      config.ipfs.cid = cid;
      config.ipfs.api_version = config.ipfs.api_version || 'v0';
      
      const tomlContent = `[ipfs]
# The Content ID (CID) of the project root on IPFS
cid = "${cid}"

# IPFS API version
api_version = "${config.ipfs.api_version}"
`;
      
      await fs.writeFile(configPath, tomlContent);
      console.log(chalk.green('✓'), 'Updated configuration with new CID');
      
      console.log(chalk.green('\nProject successfully published to IPFS!'));
      console.log(chalk.blue('CID:'), chalk.green(cid));
      console.log(chalk.blue('You can access your site at:'), chalk.green(`https://ipfs.io/ipfs/${cid}`));
      console.log(chalk.blue('Or with a local gateway:'), chalk.green(`http://localhost:8080/ipfs/${cid}`));
    } catch (error) {
      console.error(chalk.red('Error during publishing:'), error.message);
      process.exit(1);
    }
  });

program.parse();