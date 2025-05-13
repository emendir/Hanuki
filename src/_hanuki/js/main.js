// main.js - Main entry point for the application

import {
  loadConfig,
  listProjectDir,
  filterDirectoryItems
} from './filesystem.js';
import {
  activateScrollbars,
  deactivateScrollbars,
  makeContentSelectable,
  makeContentUnselectable
} from './renderer.js';
import {
  initUI,
  resize,
  downloadSource,
  changeSiteSubpage,
  scale,
  onLoad,
  onMouseMove,
  onMouseWheel,
  onMouseUp,
  updateUIFromConfig
} from './ui.js';

// Global configuration
window.hanukiConfig = null;
var config = null;


// Initialize the application
async function initApp() {
  // Initialize UI components
  initUI();

  // Load configuration
  config = await loadConfig();
  console.log("Configuration loaded:", config);

  // Store configuration globally
  window.hanukiConfig = config;

  // Update UI with configuration values
  updateUIFromConfig(config);

  // Initialize layout
  resize();

  // Dispatch from the container element
  window.dispatchEvent(initialised);
  
  
}

const initialised = new CustomEvent('initialised', {
  detail: {
    message: 'Hello from inside the content container!',
    timestamp: Date.now()
  }
});

function getConfig() {
  return config;
}
// Enhanced version of listProjectDir that applies filtering
async function listFilteredProjectDir(dirPath, mode = 'treeView') {
  const items = await listProjectDir(dirPath);

  if (window.hanukiConfig) {
    return filterDirectoryItems(items, dirPath, window.hanukiConfig, mode);
  }

  return items;
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for HTML use with both lowercase and PascalCase naming for compatibility
// Lowercase versions (modern convention)
window.resize = resize;
window.downloadSource = downloadSource;
window.changeSiteSubpage = changeSiteSubpage;
window.scale = scale;
window.activateScrollbars = activateScrollbars;
window.deactivateScrollbars = deactivateScrollbars;
window.makeContentSelectable = makeContentSelectable;
window.makeContentUnselectable = makeContentUnselectable;
window.onLoad = onLoad;
window.onMouseMove = onMouseMove;
window.onMouseWheel = onMouseWheel;
window.onMouseUp = onMouseUp;
window.listProjectDir = listProjectDir;
window.listFilteredProjectDir = listFilteredProjectDir;
window.getConfig = getConfig;

// Legacy PascalCase versions (for backward compatibility)
window.Resize = resize;
window.DownloadSource = downloadSource;
window.ChangeSiteSubpage = changeSiteSubpage;
window.Scale = scale;
window.ActivateScrollbars = activateScrollbars;
window.DeactivateScrollbars = deactivateScrollbars;
window.MakeContentSelectable = makeContentSelectable;
window.MakeContentUnselectable = makeContentUnselectable;
window.OnLoad = onLoad;
window.OnMouseMove = onMouseMove;
window.OnMouseWheel = onMouseWheel;
window.OnMouseUp = onMouseUp;
window.ListProjectDir = listProjectDir;
window.ListFilteredProjectDir = listFilteredProjectDir;