// renderer.js - Module for rendering project files and content

import { PROJECT_FILES_PATH, isProjectResource, getFileExtension, getRelativeProjectPath, encodePathForUrl, decodePathFromUrl, fetchProjectFile, getProjectFileUrl, getAbsolutPath, normalizePath} from './filesystem.js';
import { setUrlFile } from './ui.js';

// UI Components for rendering (these will be initialized later)
let contentContainer = null;
let codeBlock = null;
let codeElement = null;
let mdRenderer = null;
let htmlRenderer = null;
let mediaContainer = null;
let current_path = "/";

// File type categories
const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
const VIDEO_TYPES = ['mp4', 'webm', 'ogg', 'mov'];
const AUDIO_TYPES = ['mp3', 'wav', 'ogg', 'flac'];

/**
 * Load appropriate project file based on file type
 * @param {string} filePath - Path to the file
 */
async function loadProjectPage(filePath) {
  filePath = getAbsolutPath(filePath, current_path)
  const fileType = getFileExtension(filePath);
  console.log(`loadProjectPage ${filePath}`)

  if (fileType === "md") {
    await loadProjectMarkdownFile(filePath);
  } else if (fileType === "html" || fileType === "htm") {
    await loadProjectHtmlFile(filePath);
  } else if (IMAGE_TYPES.includes(fileType)) {
    await loadProjectImageFile(filePath);
  } else if (VIDEO_TYPES.includes(fileType)) {
    await loadProjectVideoFile(filePath);
  } else if (AUDIO_TYPES.includes(fileType)) {
    await loadProjectAudioFile(filePath);
  } else {
    await loadProjectCodeFile(filePath);
  }
  
  current_path = filePath;
  await setUrlFile(current_path)
}
/**
 * Load and display a code file with syntax highlighting
 * @param {string} filePath - Path to the code file
 */
async function loadProjectCodeFile(filePath) {
  try {
    const language = getFileExtension(filePath);

    const codeContent = await fetchProjectFile(filePath);

    // Update code element and apply highlighting
    delete codeElement.dataset.highlighted;
    codeElement.className = `language-${language}`;
    codeElement.textContent = codeContent;
    hljs.highlightElement(codeElement);

    // Show code view, hide other views
    mdRenderer.style.visibility = "hidden";
    htmlRenderer.style.visibility = "hidden";
    mediaContainer.style.visibility = "hidden";
    codeBlock.style.visibility = "visible";
  } catch (error) {
    console.error(error);
    showErrorMessage(`Error loading file: ${error.message}`);
  }
}

/**
 * Load and display a markdown file
 * @param {string} filePath - Path to the markdown file
 */
async function loadProjectMarkdownFile(filePath) {
  const relativePath = getRelativeProjectPath(filePath);

  console.log("Initialising Markdown renderer");
  const basePath=`${window.location.origin}/${PROJECT_FILES_PATH}`;
  console.log(basePath);
  console.log(relativePath);
  // Create a new document for markdown rendering
  mdRenderer.src = 'about:blank';

  // Wait for iframe to load before configuring
  mdRenderer.onload = () => {
    const doc = mdRenderer.contentDocument;
    // Create basic HTML structure
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1.0, shrink-to-fit=no, viewport-fit=cover">
        <title>TITLE</title>
        <link rel="stylesheet" href="${basePath}/_hanuki/dependencies/docsify/themes/dark.css" />
      </head>
      <body>
        <div id="app"></div>
        <script>
          // Docsify Configuration
          window.$docsify = {
            name: 'Simple Docsify Template',
            basePath: '${basePath}',
            hideSidebar: true,
            homepage: '${relativePath}',
          };

          // Handle link clicks inside the renderer
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
              document.addEventListener('click', function(e) {
                if (e.target.tagName === 'A' && e.target.getAttribute('href')) {
                  const link = e.target.getAttribute('href');

                  // Only handle relative links (skip external links or anchors)
                  if (link && !link.startsWith('http') && !link.startsWith('#')) {
                    e.preventDefault();

                    // Send message to parent window
                    window.parent.postMessage({
                      type: 'markdown-link-click',
                      path: link
                    }, '*');
                  }
                  else if (link && link.startsWith('#/.')) {
                    
                    e.preventDefault();

                    // Send message to parent window
                    window.parent.postMessage({
                      type: 'markdown-link-click',
                      path: link.substr(2)
                    }, '*');
                  }
                  else if (link && link.startsWith('#')) {
                    
                    e.preventDefault();

                    // Send message to parent window
                    window.parent.postMessage({
                      type: 'markdown-link-click',
                      path: link.substr(1)
                    }, '*');
                  }
                }
              });
            }, 1000); // Give Docsify time to initialize and render content
          });
        </script>
        <script src="${basePath}/_hanuki/dependencies/docsify/lib/docsify.min.js"></script>
        <script src="${basePath}/_hanuki/dependencies/docsify/lib/plugins/zoom-image.min.js"></script>
        <script src="${basePath}/_hanuki/dependencies/docsify/lib/plugins/search.js"></script>
      </body>
      </html>
    `);
    doc.close();

    // Remove background when loaded
    setTimeout(() => {
      if (doc.body) {
        doc.body.style.background = "#0000";
      }
    }, 100);
  };

  mdRenderer.style.visibility = "visible";
  codeBlock.style.visibility = "hidden";
  htmlRenderer.style.visibility = "hidden";
  mediaContainer.style.visibility = "hidden";
}

/**
 * Load and display an HTML file as a rendered page
 * @param {string} filePath - Path to the HTML file
 */
async function loadProjectHtmlFile(filePath) {
  try {
    // Get full file URL
    const fileUrl = getProjectFileUrl(filePath);

    // Set the src of the iframe to display the HTML
    htmlRenderer.src = fileUrl;
    htmlRenderer.style.visibility = "visible";

    // Hide other content elements
    codeBlock.style.visibility = "hidden";
    mdRenderer.style.visibility = "hidden";
    mediaContainer.style.visibility = "hidden";
  } catch (error) {
    console.error(`Error loading HTML file: ${error}`);
    showErrorMessage(`Error loading HTML file: ${error.message}`);
  }
}

/**
 * Load and display an image file
 * @param {string} filePath - Path to the image file
 */
async function loadProjectImageFile(filePath) {
  try {
    // Clear previous media content
    mediaContainer.innerHTML = '';

    // Create image element
    const imgElement = document.createElement('img');
    imgElement.src = getProjectFileUrl(filePath);
    imgElement.style.maxWidth = '100%';
    imgElement.style.maxHeight = '100%';
    imgElement.style.objectFit = 'contain';

    // Add image to container
    mediaContainer.appendChild(imgElement);

    // Show media container and hide other content elements
    mediaContainer.style.visibility = "visible";
    codeBlock.style.visibility = "hidden";
    mdRenderer.style.visibility = "hidden";
    htmlRenderer.style.visibility = "hidden";
  } catch (error) {
    console.error(`Error loading image file: ${error}`);
    showErrorMessage(`Error loading image file: ${error.message}`);
  }
}

/**
 * Load and display a video file
 * @param {string} filePath - Path to the video file
 */
async function loadProjectVideoFile(filePath) {
  try {
    // Clear previous media content
    mediaContainer.innerHTML = '';

    // Create video element
    const videoElement = document.createElement('video');
    videoElement.src = getProjectFileUrl(filePath);
    videoElement.controls = true;
    videoElement.style.maxWidth = '100%';
    videoElement.style.maxHeight = '100%';

    // Add video to container
    mediaContainer.appendChild(videoElement);

    // Show media container and hide other content elements
    mediaContainer.style.visibility = "visible";
    codeBlock.style.visibility = "hidden";
    mdRenderer.style.visibility = "hidden";
    htmlRenderer.style.visibility = "hidden";
  } catch (error) {
    console.error(`Error loading video file: ${error}`);
    showErrorMessage(`Error loading video file: ${error.message}`);
  }
}

/**
 * Load and display an audio file
 * @param {string} filePath - Path to the audio file
 */
async function loadProjectAudioFile(filePath) {
  try {
    // Clear previous media content
    mediaContainer.innerHTML = '';

    // Create audio element
    const audioElement = document.createElement('audio');
    audioElement.src = getProjectFileUrl(filePath);
    audioElement.controls = true;
    audioElement.style.width = '80%';

    // Add audio to container
    mediaContainer.appendChild(audioElement);

    // Show media container and hide other content elements
    mediaContainer.style.visibility = "visible";
    codeBlock.style.visibility = "hidden";
    mdRenderer.style.visibility = "hidden";
    htmlRenderer.style.visibility = "hidden";
  } catch (error) {
    console.error(`Error loading audio file: ${error}`);
    showErrorMessage(`Error loading audio file: ${error.message}`);
  }
}

/**
 * Remove background from markdown renderer
 */
function removeMarkdownBackground() {
  mdRenderer.contentDocument.body.style.background = "#0000";
}


/**
 * Initialize renderer components
 * @param {HTMLElement} container - The container element for content
 */
function initRenderer(container) {
  contentContainer = container;

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

  // Create HTML renderer
  htmlRenderer = document.createElement('iframe');
  htmlRenderer.id = "html_renderer";
  htmlRenderer.classList.add("ContentSub");
  htmlRenderer.style.visibility = "hidden";
  htmlRenderer.sandbox = "allow-same-origin allow-scripts";

  // Create media container for images, videos, and audio
  mediaContainer = document.createElement('div');
  mediaContainer.id = "media_container";
  mediaContainer.classList.add("ContentSub");
  mediaContainer.style.visibility = "hidden";
  mediaContainer.style.display = "flex";
  mediaContainer.style.justifyContent = "center";
  mediaContainer.style.alignItems = "center";
  mediaContainer.style.overflow = "auto";

  // Set up message listener for link clicks from the iframe
  window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'markdown-link-click' && !event.data.path.includes("=")) {
      // const path = event.data.path;
      const path = decodePathFromUrl(event.data.path);
      if (path) {
        // Determine if path is absolute or relative
        let fullPath = path;

        if (!path.startsWith('/')) {
          // For relative paths, resolve against current path
          const currentPathParts = current_path.split('/') || [];
          if (currentPathParts.length > 0) {
            // Remove the filename part
            currentPathParts.pop();
            const currentDir = currentPathParts.join('/');
         fullPath = getAbsolutPath(path, currentDir);
          }
        }
          if(await isProjectResource(fullPath) == null && await isProjectResource(fullPath+".md") != null)
            fullPath+=".md";

        console.log(`Markdown link clicked: ${path}, navigating to: ${fullPath}`);

        // Update URL and load the new page
        await setUrlFile(decodePathFromUrl(fullPath));
        loadProjectPage(fullPath);
      }
    } else{
      console.log(`[MD-Renderer]: Unhandled event of type ${event.data.type} for path ${event.data.path}`)
    }
  });

  // Assemble content container
  codeBlock.appendChild(codeElement);
  contentContainer.appendChild(codeBlock);
  contentContainer.appendChild(mdRenderer);
  contentContainer.appendChild(htmlRenderer);
  contentContainer.appendChild(mediaContainer);
  mdRenderer.addEventListener("load", removeMarkdownBackground);
}

// Scrollbar control functions
async function activateScrollbars() {
  if (!contentContainer) return;

  codeBlock.style.overflow = "auto";
  mdRenderer.style.overflow = "auto";
  mdRenderer.scrolling = "yes";
  htmlRenderer.style.overflow = "auto";
  htmlRenderer.scrolling = "yes";
  mediaContainer.style.overflow = "auto";
}

async function deactivateScrollbars() {
  if (!contentContainer) return;

  codeBlock.style.overflow = "hidden";
  mdRenderer.style.overflow = "hidden";
  mdRenderer.scrolling = "no";
  htmlRenderer.style.overflow = "hidden";
  htmlRenderer.scrolling = "no";
  mediaContainer.style.overflow = "hidden";
}

// Content selection control
async function makeContentSelectable() {
  if (!contentContainer) return;
  contentContainer.style.pointerEvents = "auto";
}

async function makeContentUnselectable() {
  if (!contentContainer) return;
  contentContainer.style.pointerEvents = "none";
}

/**
 * Display an error message in the content container
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  // Clear any previous error messages
  const existingErrors = contentContainer.querySelectorAll('.error-message');
  existingErrors.forEach(el => el.remove());

  // Create and show new error message
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.style.color = 'red';
  errorElement.style.padding = '20px';
  errorElement.textContent = message;
  contentContainer.appendChild(errorElement);
}

// Export public API
export {
  loadProjectPage,
  initRenderer,
  activateScrollbars,
  deactivateScrollbars,
  makeContentSelectable,
  makeContentUnselectable
};
