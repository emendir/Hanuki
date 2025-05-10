// DOM Elements
const pageTitle = document.getElementById("page_title");
const siteTitle = document.getElementById("title");
const downloadButton = document.getElementById("download_btn");
const donateButton = document.getElementById("donate_btn");
const githubButton = document.getElementById("github_btn");

// UI Components (initialized later)
let folderSidebar = null;
let contentContainer = null;
let codeBlock = null;
let codeElement = null;
let mdRenderer = null;

// Layout Configuration
let innerLeft = 0;
let innerTop = 0;
let resizeEnabled = true;
const DEFAULT_PAGE = "ReadMe.md";

// Environment Detection
const isEmbedded = window !== window.parent;
if (isEmbedded) {
  document.body.classList.remove("body_standalone");
  document.body.classList.add("body_embedded");
}

/**
 * Resizes the layout based on window dimensions
 * @param {number} width - Window width (defaults to window.innerWidth)
 * @param {number} height - Window height (defaults to window.innerHeight)
 */
async function resize(width, height) {
  if (!resizeEnabled) return;
  
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
    downloadButton.style.visibility = "visible";
    folderSidebar.style.visibility = "visible";
    folderSidebar.width = innerLeft;
    folderSidebar.height = height - innerTop;
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
  } else {
    pageTitle.style.visibility = "visible";
    pageTitle.style.left = innerLeft + 5;
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
    contentContainer.style.visibility = "visible";
    
    // Size content area
    contentContainer.style.width = width - innerLeft;
    contentContainer.style.left = innerLeft;
    contentContainer.style.height = height - innerTop;
    codeElement.style.height = height - innerTop;
    codeBlock.style.height = height - innerTop;
    contentContainer.style.top = innerTop;
  }
  
  // Position main title
  siteTitle.style.top = (innerTop - siteTitle.clientHeight) / 2;
  siteTitle.style.left = 10 + innerLeft / 2;
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
  githubButton.style.right = donateButton.clientWidth + topSpace / 7 + downloadButton.clientWidth + 2 * topSpace / 7;
}

// Initialize layout on load
resize();

/**
 * Load appropriate project file based on file type
 * @param {string} filePath - Path to the file
 */
async function loadProjectPage(filePath) {
  const fileType = getFileExtension(filePath);
  
  if (fileType === "md") {
    loadProjectMarkdownFile(filePath);
  } else {
    loadProjectCodeFile(filePath);
  }
}

/**
 * Load and display a code file with syntax highlighting
 * @param {string} filePath - Path to the code file
 */
async function loadProjectCodeFile(filePath) {
  if (filePath[0] !== "/") {
    filePath = "/" + filePath;
  }
  filePath = "./ProjectFiles" + filePath;
  
  try {
    const language = getFileExtension(filePath);
    
    // Fetch file content
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
    const codeContent = await response.text();
    
    // Update code element and apply highlighting
    delete codeElement.dataset.highlighted;
    codeElement.className = `language-${language}`;
    codeElement.textContent = codeContent;
    hljs.highlightElement(codeElement);
    
    // Show code view, hide markdown view
    mdRenderer.style.visibility = "hidden";
    codeBlock.style.visibility = "visible";
  } catch (error) {
    console.error(error);
    const errorElement = document.createElement('div');
    errorElement.textContent = `Error loading file: ${error.message}`;
    document.getElementById('content').appendChild(errorElement);
  }
}

/**
 * Load and display a markdown file
 * @param {string} filePath - Path to the markdown file
 */
async function loadProjectMarkdownFile(filePath) {
  if (filePath[0] !== "/") {
    filePath = "/" + filePath;
  }
  mdRenderer.src = `md_renderer.html#${filePath}`;
  mdRenderer.style.visibility = "visible";
  codeBlock.style.visibility = "hidden";
}

/**
 * Extract file extension from a path
 * @param {string} filePath - Path to the file
 * @returns {string} File extension
 */
function getFileExtension(filePath) {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts.pop() : '';
}

/**
 * Check if a resource exists at the specified path
 * @param {string} path - Path to check
 * @returns {string|null} Path if resource exists, null otherwise
 */
async function isLocalResource(path) {
  if (!path) return null;
  
  const resourcePath = decodeURIComponent(path);
  
  try {
    const response = await fetch(resourcePath);
    
    if (response.ok) {
      return resourcePath;
    } else {
      const retryResponse = await fetch(resourcePath);
      return retryResponse.ok ? resourcePath : null;
    }
  } catch (error) {
    console.error(`Error checking resource: ${error}`);
    return null;
  }
}

/**
 * Remove background from markdown renderer
 */
function removeMarkdownBackground() {
  mdRenderer.contentDocument.body.style.background = "#0000";
}

/**
 * Render the project page with file content and sidebar
 */
async function renderProjectPage() {
  if (contentContainer) return;
  
  // Parse URL parameters to determine which file to display
  const urlParams = new URLSearchParams(window.location.search);
  let fileValue = urlParams.get('file');
  
  // Create content container
  contentContainer = document.createElement('div');
  contentContainer.id = "content_container";
  
  // Create code display elements
  codeBlock = document.createElement('pre');
  codeBlock.classList.add("ContentSub");
  codeBlock.style.visibility = "hidden";
  codeElement = document.createElement('code');
  
  // Create markdown renderer
  mdRenderer = document.createElement('iframe');
  mdRenderer.id = "md_renderer";
  mdRenderer.classList.add("ContentSub");
  mdRenderer.style.visibility = "hidden";
  
  // Assemble content container
  codeBlock.appendChild(codeElement);
  contentContainer.appendChild(codeBlock);
  contentContainer.appendChild(mdRenderer);
  mdRenderer.addEventListener("load", removeMarkdownBackground);
  
  // Set content ID and check if requested file exists
  contentContainer.id = "content";
  const resource = await isLocalResource("ProjectFiles/" + fileValue);
  
  if (resource === null) {
    fileValue = DEFAULT_PAGE;
  }
  
  // Update URL and load content
  setUrlFile(fileValue);
  loadProjectPage(fileValue);
  
  // Position and add content container to document
  contentContainer.style.position = "absolute";
  contentContainer.style.visibility = "hidden";
  document.body.appendChild(contentContainer);
  
  // Create and add folder sidebar
  folderSidebar = document.createElement('object');
  folderSidebar.id = "folder_sidebar";
  folderSidebar.data = "./TreeSidebar.html";
  folderSidebar.style.position = "absolute";
  folderSidebar.style.visibility = "hidden";
  document.body.appendChild(folderSidebar);
  
  // Set up sidebar load event
  folderSidebar.addEventListener("load", function() {
    if (folderSidebar.contentWindow) {
      folderSidebar.contentWindow.addEventListener("load", onLoad, false);
    }
  });
}

/**
 * Download source code as zip file
 */
async function downloadSource() {
  const anchor = document.createElement('a');
  anchor.href = siteTitle.textContent + ".zip";
  anchor.download = siteTitle.textContent + ".zip";
  
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
  
  urlParams.set('file', filePath);
  currentUrl.search = urlParams.toString();
  
  const newUrlStr = currentUrl.href.replaceAll("%2F", "/");
  window.history.pushState({}, '', newUrlStr);
}

/**
 * Change the displayed subpage
 * @param {string} file - File path to display
 * @param {string} name - Display name (defaults to filename)
 */
async function changeSiteSubpage(file, name = "") {
  if (name === "") {
    name = file.split("/").reverse()[0].split(".")[0];
  }
  
  if (file[0] !== "/") {
    file = "/" + file;
  }
  
  loadProjectPage(file);
  setUrlFile(file.substring(1));
  pageTitle.innerHTML = name;
  
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
  
  // Scale font sizes using logistic function
  pageTitle.style.fontSize = 25 * (0.2 + 2 / (1 + 2 ** (-10 * (scale - 0.8))));
  siteTitle.style.fontSize = 35 * (0.2 + 2 / (1 + 2 ** (-10 * (scale - 0.8))));
  
  // Scale content if available
  if (contentContainer.contentDocument) {
    contentContainer.contentDocument.body.style.zoom = scale;
    if (folderSidebar.contentDocument.body) {
      folderSidebar.contentDocument.body.style.zoom = scale;
    }
  }
}

/**
 * Enable scrollbars on content elements
 */
async function activateScrollbars() {
  if (!contentContainer || !folderSidebar || !folderSidebar.contentDocument || !folderSidebar.contentDocument.body) return;
  
  codeBlock.style.overflow = "auto";
  mdRenderer.style.overflow = "auto";
  mdRenderer.scrolling = "yes";
  folderSidebar.contentDocument.body.style.overflow = "auto";
}

/**
 * Disable scrollbars on content elements
 */
async function deactivateScrollbars() {
  if (!contentContainer || !folderSidebar || !folderSidebar.contentDocument || !folderSidebar.contentDocument.body) return;
  
  codeBlock.style.overflow = "hidden";
  mdRenderer.style.overflow = "hidden";
  mdRenderer.scrolling = "no";
  folderSidebar.contentDocument.body.style.overflow = "hidden";
}

/**
 * Enable content selection
 */
async function makeContentSelectable() {
  contentContainer.style.pointerEvents = "auto";
}

/**
 * Disable content selection
 */
async function makeContentUnselectable() {
  contentContainer.style.pointerEvents = "none";
}

/**
 * Handle page load events
 */
async function onLoad() {
  makeContentUnselectable();
}

/**
 * Forward mouse move events
 */
async function onMouseMove(e) {
  this.dispatchEvent(new MouseEvent('mousemove', e));
}

/**
 * Forward mouse wheel events
 */
async function onMouseWheel(e) {
  this.dispatchEvent(new MouseEvent('wheel', e));
}

/**
 * Forward mouse up events
 */
async function onMouseUp(e) {
  this.dispatchEvent(new MouseEvent('mouseup', e));
}

// Expose functions for HTML use with both lowercase and PascalCase naming for compatibility
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