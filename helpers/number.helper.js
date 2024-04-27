function roundNumber(number, decimalPlaces = 2) {
  return parseFloat(number.toFixed(decimalPlaces));
}

module.exports = {
  roundNumber,
};
