#!/usr/bin/env bash
# macOS double-clickable command file to run `npm run start` in a new Terminal window.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${DIR}"
echo "Starting GAD GUI API demo in ${DIR}"
npm run start
