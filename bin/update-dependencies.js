#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const depsDir = path.join(rootDir, 'src', '_hanuki', 'dependencies');

// Dependencies structure with URLs
const dependencies = {
  'highlight.js': {
    // CSS
    'styles/dark.min.css': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/dark.min.css',
    // Core
    'highlight.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
    // Languages
    'languages/python.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js',
    'languages/javascript.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js',
    'languages/css.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/css.min.js',
    'languages/html.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/html.min.js',
    'languages/bash.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js',
    'languages/sh.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/sh.min.js',
    'languages/rust.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/rust.min.js'
  },
  'docsify': {
    // CSS
    'themes/dark.css': 'https://cdn.jsdelivr.net/npm/docsify/themes/dark.css',
    // Core
    'lib/docsify.min.js': 'https://cdn.jsdelivr.net/npm/docsify@4/lib/docsify.min.js',
    // Plugins
    'lib/plugins/zoom-image.min.js': 'https://cdn.jsdelivr.net/npm/docsify@4/lib/plugins/zoom-image.min.js',
    'lib/plugins/search.js': 'https://cdn.jsdelivr.net/npm/docsify@4/lib/plugins/search.js'
  }
};

/**
 * Create directories recursively if they don't exist
 */
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

/**
 * Download a file from a URL and save it to the specified path
 */
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    ensureDirectoryExists(filePath);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

/**
 * Main function to download all dependencies
 */
async function downloadDependencies() {
  console.log(chalk.blue('Downloading external dependencies...'));
  
  let totalFiles = 0;
  let downloadedFiles = 0;
  
  // Count total files
  for (const [libName, files] of Object.entries(dependencies)) {
    totalFiles += Object.keys(files).length;
  }
  
  for (const [libName, files] of Object.entries(dependencies)) {
    const libDir = path.join(depsDir, libName);
    
    // Ensure lib directory exists
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }
    
    for (const [filePath, url] of Object.entries(files)) {
      const fullPath = path.join(depsDir, libName, filePath);
      const relativePath = path.join('dependencies', libName, filePath);
      
      console.log(chalk.yellow(`Downloading: ${url}`));
      
      try {
        await downloadFile(url, fullPath);
        downloadedFiles++;
        console.log(chalk.green(`  ✓ Downloaded to: ${relativePath} [${downloadedFiles}/${totalFiles}]`));
      } catch (error) {
        console.log(chalk.red(`  ✗ Failed to download: ${url}`));
        console.error(error);
      }
    }
  }
  
  console.log(chalk.blue(`\nDownloaded ${downloadedFiles}/${totalFiles} files`));
}

// Execute the main function
downloadDependencies().catch(console.error);