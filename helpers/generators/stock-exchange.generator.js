const { RandomValueGeneratorWithSeed } = require("./random-data.generator");
const { logDebug } = require("../logger-api");

const MARKET_SECTORS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Energy",
  "Consumer",
  "Industrial",
  "Materials",
  "Real Estate",
  "Utilities",
];

const EXCHANGE_NAMES = ["KYSE", "DAQ", "VIM", "VCDE", "SXSE", "HEX", "EuroBoot"];

let metricState = {
  lastValues: new Map(),
  trends: new Map(),
};

function getSmoothedValue(generator, key, currentValue, maxChange = 0.5, minValue = 0, maxValue = 1000) {
  const lastValue = metricState.lastValues.get(key) ?? currentValue;
  let trend = metricState.trends.get(key) ?? (generator.getNextValueFloat(0, 1) > 0.5 ? 1 : -1);

  // Simulate market volatility
  let newValue = lastValue + trend * generator.getNextValueFloat(0, maxChange);

  // Reverse trend if limits reached
  if (newValue > maxValue || newValue < minValue) {
    trend *= -1;
    metricState.trends.set(key, trend);
  }

  newValue = Math.max(minValue, Math.min(maxValue, newValue));
  metricState.lastValues.set(key, newValue);
  return Math.round(newValue * 100) / 100;
}

function calculateVolume(generator, price, prevPrice, baseVolume) {
  const priceChange = Math.abs((price - prevPrice) / prevPrice);
  const volatilityMultiplier = 1 + priceChange * 10; // Higher price changes = higher volume
  const timeOfDayFactor = 1 + Math.sin(generator.getNextValueFloat(0, Math.PI)); // Simulate market hours activity
  const randomFactor = 0.5 + generator.getNextValueFloat(0, 1); // Add some randomness

  return Math.floor(baseVolume * volatilityMultiplier * timeOfDayFactor * randomFactor);
}

function generateStockExchange(params) {
  metricState = {
    lastValues: new Map(),
    trends: new Map(),
  };
  const symbol = params.symbol;
  const generator = new RandomValueGeneratorWithSeed(params?.timestamp + (params?.seed || "") + symbol);
  const exchange = params?.exchange || EXCHANGE_NAMES[generator.getNextValue(0, EXCHANGE_NAMES.length - 1)];

  const basePrice = params?.basePrice || generator.getNextValue(10, 1000);
  const prevPrice = metricState.lastValues.get(`${symbol}_price`) || basePrice;
  const currentPrice = getSmoothedValue(generator, `${symbol}_price`, basePrice, basePrice * 0.02);

  // Calculate base volume based on market cap
  const baseVolume = generator.getNextValue(10000, 100000);
  const volume = calculateVolume(generator, currentPrice, prevPrice, baseVolume);

  return {
    symbol,
    companyName: params?.companyName || `Company ${symbol}`,
    exchange: exchange,
    sector: params?.sector || MARKET_SECTORS[generator.getNextValue(0, MARKET_SECTORS.length - 1)],
    currentPrice,
    change: +(currentPrice - basePrice).toFixed(2),
    changePercent: +(((currentPrice - basePrice) / basePrice) * 100).toFixed(2),
    volume,
    marketCap: currentPrice * volume,
    pe_ratio: generator.getNextValue(5, 50),
    dividend_yield: generator.getNextValue(0, 5),
    volatility: generator.getNextValue(0.1, 2.0),
  };
}

const _defaultOptions = {
  samples: 1,
  interval: 60_000, // 1 minute
  symbols: ["AAPL", "GOOGL", "MSFT", "AMZN"],
  basePrice: 100,
  seed: "gad",
  startFromNow: true,
};

function generateStockExchangeResponse(options, simplified = false) {
  const newOptions = options || _defaultOptions;
  const params = { ..._defaultOptions, ...newOptions };

  const samples = params.samples;
  const interval = params.interval;
  const stocks = params.symbols;
  const result = [];

  const now = Date.now();
  const baseTimestamp = Math.floor(now / 60_000) * 60_000;

  for (let i = 0; i < samples; i++) {
    const timestamp = baseTimestamp - (samples - 1 - i) * interval;
    const stockData = stocks.map((symbol) =>
      generateStockExchange({
        ...params,
        symbol,
        timestamp,
        seed: params.seed + timestamp,
      })
    );

    if (simplified) {
      result.push({
        timestamp,
        time: new Date(timestamp).toISOString(),
        stocks: stockData.map((s) => ({
          symbol: s.symbol,
          price: s.currentPrice,
          change: s.change,
        })),
      });
    } else {
      result.push({
        timestamp,
        time: new Date(timestamp).toISOString(),
        stocks: stockData,
      });
    }
  }

  return result;
}

module.exports = {
  generateStockExchange,
  generateStockExchangeResponse,
  MARKET_SECTORS,
  EXCHANGE_NAMES,
  stockGeneratorDefaultOptions: _defaultOptions,
};
