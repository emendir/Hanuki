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

// IPFS Configuration (loaded from project.toml)
let ipfsCid = null;

// Environment Detection
const isEmbedded = window !== window.parent;
if (isEmbedded) {
  document.body.classList.remove("body_standalone");
  document.body.classList.add("body_embedded");
}

/**
 * Load IPFS configuration from project.toml
 */
async function loadConfig() {
  try {
    console.log("Loading configuration from project.toml");
    const response = await fetch('./project.toml');
    if (!response.ok) {
      console.error(`[IPFS] Failed to load project.toml: ${response.statusText}`);
      return false;
    }

    const tomlContent = await response.text();
    console.log("project.toml content:", tomlContent);

    // Very simple TOML parser for our basic needs
    const cidMatch = tomlContent.match(/cid\s*=\s*"([^"]+)"/);
    const apiVersionMatch = tomlContent.match(/api_version\s*=\s*"([^"]+)"/);

    if (cidMatch && cidMatch[1]) {
      ipfsCid = cidMatch[1];
      console.log(`Loaded CID: ${ipfsCid}`);
    } else {
      console.error("[IPFS] Could not find IPFS CID in project.toml");
      return false;
    }

    return true;
  } catch (error) {
    console.error("[IPFS] Error loading IPFS config:", error);
    return false;
  }
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

// Initialize IPFS configuration and layout on load
loadConfig().then(() => {
  console.log("TOML Configuration loaded.");
  resize();
}).catch(error => {
  console.error("Failed to load IPFS configuration:", error);
  // Continue with layout initialization even if IPFS config fails
  resize();
});

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
  try {
    const language = getFileExtension(filePath);

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
 * Get a list of files and subfolders contained in a directory using IPFS API
 * @param {string} dirPath - Path to the directory to list
 * @returns {Array} Array of file/directory objects with paths and metadata
 */
async function listProjectDir(dirPath) {
  try {
    
    // Construct the IPFS path - for root directory use just the CID
    const url = `./ProjectFiles/${dirPath}?format=dag-json`;
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
      const base64Data = dagJson?.Data?.['/']?.bytes;
      const links = dagJson?.Links ?? [];
      return links;
    } catch (err) {
      console.error("Failed to fetch or decode:", err);
      return null;
    }

    if (!response.ok) {
      console.error(`[IPFS] API error response: ${await response.text()}`);
      throw new Error(`IPFS API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[IPFS] Directory list response:`, data);

    if (!data.Objects || !data.Objects[0] || !data.Objects[0].Links) {
      console.warn(`[IPFS] No links found in directory: ${dirPath || 'root'}`);
      return [];
    }

    // Process the links and return an array of file/directory paths with metadata
    const results = data.Objects[0].Links.map(link => {
      // Create a path relative to ProjectFiles for backward compatibility
      const relativePath = dirPath ? `${dirPath}/${link.Name}` : link.Name;

      return {
        path: relativePath,
        name: link.Name,
        isDirectory: link.Type === 1,  // Type 1 is directory, 2 is file
        size: link.Size,
        hash: link.Hash
      };
    });

    console.log(`[IPFS] Processed ${results.length} items in directory: ${dirPath || 'root'}`);
    return results;
  } catch (error) {
    console.error(`[IPFS] Error listing directory ${dirPath || 'root'}:`, error);
    return [];
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

  // Pass the IPFS CID in the URL to the markdown renderer
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
 * Check if a path is part of our project
 * @param {string} path - Path to check
 * @returns {string|null} Path if resource exists, null otherwise
 */
async function isProjectResource(path) {
  if (!path) return null;

  // If path starts with ProjectFiles/, remove it to get the relative path
  let relativePath = path;
  if (relativePath.startsWith('ProjectFiles/')) {
    relativePath = relativePath.substring('ProjectFiles/'.length);
  }

  try {
    
    // Use the IPFS API to check if the file exists
    // We can use the /ls API to check the file's parent directory
    const pathParts = relativePath.split('/');
    const fileName = pathParts.pop();
    const parentDir = pathParts.join('/');

    // Get the parent directory contents
    const dirContents = await listProjectDir(parentDir);

    // Check if any item in the directory matches the file name
    const fileExists = dirContents.some(item => item.name === fileName);

    return fileExists ? path : null;
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
  const resource = await isProjectResource(fileValue);

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
  console.log("Changing Site page to:");
  console.log(file);
  
  if (file[0] !== "/") {
    file = "/" + file;
  }
  file = `/ProjectFiles/${file}`
  
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