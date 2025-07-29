#!/usr/bin/env node

// GAD Version Update Script (Node.js version)
// Updates version in all relevant files: package.json, app.json, public/version.js, and tools/release/README.md
// Usage: node update-version.js [major|minor|patch|custom] [new_version]

const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

// Project root directory (assuming script is in tools/release/)
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// Files to update
const FILES = {
  PACKAGE_JSON: path.join(PROJECT_ROOT, "package.json"),
  APP_JSON: path.join(PROJECT_ROOT, "app.json"),
  VERSION_JS: path.join(PROJECT_ROOT, "public", "version.js"),
  RELEASE_README: path.join(PROJECT_ROOT, "tools", "release", "README.md"),
  PACKAGE_LOCK: path.join(PROJECT_ROOT, "package-lock.json"),
};

// Helper functions for colored output
function printInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

// Validate semantic version format
function validateVersion(version) {
  const versionRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;
  if (!versionRegex.test(version)) {
    printError(`Invalid version format: ${version}`);
    printError("Version must be in format: MAJOR.MINOR.PATCH (e.g., 2.8.5)");
    process.exit(1);
  }
}

// Extract current version from package.json
function getCurrentVersion() {
  try {
    if (!fs.existsSync(FILES.PACKAGE_JSON)) {
      printError(`package.json not found at: ${FILES.PACKAGE_JSON}`);
      process.exit(1);
    }

    const packageContent = fs.readFileSync(FILES.PACKAGE_JSON, "utf8");
    const packageJson = JSON.parse(packageContent);

    if (!packageJson.version) {
      printError("Could not extract current version from package.json");
      process.exit(1);
    }

    return packageJson.version;
  } catch (error) {
    printError(`Error reading package.json: ${error.message}`);
    process.exit(1);
  }
}

// Increment version based on type
function incrementVersion(currentVersion, incrementType) {
  const versionParts = currentVersion.split(".").map((num) => parseInt(num, 10));
  let [major, minor, patch] = versionParts;

  switch (incrementType) {
    case "major":
      major++;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor++;
      patch = 0;
      break;
    case "patch":
      patch++;
      break;
    default:
      printError(`Invalid increment type: ${incrementType}`);
      printError("Valid types: major, minor, patch");
      process.exit(1);
  }

  return `${major}.${minor}.${patch}`;
}

// Create backup of a file
function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.bak`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }
  return null;
}

// Update package.json
function updatePackageJson(newVersion) {
  printInfo("Updating package.json...");

  const backupPath = createBackup(FILES.PACKAGE_JSON);

  try {
    const content = fs.readFileSync(FILES.PACKAGE_JSON, "utf8");
    const packageJson = JSON.parse(content);
    packageJson.version = newVersion;

    fs.writeFileSync(FILES.PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + "\n");
    printSuccess("Updated package.json");

    return backupPath;
  } catch (error) {
    printError(`Error updating package.json: ${error.message}`);
    throw error;
  }
}

// Update app.json
function updateAppJson(newVersion) {
  printInfo("Updating app.json...");

  if (!fs.existsSync(FILES.APP_JSON)) {
    printWarning("app.json not found, skipping...");
    return null;
  }

  const backupPath = createBackup(FILES.APP_JSON);

  try {
    const content = fs.readFileSync(FILES.APP_JSON, "utf8");
    const appJson = JSON.parse(content);
    appJson.version = `v${newVersion}`;

    fs.writeFileSync(FILES.APP_JSON, JSON.stringify(appJson, null, 2) + "\n");
    printSuccess("Updated app.json");

    return backupPath;
  } catch (error) {
    printError(`Error updating app.json: ${error.message}`);
    throw error;
  }
}

// Update public/version.js
function updateVersionJs(newVersion) {
  printInfo("Updating public/version.js...");

  if (!fs.existsSync(FILES.VERSION_JS)) {
    printWarning("public/version.js not found, skipping...");
    return null;
  }

  const backupPath = createBackup(FILES.VERSION_JS);

  try {
    let content = fs.readFileSync(FILES.VERSION_JS, "utf8");
    content = content.replace(/const appVersion = "v[^"]*"/, `const appVersion = "v${newVersion}"`);

    fs.writeFileSync(FILES.VERSION_JS, content);
    printSuccess("Updated public/version.js");

    return backupPath;
  } catch (error) {
    printError(`Error updating public/version.js: ${error.message}`);
    throw error;
  }
}

// Update tools/release/README.md
function updateReleaseReadme(newVersion) {
  printInfo("Updating tools/release/README.md...");

  if (!fs.existsSync(FILES.RELEASE_README)) {
    printWarning("tools/release/README.md not found, skipping...");
    return null;
  }

  const backupPath = createBackup(FILES.RELEASE_README);

  try {
    let content = fs.readFileSync(FILES.RELEASE_README, "utf8");
    content = content.replace(/git tag v[0-9]+\.[0-9]+\.[0-9]+/g, `git tag v${newVersion}`);
    content = content.replace(/git push upstream v[0-9]+\.[0-9]+\.[0-9]+/g, `git push upstream v${newVersion}`);

    fs.writeFileSync(FILES.RELEASE_README, content);
    printSuccess("Updated tools/release/README.md");

    return backupPath;
  } catch (error) {
    printError(`Error updating tools/release/README.md: ${error.message}`);
    throw error;
  }
}

// Update package-lock.json
function updatePackageLock(newVersion) {
  if (!fs.existsSync(FILES.PACKAGE_LOCK)) {
    printWarning("package-lock.json not found, skipping...");
    return null;
  }

  printInfo("Updating package-lock.json...");

  const backupPath = createBackup(FILES.PACKAGE_LOCK);

  try {
    const content = fs.readFileSync(FILES.PACKAGE_LOCK, "utf8");
    const packageLock = JSON.parse(content);

    // Update main project version
    packageLock.version = newVersion;
    if (packageLock.packages && packageLock.packages[""]) {
      packageLock.packages[""].version = newVersion;
    }

    fs.writeFileSync(FILES.PACKAGE_LOCK, JSON.stringify(packageLock, null, 2) + "\n");
    printSuccess("Updated package-lock.json");

    return backupPath;
  } catch (error) {
    printError(`Error updating package-lock.json: ${error.message}`);
    throw error;
  }
}

// Clean up backup files
function cleanupBackups(backupPaths) {
  printInfo("Cleaning up backup files...");
  backupPaths.forEach((backupPath) => {
    if (backupPath && fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  });
  printSuccess("Cleanup completed");
}

// Restore from backups in case of error
function restoreBackups(backupPaths) {
  printWarning("Restoring from backups due to error...");
  backupPaths.forEach((backupPath) => {
    if (backupPath && fs.existsSync(backupPath)) {
      const originalPath = backupPath.replace(".bak", "");
      fs.copyFileSync(backupPath, originalPath);
      printInfo(`Restored: ${originalPath}`);
    }
  });
}

// Show usage information
function showUsage() {
  console.log("Usage: node update-version.js [major|minor|patch|custom] [new_version]");
  console.log("");
  console.log("Examples:");
  console.log("  node update-version.js patch           # Increments patch version (2.8.5 -> 2.8.6)");
  console.log("  node update-version.js minor           # Increments minor version (2.8.5 -> 2.9.0)");
  console.log("  node update-version.js major           # Increments major version (2.8.5 -> 3.0.0)");
  console.log("  node update-version.js custom 3.1.4    # Sets specific version to 3.1.4");
  console.log("");
  console.log("Or use npm scripts:");
  console.log("  npm run version:patch");
  console.log("  npm run version:minor");
  console.log("  npm run version:major");
  console.log("  npm run version:custom 3.1.4");
  console.log("");
  console.log("The script will update version in:");
  console.log("  - package.json");
  console.log("  - app.json (with 'v' prefix)");
  console.log("  - public/version.js (with 'v' prefix)");
  console.log("  - tools/release/README.md (git tag commands)");
  console.log("  - package-lock.json (if exists)");
}

// Prompt user for confirmation
function promptConfirmation(question) {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

// Main function
async function main() {
  printInfo("GAD Version Update Script (Node.js)");
  printInfo("===================================");

  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(1);
  }

  // Check if we're in the right directory
  if (!fs.existsSync(FILES.PACKAGE_JSON)) {
    printError("package.json not found. Please run this script from the project root.");
    process.exit(1);
  }

  // Get current version
  const currentVersion = getCurrentVersion();
  printInfo(`Current version: ${currentVersion}`);

  // Determine new version
  const action = args[0];
  let newVersion = "";

  switch (action) {
    case "major":
    case "minor":
    case "patch":
      newVersion = incrementVersion(currentVersion, action);
      break;
    case "custom":
      if (args.length !== 2) {
        printError("Custom version requires a version number");
        showUsage();
        process.exit(1);
      }
      newVersion = args[1];
      validateVersion(newVersion);
      break;
    default:
      printError(`Invalid action: ${action}`);
      showUsage();
      process.exit(1);
  }

  printInfo(`New version: ${newVersion}`);

  // Confirm with user
  const confirmed = await promptConfirmation(
    `Do you want to update version from ${currentVersion} to ${newVersion}? (y/N): `
  );
  if (!confirmed) {
    printInfo("Version update cancelled");
    process.exit(0);
  }

  // Track backup files for cleanup/restore
  const backupPaths = [];

  try {
    // Update all files
    backupPaths.push(updatePackageJson(newVersion));
    backupPaths.push(updateAppJson(newVersion));
    backupPaths.push(updateVersionJs(newVersion));
    backupPaths.push(updateReleaseReadme(newVersion));
    backupPaths.push(updatePackageLock(newVersion));

    // Clean up backups on success
    cleanupBackups(backupPaths);

    printSuccess(`Successfully updated version from ${currentVersion} to ${newVersion}`);
    console.log("");
    printInfo("Updated files:");
    printInfo("  ✓ package.json");
    printInfo("  ✓ app.json");
    printInfo("  ✓ public/version.js");
    printInfo("  ✓ tools/release/README.md");
    printInfo("  ✓ package-lock.json (if existed)");
    console.log("");
    printInfo("Next steps:");
    printInfo("  1. Review the changes");
    printInfo(`  2. Commit the changes: git add . && git commit -m "chore: bump version to v${newVersion}"`);
    printInfo(`  3. Create and push tag: git tag v${newVersion} && git push origin v${newVersion}`);
  } catch (error) {
    restoreBackups(backupPaths);
    printError(`Version update failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    printError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  getCurrentVersion,
  incrementVersion,
  validateVersion,
  updatePackageJson,
  updateAppJson,
  updateVersionJs,
  updateReleaseReadme,
  updatePackageLock,
};
