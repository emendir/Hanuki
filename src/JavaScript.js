var page_title = document.getElementById("page_title")
var title = document.getElementById("title")
var download_btn = document.getElementById("download_btn")
// var folder_sidebar = document.getElementById("FolderSidebar")
// var content_container = document.getElementById("content_container")
var folder_sidebar = null
var content_container = null
var codeBlock = null
var codeElement = null
var md_renderer = null
var inner_left = 0
var inner_top = 0
var resize = true
var DEFAULT_PAGE = "ReadMe.md"


var embedded = false // flag whether or not this site is running embedded in another site or standalone 
if (!(window === window.parent)) {
  embedded = true
  document.body.classList.remove("body_standalone")
  document.body.classList.add("body_embedded")
}

async function Resize(width, height) {
  if (!resize)
    return
  if (!width)
    width = window.innerWidth

  if (!height)
    height = window.innerHeight

  inner_left = Math.min(width / 4, 300);
  inner_top = Math.min(height / 6, 200);
  if (inner_left < 150) {
    inner_left = 0
    if (folder_sidebar)
      folder_sidebar.style.visibility = "hidden"
    download_btn.style.visibility = "hidden"
  } else {
    if (!folder_sidebar)
      await renderProjectPage()
    download_btn.style.visibility = "visible"
    folder_sidebar.style.visibility = "visible"
    folder_sidebar.width = inner_left;
    folder_sidebar.height = height - inner_top;
    folder_sidebar.style.top = inner_top;
  }
  if (inner_top < title.clientHeight) {
    inner_top = title.clientHeight
  }
  
  donate_btn.style.top = (inner_top - donate_btn.clientHeight)/3
  donate_btn.style.right = inner_top / 7
  
  download_btn.style.top = inner_top / 7
  download_btn.height = inner_top * 3 / 7
  download_btn.style.right = donate_btn.clientWidth + 2 * inner_top / 7
  
  github_btn.style.top = inner_top / 7
  github_btn.height = inner_top * 3 / 7
  github_btn.style.right = donate_btn.clientWidth + inner_top / 7 + download_btn.clientWidth  + 2 * inner_top / 7

  if (inner_top < 2 * title.clientHeight) {
    page_title.style.visibility = "hidden"
    title.style.top = 0
  } else {
    page_title.style.visibility = "visible"
    page_title.style.left = inner_left + 5;
    page_title.style.top = (inner_top - page_title.clientHeight) * 0.98;
  }
  
  if (height < title.clientHeight * 2 || height < 150) {
    if (content_container)
      content_container.style.visibility = "hidden"
    else {
      if (height > title.clientHeight * 1 || height > 75)
        setTimeout(renderProjectPage(), 0) //  start loading embedded HTML content at some stage
    }
  } else {
    await renderProjectPage()
    // DeactivateScrollbars()
    content_container.style.visibility = "visible"
    // 
    content_container.style.width = width - inner_left;
    content_container.style.left = inner_left;
    content_container.style.height = height - inner_top;
    codeElement.style.height = height - inner_top;
    codeBlock.style.height = height - inner_top;
    content_container.style.top = inner_top;

  }
  title.style.top = (inner_top - title.clientHeight) / 2;
  title.style.left = 10 + inner_left / 2;
}

Resize()

async function loadProjectPage(filePath){
  const file_type = getFileExtension(filePath);
  
  if (file_type == "md"){
      loadProjectMarkdownfile(filePath)      
  }
  else
    loadProjectCodefile(filePath)  
}

async function loadProjectCodefile(filePath) {
  // console.log(`Loading code file: ${filePath}`)
  if (filePath[0] != "/")
    filePath = "/" + filePath
  filePath = "./ProjectFiles" + filePath
  try {
    const language = getFileExtension(filePath);
    // Fetch the file content
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
    const codeContent = await response.text();
    delete codeElement.dataset.highlighted; // mark codeElement as not yet highlighted
    codeElement.className = `language-${language}`;
    codeElement.textContent = codeContent; // Insert fetched code
    
    // Apply syntax highlighting
    hljs.highlightElement(codeElement);
    md_renderer.style.visibility = "hidden"
    codeBlock.style.visibility = "visible"
  } catch (error) {
    console.error(error);
    const errorElement = document.createElement('div');
    errorElement.textContent = `Error loading file: ${error.message}`;
    document.getElementById('content').appendChild(errorElement);
  }
}

async function loadProjectMarkdownfile(filePath) {
  // console.log(`Loading markdown file: ${filePath}`)
  if (filePath[0] != "/")
    filePath = "/" + filePath
  md_renderer.src = `md_renderer.html#${filePath}`
  // console.log(md_renderer.src)
  md_renderer.style.visibility = "visible"
  codeBlock.style.visibility = "hidden"
}

function getFileExtension(filePath) {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts.pop() : ''; // Get the last part after the last dot
}
async function isLocalResource(path) {
  // console.log("Checking: " + path);

  if (path) {
    // Assume the query string represents a potential path
    var resourcePath = decodeURIComponent(path);

    try {
      const response = await fetch(resourcePath);

      if (response.ok) {
        // console.log(`Valid resource: ${resourcePath}`);
        return resourcePath;
      } else {
        const response = await fetch(resourcePath);

        if (response.ok) {
          // console.log(`Valid resource: ${resourcePath}`);
          return resourcePath;
        } else {
          // console.log(`Resource not found: ${resourcePath}`);
          return null;
        }
      }
    } catch (error) {
      console.error(`Error checking resource: ${error}`);
      return null;
    }
  } else {
    // console.log('No query string found.');
    return null;
  }
}

function removeMarkdownBackground(){
  md_renderer.contentDocument.body.style.background = "#0000"
}


async function renderProjectPage() {
  if (content_container) return

  const queryString = window.location.search;
  // Use URLSearchParams to parse the query string
  const urlParams = new URLSearchParams(queryString);

  // Extract the value of the 'file' key from the query string
  var fileValue = urlParams.get('file');

  content_container = document.createElement('div')
  content_container.id = "content_container"
  // Create a <pre><code> block
  codeBlock = document.createElement('pre');
  codeBlock.classList.add("ContentSub")
  codeBlock.style.visibility = "hidden"
  
  codeElement = document.createElement('code');
  
  md_renderer = document.createElement('iframe');
  md_renderer.id = "md_renderer"
  md_renderer.classList.add("ContentSub")
  
  // md_renderer.style.position = "absolute"
  md_renderer.style.visibility = "hidden"
  
  

  // Append elements to the container
  codeBlock.appendChild(codeElement);
  content_container.appendChild(codeBlock);
  content_container.appendChild(md_renderer);
  
  md_renderer.addEventListener("load", removeMarkdownBackground)
  
  content_container.id = "content"
  var resource = await isLocalResource("ProjectFiles/" + fileValue);

  if (resource == null)
    fileValue = DEFAULT_PAGE
  
  setUrlFile(fileValue);  
  loadProjectPage(fileValue)


  // content_container.class = "Content"
  content_container.style.position = "absolute"
  content_container.style.visibility = "hidden";
  document.body.appendChild(content_container);

  folder_sidebar = document.createElement('object')
  folder_sidebar.id = "folder_sidebar"
  folder_sidebar.data = "./TreeSidebar.html"
  // folder_sidebar.class = "FolderSidebar"
  folder_sidebar.style.position = "absolute"
  folder_sidebar.style.visibility = "hidden";
  document.body.appendChild(folder_sidebar);

  // folder_sidebar.contentWindow.addEventListener("load", OnLoad, false)

  folder_sidebar.addEventListener("load", async function(self, event) {
    folder_sidebar.contentWindow.addEventListener("load", OnLoad, false)
  }.bind(event, folder_sidebar))

  // content_container.contentWindow.addEventListener("mousemove", OnMouseMove.bind(event), false)
  // content_container.contentWindow.addEventListener("wheel", OnMouseWheel.bind(event, content_container), false)
  // content_container.contentWindow.addEventListener("mouseup", OnMouseUp.bind(event, content_container), false)
  
}

async function DownloadImageClickedOpaqueFilter(event) {
  var ctx = document.createElement("canvas").getContext("2d");
  // Get click coordinates
  var x = event.pageX - document.images["download"].offsetLeft,
    y = event.pageY - document.images["download"].offsetTop,
    w = ctx.canvas.width = document.images["download"].width,
    h = ctx.canvas.height = document.images["download"].height,
    alpha;

  // Draw image to canvas
  // and read Alpha channel value
  ctx.drawImage(document.images["download"], 0, 0, w, h);
  alpha = ctx.getImageData(x, y, 1, 1).data[3]; // [0]R [1]G [2]B [3]A

  // If pixel is transparent,
  // retrieve the element underneath and trigger it's click event
  if (alpha === 0) {
    document.images["download"].style.pointerEvents = "none";
    $(document.elementFromPoint(event.clientX, event.clientY)).trigger("click");
    document.images["download"].style.pointerEvents = "auto";
  } else {
    DownloadSource();
  }
}

async function DownloadSource() {
  const anchor = document.createElement('a');
  anchor.href = title.textContent + ".zip";
  anchor.download = title.textContent + ".zip";

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
async function setUrlFile(file_path) {
  // Extract the current URL components
  const currentUrl = new URL(window.location.href);

  // Use URLSearchParams to manipulate the query string
  const urlParams = currentUrl.searchParams;

  // Modify or add the 'file' key to the query string
  urlParams.set('file', file_path); // Set the new value (or modify if exists)

  // Update the browser's URL with the new query string, keeping the pathname and hash intact
  currentUrl.search = urlParams.toString(); // Update the query string part

  var new_url_str = currentUrl.href.replaceAll("%2F", "/");
  // Update the browser's URL without reloading the page
  window.history.pushState({}, '', new_url_str);


}

async function ChangeSiteSubpage(file, name = "") {
  if (name == "")
    name = file.split("/").reverse()[0].split(".")[0]
  // content_container.data = file;
  if (file[0] != "/")
    file = "/" + file
  loadProjectPage(file);
  setUrlFile(file.substring(1));
  page_title.innerHTML = name;
  // console.log("content_container.data: " + content_container.data);
  if (embedded) {
    // console.log("calling parent handler")
    parent.OnSiteSubPageChanged(file, name)
  } else {
    // console.log("Not embedded, so not calling parent handler")
  }
}

async function Scale(scale) {
  if (!content_container || !folder_sidebar || !folder_sidebar.contentDocument || !folder_sidebar.contentDocument.body) return
  page_title.style.fontSize = 25 * (0.2 + 2 / (1 + 2 ** (-10 * (scale - 0.8))))
  title.style.fontSize = 35 * (0.2 + 2 / (1 + 2 ** (-10 * (scale - 0.8))))
  // title.textContent = scale
  // folder_sidebar.contentWindow.Scale(scale)
  if (content_container.contentDocument){
  content_container.contentDocument.body.style.zoom = scale
  if (!folder_sidebar.contentDocument.body) return
  folder_sidebar.contentDocument.body.style.zoom = scale
}}

async function ActivateScrollbars() {
  if (!content_container || !folder_sidebar || !folder_sidebar.contentDocument || !folder_sidebar.contentDocument.body) return
  codeBlock.style.overflow = "auto"
  md_renderer.style.overflow = "auto"
  md_renderer.scrolling="yes"
  folder_sidebar.contentDocument.body.style.overflow = "auto"
}

async function DeactivateScrollbars() {
  if (!content_container || !folder_sidebar || !folder_sidebar.contentDocument || !folder_sidebar.contentDocument.body) return
  codeBlock.style.overflow = "hidden"
  md_renderer.style.overflow = "hidden"
  md_renderer.scrolling="no"
  folder_sidebar.contentDocument.body.style.overflow = "hidden"
}
document.onload = async function() {
  DeactivateScrollbars()
}

async function MakeContentSelectable() {
  content_container.style.pointerEvents = "auto"
}

async function MakeContentUnselectable() {
  content_container.style.pointerEvents = "none"
}

async function OnLoad() {
  MakeContentUnselectable()
  // DeactivateScrollbars()
}

async function OnMouseMove(e) {
  this.dispatchEvent(new MouseEvent('mousemove', e))
}

async function OnMouseWheel(e) {
  this.dispatchEvent(new MouseEvent('wheel', e))
}

async function OnMouseUp(e) {
  this.dispatchEvent(new MouseEvent('mouseup', e))
}