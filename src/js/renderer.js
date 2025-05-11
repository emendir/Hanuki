// renderer.js - Module for rendering project files and content

import { PROJECT_FILES_PATH, getFileExtension, getRelativeProjectPath } from './filesystem.js';

// UI Components for rendering (these will be initialized later)
let contentContainer = null;
let codeBlock = null;
let codeElement = null;
let mdRenderer = null;

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
    contentContainer.appendChild(errorElement);
  }
}

/**
 * Load and display a markdown file
 * @param {string} filePath - Path to the markdown file
 */
async function loadProjectMarkdownFile(filePath) {

  const relativePath = getRelativeProjectPath(filePath);
  console.log(`Loading MD: ${relativePath}`)

  // Pass the file path in the URL to the markdown renderer
  mdRenderer.src = `md_renderer.html#${relativePath}`;
  mdRenderer.style.visibility = "visible";
  codeBlock.style.visibility = "hidden";
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
  
  // Assemble content container
  codeBlock.appendChild(codeElement);
  contentContainer.appendChild(codeBlock);
  contentContainer.appendChild(mdRenderer);
  mdRenderer.addEventListener("load", removeMarkdownBackground);
}

// Scrollbar control functions
async function activateScrollbars() {
  if (!contentContainer) return;
  
  codeBlock.style.overflow = "auto";
  mdRenderer.style.overflow = "auto";
  mdRenderer.scrolling = "yes";
}

async function deactivateScrollbars() {
  if (!contentContainer) return;
  
  codeBlock.style.overflow = "hidden";
  mdRenderer.style.overflow = "hidden";
  mdRenderer.scrolling = "no";
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

// Export public API
export {
  loadProjectPage,
  initRenderer,
  activateScrollbars,
  deactivateScrollbars,
  makeContentSelectable,
  makeContentUnselectable
};