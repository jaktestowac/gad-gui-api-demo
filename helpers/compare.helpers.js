const { logTrace } = require("./logger-api");

function areStringsEqualIgnoringCase(str1, str2, msg) {
  logTrace("areStringsEqualIgnoringCase", { str1, str2, msg });
  return str1?.toLowerCase() === str2?.toLowerCase();
}

function areIdsEqual(id1, id2, msg) {
  logTrace("areIdsEqual", { id1, id2, msg });
  return id1?.toString() === id2?.toString();
}

function isNumber(value) {
  return typeof value === "number";
}

function isUndefined(value) {
  return value === undefined;
}

module.exports = {
  areStringsEqualIgnoringCase,
  areIdsEqual,
  isNumber,
  isUndefined,
};
