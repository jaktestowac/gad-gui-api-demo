#!/usr/bin/env bash
# macOS double-clickable command file to run `npm run start3001` in a new Terminal window.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${DIR}"
echo "Starting GAD GUI API demo on port 3001 in ${DIR}"
npm run start3001
