const fs = require("fs");
const path = require("path");
const { logDebug, logTrace } = require("./logger-api");

function saveFile(filePath, file) {
  createDirectoryForFilePath(filePath);
  try {
    fs.writeFileSync(filePath, file);
  } catch (error) {
    logDebug(`[IO_HELPER] Something went wrong during file saving: ${filePath} \n ${error.message}`);
    throw new Error(`[IO_HELPER] Something went wrong during file saving: ${filePath} \n ${error.message}`);
  }
  logDebug("[IO_HELPER] File saved:", filePath);
}

function saveJsonFile(jsonFilePath, file) {
  saveFile(jsonFilePath, JSON.stringify(file, null, 2));
}

function checkIfPathExist(filePath) {
  logTrace(`[IO_HELPER] Checking that the file ${filePath} exists.`);
  return fs.existsSync(filePath);
}

function createDirectory(directoryPath) {
  if (checkIfPathExist(directoryPath)) {
    logTrace(`[IO_HELPER] Directory ${directoryPath} already exists.`);
    return;
  }
  fs.mkdirSync(directoryPath, { recursive: true });
}

function createDirectoryForFilePath(filePath) {
  const directory = path.dirname(filePath);
  createDirectory(directory);
}

module.exports = {
  saveFile,
  saveJsonFile,
  createDirectoryForFilePath,
};
