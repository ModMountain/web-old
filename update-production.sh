#!/usr/bin/env bash

# Update our code from Git
git pull

# Make sure system dependencies are installed
apt-get install -y graphicsmagick

# Remove packages we no longer need and then recursively update our packages
npm prune
npm --depth 9999 update

# Flush the temporary direct so the Typescript compiler doesn't shit itself
rm -rf .tmp

# Compile Typescript files into Javascript files
find . -name "*.ts" | xargs tsc --module "commonjs"

# Restart the application
pm2 gracefulReload modmtn
