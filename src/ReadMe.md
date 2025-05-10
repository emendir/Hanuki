This project is a static website for publishing code repositories on IPFS. It enables a web-browser to view the code repository with purely client-side dynamic rendering.

The left-hand sidebar with the tree-explorer for the project files is coded in `src/TreeSidebar.html`.
So far I've hard-coded the project tree into HTML list elements.
Let's replace this hard-coding of the project directory with a dynamic loading of the directory structure of the `ProjectFiles` folder.
I've a function in `JavaScript.js` that gets the absolute paths of the files and subfolders for a given path in the `ProjectFiles` folder.

Use this function to dynamically generate a tree-explorer. Feel free to make the GUI of the tree-explorer nicer and and more modern than what's currently in `src/TreeSidebar.html`, but nothing too fancy!
The requirements for the tree explorer are:
- show hierarchical folder structure for the `ProjectFiles` directory
- folders should be visually distinct from files
- folders should be collapsible
