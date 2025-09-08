## General

- make title work as homepage
- fix browser's back button

## Config

- entry point (read from TOML `project.readme.file`)

## Renderer

- html: ¿use markdown renderer?
- html: update URL when clicking hyperlinks
- markdown & html: include anchored headers in URL (see `window.addEventListener('message'` in `src/hanuki/js/renderer.js`)
- fix renderer for code pages isn't scrollable
- pages sometimes take ages to load

## TreeView

- gitignore - implemented in config, but not yet in practice
- dot-folder seem not to be ignored
- highlight current file
- example "_docs_tools" seems not to be ignored

## Packaging

- Obsidian plugin
