/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

function checkPackageDependencies() {
  const packagesToSkip = ["nanoid"];

  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const missingPackages = [];

    for (const [packageName, version] of Object.entries(dependencies)) {
      if (packagesToSkip.includes(packageName)) {
        continue;
      }
      try {
        require(packageName);
      } catch (error) {
        missingPackages.push({ packageName, version });
      }
    }

    if (missingPackages.length > 0) {
      console.log("========================================================");
      console.log("");
      missingPackages.forEach(({ packageName, version }) => {
        console.log(` ❌ Package "${packageName}" (${version}) is not installed.`);
      });
      console.log("");
      console.log(` 💡 Please run: 'npm i'`);
      console.log("");
      console.log("========================================================");
      throw new Error(`Required packages are not installed. Please run 'npm install' first.`);
    }
  } catch (error) {
    process.exit(1);
  }

  console.log("> All required packages are installed");
}

module.exports = { checkPackageDependencies };
