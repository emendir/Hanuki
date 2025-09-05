#!/bin/bash

# Script to update and install the hanuki CLI tool
# without symlinking to the development directory

# the absolute path of this script's directory
SCRIPT_DIR="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
cd $SCRIPT_DIR

set -e  # Exit on error

# Step 1: Uninstall current global version
echo "Uninstalling current global version..."
npm rm -g hanuki


# Step 5: Install globally without symlinking
echo "Installing globally (without symlinking)..."
npm install -g --no-link "./"


# Step 6: Verify installation
echo "Verifying installation..."
HANUKI_PATH=$(which hanuki)
echo "Hanuki is installed at: $HANUKI_PATH"
hanuki --version

echo "Update complete! You can now use hanuki CLI with the updated website files."
