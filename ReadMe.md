# Hanuki

Turn any code repository or markdown notebook into a website that can be hosted on IPFS.
It allows the user to explore a notebook or code repository in their browser with purely client-side dynamic rendering.

## Features

- syntax highlighting for code files
- rendering HTML and markdown
- multimedia support
- tree-explorer for the project files (dynamically lazily generated)

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

## Name

Derived from the Japanese _Hanafubuki_ _花吹雪_, meaning something like, perhaps exaggeratedly translated, "blossom blizzard".
