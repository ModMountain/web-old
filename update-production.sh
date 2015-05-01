#!/usr/bin/env bash
git pull
find . -name "*.ts" | xargs tsc
npm install --production
pm2 restart 7