// filesystem.js - Module for interacting with the project filesystem

// Project filesystem configuration
const PROJECT_FILES_PATH = './ProjectFiles';
const DEFAULT_PAGE = 'ReadMe.md';

/**
 * Get a list of files and subfolders contained in a directory
 * @param {string} dirPath - Path to the directory to list
 * @returns {Array} Array of file/directory objects with paths and metadata
 */
async function listProjectDir(dirPath) {
  try {
    // Construct the path - for root directory use just the path
    const url = `${PROJECT_FILES_PATH}/${dirPath}?format=dag-json`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.ipld.dag-json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const dagJson = await response.json();
      const links = dagJson?.Links ?? [];
      return links;
    } catch (err) {
      console.error("Failed to fetch or decode:", err);
      return null;
    }
  } catch (error) {
    console.error(`Error listing directory ${dirPath || 'root'}:`, error);
    return [];
  }
}

/**
 * Normalize a path by removing redundant slashes and trimming leading/trailing slashes
 * @param {string} path - The path to normalize
 * @returns {string} A cleaned path string
 */
function normalizePath(path) {
  return path
    .replace(/\/{2,}/g, '/')      // Replace repeated slashes with one
    .replace(/^\.?\/*/, '')       // Remove leading './' or '/'
    .replace(/\/+$/, '');         // Remove trailing slashes
}

/**
 * Get the relative path from a full project path.
 * Strips the project files base path prefix and normalizes repeated slashes.
 * Handles flexible PROJECT_FILES_PATH formats like "./ProjectFiles", "/ProjectFiles", etc.
 * @param {string} fullPath - The full path to evaluate
 * @returns {string} The normalized relative path within the project
 */
function getRelativeProjectPath(fullPath) {
  if (!fullPath) return '';

  const normalizedFullPath = normalizePath(fullPath);
  const normalizedProjectPath = normalizePath(PROJECT_FILES_PATH);

  if (normalizedFullPath.startsWith(`${normalizedProjectPath}/`)) {
    return normalizedFullPath.substring(`${normalizedProjectPath}/`.length);
  }

  return normalizedFullPath;
}



/**
 * Check if a path is part of our project
 * @param {string} path - Path to check
 * @returns {string|null} Path if resource exists, null otherwise
 */
async function isProjectResource(path) {
  if (!path) return null;

  const relativePath = getRelativeProjectPath(path);

  try {
    const pathParts = relativePath.split('/');
    const fileName = pathParts.pop();
    const parentDir = pathParts.join('/');

    const dirContents = await listProjectDir(parentDir);
    const fileExists = dirContents.some(item => item.name === fileName);

    return fileExists ? path : null;
  } catch (error) {
    console.error(`Error checking resource: ${error}`);
    return null;
  }
}


/**
 * Extract file extension from a path
 * @param {string} filePath - Path to the file
 * @returns {string} File extension
 */
function getFileExtension(filePath) {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Load IPFS configuration from project.toml
 */
async function loadConfig() {
  try {
    console.log("Loading configuration from project.toml");
    const response = await fetch('./project.toml');
    if (!response.ok) {
      console.error(`Failed to load project.toml: ${response.statusText}`);
      return false;
    }

    const tomlContent = await response.text();
    console.log("project.toml content:", tomlContent);

    // Simple TOML parser for basic needs
    const cidMatch = tomlContent.match(/cid\s*=\s*"([^"]+)"/);
    const apiVersionMatch = tomlContent.match(/api_version\s*=\s*"([^"]+)"/);

    if (cidMatch && cidMatch[1]) {
      const ipfsCid = cidMatch[1];
      console.log(`Loaded CID: ${ipfsCid}`);
      return { cid: ipfsCid, apiVersion: apiVersionMatch?.[1] || 'v0' };
    } else {
      console.error("Could not find IPFS CID in project.toml");
      return false;
    }
  } catch (error) {
    console.error("Error loading IPFS config:", error);
    return false;
  }
}

// Export public API
export {
  PROJECT_FILES_PATH,
  DEFAULT_PAGE,
  loadConfig,
  listProjectDir,
  isProjectResource,
  getFileExtension,
  getRelativeProjectPath
};