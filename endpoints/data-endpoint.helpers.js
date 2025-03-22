const {
  generateIncomeOutcomeData,
  generateRandomSimplifiedIncomeOutcomeData,
} = require("../helpers/generators/income-outcome.generator");
const { generateWeatherResponse } = require("../helpers/generators/weather.generator");
const { HTTP_OK } = require("../helpers/response.helpers");
const { logDebug } = require("../helpers/logger-api");
const { generateEcommerceShoppingCart } = require("../helpers/generators/ecommerce-shopping-cart.generator");
const { generateRandomUser } = require("../helpers/generators/user.generator");
const { generateRandomSimpleBusTicketCard } = require("../helpers/generators/bus-ticket.generator");
const { generateRandomStudentsData } = require("../helpers/generators/student-grades-manager.generator");
const { generateRandomEmployeesData } = require("../helpers/generators/employees.generator");
const { generateSystemMetricsResponse } = require("../helpers/generators/system-metrics");
const {
  generateStockExchangeResponse,
  stockGeneratorDefaultOptions,
} = require("../helpers/generators/stock-exchange.generator");
const {
  listOfNumbersDefaultOptions,
  generateListOfNumbersResponse,
} = require("../helpers/generators/numbers.generator");

function generateWeatherResponseBasedOnQuery(queryParams, simplified = false, totalRandom = false) {
  const days = parseInt(queryParams.get("days"));
  const future = parseInt(queryParams.get("futuredays"));
  const date = queryParams.get("date");
  const city = queryParams.get("city");
  const limitedDays = Math.min(days || 31, 90);
  let limitedFutureDays = Math.min(future || 0, 90);
  return generateWeatherResponse(date, days, city, limitedDays, limitedFutureDays, simplified, totalRandom);
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
    (req.method === "POST" || req.method === "PUT") &&
    (req.url.includes("/api/v1/data/random/weather") || req.url.includes("/api/v1/data/random/weather-simple"))
  ) {
    const days = parseInt(req.body.days);
    const futuredays = parseInt(req.body.futuredays);

    if (days < 0) {
      res.status(400).json({ error: "Days must be greater than 0" });
      return;
    }

    if (futuredays < 0) {
      res.status(400).json({ error: "Future days must be greater than 0" });
      return;
    }

    if (days === 0 && futuredays === 0) {
      res.status(HTTP_OK).json([]);
      return;
    }

    const city = req.body.city;
    const date = req.body.date;
    const limitedDays = Math.min(days || 31, 90);
    let limitedFutureDays = Math.min(futuredays || 0, 90);

    const weatherData = generateWeatherResponse(
      date,
      days,
      city,
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

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/students")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const seed = queryParams.get("seed");

    const studentsData = generateRandomStudentsData({ seed });
    res.status(HTTP_OK).json(studentsData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/system-simple")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const seed = queryParams.get("seed");
    const samples = parseInt(queryParams.get("samples")) || 1;
    const interval = parseInt(queryParams.get("interval")) || 1000;

    const systemData = generateSystemMetricsResponse(samples, interval, true);
    res.status(HTTP_OK).json(systemData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v2/data/random/system-simple")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const seed = queryParams.get("seed");
    const samples = parseInt(queryParams.get("samples")) || 1;
    const interval = parseInt(queryParams.get("interval")) || 1000;

    const systemData = generateSystemMetricsResponse(samples, interval, false)[0];

    const simplifiedSystemData = {
      cpu: {
        usage: systemData.cpu.usage.total,
        temperature: systemData.cpu.temperature,
        cores: systemData.cpu.usage.cores.length,
      },
      memory: {
        usage: systemData.memory.used,
        total: systemData.memory.total,
      },
      disk: {
        reads: systemData.disk.reads,
        writes: systemData.disk.writes,
        volumes: [],
      },
      network: {
        interfaces: [],
      },
    };

    systemData.network.interfaces.forEach((_interface) => {
      simplifiedSystemData.network.interfaces.push({
        name: _interface.name,
        bytesReceived: _interface.bytesReceived,
        bytesSent: _interface.bytesSent,
      });
    });

    systemData.disk.volumes.forEach((disc) => {
      simplifiedSystemData.disk.volumes.push({
        name: disc.name,
        percentage: disc.percentage,
      });
    });

    res.status(HTTP_OK).json(simplifiedSystemData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/system")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const seed = queryParams.get("seed");
    const samples = parseInt(queryParams.get("samples")) || 1;
    const interval = parseInt(queryParams.get("interval")) || 1000;
    const simplified = queryParams.get("simplified") === "true";

    const systemData = generateSystemMetricsResponse(samples, interval, simplified);
    res.status(HTTP_OK).json(systemData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/employees")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const seed = queryParams.get("seed") || Math.random().toString();
    const details = queryParams.get("details") === "true";

    const employeesData = generateRandomEmployeesData({ seed, details });
    res.status(HTTP_OK).json(employeesData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v2/data/random/employees")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const seed = queryParams.get("seed") || "my random seed";
    const details = queryParams.get("details") === "true";
    const page = parseInt(queryParams.get("page")) || 1;
    const pageSize = parseInt(queryParams.get("pageSize")) || 10;

    const nameFilter = queryParams.get("name")?.split(",") || [];
    const roleFilter = queryParams.get("role")?.split(",") || [];
    const statusFilter = queryParams.get("status")?.split(",") || [];

    if (pageSize > 100) {
      res.status(400).json({ error: "pageSize cannot be greater than 100" });
      return;
    }

    let employeesData = generateRandomEmployeesData({ seed, details });

    const allRoles = [...new Set(employeesData.map((employee) => employee.role))];
    const allStatus = [...new Set(employeesData.map((employee) => employee.status))];

    if (nameFilter.length > 0 || roleFilter.length > 0 || statusFilter.length > 0) {
      employeesData = employeesData.filter(
        (employee) =>
          (nameFilter.length === 0 || nameFilter.includes(employee.name)) &&
          (roleFilter.length === 0 || roleFilter.includes(employee.role)) &&
          (statusFilter.length === 0 || statusFilter.includes(employee.status))
      );
    }

    const total = employeesData.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = page * pageSize;

    const data = {
      allRoles,
      allStatus,
      page,
      pageSize,
      total,
      totalPages,
      data: employeesData.slice(start, end),
    };

    logDebug(`Returning filtered page ${page} of ${data.totalPages} with ${pageSize} items each`, {
      page,
      pageSize,
      total,
      totalPages: data.totalPages,
      employees: data.data.length,
      filters: {
        name: nameFilter,
        role: roleFilter,
        status: statusFilter,
      },
    });

    res.status(HTTP_OK).json(data);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/stock-exchange")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const seed = queryParams.get("seed") || stockGeneratorDefaultOptions.seed;
    const simplified = queryParams.get("simplified") === "true";
    const samples = parseInt(queryParams.get("samples")) || stockGeneratorDefaultOptions.samples;
    const interval = parseInt(queryParams.get("interval")) || stockGeneratorDefaultOptions.interval;

    const stockExchangeData = generateStockExchangeResponse({ seed, samples, interval }, simplified);
    res.status(HTTP_OK).json(stockExchangeData);
    return;
  }

  if (req.method === "GET" && req.url.includes("/api/v1/data/random/numbers")) {
    const queryParams = new URLSearchParams(req.url.split("?")[1]);
    const samples = parseInt(queryParams.get("samples")) || listOfNumbersDefaultOptions.samples;

    const numbers = generateListOfNumbersResponse({ samples });
    res.status(HTTP_OK).json({ data: numbers });
    return;
  }

  return;
}

module.exports = {
  handleData,
};
