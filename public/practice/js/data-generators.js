function generateRandomStockData() {
  const stocks = ["AAPL", "GOOGL", "AMZN", "MSFT", "FB"]; // List of stock symbols
  const startDate = new Date("2022-01-01"); // Start date for the data
  const endDate = new Date("2022-01-15"); // End date for the data
  const stockData = [];

  for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
    const stockPrices = stocks.map((stock) => ({
      symbol: stock,
      price: getRandomPrice(),
    }));

    stockData.push({
      date: formatDate(date),
      prices: stockPrices,
    });
  }

  return stockData;
}

function getRandomPrice() {
  const minPrice = 50; // Minimum price for a stock
  const maxPrice = 200; // Maximum price for a stock
  return (Math.random() * (maxPrice - minPrice) + minPrice).toFixed(2);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateWeatherDataForNDays(nSamples) {
  const pastDays = generateDateStrings(nSamples);

  const weatherData = [];
  for (let i = 0; i < nSamples; i++) {
    const dataGenerator = new RandomValueGenerator(pastDays[i]);

    const date = pastDays[i];
    const weather = weatherTypes[dataGenerator.getNextValue(0, weatherTypes.length - 1)];

    let temperature = `${dataGenerator.getNextValue(15, 35)}°C`;
    if (dataGenerator.getNextValue(0, 100) < 20) {
      temperature = `${dataGenerator.getNextValue(-20, 50)}°C`;
    }

    const sunriseHour = dataGenerator.getNextValue(4, 6);
    const sunsetHour = dataGenerator.getNextValue(19, 23);
    const sunriseSunset = `${sunriseHour}:00 AM - ${sunsetHour}:00 PM`;

    const humidity = `${dataGenerator.getNextValue(30, 90)}%`;

    let windSpeed = windSpeedTypes[0];
    if (dataGenerator.getNextValue(0, 100) < 20) {
      windSpeed = windSpeedTypes[dataGenerator.getNextValue(0, windSpeedTypes.length - 1)];
    }

    const windDirection = dataGenerator.getNextValue(0, 360);
    const moonPhase = moonPhaseTypes[dataGenerator.getNextValue(0, moonPhaseTypes.length - 1)];
    const airQualityIndex = airQualityIndexAQI[dataGenerator.getNextValue(0, airQualityIndexAQI.length - 1)];

    let weatherAlert = weatherAlertTypes[0];
    if (dataGenerator.getNextValue(0, 100) < 25) {
      weatherAlert = weatherAlertTypes[dataGenerator.getNextValue(0, weatherAlertTypes.length - 1)];
    }

    weatherData.push({
      date,
      weather,
      temperature,
      sunriseSunset,
      humidity,
      windSpeed,
      windDirection,
      moonPhase,
      airQualityIndex,
      weatherAlert,
    });
  }

  return weatherData;
}

function randomPlacesGenerator(numberOfPlaces, restaurantNames, addresses, cuisineTypes, reviews) {
  const places = [];
  for (let i = 0; i < numberOfPlaces; i++) {
    const randomPlace = randomPlaceGenerator(restaurantNames, addresses, cuisineTypes, reviews);
    places.push(randomPlace);
  }

  return places;
}

function randomPlaceGenerator(restaurantNames, addresses, cuisineTypes, reviews) {
  const priceRanges = ["$", "$$", "$$$", "$$$$", "$$$$$"];
  const openingHours = generateRandomOpeningHours();

  const randomRestaurantNameIndex = Math.floor(Math.random() * restaurantNames.length);
  const randomAddressIndex = Math.floor(Math.random() * addresses.length);
  const randomCuisineTypeIndex = Math.floor(Math.random() * cuisineTypes.length);
  const randomPriceRangeIndex = Math.floor(Math.random() * priceRanges.length);

  const randomNumOfReviews = Math.floor(Math.random() * 6) + 1;
  const randomReviews = [];

  for (let i = 0; i < randomNumOfReviews; i++) {
    const randomReviewIndex = Math.floor(Math.random() * reviews.length);
    randomReviews.push(reviews[randomReviewIndex]);
  }

  const randomRating = (Math.random() * 5).toFixed(1);

  const randomPlace = {
    restaurantName: restaurantNames[randomRestaurantNameIndex],
    address: addresses[randomAddressIndex],
    rating: randomRating,
    reviews: randomReviews,
    cuisineType: cuisineTypes[randomCuisineTypeIndex],
    priceRange: priceRanges[randomPriceRangeIndex],
    openingHours: openingHours,
  };

  return randomPlace;
}

function generateRandomOpeningHours() {
  const openingHour = Math.floor(Math.random() * 12) + 1;
  const closingHour = openingHour + Math.floor(Math.random() * 12) + 1;
  const openingPeriod = Math.random() < 0.5 ? "AM" : "PM";
  const closingPeriod = Math.random() < 0.5 ? "AM" : "PM";

  const openingTime = `${openingHour}:00 ${openingPeriod}`;
  const closingTime = `${closingHour}:00 ${closingPeriod}`;

  return `${openingTime} - ${closingTime}`;
}
