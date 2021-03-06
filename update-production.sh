#!/usr/bin/env bash

# Update our code from Git
git pull

# Flush the temporary direct so the Typescript compiler doesn't shit itself
rm -rf .tmp

# Compile Typescript files into Javascript files
find . -name "*.ts" | xargs tsc --module "commonjs"

# Restart the application
pm2 gracefulReload modmtn
