const { fileSystem } = require("./data/file-system-v1.data");
const { formatErrorResponse } = require("../../helpers/helpers");
const {
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_UNAUTHORIZED,
} = require("../../helpers/response.helpers");

// Helper to find a directory or file by path
function findNodeByPath(path) {
  // Handle drive letter specifically
  if (path === "/" || path === "") {
    return {
      type: "root",
      drives: Object.keys(fileSystem).map((drive) => ({
        name: `${drive}:`,
        type: "drive",
      })),
    };
  }

  // Remove leading and trailing slashes
  const cleanPath = path.replace(/^\/|\/$/g, "");
  const parts = cleanPath.split("/");

  // If it's just a drive letter
  if (parts.length === 1 && parts[0].endsWith(":")) {
    const drive = parts[0].charAt(0);
    return fileSystem[drive];
  }

  let current = fileSystem;
  let driveLetter = null;

  // Extract the drive letter from the first part
  if (parts[0].endsWith(":")) {
    driveLetter = parts[0].charAt(0);
    current = fileSystem[driveLetter];
    parts.shift(); // Remove the drive part

    if (!current) {
      return null;
    }
  }

  // Navigate through the path
  for (const part of parts) {
    if (!current.children || !current.children[part]) {
      return null;
    }
    current = current.children[part];
  }

  return current;
}

// Helper for name validation
function isValidName(name) {
  const invalidPattern = /[\\/:*?"<>|]/;
  return name && name.length > 0 && name.length <= 50 && !invalidPattern.test(name);
}

// Helper to check password protection
function checkPassword(node, req) {
  if (!node || !node.password) return true;
  let provided = req.method === "GET" ? req.query.password || req.headers["x-password"] : req.body && req.body.password;
  return node.password === provided;
}

// Get directory contents
function getDirectoryContents(req, res) {
  const rawPath = req.query.path || "/";
  const path = decodeURIComponent(rawPath);

  const node = findNodeByPath(path);

  if (!node) {
    return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Directory not found"));
  }

  if (node.type === "root") {
    return res.status(HTTP_OK).json(node.drives);
  }

  if (node.type === "file") {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Path is a file, not a directory"));
  }

  // Password protection
  if (node.password && !checkPassword(node, req)) {
    return res.status(HTTP_UNAUTHORIZED).json(formatErrorResponse("Password required or incorrect for this directory"));
  }

  const dirInfo = {
    name: node.name,
    type: node.type,
    passwordProtected: !!node.password,
    corrupted: !!node.corrupted,
    createdAt: node.createdAt || null,
    updatedAt: node.updatedAt || null,
  };

  const contents = Object.values(node.children || {}).map((item) => ({
    name: item.name,
    type: item.type,
    size: item.size || null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    passwordProtected: !!item.password,
    corrupted: !!item.corrupted,
  }));

  return res.status(HTTP_OK).json({
    directory: dirInfo,
    contents,
  });
}

// Get file details
function getFileDetails(req, res) {
  const rawPath = req.query.path;

  if (!rawPath) {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("File path is required"));
  }

  const path = decodeURIComponent(rawPath);
  const node = findNodeByPath(path);

  if (!node) {
    return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("File not found"));
  }

  if (node.type !== "file") {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Path is not a file"));
  }

  // Password protection
  if (node.password && !checkPassword(node, req)) {
    return res.status(HTTP_UNAUTHORIZED).json(formatErrorResponse("Password required or incorrect for this file"));
  }

  return res.status(HTTP_OK).json({
    name: node.name,
    type: node.type,
    size: node.size,
    content: node.content,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  });
}

// Create a new file or directory
function createItem(req, res) {
  const { path, name, type, content } = req.body;

  if (!path || !name || !type) {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Path, name, and type are required"));
  }

  if (!isValidName(name)) {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse('Invalid name. Max 50 chars, no / \\: * ? " < > |'));
  }

  if (type !== "file" && type !== "directory") {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Type must be 'file' or 'directory'"));
  }

  const parentNode = findNodeByPath(path);

  if (!parentNode) {
    return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Parent directory not found"));
  }

  if (parentNode.type !== "directory") {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Parent path is not a directory"));
  }

  if (parentNode.children && parentNode.children[name]) {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Item with this name already exists"));
  }

  const now = new Date().toISOString();
  const newItem = {
    type,
    name,
    createdAt: now,
    updatedAt: now,
  };

  if (type === "file") {
    newItem.content = content || "";
    newItem.size = `${(content || "").length} bytes`;
  } else {
    newItem.children = {};
  }

  // Initialize children object if it doesn't exist
  if (!parentNode.children) {
    parentNode.children = {};
  }

  parentNode.children[name] = newItem;

  return res.status(HTTP_CREATED).json({
    message: `${type === "file" ? "File" : "Directory"} created successfully`,
    item: {
      name: newItem.name,
      type: newItem.type,
      size: newItem.size || null,
      createdAt: newItem.createdAt,
      updatedAt: newItem.updatedAt,
    },
  });
}

// Update a file
function updateFile(req, res) {
  const { path, content } = req.body;

  if (!path) {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("File path is required"));
  }

  const node = findNodeByPath(path);

  if (!node) {
    return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("File not found"));
  }

  if (node.type !== "file") {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Path is not a file"));
  }

  node.content = content || "";
  node.size = `${content.length} bytes`;
  node.updatedAt = new Date().toISOString();

  return res.status(HTTP_OK).json({
    message: "File updated successfully",
    file: {
      name: node.name,
      type: node.type,
      size: node.size,
      updatedAt: node.updatedAt,
    },
  });
}

// Delete a file or directory
function deleteItem(req, res) {
  const rawPath = req.query.path;

  if (!rawPath) {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Path is required"));
  }

  const path = decodeURIComponent(rawPath);

  // Handle root paths
  if (path === "/" || path === "") {
    return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Cannot delete root directory"));
  }

  // Extract parent path and item name
  const lastSlashIndex = path.lastIndexOf("/");
  let parentPath, itemName;

  if (lastSlashIndex === -1) {
    // Check if it's a drive
    if (path.endsWith(":")) {
      return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Cannot delete a drive"));
    }

    parentPath = "/";
    itemName = path;
  } else {
    parentPath = path.substring(0, lastSlashIndex);
    itemName = path.substring(lastSlashIndex + 1);
  }

  const parentNode = findNodeByPath(parentPath);

  if (!parentNode || !parentNode.children) {
    return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Parent directory not found"));
  }

  if (!parentNode.children[itemName]) {
    return res.status(HTTP_NOT_FOUND).json(formatErrorResponse("Item not found"));
  }

  const deletedType = parentNode.children[itemName].type;
  delete parentNode.children[itemName];

  return res.status(HTTP_OK).json({
    message: `${deletedType === "file" ? "File" : "Directory"} deleted successfully`,
  });
}

module.exports = {
  getDirectoryContents,
  getFileDetails,
  createItem,
  updateFile,
  deleteItem,
};
