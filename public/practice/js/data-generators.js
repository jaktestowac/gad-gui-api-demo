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

function generateWeatherDataForNSeconds(nSamples) {
  const pastSeconds = generateSecondsStrings(nSamples);
  return generateWeatherDataForNPastDays(pastSeconds);
}

function generateWeatherDataForNDays(nSamples) {
  const pastDays = generateDateStrings(nSamples);
  return generateWeatherDataForNPastDays(pastDays);
}

function generateWeatherDataForNPastDays(pastDays) {
  const weatherData = [];
  const nSamples = pastDays.length;
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

const sampleUser = {
  id: 1,
  name: `Item`,
  surname: "Surname",
  location: "Location",
};

const userNames = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Hannah",
  "Ivy",
  "Jack",
  "Kate",
  "Liam",
  "Mia",
  "Noah",
  "Olivia",
  "Peter",
  "Quinn",
  "Ryan",
  "Sophia",
  "Tom",
  "Uma",
  "Victor",
  "Wendy",
  "Xander",
  "Yara",
  "Zane",
  "Ava",
  "Ben",
  "Cara",
  "Dylan",
  "Emma",
  "Finn",
  "Gina",
  "Henry",
  "Isla",
  "Jake",
  "Kara",
  "Luke",
  "Luna",
  "Max",
  "Nina",
  "Owen",
  "Penny",
  "Quentin",
  "Rose",
  "Sam",
  "Sara",
  "Tim",
  "Tina",
  "Ulysses",
  "Vera",
  "Will",
  "Willa",
  "Xavier",
  "Yasmin",
  "Zara",
];
const userSurnames = [
  "Smith",
  "Johnson",
  "Williams",
  "Jones",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Garcia",
  "Martinez",
  "Robinson",
  "Clark",
  "Rodriguez",
  "Lewis",
  "Lee",
  "Walker",
  "Hall",
  "Allen",
  "Young",
  "Hernandez",
  "King",
  "Wright",
  "Lopez",
  "Hill",
  "Scott",
  "Green",
  "Adams",
  "Baker",
  "Gonzalez",
  "Nelson",
  "Carter",
  "Mitchell",
  "Perez",
  "Roberts",
  "Turner",
  "Phillips",
  "Campbell",
  "Parker",
  "Evans",
  "Edwards",
  "Collins",
  "Stewart",
  "Sanchez",
  "Morris",
  "Rogers",
  "Reed",
  "Cook",
  "Morgan",
  "Bell",
  "Murphy",
  "Bailey",
  "Rivera",
  "Cooper",
  "Richardson",
  "Cox",
  "Howard",
  "Ward",
  "Torres",
  "Peterson",
  "Gray",
  "Ramirez",
  "James",
  "Watson",
  "Brooks",
  "Kelly",
  "Sanders",
  "Price",
  "Bennett",
  "Wood",
  "Barnes",
  "Ross",
  "Henderson",
  "Coleman",
  "Jenkins",
  "Perry",
  "Powell",
  "Long",
  "Patterson",
  "Hughes",
  "Flores",
  "Washington",
  "Butler",
  "Simmons",
  "Foster",
  "Gonzales",
  "Bryant",
  "Alexander",
  "Russell",
  "Griffin",
  "Diaz",
  "Hayes",
];
const userLocations = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "San Jose",
  "Austin",
  "Jacksonville",
  "San Francisco",
  "Indianapolis",
  "Columbus",
  "Fort Worth",
  "Charlotte",
  "Seattle",
  "Denver",
  "El Paso",
  "Detroit",
  "Washington",
  "Boston",
  "Memphis",
  "Nashville",
  "Portland",
  "Oklahoma City",
  "Las Vegas",
  "Baltimore",
  "Louisville",
  "Milwaukee",
  "Albuquerque",
  "Tucson",
  "Fresno",
  "Sacramento",
  "Mesa",
  "Kansas City",
  "Atlanta",
  "Long Beach",
  "Colorado Springs",
  "Raleigh",
  "Miami",
  "Virginia Beach",
  "Omaha",
  "Oakland",
  "Minneapolis",
  "Tulsa",
  "Arlington",
  "New Orleans",
  "Wichita",
  "Cleveland",
  "Tampa",
  "Bakersfield",
  "Aurora",
  "Honolulu",
  "Anaheim",
  "Santa Ana",
  "Corpus Christi",
  "Riverside",
  "St. Louis",
  "Lexington",
  "Stockton",
  "Pittsburgh",
  "Saint Paul",
  "Anchorage",
  "Cincinnati",
  "Henderson",
  "Greensboro",
  "Plano",
  "Newark",
  "Toledo",
  "Lincoln",
  "Orlando",
  "Chula Vista",
  "Jersey City",
  "Chandler",
  "Fort Wayne",
  "Buffalo",
  "Durham",
  "St. Petersburg",
  "Irvine",
  "Laredo",
  "Lubbock",
  "Madison",
  "Gilbert",
  "Norfolk",
  "Reno",
  "Winston-Salem",
  "Glendale",
  "Hialeah",
];

function randomUserGenerator(userId) {
  const randomUser = { ...sampleUser };
  randomUser.id = userId;
  randomUser.name = userNames[Math.floor(Math.random() * userNames.length)];
  randomUser.surname = userSurnames[Math.floor(Math.random() * userSurnames.length)];
  randomUser.location = userLocations[Math.floor(Math.random() * userLocations.length)];

  // TODO: reuse in other places
  // if (Math.random() < 0.05) {
  //   const fields = ["name", "surname", "location"];
  //   const randomFieldIndex = Math.floor(Math.random() * fields.length);
  //   randomUser[fields[randomFieldIndex]] = "";
  // }

  return randomUser;
}

function generateRandomUsers(numberOfUsers, id = 1) {
  const users = [];
  for (let i = 0; i < numberOfUsers; i++) {
    const randomUser = randomUserGenerator(id + i);
    users.push(randomUser);
  }

  return users;
}
