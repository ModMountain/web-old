#!/usr/bin/env bash

# Update our code from Git
git pull

# Compile Typescript files into Javascript files
find . -name "*.ts" | xargs tsc

# Remove packages we no longer need and then recursively update our packages
npm prune
npm --depth 9999 update

# Restart the application
pm2 gracefulReload 3