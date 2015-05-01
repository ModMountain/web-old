#!/usr/bin/env bash

# Update our code from Git
git pull

# Compile Typescript files into Javascript files
find . -name "*.ts" | xargs tsc

# Remove packages we no longer need, recursively update our packages, and then deduplicate packages if possible
npm prune
npm --depth 9999 update
npm dedupe

# Restart the application
pm2 restart 7