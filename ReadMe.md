# Hanuki

Turn any code repository or markdown notebook into an explorable IPFS website.
It allows the user to explore a notebook or code repository in their browser with purely client-side dynamic rendering.

## Features

- syntax highlighting for code files
- rendering HTML and markdown
- multimedia support
- tree-explorer for the project files (dynamically lazily generated)
- fully offline-capable with local dependencies

## Installation

When Hanuki is installed to a project folder, it simply creates the following files:
  - `.hanuki`: contains most of the Hanuki static website code 
  - `index.html`: the web-browser's entry-point to the Hanuki static website code
  - `.hanuki.toml`: a configuration file to set things like the project name 

## Packaging

This project is packaged as an npm package which is used as a CLI tool.
The `hanuki` CLI tool has the following commands:
- `hanuki init`: Installs hanuki in the current directory.
- `hanuki update`: Updates the hanuki installation in the current directory.
- `hanuki publish`: Publishes the current directory on IPFS.

## Development

### Managing Dependencies

Hanuki now stores all external dependencies locally for offline use. To update these dependencies, edit the URLs in `bin/download-deps` and run it:

1. Run `./bin/download-deps.js` - This will download all required external dependencies to the `src/_hanuki/dependencies` folder.

This enables Hanuki to work completely offline without requiring access to CDNs or external resources.

### Bumping Versions

Use **`npm version`** → This updates the version field in `package.json` (and `package-lock.json`) according to [semver](https://semver.org/).

  * Examples:

    ```bash
    npm version patch   # 1.0.0 → 1.0.1
    npm version minor   # 1.0.0 → 1.1.0
    npm version major   # 1.0.0 → 2.0.0
    ```

  It also creates a Git tag if your project is in git.

## Known Issues

- Markdown embedded media partially broken: due to [bugs in Docsify, the markdown renderer used by Hanuki](https://github.com/docsifyjs/docsify/issues/1891)

## Name

Derived from the Japanese _Hanafubuki_ _花吹雪_, meaning something like, perhaps exaggeratedly translated, "blossom blizzard".
