const { RandomValueGeneratorWithSeed } = require("./random-data.generator");
const { logDebug } = require("../logger-api");

function generateListOfNumbers(params) {
  const samples = params.samples;
  const numbers = [];

  for (let i = 0; i < samples; i++) {
    // base seed on next seconds
    const newSeed = Math.floor(Date.now() / 1000) + i;
    const generator = new RandomValueGeneratorWithSeed(newSeed);
    numbers.push(generator.getNextValueFloat(0, 100));
  }

  return numbers;
}

const _defaultOptions = {
  samples: 50,
};

function generateListOfNumbersResponse(options, simplified = false) {
  const newOptions = options || _defaultOptions;
  const params = { ..._defaultOptions, ...newOptions };

  const result = generateListOfNumbers(params);

  if (simplified) {
    return result.map((num) => Math.round(num));
  }

  return result;
}

module.exports = {
  generateListOfNumbers,
  generateListOfNumbersResponse,
  listOfNumbersDefaultOptions: _defaultOptions,
};
