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
  prices: new Map(), // Store price history per symbol
  trends: new Map(), // Store trend direction per symbol
  volatility: new Map(), // Store volatility levels per symbol
  baseValues: new Map(), // Store initial/base values per symbol
  lastUpdate: new Map(), // Store last update timestamp per symbol
};

function resetMetricState() {
  metricState = {
    prices: new Map(),
    trends: new Map(),
    volatility: new Map(),
    baseValues: new Map(),
    lastUpdate: new Map(),
  };
}

function getSmoothedValue(generator, symbol, currentValue, maxChange = 0.5, minValue = 0, maxValue = 1000) {
  const now = Date.now();
  const key = `${symbol}_price`;

  // Initialize state for new symbols
  if (!metricState.prices.has(key)) {
    metricState.prices.set(key, [currentValue]);
    metricState.trends.set(key, generator.getNextValueFloat(0, 1) > 0.5 ? 1 : -1);
    metricState.volatility.set(key, generator.getNextValueFloat(0.1, 2.0));
    metricState.baseValues.set(key, currentValue);
    metricState.lastUpdate.set(key, now);
  }

  const lastValue = metricState.prices.get(key)[0];
  let trend = metricState.trends.get(key);
  const volatility = metricState.volatility.get(key);
  const lastUpdate = metricState.lastUpdate.get(key);

  const timeFactor = Math.min((now - lastUpdate) / 60000, 1);
  const effectiveMaxChange = maxChange * volatility * timeFactor;

  let newValue = lastValue + trend * effectiveMaxChange * generator.getNextValueFloat(0.1, 1);

  newValue += generator.getNextValueFloat(-0.1, 0.1) * volatility;

  if (newValue > maxValue || newValue < minValue || generator.getNextValueFloat(0, 1) < 0.1) {
    trend *= -1;
    metricState.trends.set(key, trend);

    const newVolatility = Math.max(0.1, Math.min(2.0, volatility * generator.getNextValueFloat(0.8, 1.2)));
    metricState.volatility.set(key, newVolatility);
  }

  newValue = Math.max(minValue, Math.min(maxValue, newValue));

  const priceHistory = metricState.prices.get(key);
  priceHistory.unshift(newValue);
  if (priceHistory.length > 100) priceHistory.pop();
  metricState.lastUpdate.set(key, now);

  return Math.round(newValue * 100) / 100;
}

function calculateVolume(generator, price, prevPrice, baseVolume) {
  const priceChange = Math.abs((price - prevPrice) / prevPrice);
  const volatilityMultiplier = 1 + priceChange * 10;
  const timeOfDayFactor = 1 + Math.sin(generator.getNextValueFloat(0, Math.PI));
  const randomFactor = 0.5 + generator.getNextValueFloat(0, 1);

  return Math.floor(baseVolume * volatilityMultiplier * timeOfDayFactor * randomFactor);
}

function generateStockExchange(params) {
  const symbol = params.symbol;
  const generator = new RandomValueGeneratorWithSeed(params?.timestamp + (params?.seed || "") + symbol);
  const exchange = params?.exchange || EXCHANGE_NAMES[generator.getNextValue(0, EXCHANGE_NAMES.length - 1)];

  const basePrice =
    metricState.baseValues.get(`${symbol}_price`) || params?.basePrice || generator.getNextValue(10, 1000);
  const currentPrice = getSmoothedValue(generator, symbol, basePrice, basePrice * 0.02);

  const baseVolume = generator.getNextValue(10000, 100000);
  const volume = calculateVolume(generator, currentPrice, basePrice, baseVolume);

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

  resetMetricState();

  const samples = params.samples;
  const interval = params.interval;
  const stocks = params.symbols;
  const result = [];

  const now = Date.now();
  const baseTimestamp = Math.floor(now / 60_000) * 60_000;

  logDebug("Generating stock exchange data for:", {
    startDate: new Date(baseTimestamp).toISOString(),
    samples,
    interval,
    stocks,
  });

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
