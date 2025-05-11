// main.js - Main entry point for the application

import { loadConfig, listProjectDir } from './filesystem.js';
import { activateScrollbars, deactivateScrollbars, makeContentSelectable, makeContentUnselectable } from './renderer.js';
import { initUI, resize, downloadSource, changeSiteSubpage, scale, onLoad, onMouseMove, onMouseWheel, onMouseUp } from './ui.js';

// Initialize the application
async function initApp() {
  // Initialize UI components
  initUI();
  
  // Load configuration
  const config = await loadConfig();
  console.log("TOML Configuration loaded:", config);
  
  // Initialize layout
  resize();
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