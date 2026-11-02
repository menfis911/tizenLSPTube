#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm ci --ignore-scripts --prefix src/mods
npm run build --prefix src/mods
cp src/dist/userScript.js packages/launcher/service/dist/userscript.js
npm ci --ignore-scripts --prefix src/vot
npm run build --prefix src/vot
cp src/vot/libav/* packages/launcher/service/dist/libav/
python3 scripts/prepare-runtime.py
