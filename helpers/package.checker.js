/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const printMissingPackagesMessage = (missingPackages) => {
  const borderWidth = 70;
  const borderChar = "═";
  const verticalChar = "║";

  const topBorder = `╔${borderChar.repeat(borderWidth)}╗`;
  const bottomBorder = `╚${borderChar.repeat(borderWidth)}╝`;
  const emptyLine = `${verticalChar}${" ".repeat(borderWidth)}${verticalChar}`;

  const formatLine = (text) =>
    `${verticalChar} ${text}${" ".repeat(Math.max(0, borderWidth - text.length - 1))}${verticalChar}`;

  console.log(topBorder);
  console.log(formatLine("Looks like some required packages are not installed:"));
  console.log(emptyLine);

  missingPackages.forEach(({ packageName, version }) => {
    console.log(formatLine(` - Package "${packageName}" (${version})`));
  });

  console.log(emptyLine);
  console.log(emptyLine);
  console.log(formatLine("=> Please run the following command to install missing packages:"));
  console.log(emptyLine);
  console.log(formatLine("         npm i"));
  console.log(emptyLine);
  console.log(formatLine("<3 jaktestowac.pl Team"));
  console.log(bottomBorder);
};

function assertPackageDependencies() {
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
      printMissingPackagesMessage(missingPackages);
      throw new Error(`Required packages are not installed. Please run 'npm install' first.`);
    }
  } catch (error) {
    process.exit(1);
  }

  console.log("> All required packages are installed");
}

module.exports = { assertPackageDependencies };
