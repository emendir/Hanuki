// ui.js - Module for managing the main website UI

import {
  PROJECT_FILES_PATH,
  DEFAULT_PAGE,
  isProjectResource,
  normalizePath,
  encodePathForUrl,
  decodePathFromUrl,
  getProjectFileUrl
} from './filesystem.js';
import {
  loadProjectPage,
  initRenderer
} from './renderer.js';

// DOM Elements
let pageTitle;
let siteTitle;
let downloadButton;
let donateButton;
let githubButton;
let projectIcon;

// UI Components
let folderSidebar = null;
let contentContainer = null;

// Layout Configuration
let innerLeft = 0;
let innerTop = 0;
let resizeEnabled = true;

// Environment Detection
const isEmbedded = window !== window.parent;

/**
 * Initialize UI elements
 */
function initUI() {
  // Get DOM elements
  pageTitle = document.getElementById("page_title");
  siteTitle = document.getElementById("title");
  downloadButton = document.getElementById("download_btn");
  donateButton = document.getElementById("donate_btn");
  githubButton = document.getElementById("github_btn");
  projectIcon = document.getElementById("project_icon");
  // Apply embedded class if needed
  if (isEmbedded) {
    document.body.classList.remove("body_standalone");
    document.body.classList.add("body_embedded");
  }

  // Set up an observer for the global configuration
  // Since configuration is loaded asynchronously after UI initialization
  const configObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && window.hanukiConfig) {
        updateUIFromConfig(window.hanukiConfig);
        configObserver.disconnect(); // Only need to run once when config is loaded
      }
    });
  });

  // Start observing document.body for changes
  configObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also check if config is already loaded (might happen in some cases)
  if (window.hanukiConfig) {
    updateUIFromConfig(window.hanukiConfig);
  }
}

/**
 * Resizes the layout based on window dimensions
 * @param {number} width - Window width (defaults to window.innerWidth)
 * @param {number} height - Window height (defaults to window.innerHeight)
 */
async function resize(width, height) {

  if (!resizeEnabled) {
    console.log("[Hanuki]: Resizing disabled.")
    return;
  }
  console.log("[Hanuki]: Resizing...")

  width = width || window.innerWidth;
  height = height || window.innerHeight;

  // Calculate sidebar width and top panel height
  innerLeft = Math.min(width / 4, 300);
  innerTop = Math.min(height / 6, 200);

  // Handle narrow screens
  if (innerLeft < 150) {
    innerLeft = 0;
    if (folderSidebar) folderSidebar.style.visibility = "hidden";
    downloadButton.style.visibility = "hidden";
  } else {
    if (!folderSidebar) await renderProjectPage();
    // downloadButton.style.visibility = "visible";
    folderSidebar.style.visibility = "visible";
    folderSidebar.width = innerLeft;
    folderSidebar.height = height - innerTop;

    folderSidebar.style.left = 0;
    folderSidebar.style.top = innerTop;
  }

  // Ensure minimum top space for title
  if (innerTop < siteTitle.clientHeight) {
    innerTop = siteTitle.clientHeight;
  }

  // Position UI elements
  positionUIElements(innerTop);

  // Handle page title visibility based on available space
  if (innerTop < 2 * siteTitle.clientHeight) {
    pageTitle.style.visibility = "hidden";
    siteTitle.style.top = 0;

    // projectIcon.style.visibility = "hidden";

  } else {
    // projectIcon.style.visibility = "visible";
    projectIcon.style.left = innerTop * 0.1;
    projectIcon.style.top = innerTop * 0.1;
    projectIcon.height = innerTop * 0.8;

    pageTitle.style.visibility = "visible";
    pageTitle.style.left = innerLeft + 5;
    pageTitle.style.left = folderSidebar.width;
    pageTitle.style.top = (innerTop - pageTitle.clientHeight) * 0.98;

  }

  // Handle content container visibility and sizing
  if (height < siteTitle.clientHeight * 2 || height < 150) {
    if (contentContainer) {
      contentContainer.style.visibility = "hidden";
    } else if (height > siteTitle.clientHeight || height > 75) {
      setTimeout(() => renderProjectPage(), 0); // Defer loading to improve responsiveness
    }
  } else {
    await renderProjectPage();
    // contentContainer.style.visibility = "visible";

    // Size content area
    contentContainer.style.width = width - innerLeft;
    contentContainer.style.left = innerLeft;
    contentContainer.style.height = height - innerTop;
    contentContainer.style.top = innerTop;
  }

  // Position main title
  siteTitle.style.top = (innerTop - siteTitle.clientHeight) / 2;
  siteTitle.style.left = folderSidebar.width;

}

/**
 * Positions UI elements based on available space
 * @param {number} topSpace - Available vertical space
 */
function positionUIElements(topSpace) {
  // Position donate button
  donateButton.style.top = (topSpace - donateButton.clientHeight) / 3;
  donateButton.style.right = topSpace / 7;

  // Position download button
  downloadButton.style.top = topSpace / 7;
  downloadButton.height = topSpace * 3 / 7;
  downloadButton.style.right = donateButton.clientWidth + 2 * topSpace / 7;

  // Position GitHub button
  githubButton.style.top = topSpace / 7;
  githubButton.height = topSpace * 3 / 7;

  // githubButton.style.right = donateButton.clientWidth + topSpace / 7 + downloadButton.clientWidth + 2 * topSpace / 7;
  githubButton.style.right = downloadButton.style.right;
}

function createProjectSiteContainer() {
  // Create content container
  contentContainer = document.createElement('div');

  // Set content ID and check if requested file exists
  contentContainer.id = "content";

  // Initialize the renderer with our container
  initRenderer(contentContainer);

  // Position and add content container to document
  contentContainer.style.position = "absolute";
  contentContainer.style.visibility = "hidden";
  document.body.appendChild(contentContainer);

  // Create and add folder sidebar
  folderSidebar = document.createElement('object');
  folderSidebar.id = "folder_sidebar";
  folderSidebar.data = `${window.location.origin}/${PROJECT_FILES_PATH}/_hanuki/TreeSidebar.html`;
  folderSidebar.style.position = "absolute";
  folderSidebar.style.visibility = "hidden";
  document.body.appendChild(folderSidebar);
}
/**
 * Render the project page with file content and sidebar
 */
async function renderProjectPage() {

  // Parse URL parameters to determine which file to display
  const urlParams = new URLSearchParams(window.location.search);
  let fileValue = decodePathFromUrl(urlParams.get('file'));
  const resource = await isProjectResource(fileValue);
  // console.log(`[renderProjectPage]: ${fileValue} ${resource === null}`)
  if (resource === null) {
    fileValue = DEFAULT_PAGE;
  }


  if (!contentContainer) {
    createProjectSiteContainer()

  }



  // Update URL and load content
  await setUrlFile(fileValue);
  loadProjectPage(fileValue);

  pageTitle.textContent = fileValue;
}

/**
 * Download source code as zip file
 */
async function downloadSource() {
  const projectName = window.hanukiConfig?.project?.name || siteTitle.textContent || "project";
  const safeProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");

  const anchor = document.createElement('a');
  anchor.href = safeProjectName + ".zip";
  anchor.download = safeProjectName + ".zip";

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * Update URL with file parameter
 * @param {string} filePath - Path to set in URL
 */
async function setUrlFile(filePath) {
  const currentUrl = new URL(window.location.href);
  const urlParams = currentUrl.searchParams;
  // const safePath = encodePathForUrl(filePath);

  // console.log(`Setting URL: ${filePath}`);
  urlParams.set('file', filePath);
  currentUrl.search = urlParams.toString();

  const newUrlStr = currentUrl.href.replaceAll("%2F", "/");
  try {
    window.history.pushState({}, '', newUrlStr);
  } catch {
    console.log("Failed to update URL.")
  }
}

/**
 * Change the displayed subpage
 * @param {string} file - File path to display, relative to PROJECT_FILES_PATH
 * @param {string} name - Display name (defaults to filename)
 */
async function changeSiteSubpage(file, name = "") {
  if (name === "") {
    name = file.split("/").reverse()[0].split(".")[0];
  }
  console.log("Changing Site page to:", file);

  // create clean absolute file path where root is PROJECT_FILES_PATH
  file = normalizePath(`/${file}`);
  // file = normalizePath(`/${PROJECT_FILES_PATH}/${file}`);

  loadProjectPage(file);
  setUrlFile(file);
  pageTitle.textContent = file;

  if (isEmbedded) {
    if (typeof parent.onSiteSubPageChanged === 'function') {
      parent.onSiteSubPageChanged(file, name);
    } else if (typeof parent.OnSiteSubPageChanged === 'function') {
      // Fallback for legacy implementation
      parent.OnSiteSubPageChanged(file, name);
    }
  }
}

/**
 * Scale UI elements
 * @param {number} scale - Scale factor
 */
async function scale(scale) {
  if (!contentContainer || !folderSidebar || !folderSidebar.contentDocument || !folderSidebar.contentDocument.body) return;

  // // Scale font sizes using logistic function
  // pageTitle.style.fontSize = 25 * (0.2 + 2 / (1 + 2 ** (-10 * (scale - 0.8))));
  // siteTitle.style.fontSize = 35 * (0.2 + 2 / (1 + 2 ** (-10 * (scale - 0.8))));

  // Scale content if available
  if (contentContainer.contentDocument) {
    contentContainer.contentDocument.body.style.zoom = scale;
    if (folderSidebar.contentDocument.body) {
      folderSidebar.contentDocument.body.style.zoom = scale;
    }
  }
}

// Event handlers
async function onLoad() {
  console.log("UI loaded");
}

async function onMouseMove(e) {
  this.dispatchEvent(new MouseEvent('mousemove', e));
}

async function onMouseWheel(e) {
  this.dispatchEvent(new MouseEvent('wheel', e));
}

async function onMouseUp(e) {
  this.dispatchEvent(new MouseEvent('mouseup', e));
}

/**
 * Updates UI elements based on the application configuration
 * @param {object} config - The application configuration object
 */
function updateUIFromConfig(config) {
  if (!config || !config.project) return;

  // Update title elements with the project name from config
  if (config.project.name) {
    // if (pageTitle) pageTitle.textContent = config.project.description;
    if (siteTitle) siteTitle.textContent = config.project.name;

    // Also update document title
    document.title = config.project.name;
  }

  // Set up GitHub button if repository URL is provided
  if (config.project.urls && config.project.urls.repository && githubButton) {
    githubButton.onclick = () => {
      window.open(config.project.urls.repository, '_blank');
    };
    githubButton.style.display = 'block';
  } else if (githubButton) {
    githubButton.style.display = 'none';
  }
  if (config.project.icon != "") {
    projectIcon.src = getProjectFileUrl(config.project.icon);
  }
}

function setResizeEnabled(enabled) {
  resizeEnabled = enabled;
}
window.setResizeEnabled = setResizeEnabled;
// Export public API
export {
  initUI,
  resize,
  downloadSource,
  changeSiteSubpage,
  scale,
  onLoad,
  onMouseMove,
  onMouseWheel,
  onMouseUp,
  setUrlFile,
  updateUIFromConfig
};