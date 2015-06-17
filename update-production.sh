#!/usr/bin/env bash

# Make sure system dependencies are installed
apt-get install -y graphicsmagick

# Flush the temporary direct so the Typescript compiler doesn't shit itself
rm -rf .tmp

# Update our code from Git
git pull

# Compile Typescript files into Javascript files
find . -name "*.ts" | xargs tsc --module "commonjs"

# Remove packages we no longer need and then recursively update our packages
npm prune
npm --depth 9999 update

# Restart the application
pm2 gracefulReload modmtn
