const {
  generateIncomeOutcomeData,
  generateRandomSimplifiedIncomeOutcomeData,
} = require("../helpers/generators/income-outcome.generator");
const {
  generateWeatherDataForNPastDays,
  generateWeatherDataForNFutureDays,
  generateWeatherDataForNPastDaysFromDate,
  generateWeatherDataForNFutureDaysFromDate,
} = require("../helpers/generators/weather.generator");
const { HTTP_OK } = require("../helpers/response.helpers");
const { logDebug } = require("../helpers/logger-api");
const { generateEcommerceShoppingCart } = require("../helpers/generators/ecommerce-shopping-cart.generator");
const { generateRandomUser } = require("../helpers/generators/user.generator");
const { generateRandomSimpleBusTicketCard } = require("../helpers/generators/bus-ticket.generator");

function generateWeatherResponseBasedOnQuery(queryParams, simplified = false, totalRandom = false) {
  const days = parseInt(queryParams.get("days"));
  const future = parseInt(queryParams.get("futuredays"));
  const date = queryParams.get("date");
  const limitedDays = Math.min(days || 31, 90);
  let limitedFutureDays = Math.min(future || 0, 90);
  return generateWeatherResponse(date, days, limitedDays, limitedFutureDays, simplified, totalRandom);
}

function generateWeatherResponse(date, days, limitedDays, limitedFutureDays, simplified = false, totalRandom = false) {
  logDebug(`Requested weather data for:`, { days, limitedDays, limitedFutureDays, date });

  let weatherData = [];
  if (date === null || date === undefined || date === "") {
    weatherData = generateWeatherDataForNPastDays(limitedDays, totalRandom);
  } else {
    weatherData = generateWeatherDataForNPastDaysFromDate(date, limitedDays, totalRandom);
  }

  if (limitedFutureDays > 0) {
    limitedFutureDays += 1; // Add one more day because 1 is today
    let weatherDataFuture = [];

    if (date === null || date === undefined || date === "") {
      weatherDataFuture = generateWeatherDataForNFutureDays(limitedFutureDays, totalRandom);
    } else {
      weatherDataFuture = generateWeatherDataForNFutureDaysFromDate(date, limitedFutureDays, totalRandom);
    }

    if (weatherDataFuture.length > 1) {
      for (let i = 1; i < limitedFutureDays; i++) {
        weatherData.unshift(weatherDataFuture[i]);
      }
    }
  }

  if (simplified) {
    weatherData = weatherData.map((weather) => {
      return {
        date: weather.date,
        temperature: weather.temperatureRaw,
        temperatureMin: weather.highLowTemperature.temperatureLow,
        temperatureMax: weather.highLowTemperature.temperatureHigh,
        humidity: weather.humidity,
        dayLength: weather.dayLength,
        windSpeed: weather.windSpeedData.actual,
        windSpeedRange: weather.windSpeed,
      };
    });
  }

  return weatherData;
}

function generateEcommerceShoppingCartResponse(queryParams, simplified = false, totalRandom = false) {
  let ecommerceShoppingCartData = generateEcommerceShoppingCart(totalRandom);

  if (simplified === true) {
    ecommerceShoppingCartData = {
      cartItems: ecommerceShoppingCartData.cartItems,
    };
  }

  return ecommerceShoppingCartData;
}

function handleData(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");

  if (
    req.method === "GET" &&
    (req.url.includes("/api/v1/data/weather") || req.url.includes("/api/v1/data/weather-simple"))
  ) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);

    const weatherData = generateWeatherResponseBasedOnQuery(
      queryParams,
      req.url.includes("/api/v1/data/weather-simple")
    );

    res.status(HTTP_OK).json(weatherData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/costs")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);

    const days = parseInt(queryParams.get("days"));
    const limitedDays = Math.min(days || 31, 90);
    logDebug(`Requested costs data for:`, { days, limitedDays });

    const incomeOutcomeData = generateIncomeOutcomeData(limitedDays);
    res.status(HTTP_OK).json(incomeOutcomeData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/costs")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);

    const days = parseInt(queryParams.get("days"));
    const limitedDays = Math.min(days || 31, 90);
    logDebug(`Requested costs data for:`, { days, limitedDays });

    const incomeOutcomeData = generateRandomSimplifiedIncomeOutcomeData(limitedDays);
    res.status(HTTP_OK).json(incomeOutcomeData);
    return;
  }

  if (
    req.method === "GET" &&
    (req.url.includes("/api/v1/data/random/weather") || req.url.includes("/api/v1/data/random/weather-simple"))
  ) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const weatherData = generateWeatherResponseBasedOnQuery(queryParams, req.url.includes("weather-simple"), true);
    res.status(HTTP_OK).json(weatherData);
    return;
  }
  if (
    req.method === "POST" &&
    (req.url.includes("/api/v1/data/random/weather") || req.url.includes("/api/v1/data/random/weather-simple"))
  ) {
    const days = parseInt(req.body.days);
    const futuredays = parseInt(req.body.futuredays);
    const date = req.body.date;
    const limitedDays = Math.min(days || 31, 90);
    let limitedFutureDays = Math.min(futuredays || 0, 90);

    const weatherData = generateWeatherResponse(
      date,
      days,
      limitedDays,
      limitedFutureDays,
      req.url.includes("weather-simple"),
      true
    );
    res.status(HTTP_OK).json(weatherData);
    return;
  }

  if (
    req.method === "GET" &&
    (req.url.includes("/api/v1/data/random/ecommerce-shopping-cart") ||
      req.url.includes("/api/v1/data/random/ecommerce-shopping-cart-simple"))
  ) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const ecommerceShoppingCartData = generateEcommerceShoppingCartResponse(
      queryParams,
      req.url.includes("ecommerce-shopping-cart-simple"),
      true
    );
    res.status(HTTP_OK).json(ecommerceShoppingCartData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/simple-user")) {
    const userData = generateRandomUser();
    res.status(HTTP_OK).json(userData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/simple-bus-ticket-card")) {
    const busTicketCard = generateRandomSimpleBusTicketCard();
    res.status(HTTP_OK).json(busTicketCard);
    return;
  }
  return;
}

module.exports = {
  handleData,
};
