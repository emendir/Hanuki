#!/bin/bash

# Script to update and install the hanuki CLI tool
# without symlinking to the development directory

set -e  # Exit on error

# Step 1: Uninstall current global version
echo "Uninstalling current global version..."
npm rm -g hanuki

# # Step 2: Bump patch version
# echo "Bumping version..."
# npm version patch

# Step 3: Create package tarball
echo "Creating package tarball..."
npm pack

# Step 4: Get the tarball filename (latest version)
TARBALL=$(ls -t hanuki-*.tgz | head -1)
mv $TARBALL dist
TARBALL="./dist/$TARBALL"
echo "Using tarball: $TARBALL"


# # Step 5: Install globally without symlinking
# echo "Installing globally (without symlinking)..."
# npm install -g --no-link "./$TARBALL"
# 

# Step 5: Install globally without symlinking
echo "Installing globally (with symlinking)..."
npm link 


# Step 6: Verify installation
echo "Verifying installation..."
HANUKI_PATH=$(which hanuki)
echo "Hanuki is installed at: $HANUKI_PATH"
hanuki --version

echo "Update complete! You can now use hanuki CLI with the updated website files."