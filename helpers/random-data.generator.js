const { getRandomInt } = require("./helpers");

function getRandomVisitsForEntities(dataSet, min = 0, max = 10) {
  const visits = {};
  for (const entity of dataSet) {
    visits[entity.id] = getRandomInt(min, max);
  }

  return visits;
}

module.exports = {
  getRandomVisitsForEntities,
};
