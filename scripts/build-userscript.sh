#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm ci --ignore-scripts --prefix src/mods
npm run build --prefix src/mods
cp src/dist/userScript.js packages/single/service/dist/userscript.js
