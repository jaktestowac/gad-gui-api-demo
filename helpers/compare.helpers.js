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
  const baseDbTables = getAllDbTables(baseDb);
  const currentDbTables = getAllDbTables(currentDb);

  const areTablesEqual = baseDbTables.length === currentDbTables.length;

  const missingTablesInCurrentDb = baseDbTables.filter((key) => !currentDbTables.includes(key));

  const entitiesCountInCurrentDb = getDbTableElementsCount(currentDb);
  const isCurrentDbEmpty = Object.values(entitiesCountInCurrentDb).every((count) => count === 0);

  const keys1 = getAllDbKeys(baseDb);
  const keys2 = getAllDbKeys(currentDb);

  const areAllKeysPresent = keys1.every((key) => keys2.includes(key));

  const missingKeysInCurrentDb = keys1.filter((key) => !keys2.includes(key));
  const areEqual = areAllKeysPresent === true && missingKeysInCurrentDb.length === 0;

  const invalidObjects = [];
  for (const key of missingKeysInCurrentDb) {
    const parts = key.split(".");

    if (currentDb[parts[0]] === undefined) {
      break;
    }
    if (currentDb[parts[0]].length === undefined) {
      break;
    }

    for (const obj of currentDb[parts[0]]) {
      if (obj[parts[1]] === undefined) {
        invalidObjects.push({ table: parts[0], key: parts[1], id: obj.id });
      }
    }
  }

  return {
    areEqual,
    areTablesEqual,
    isCurrentDbEmpty,
    areAllKeysPresent,
    entitiesCountInCurrentDb,
    missingTablesInCurrentDb,
    missingKeysInCurrentDb,
    invalidObjects,
  };
}

function getDbTableElementsCount(database) {
  let keys = {};
  for (let table in database) {
    keys[table] = database[table].length;
  }
  return keys;
}

function getAllDbTables(database) {
  let keys = [];
  for (let table in database) {
    keys.push(table);
  }
  keys = Array.from(new Set(keys));
  return keys;
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
