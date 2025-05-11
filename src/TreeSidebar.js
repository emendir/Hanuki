// File Explorer JavaScript

/**
 * Initializes the file explorer by creating the root directory view
 * and loading the initial directory structure.
 * 
 * This function is called when the document loads and sets up the
 * file tree explorer component.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function initFileExplorer() {
  const rootElement = document.getElementById('explorer');
  try {
    // Create the root folder (ProjectFiles)
    const rootName = '/';

    // Start by only loading the root level
    const rootPaths = await parent.listProjectDir(rootName);

    // Create the root container which will be visible initially
    const rootContainer = document.createElement('ul');
    rootContainer.classList.add('active');
    rootContainer.subPaths = rootPaths;
    rootContainer.dataset.path = rootName;

    // Populate only the root level initially
    await loadFolderContent(rootContainer, rootName);

    // Add to the explorer
    rootElement.appendChild(rootContainer);
  } catch (error) {
    console.error('Error initializing file explorer:', error);
  }
}

/**
 * Creates a DOM element representing a file in the file explorer.
 *
 * @param {string} path - The full path to the file
 * @param {string} name - The display name of the file
 * @returns {HTMLElement} - The DOM element representing the file
 */
function createFileNode(path, name) {
  const fileItem = document.createElement('li');
  fileItem.className = 'tree-item tree-file';

  const fileIcon = document.createElement('span');
  fileIcon.className = 'file-icon';

  const fileName = document.createElement('span');
  fileName.textContent = name;

  fileItem.appendChild(fileIcon);
  fileItem.appendChild(fileName);

  // Add click handler to open the file
  fileItem.addEventListener('click', function(event) {
    event.stopPropagation();
    parent.ChangeSiteSubpage(path, name);
  });

  return fileItem;
}

/**
 * Creates a DOM element representing a folder in the file explorer.
 * Includes click event handling for expanding/collapsing folders.
 *
 * @param {string} path - The full path to the folder
 * @param {string} name - The display name of the folder
 * @param {Array} subPaths - Array of file/folder objects contained in this folder
 * @returns {HTMLElement} - The DOM element representing the folder
 */
function createFolderNode(path, name, subPaths) {
  // Create the list item that will contain both the folder and its content
  const folderContainer = document.createElement('li');
  folderContainer.className = 'folder-container';

  // Create the folder item itself
  const folderItem = document.createElement('div');
  folderItem.className = 'tree-item tree-folder';
  folderItem.dataset.path = path;

  // Add folder icon
  const folderIcon = document.createElement('span');
  folderIcon.className = 'folder-icon';

  // Add folder name
  const folderName = document.createElement('span');
  folderName.textContent = name;

  folderItem.appendChild(folderIcon);
  folderItem.appendChild(folderName);

  // Create a container for folder contents
  const folderContent = document.createElement('ul');
  folderContent.dataset.loaded = 'false';
  folderContent.className = 'tree-folder-content';
  folderContent.dataset.path = path;
  folderContent.subPaths = subPaths;

  // Add click handler to toggle folder expansion and load content if needed
  folderItem.addEventListener('click', async function(event) {
    event.stopPropagation();
    folderIcon.classList.toggle('expanded');
    folderContent.classList.toggle('active');

    // If folder content isn't loaded yet, load it
    if (folderContent.dataset.loaded === 'false') {
      await loadFolderContent(folderContent);
      folderContent.dataset.loaded = 'true';
    }
  });

  // Add both elements to the container
  folderContainer.appendChild(folderItem);
  folderContainer.appendChild(folderContent);
  folderContainer.folderContent = folderContent;

  return folderContainer;
}

/**
 * Loads the content of a folder and adds it to the DOM.
 * This function is called when a folder is expanded for the first time.
 * Uses parent.listProjectDir to get folder contents and creates file/folder
 * nodes for each item.
 *
 * @async
 * @param {HTMLElement} folderContainer - The DOM element representing the folder container
 * @returns {Promise<HTMLElement>} - The updated folder container with child elements
 */
async function loadFolderContent(folderContainer) {
  // Process each item
  const fileNodes = [];
  const folderNodes = [];

  for (const pathItem of folderContainer.subPaths) {
    if (pathItem.Name === "/" || pathItem.Name === "" || pathItem.Name === ".") {
      continue;
    }

    const fullPath = `${folderContainer.dataset.path}/${pathItem.Name}`;
    
    try {
      const childPaths = await parent.listProjectDir(fullPath);
      const isFile = childPaths.length === 0;

      if (isFile) {
        // Create file node
        const fileNode = createFileNode(fullPath, pathItem.Name);
        fileNodes.push(fileNode);
      } else {
        // Create folder node without loading its contents yet
        const folderNode = createFolderNode(fullPath, pathItem.Name, childPaths);
        folderNodes.push(folderNode);
      }
    } catch (error) {
      console.error(`Error loading path ${fullPath}:`, error);
    }
  }

  // Add folders first, then files
  for (const item of folderNodes) {
    folderContainer.appendChild(item);
  }

  for (const item of fileNodes) {
    folderContainer.appendChild(item);
  }

  return folderContainer;
}

/**
 * Scales the font size of all tree items.
 * This function is called from the parent window to adjust the visualization.
 *
 * @param {number} scale - The scale factor to apply to the base font size (16px)
 */
function setFontScale(scaleFactor) {
  document.querySelectorAll('.tree-item').forEach(item => {
    item.style.fontSize = `${16 * scaleFactor}px`;
  });
}

// Keep legacy function name for backward compatibility
const Scale = setFontScale;

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', initFileExplorer);