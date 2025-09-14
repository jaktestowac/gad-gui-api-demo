# Version Update Guide

This directory contains tools for managing GAD application versions.

## Quick Usage with npm scripts (Recommended)

You can use the following npm commands to update the version:

```bash
# Increment patch version (2.8.5 -> 2.8.6)
npm run version:patch

# Increment minor version (2.8.5 -> 2.9.0)
npm run version:minor

# Increment major version (2.8.5 -> 3.0.0)
npm run version:major

# Set custom version
npm run version:custom 3.1.4

# Show help and usage
npm run version:help
```

## Direct Script Usage

### Node.js Version (Cross-platform - Recommended)

```bash
# From project root
node tools/release/update-version.js patch
node tools/release/update-version.js minor
node tools/release/update-version.js major
node tools/release/update-version.js custom 3.1.4

# From tools/release directory
node update-version.js patch
```

### Bash Version (Linux/macOS/Git Bash on Windows)

```bash
# From project root (requires bash)
bash tools/release/update-version.sh patch

# From tools/release directory
./update-version.sh patch
```

## What gets updated

The version update script will automatically update the version in these files:

- ✅ `package.json` - Main version field
- ✅ `package-lock.json` - Main project version (if file exists)
- ✅ `app.json` - Version field with "v" prefix
- ✅ `public/version.js` - appVersion constant with "v" prefix
- ✅ `tools/release/README.md` - Git tag commands with "v" prefix

## Safety Features

- **Backup Creation**: The script creates `.bak` files before making changes
- **Error Recovery**: If an error occurs, all files are restored from backups
- **Validation**: Version format is validated (must be MAJOR.MINOR.PATCH)
- **User Confirmation**: You must confirm the version change before it's applied
- **Colored Output**: Clear status messages with color coding

## After Version Update

The script will provide next steps:

1. **Review changes**: Check that all files were updated correctly
2. **Commit changes**: `git add . && git commit -m "chore: bump version to vX.Y.Z"`
3. **Create and push tag**: `git tag vX.Y.Z && git push origin vX.Y.Z`

## Examples

### Patch Release (Bug fixes)

```bash
npm run version:patch
# 2.8.5 -> 2.8.6
```

### Minor Release (New features, backward compatible)

```bash
npm run version:minor
# 2.8.5 -> 2.9.0
```

### Major Release (Breaking changes)

```bash
npm run version:major
# 2.8.5 -> 3.0.0
```

### Custom Version

```bash
npm run version:custom 4.2.1
# Current -> 4.2.1
```

## Git Workflow

After updating the version, follow this typical workflow:

```bash
# 1. Update version
npm run version:patch

# 2. Review changes
git diff

# 3. Commit changes
git add .
git commit -m "chore: bump version to v2.8.6"

# 4. Create and push tag
git tag v2.8.6
git push origin main
git push origin v2.8.6
```

## Troubleshooting

### Windows Issues

**"'bash' is not recognized as an internal or external command"**

- ✅ **Solution**: Use the npm scripts (they use the Node.js version automatically)
- Alternative: Install Git Bash or WSL (Windows Subsystem for Linux)

**"'node' is not recognized as an internal or external command"**

- Install Node.js from https://nodejs.org/
- Make sure Node.js is in your PATH

### Unix/Linux Issues

**Permission denied**

```bash
chmod +x tools/release/update-version.sh
```

### General Issues

**Script fails to find files**

- Make sure you're running from the project root directory
- Check that all expected files exist in the project

**JSON parsing errors**

- Ensure package.json and app.json are valid JSON files
- Check for syntax errors in the files

## Manual Version Update

If you prefer to update versions manually, make sure to update all these locations:

1. `package.json`: `"version": "X.Y.Z"`
2. `app.json`: `"version": "vX.Y.Z"`
3. `public/version.js`: `const appVersion = "vX.Y.Z";`
4. `tools/release/README.md`: Update git tag commands
5. `package-lock.json`: Update main project version (if using npm)
