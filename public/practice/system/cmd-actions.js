// File and directory API actions for GAD Commander

// Store passwords for accessed items (in-memory, per session)
const passwordStore = {};

export function getPasswordForPath(path) {
  return passwordStore[path];
}

export function setPasswordForPath(path, pwd) {
  passwordStore[path] = pwd;
}

export async function fetchDirectoryContentsWithPassword(path) {
  let pwd = getPasswordForPath(path);
  let url = `/api/practice/v1/file-system/directory?path=${encodeURIComponent(path)}`;
  if (pwd) url += `&password=${encodeURIComponent(pwd)}`;
  let response = await fetch(url);
  if (response.status === 401) {
    // Return 401 status to indicate password required
    return { status: 401, directory: null, contents: [] };
  }
  if (!response.ok) {
    return { directory: null, contents: [] };
  }
  return await response.json();
}

export async function fetchFileContentWithPassword(path) {
  let pwd = getPasswordForPath(path);
  let url = `/api/practice/v1/file-system/file?path=${encodeURIComponent(path)}`;
  if (pwd) url += `&password=${encodeURIComponent(pwd)}`;
  let response = await fetch(url);
  if (response.status === 401) {
    // Return 401 status to indicate password required
    return { status: 401, content: null };
  }
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

export async function fetchFileContent(path) {
  let url = `/api/practice/v1/file-system/file?path=${encodeURIComponent(path)}`;
  let response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

export async function createDirectory(path, name) {
  const res = await fetch("/api/practice/v1/file-system/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, name, type: "directory" }),
  });
  return res.ok;
}

export async function updateFile(path, content) {
  const res = await fetch("/api/practice/v1/file-system/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  });
  return res.ok;
}

export async function deleteItem(path) {
  const res = await fetch("/api/practice/v1/file-system/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  return res.ok;
}

export function isValidName(name) {
  // Limit: max 50 chars, no / \ : * ? " < > |
  const invalidPattern = /[\\/:*?"<>|]/;
  return name.length > 0 && name.length <= 50 && !invalidPattern.test(name);
}

export function buildPath(currentPath, itemName) {
  if (itemName === "..") {
    return navigateToParent(currentPath);
  }

  // If it's just a drive (e.g., "C:"), return it
  if (itemName.endsWith(":")) {
    return itemName;
  }

  // If the current path is a drive, we don't need an extra slash
  if (currentPath.endsWith(":")) {
    return `${currentPath}/${itemName}`;
  }

  return `${currentPath}/${itemName}`;
}

export function navigateToParent(currentPath) {
  if (currentPath === "/" || currentPath.endsWith(":")) {
    return "/"; // Go to root if at drive level
  }

  const lastSlashIndex = currentPath.lastIndexOf("/");
  let parentPath;

  if (lastSlashIndex === -1) {
    parentPath = "/";
  } else {
    parentPath = currentPath.substring(0, lastSlashIndex);

    // If we're left with an empty string or just a drive letter with no slash
    if (parentPath === "" || parentPath.endsWith(":")) {
      parentPath = parentPath || "/";
    }
  }

  return parentPath;
}

export function resolveCdPath(currentPath, arg) {
  if (!arg) return currentPath;
  // Normalize slashes
  arg = arg.replace(/\\/g, "/");
  // If root
  if (arg === "/" || arg === "\\") return "/";
  // If drive only (e.g., D:)
  if (/^[A-Za-z]:$/.test(arg)) return arg;
  // If absolute path (starts with drive or /)
  if (/^[A-Za-z]:\//.test(arg)) return arg;
  if (arg.startsWith("/")) return arg;
  // Relative navigation
  let base = currentPath;
  if (base === "/") base = "";
  let parts = base ? base.split("/") : [];
  let argParts = arg.split("/");
  for (let part of argParts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (parts.length > 0) parts.pop();
    } else {
      parts.push(part);
    }
  }
  let result = parts.join("/");
  // If result is a drive (e.g., C:), keep as is
  if (/^[A-Za-z]:$/.test(result)) return result;
  return result.startsWith("/") ? result : result ? result : "/";
}
