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

function compareDbObjects(baseDb, currentDb) {
  const keys1 = getAllDbKeys(baseDb);
  const keys2 = getAllDbKeys(currentDb);

  const missingKeys1 = keys1.filter((key) => !keys2.includes(key));
  const missingKeys2 = keys2.filter((key) => !keys1.includes(key));
  const areEqual = keys1.length === keys2.length && missingKeys1.length === 0 && missingKeys2.length === 0;

  return {
    areEqual,
    missingKeysInCurrentDb: missingKeys1,
    missingKeysInBaseDb: missingKeys2,
  };
}

function getAllDbKeys(database) {
  let keys = [];

  for (let table in database) {
    keys.push(table);
    if (typeof database[table] === "object") {
      if (database[table].length > 0) {
        let newKeys = [];
        for (let item of database[table]) {
          newKeys = newKeys.concat(Object.keys(item).map((key) => `${table}.${key}`));
        }

        // Count occurrences of values in newKeys
        const occurrences = newKeys.reduce((count, key) => {
          count[key] = (count[key] || 0) + 1;
          return count;
        }, {});

        // Remove keys that don't occur in all elements of database[table]
        newKeys = newKeys.filter((key) => occurrences[key] === database[table].length);

        keys = keys.concat(newKeys);
      } else {
        keys = keys.concat(Object.keys(database[table]).map((key) => `${table}.${key}`));
      }
    }
  }

  keys = Array.from(new Set(keys));

  return keys;
}

module.exports = {
  areStringsEqualIgnoringCase,
  areIdsEqual,
  isNumber,
  isUndefined,
  isStringOnTheList,
  isEmptyOrUndefined,
  compareDbObjects,
};
