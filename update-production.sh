#!/usr/bin/env bash
git pull
find . -name "*.ts" | xargs tsc
npm install
pm2 restart 7