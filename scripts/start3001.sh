#!/usr/bin/env bash
"$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" >/dev/null
# Open a terminal window and run `npm run start3001`

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CMD="npm run start3001"

echo "Starting GAD GUI API demo (port 3001) in: ${DIR}"

case "$(uname -s)" in
  Darwin)
    osascript <<EOF
tell application "Terminal"
    do script "cd \"${DIR}\"; ${CMD}"
    activate
end tell
EOF
    ;;
  Linux)
    if command -v gnome-terminal >/dev/null 2>&1; then
      gnome-terminal -- bash -lc "cd \"${DIR}\" && ${CMD}; exec bash"
    elif command -v xfce4-terminal >/dev/null 2>&1; then
      xfce4-terminal -e bash -lc "cd \"${DIR}\" && ${CMD}; exec bash"
    elif command -v konsole >/dev/null 2>&1; then
      konsole -e bash -lc "cd \"${DIR}\" && ${CMD}; exec bash"
    elif command -v xterm >/dev/null 2>&1; then
      xterm -e "bash -lc 'cd \"${DIR}\" && ${CMD}; exec bash'"
    else
      echo "No GUI terminal detected; running in current terminal..."
      cd "${DIR}" || exit 1
      ${CMD}
    fi
    ;;
  *)
    echo "Unsupported OS; running in this terminal..."
    cd "${DIR}" || exit 1
    ${CMD}
    ;;
esac
