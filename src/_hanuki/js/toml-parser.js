// toml-parser.js - Utility functions for parsing TOML configuration

/**
 * Parse a TOML string into a JavaScript object
 * 
 * This is a simplified TOML parser for Hanuki's needs.
 * It handles section headers, key-value pairs, booleans, strings, and arrays.
 * 
 * @param {string} tomlContent - The TOML content to parse
 * @returns {object} - The parsed configuration object
 */
function parseToml(tomlContent) {
  if (!tomlContent) return {};
  
  const result = {};
  let currentSection = null;
  
  // Split the TOML content into lines and process each line
  const lines = tomlContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (line === '' || line.startsWith('#')) continue;
    
    // Handle section headers: [SectionName]
    const sectionMatch = line.match(/^\[(.*)\]$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim();
      result[sectionName] = result[sectionName] || {};
      currentSection = sectionName;
      continue;
    }
    
    // Handle key-value pairs
    const keyValueMatch = line.match(/^([^=]+)=(.*)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1].trim();
      let value = keyValueMatch[2].trim();
      
      // Handle different value types
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value.startsWith('"') && value.endsWith('"')) {
        // Handle string value
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Handle array
        value = parseArray(value, lines, i);
      }
      
      // Store the value in the appropriate section
      if (currentSection) {
        result[currentSection][key] = value;
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Parse a TOML array, including multi-line arrays
 * 
 * @param {string} arrayStr - The array string to parse
 * @param {Array} lines - All lines of the TOML content
 * @param {number} lineIndex - The current line index
 * @returns {Array} - The parsed array
 */
function parseArray(arrayStr, lines, lineIndex) {
  // Handle empty array
  if (arrayStr === '[]') return [];
  
  // Remove brackets and split by commas
  let content = arrayStr.substring(1, arrayStr.length - 1).trim();
  
  // If the array continues to multiple lines, collect all lines
  if (content.endsWith(',') || !arrayStr.endsWith(']')) {
    let currentIndex = lineIndex + 1;
    while (currentIndex < lines.length) {
      const nextLine = lines[currentIndex].trim();
      if (!nextLine || nextLine.startsWith('#')) {
        currentIndex++;
        continue;
      }
      
      content += ',' + nextLine;
      if (nextLine.endsWith(']')) {
        content = content.substring(0, content.length - 1);
        break;
      }
      currentIndex++;
    }
  }
  
  // Parse each array item
  return content.split(',')
    .map(item => {
      item = item.trim();
      if (item === '') return null;
      
      // Handle string values
      if (item.startsWith('"') && item.endsWith('"')) {
        return item.substring(1, item.length - 1);
      }
      
      // Handle numeric values
      if (!isNaN(Number(item))) {
        return Number(item);
      }
      
      // Handle boolean values
      if (item === 'true') return true;
      if (item === 'false') return false;
      
      return item;
    })
    .filter(item => item !== null);
}

  const DEFAULT_CONFIG = {
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
      },
      icon:"",
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
/**
 * Map the TOML configuration to the Hanuki configuration structure
 *
 * @param {object} parsedToml - The parsed TOML object
 * @returns {object} - The Hanuki configuration object
 */
function mapToHanukiConfig(parsedToml) {
  var config = DEFAULT_CONFIG;
  // Map Project section
  if (parsedToml.project) {
    // Map basic project fields
    config.project.name = parsedToml.project.name || DEFAULT_CONFIG.project.name;
    config.project.version = parsedToml.project.version || DEFAULT_CONFIG.project.version;
    config.project.description = parsedToml.project.description || DEFAULT_CONFIG.project.description;
    config.project.authors = Array.isArray(parsedToml.project.authors) ?
      parsedToml.project.authors : DEFAULT_CONFIG.project.authors;
    config.project.license = parsedToml.project.license || DEFAULT_CONFIG.project.license;
    config.project.keywords = Array.isArray(parsedToml.project.keywords) ?
      parsedToml.project.keywords : DEFAULT_CONFIG.project.keywords;

    config.project.icon = parsedToml.project.icon || DEFAULT_CONFIG.project.icon;
    
    // Map URLs from project.urls section
    if (parsedToml.project.urls) {
      // First check for repository, then fall back to github if repository isn't specified
      config.project.urls.repository = parsedToml.project.urls.repository ||
                                       parsedToml.project.urls.github ||
                                       DEFAULT_CONFIG.project.urls.repository;
      config.project.urls.documentation = parsedToml.project.urls.documentation || DEFAULT_CONFIG.project.urls.documentation;
      config.project.urls.homepage = parsedToml.project.urls.homepage || DEFAULT_CONFIG.project.urls.homepage;
    }
  }

  // Handle the case where project.urls is a separate section (e.g., [project.urls])
  if (parsedToml["project.urls"]) {
    // First check for repository, then fall back to github if repository isn't specified
    config.project.urls.repository = parsedToml["project.urls"].repository ||
                                     parsedToml["project.urls"].github ||
                                     DEFAULT_CONFIG.project.urls.repository;
    config.project.urls.documentation = parsedToml["project.urls"].documentation || DEFAULT_CONFIG.project.urls.documentation;
    config.project.urls.homepage = parsedToml["project.urls"].homepage || DEFAULT_CONFIG.project.urls.homepage;
  }


  // Map tree-view section (lowercase with hyphen)
  if (parsedToml['tree-view']) {
    config.treeView.useGitignore = parsedToml['tree-view'].use_gitignore !== undefined ?
      parsedToml['tree-view'].use_gitignore : DEFAULT_CONFIG.treeView.useGitignore;
    config.treeView.include = Array.isArray(parsedToml['tree-view'].include) ?
      parsedToml['tree-view'].include : DEFAULT_CONFIG.treeView.include;
    config.treeView.ignore = Array.isArray(parsedToml['tree-view'].ignore) ?
      parsedToml['tree-view'].ignore : DEFAULT_CONFIG.treeView.ignore;
  }
  // For backward compatibility
  else if (parsedToml.TreeView) {
    config.treeView.useGitignore = parsedToml.TreeView.use_gitignore !== undefined ?
      parsedToml.TreeView.use_gitignore : DEFAULT_CONFIG.treeView.useGitignore;
    config.treeView.include = Array.isArray(parsedToml.TreeView.include) ?
      parsedToml.TreeView.include : DEFAULT_CONFIG.treeView.include;
    config.treeView.ignore = Array.isArray(parsedToml.TreeView.ignore) ?
      parsedToml.TreeView.ignore : DEFAULT_CONFIG.treeView.ignore;
  }

  // Map ipfs-publishing section (lowercase with hyphen)
  if (parsedToml['ipfs-publishing']) {
    config.ipfsPublishing.useTreeViewIgnore = parsedToml['ipfs-publishing'].use_treeview_ignore !== undefined ?
      parsedToml['ipfs-publishing'].use_treeview_ignore : DEFAULT_CONFIG.ipfsPublishing.useTreeViewIgnore;
    config.ipfsPublishing.useGitignore = parsedToml['ipfs-publishing'].use_gitignore !== undefined ?
      parsedToml['ipfs-publishing'].use_gitignore : DEFAULT_CONFIG.ipfsPublishing.useGitignore;
    config.ipfsPublishing.include = Array.isArray(parsedToml['ipfs-publishing'].include) ?
      parsedToml['ipfs-publishing'].include : DEFAULT_CONFIG.ipfsPublishing.include;
    config.ipfsPublishing.ignore = Array.isArray(parsedToml['ipfs-publishing'].ignore) ?
      parsedToml['ipfs-publishing'].ignore : DEFAULT_CONFIG.ipfsPublishing.ignore;
  }
  // For backward compatibility
  else if (parsedToml.IpfsPublishing) {
    config.ipfsPublishing.useTreeViewIgnore = parsedToml.IpfsPublishing.use_treeview_ignore !== undefined ?
      parsedToml.IpfsPublishing.use_treeview_ignore : DEFAULT_CONFIG.ipfsPublishing.useTreeViewIgnore;
    config.ipfsPublishing.useGitignore = parsedToml.IpfsPublishing.use_gitignore !== undefined ?
      parsedToml.IpfsPublishing.use_gitignore : DEFAULT_CONFIG.ipfsPublishing.useGitignore;
    config.ipfsPublishing.include = Array.isArray(parsedToml.IpfsPublishing.include) ?
      parsedToml.IpfsPublishing.include : DEFAULT_CONFIG.ipfsPublishing.include;
    config.ipfsPublishing.ignore = Array.isArray(parsedToml.IpfsPublishing.ignore) ?
      parsedToml.IpfsPublishing.ignore : DEFAULT_CONFIG.ipfsPublishing.ignore;
  }

  return config;
}

// Export public API
export {
  parseToml,
  mapToHanukiConfig,
  DEFAULT_CONFIG
};