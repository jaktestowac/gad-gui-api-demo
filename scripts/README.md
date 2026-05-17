# Start scripts

This folder contains helper scripts to start the GAD GUI API demo in a new terminal window or the current terminal.

Available scripts:

- `start.sh` - POSIX/Linux/macOS script that tries to open a new terminal window and runs `npm run start`.
- `start3001.sh` - Similar to `start.sh` but runs `npm run start3001`.
- `start.command` - macOS double-click command that runs `npm run start` in the project root.
- `start3001.command` - macOS double-click command for `npm run start3001`.
- `start.bat` - Windows (cmd) script that opens a new Command Prompt and runs `npm run start`.
- `start3001.bat` - Windows (cmd) script for `npm run start3001`.
- `start.ps1` - PowerShell script that opens a new PowerShell instance and runs `npm run start`.
- `start3001.ps1` - PowerShell script that opens a new PowerShell instance and runs `npm run start3001`.

Usage:

- On macOS: you may double-click `scripts/start.command` or `scripts/start3001.command` (ensure they are executable):

```
chmod +x scripts/*.command scripts/*.sh
./scripts/start.command
```

- On Linux: run the shell script or make it executable and double-clicking might be available depending on your desktop environment:

```
chmod +x scripts/*.sh
./scripts/start.sh
```

- On Windows (cmd.exe): run the `.bat` scripts with a double-click or:

```
scripts\start.bat
```

- On Windows (PowerShell): you might run the `.ps1` file:

```
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

Notes:

- The scripts try to open a new terminal on Linux/macOS using common terminal binaries; if not found, they'll run in the current terminal.
- On Linux, depending on your environment, double-clicking shell scripts in your file manager may not open a terminal; prefer running from an existing terminal or use a .desktop launcher.
- When using macOS `.command` files, make sure to set executable permissions:

```
chmod +x scripts/*.command
```
