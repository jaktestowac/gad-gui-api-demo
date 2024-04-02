function areStringsEqualIgnoringCase(str1, str2) {
  return str1 !== undefined && `${str1}`.toLowerCase() === `${str2}`.toLowerCase();
}

function areIdsEqual(id1, id2) {
  return id1?.toString() === id2?.toString();
}

function isNumber(value) {
  return typeof value === "number";
}

function isUndefined(value) {
  return value === undefined;
}

function isEmptyOrUndefined(value) {
  return (
    value === undefined ||
    value === "" ||
    value === null ||
    value === 0 ||
    value === false ||
    Object.keys(value).length === 0
  );
}

function isStringOnTheList(value, list, caseSensitive = false) {
  if (caseSensitive === true) {
    return list.includes(`${value}`);
  } else {
    return list.some((item) => `${item}`.toLowerCase() === `${value}`.toLowerCase());
  }
}

module.exports = {
  areStringsEqualIgnoringCase,
  areIdsEqual,
  isNumber,
  isUndefined,
  isStringOnTheList,
  isEmptyOrUndefined,
};
