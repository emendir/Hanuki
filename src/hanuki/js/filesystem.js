// filesystem.js - Module for interacting with the project filesystem

import { parseToml, mapToHanukiConfig } from './toml-parser.js';

// Project filesystem configuration
const PROJECT_FILES_PATH = '/';
const DEFAULT_PAGE = '/ReadMe.md';

/**
 * Replaces spaces with URL-safe symbols
 * @param {string} path - Path to encode
 * @returns {string} encoded path
 */
function encodePathForUrl(path) {
  if (path === null)
    return null
  return path
    .split("/")
    .map(encodeURIComponent) // encode each path segment
    .join("/");
}
function decodePathFromUrl(path) {
  if (path === null)
    return null
  return path
    .split("/")
    .map(decodeURIComponent) // encode each path segment
    .join("/");
}
function getProjectFileUrl(filePath) {
  const safePath = encodePathForUrl(getRelativeProjectPath(filePath));
  const fullPath = normalizePath(`/${PROJECT_FILES_PATH}/${safePath}`)
  return `${window.location.origin}${fullPath}`;
}
async function fetchProjectFile(filePath) {
  const response = await fetch(getProjectFileUrl(filePath));
  if (!response.ok) throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
  return await response.text();
}
/**
 * Get a list of files and subfolders contained in a directory
 * @param {string} dirPath - Path to the directory to list
 * @returns {Array} Array of file/directory objects with paths and metadata
 */
async function listProjectDir(dirPath) {
  try {
    const url = `${getProjectFileUrl(dirPath)}?format=dag-json`;
    // console.log(url);
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.ipld.dag-json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const dagJson = await response.json();
    const content = dagJson?.Data?.["/"]?.bytes;
    if (content == "CAE") {
      const links = dagJson?.Links ?? [];
      return links;
    } else
      return [];

  } catch (err) {
    console.error("Failed to fetch or decode:", err);
    return null;
  }
}


/**
 * Normalize a path by removing redundant slashes and trimming leading/trailing slashes
 * @param {string} path - The path to normalize
 * @returns {string} A cleaned path string
 */
function normalizePath(path) {
  return path
    .replace(/\/{2,}/g, '/') // Replace repeated slashes with one
  // .replace(/^\.?\/*/, '')       // Remove leading './' or '/'
  // .replace(/\/+$/, '');         // Remove trailing slashes
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
  // ensure we have a full path where the root is the PROJECT_FILES_PATH
  const relativePath = `${getRelativeProjectPath(path)}`;
  try {
    const pathParts = relativePath.split('/');
    const fileName = pathParts.pop();
    const parentDir = pathParts.join('/');

    const dirContents = await listProjectDir(parentDir);
    const fileExists = dirContents.some(item => item.Name === fileName);

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
 * Load configuration from hanuki.toml with fallback to pyproject.toml
 */
async function loadConfig() {
  try {
    // Try to load hanuki.toml first
    console.log("Attempting to load configuration from hanuki.toml");
    let response = await fetch('/hanuki.toml');

    // If hanuki.toml is not found, try to load pyproject.toml
    if (!response.ok) {
      console.log("hanuki.toml not found, attempting to load from pyproject.toml");
      response = await fetch('/pyproject.toml');

      // If both files are not found, throw an error
      if (!response.ok) {
        console.error("Failed to load configuration: Neither hanuki.toml nor pyproject.toml found");
        throw new Error("Configuration files not found");
      }

      console.log("Using pyproject.toml for configuration");
    } else {
      console.log("Using hanuki.toml for configuration");
    }

    const tomlContent = await response.text();
    console.log("TOML content:", tomlContent);

    // Parse TOML content using our custom parser
    const parsedToml = parseToml(tomlContent);
    console.log("Parsed TOML:", parsedToml);

    // Map to Hanuki configuration structure
    const config = mapToHanukiConfig(parsedToml);

    console.log("Loaded configuration:", config);
    return config;
  } catch (error) {
    console.error("Error loading config:", error);

    // Return a default configuration as fallback
    return {
      project: {
        name: "Unnamed Project",
        version: "0.1.0",
        description: "",
        authors: [],
        license: "",
        keywords: [],
        urls: {
          repository: "",
          documentation: "",
          homepage: ""
        }
      },
      ipfs: {
        cid: null,
        apiVersion: 'v0'
      },
      treeView: {
        useGitignore: true,
        include: [],
        ignore: []
      },
      ipfsPublishing: {
        useTreeViewIgnore: true,
        useGitignore: true,
        include: [],
        ignore: []
      }
    };
  }
}

/**
 * Check if a path should be ignored based on patterns
 * @param {string} path - The path to check
 * @param {object} config - Configuration object with ignore patterns
 * @param {string} mode - Either 'treeView' or 'ipfsPublishing'
 * @returns {boolean} - True if path should be ignored, false otherwise
 */
function shouldIgnorePath(path, config, mode = 'treeView') {
  if (!config) return false;

  // Normalize the path for consistent matching
  const normalizedPath = normalizePath(path);

  // Special case for Hanuki system files
  const hanukiSystemFiles = ['/hanuki', '/hanuki.toml', '/index.html'];

  if (mode === 'treeView') {
    // Always ignore Hanuki system files in TreeView
    if (hanukiSystemFiles.some(file => normalizedPath === file || normalizedPath.startsWith('/hanuki/'))) {
      return true; // Ignore this path in TreeView
    }
  } else if (mode === 'ipfsPublishing') {
    // Always include Hanuki system files when publishing to IPFS
    if (hanukiSystemFiles.some(file => normalizedPath === file || normalizedPath.startsWith('/hanuki/'))) {
      return false; // Don't ignore this path in IPFS publishing
    }
  }

  const configSection = mode === 'ipfsPublishing' ? config.ipfsPublishing : config.treeView;

  // If in ipfsPublishing mode and useTreeViewIgnore is true, we might need both configs
  let patterns = [];
  let includePatterns = [];

  if (mode === 'ipfsPublishing' && configSection.useTreeViewIgnore) {
    // Start with TreeView patterns
    patterns = [...config.treeView.ignore];
    includePatterns = [...config.treeView.include];

    // Then override with ipfsPublishing patterns
    patterns = patterns.concat(configSection.ignore);
    includePatterns = includePatterns.concat(configSection.include);
  } else {
    // Just use the directly applicable config
    patterns = configSection.ignore;
    includePatterns = configSection.include;
  }

  // Check if the path matches any include pattern (these override ignores)
  for (const pattern of includePatterns) {
    if (matchesPattern(normalizedPath, pattern)) {
      return false; // Don't ignore this path
    }
  }

  // Check if the path matches any ignore pattern
  for (const pattern of patterns) {
    if (matchesPattern(normalizedPath, pattern)) {
      console.log(`Ignoring: ${normalizedPath}`);
      return true; // Ignore this path
    }
  }

  // TODO: Add gitignore processing here if needed
  // This would require fetching and parsing .gitignore files

  return false; // Don't ignore by default
}

/**
 * Check if a path matches a glob pattern
 * @param {string} path - Path to check
 * @param {string} pattern - Glob pattern
 * @returns {boolean} - True if path matches pattern
 */
function matchesPattern(path, pattern) {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')   // Escape dots
    .replace(/\*/g, '.*')    // * becomes .*
    .replace(/\?/g, '.')     // ? becomes .
    .replace(/\/\*\*/g, '(\/.*)?') // /**/ becomes (/.*)? for directory wildcards

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Filter directory listing based on config settings
 * @param {Array} dirItems - Directory items from listProjectDir
 * @param {string} dirPath - Directory path
 * @param {object} config - Configuration object
 * @param {string} mode - Either 'treeView' or 'ipfsPublishing'
 * @returns {Array} - Filtered directory items
 */
function filterDirectoryItems(dirItems, dirPath, config, mode = 'treeView') {
  if (!config || !dirItems) return dirItems;

  return dirItems.filter(item => {
    const fullPath = `${dirPath}/${item.Name}`;
    return !shouldIgnorePath(fullPath, config, mode);
  });
}

// Export public API
export {
  PROJECT_FILES_PATH,
  DEFAULT_PAGE,
  loadConfig,
  listProjectDir,
  isProjectResource,
  getFileExtension,
  getRelativeProjectPath,
  normalizePath,
  encodePathForUrl,
  fetchProjectFile,
  getProjectFileUrl,
  decodePathFromUrl,
  shouldIgnorePath,
  filterDirectoryItems
};