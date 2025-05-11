import {
  create,
  globSource
} from 'kubo-rpc-client'
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';

const ipfs = await create()

/**
 * Create an IPFS client
 * @param {string} apiUrl - The URL of the IPFS API
 * @returns {Object|null} - IPFS client or null if connection failed
 */
export async function createIPFSClient(apiUrl) {
  try {
    const client = create({
      url: apiUrl
    });

    // Test connection by getting version
    const version = await client.version();
    console.log(chalk.green('✓'), 'Connected to IPFS version:', version.version);

    return client;
  } catch (error) {
    console.error(chalk.red('Failed to connect to IPFS:'), error.message);
    return null;
  }
}

/**
 * Recursively add a directory to IPFS
 * @param {Object} ipfs - IPFS client
 * @param {string} dirPath - Directory path to add
 * @returns {string|null} - The CID of the added directory or null on failure
 */
export async function publishToIPFS(ipfs, dirPath) {
  try {
    console.log(chalk.blue('Adding directory to IPFS:'), chalk.green(dirPath));

    // Options for the directory addition

    const addOptions = {
      pin: true,
      wrapWithDirectory: true,
      recursive: true,
      timeout: 60000, // 60s timeout
      // progress: (bytes, file) => {
      //   console.log(`${file} ${bytes}`)
      // }
    };


    // Add the directory to IPFS
    console.log(chalk.yellow('Uploading files to IPFS... This may take a moment.'));

    let rootCid;
    for await (const result of ipfs.addAll(globSource('.', '**/*'), addOptions)) {
      // // console.log(result.path);



      // The last item will be the root directory
      if (result.path === '') {
        rootCid = result.cid.toString();
      }
    }

    if (!rootCid) {
      throw new Error('No CID returned for directory');
    }

    console.log(chalk.green('✓'), 'Directory successfully added to IPFS with CID:', rootCid);
    return rootCid;

  } catch (error) {
    console.error(chalk.red('Error adding to IPFS:'), error.message);
    return null;
  }
}