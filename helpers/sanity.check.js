const { compareDbObjects } = require("./compare.helpers");
const { fullDb, fullBaseDb } = require("./db.helpers");

function checkDatabase() {
  const dbData = fullDb();
  const dbBaseData = fullBaseDb();

  const result = compareDbObjects(dbBaseData, dbData);

  if (result.areEqual) {
    console.log("> Database is correct");
  } else {
    console.log("> DATABASE IS INCORRECT!", result);
  }
}

module.exports = { checkDatabase };
