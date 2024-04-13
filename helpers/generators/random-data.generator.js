const { getConfigValue } = require("../../config/config-manager");
const { ConfigKeys } = require("../../config/enums");
const { isUndefined } = require("../compare.helpers");
const { formatYmd } = require("../datetime.helpers");
const seedrandom = require("seedrandom");

const generatorBasedOnCurrentDay = seedrandom(formatYmd(new Date()));

function getRandomVisitsForEntities(dataSet, min = 0, max = 10) {
  const visits = {};
  for (const entity of dataSet) {
    visits[entity.id] = getRandomInt(min, max);
  }

  return visits;
}

function getSeededRandomVisitsForEntities(dataSet, min = 0, max = 10) {
  const visits = {};
  for (const entity of dataSet) {
    visits[entity.id] = getRandomIntBasedOnDay(min, max);
  }

  return visits;
}

function getRandomIdBasedOnDay(length = 32) {
  var result = "";
  var charactersLength = getConfigValue(ConfigKeys.CHARACTERS).length;
  for (var i = 0; i < length; i++) {
    result += getConfigValue(ConfigKeys.CHARACTERS).charAt(Math.floor(generatorBasedOnCurrentDay() * charactersLength));
  }
  return result;
}

function getRandomIntBasedOnDay(min, max) {
  const randomValue = generatorBasedOnCurrentDay();
  const value = Math.floor(randomValue * (max - min) + min);
  return value;
}

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
};

function getGaussianRandom(min, max, sigma) {
  const mean = (max + min) / 2;

  if (isUndefined(sigma)) {
    sigma = (max - min) / 6;
  }

  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();

  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  let randomValue = mean + z * sigma;

  return Math.max(min, Math.min(max, randomValue));
}

function getGaussianRandomInt(min, max, sigma) {
  return Math.round(getGaussianRandom(min, max, sigma));
}

module.exports = {
  getRandomVisitsForEntities,
  getSeededRandomVisitsForEntities,
  getRandomInt,
  getGaussianRandomInt,
  getGaussianRandom,
  getRandomIdBasedOnDay,
  getRandomIntBasedOnDay,
};
