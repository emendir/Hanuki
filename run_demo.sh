#!/bin/bash

set -e # Exit if any command fails

# the absolute paths of this script and it's directory
SCRIPT_PATH=$(realpath -s "$0")
SCRIPT_DIR=$(dirname "$SCRIPT_PATH")

cd $SCRIPT_DIR

# update Hanuki code in DemoProject
rsync -va ./src/_hanuki/ ./docs/ExampleProject/_hanuki/

cid=$(ipfs add -rHq ./docs/ExampleProject/ | tail -n 1 | xargs ipfs cid base32)
echo $cid

brave-browser "http://$cid.ipfs.localhost:8080"
