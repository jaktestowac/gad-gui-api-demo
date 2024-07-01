const weatherData = [
  { date: "2022-01-01", weather: "☀️ Sunny", temperature: "25°C", sunriseSunset: "6:30 AM - 7:30 PM" },
  { date: "2022-01-02", weather: "☁️ Cloudy", temperature: "20°C", sunriseSunset: "6:45 AM - 7:15 PM" },
  { date: "2022-01-03", weather: "🌧️ Rainy", temperature: "18°C", sunriseSunset: "7:00 AM - 7:00 PM" },
  { date: "2022-01-04", weather: "⛅ Partly Cloudy", temperature: "22°C", sunriseSunset: "6:15 AM - 7:45 PM" },
  { date: "2022-01-05", weather: "⛈️ Thunderstorms", temperature: "23°C", sunriseSunset: "6:00 AM - 8:00 PM" },
  { date: "2022-01-06", weather: "💨 Windy", temperature: "19°C", sunriseSunset: "6:30 AM - 7:30 PM" },
  { date: "2022-01-07", weather: "❄️ Snowy", temperature: "-5°C", sunriseSunset: "7:00 AM - 6:00 PM" },
  { date: "2022-01-08", weather: "🌁 Foggy", temperature: "10°C", sunriseSunset: "6:45 AM - 7:15 PM" },
  { date: "2022-01-09", weather: "🌫️ Hazy", temperature: "15°C", sunriseSunset: "7:30 AM - 6:30 PM" },
  { date: "2022-01-10", weather: "🌨️ Sleet", temperature: "0°C", sunriseSunset: "6:15 AM - 7:45 PM" },
  { date: "2022-01-11", weather: "🌫️ Misty", temperature: "12°C", sunriseSunset: "6:00 AM - 8:00 PM" },
  { date: "2022-01-12", weather: "☀️ Clear", temperature: "28°C", sunriseSunset: "6:30 AM - 7:30 PM" },
  { date: "2022-01-13", weather: "❄️ Frosty", temperature: "-10°C", sunriseSunset: "7:00 AM - 6:00 PM" },
  { date: "2022-01-14", weather: "💦 Wet", temperature: "16°C", sunriseSunset: "6:45 AM - 7:15 PM" },
  { date: "2022-01-15", weather: "❄️ Icy", temperature: "-2°C", sunriseSunset: "7:30 AM - 6:30 PM" },
];

const randomStockData = [
  {
    date: "2022-01-01",
    prices: [
      { symbol: "AAPL", price: "161.38" },
      { symbol: "GOOGL", price: "177.10" },
      { symbol: "AMZN", price: "94.25" },
      { symbol: "MSFT", price: "110.49" },
      { symbol: "FB", price: "135.25" },
    ],
  },
  {
    date: "2022-01-02",
    prices: [
      { symbol: "AAPL", price: "129.51" },
      { symbol: "GOOGL", price: "136.07" },
      { symbol: "AMZN", price: "198.01" },
      { symbol: "MSFT", price: "188.78" },
      { symbol: "FB", price: "186.93" },
    ],
  },
  {
    date: "2022-01-03",
    prices: [
      { symbol: "AAPL", price: "115.88" },
      { symbol: "GOOGL", price: "120.45" },
      { symbol: "AMZN", price: "118.43" },
      { symbol: "MSFT", price: "170.53" },
      { symbol: "FB", price: "60.64" },
    ],
  },
  {
    date: "2022-01-04",
    prices: [
      { symbol: "AAPL", price: "156.41" },
      { symbol: "GOOGL", price: "150.65" },
      { symbol: "AMZN", price: "55.47" },
      { symbol: "MSFT", price: "75.68" },
      { symbol: "FB", price: "188.38" },
    ],
  },
  {
    date: "2022-01-05",
    prices: [
      { symbol: "AAPL", price: "97.11" },
      { symbol: "GOOGL", price: "180.35" },
      { symbol: "AMZN", price: "57.45" },
      { symbol: "MSFT", price: "90.86" },
      { symbol: "FB", price: "51.88" },
    ],
  },
  {
    date: "2022-01-06",
    prices: [
      { symbol: "AAPL", price: "179.33" },
      { symbol: "GOOGL", price: "135.77" },
      { symbol: "AMZN", price: "66.86" },
      { symbol: "MSFT", price: "62.80" },
      { symbol: "FB", price: "167.34" },
    ],
  },
  {
    date: "2022-01-07",
    prices: [
      { symbol: "AAPL", price: "173.21" },
      { symbol: "GOOGL", price: "125.62" },
      { symbol: "AMZN", price: "63.20" },
      { symbol: "MSFT", price: "166.75" },
      { symbol: "FB", price: "144.23" },
    ],
  },
  {
    date: "2022-01-08",
    prices: [
      { symbol: "AAPL", price: "121.89" },
      { symbol: "GOOGL", price: "126.78" },
      { symbol: "AMZN", price: "106.02" },
      { symbol: "MSFT", price: "64.48" },
      { symbol: "FB", price: "161.93" },
    ],
  },
  {
    date: "2022-01-09",
    prices: [
      { symbol: "AAPL", price: "194.91" },
      { symbol: "GOOGL", price: "134.32" },
      { symbol: "AMZN", price: "98.09" },
      { symbol: "MSFT", price: "188.92" },
      { symbol: "FB", price: "55.79" },
    ],
  },
  {
    date: "2022-01-10",
    prices: [
      { symbol: "AAPL", price: "145.23" },
      { symbol: "GOOGL", price: "176.98" },
      { symbol: "AMZN", price: "162.38" },
      { symbol: "MSFT", price: "158.16" },
      { symbol: "FB", price: "145.16" },
    ],
  },
  {
    date: "2022-01-11",
    prices: [
      { symbol: "AAPL", price: "153.20" },
      { symbol: "GOOGL", price: "65.23" },
      { symbol: "AMZN", price: "187.67" },
      { symbol: "MSFT", price: "60.78" },
      { symbol: "FB", price: "74.06" },
    ],
  },
  {
    date: "2022-01-12",
    prices: [
      { symbol: "AAPL", price: "187.01" },
      { symbol: "GOOGL", price: "162.89" },
      { symbol: "AMZN", price: "185.13" },
      { symbol: "MSFT", price: "116.10" },
      { symbol: "FB", price: "131.54" },
    ],
  },
  {
    date: "2022-01-13",
    prices: [
      { symbol: "AAPL", price: "121.87" },
      { symbol: "GOOGL", price: "196.01" },
      { symbol: "AMZN", price: "61.53" },
      { symbol: "MSFT", price: "95.39" },
      { symbol: "FB", price: "150.10" },
    ],
  },
  {
    date: "2022-01-14",
    prices: [
      { symbol: "AAPL", price: "61.99" },
      { symbol: "GOOGL", price: "190.33" },
      { symbol: "AMZN", price: "198.95" },
      { symbol: "MSFT", price: "56.01" },
      { symbol: "FB", price: "105.70" },
    ],
  },
  {
    date: "2022-01-15",
    prices: [
      { symbol: "AAPL", price: "111.26" },
      { symbol: "GOOGL", price: "156.65" },
      { symbol: "AMZN", price: "151.07" },
      { symbol: "MSFT", price: "105.51" },
      { symbol: "FB", price: "142.36" },
    ],
  },
];

const randomProductData = {
  ecommerceProducts: [
    {
      name: "Wireless Bluetooth Headphones",
      description:
        "Experience high-fidelity audio with our wireless Bluetooth headphones. Features noise-cancellation and long battery life.",
      price: 59.99,
      category: "Electronics",
      sku: "ELEC1001",
      stockLevel: 50,
    },
    {
      name: "Men's Casual Jacket",
      description:
        "Stylish and comfortable, this men's casual jacket is perfect for everyday wear. Made from durable materials.",
      price: 79.99,
      category: "Clothing",
      sku: "CLTH2001",
      stockLevel: 25,
    },
    {
      name: "Non-Stick Cookware Set",
      description:
        "Upgrade your kitchen with this premium non-stick cookware set. Includes pots, pans, and utensils for all your cooking needs.",
      price: 129.99,
      category: "Home & Kitchen",
      sku: "HNK3001",
      stockLevel: 40,
    },
    {
      name: "Smart LED Bulb",
      description:
        "Control the lighting in your home with this smart LED bulb. Compatible with major smart home systems and offers various color options.",
      price: 19.99,
      category: "Electronics",
      sku: "ELEC1002",
      stockLevel: 100,
    },
    {
      name: "Yoga Mat with Carrying Strap",
      description:
        "Comfortable and durable yoga mat with a carrying strap for easy transportation. Ideal for yoga, Pilates, and other exercises.",
      price: 24.99,
      category: "Sports & Outdoors",
      sku: "SPRT4001",
      stockLevel: 60,
    },
  ],
  digitalProducts: [
    {
      name: "Photo Editing Software",
      version: "4.1",
      licenseKey: "PHOT2023-XYZ",
      description:
        "Advanced photo editing software with a wide range of tools and features. Perfect for both beginners and professionals.",
    },
    {
      name: "Project Management Tool",
      version: "5.3",
      licenseKey: "PMTOOL2023-ABC",
      description:
        "Streamline your projects with our comprehensive project management tool. Features task tracking, team collaboration, and more.",
    },
    {
      name: "Antivirus Software",
      version: "8.0",
      licenseKey: "AV2023-DEF",
      description:
        "Protect your computer from viruses, malware, and other threats with our top-rated antivirus software. Includes real-time protection.",
    },
    {
      name: "E-Book Reader",
      version: "2.2",
      licenseKey: "EBK2023-GHI",
      description:
        "Enjoy reading your favorite books with our easy-to-use e-book reader software. Supports various file formats and has a customizable interface.",
    },
    {
      name: "Music Streaming App",
      version: "3.5",
      licenseKey: "MUSIC2023-JKL",
      description:
        "Access millions of songs and playlists with our music streaming app. High-quality audio and offline listening available.",
    },
  ],
};

const geographicData = {
  locations: [
    {
      cityName: "San Francisco",
      countryName: "United States",
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      postalCode: "94103",
      region: "California",
      population: 883305,
      timezone: "PST",
    },
    {
      cityName: "Paris",
      countryName: "France",
      coordinates: {
        latitude: 48.8566,
        longitude: 2.3522,
      },
      postalCode: "75001",
      region: "Île-de-France",
      population: 2148327,
      timezone: "CET",
    },
    {
      cityName: "Tokyo",
      countryName: "Japan",
      coordinates: {
        latitude: 35.6895,
        longitude: 139.6917,
      },
      postalCode: "100-0001",
      region: "Kantō",
      population: 13929286,
      timezone: "JST",
    },
    {
      cityName: "Sydney",
      countryName: "Australia",
      coordinates: {
        latitude: -33.8688,
        longitude: 151.2093,
      },
      postalCode: "2000",
      region: "New South Wales",
      population: 5312163,
      timezone: "AEST",
    },
    {
      cityName: "Toronto",
      countryName: "Canada",
      coordinates: {
        latitude: 43.65107,
        longitude: -79.347015,
      },
      postalCode: "M5H 2N2",
      region: "Ontario",
      population: 2731571,
      timezone: "EST",
    },
  ],
};

const timeZones = [
  {
    name: "Pacific Standard Time",
    abbreviation: "PST",
    offset: -8,
    country: ["United States", "Canada"],
    region: "North America",
    cityExamples: ["Los Angeles", "San Francisco", "Seattle", "Vancouver"],
  },
  {
    name: "Mountain Standard Time",
    abbreviation: "MST",
    offset: -7,
    country: ["United States", "Canada"],
    region: "North America",
    cityExamples: ["Denver", "Phoenix", "Salt Lake City", "Calgary"],
  },
  {
    name: "Central Standard Time",
    abbreviation: "CST",
    offset: -6,
    country: ["United States", "Canada", "Mexico"],
    region: "North America",
    cityExamples: ["Chicago", "Houston", "Mexico City", "Winnipeg"],
  },
  {
    name: "Eastern Standard Time",
    abbreviation: "EST",
    offset: -5,
    country: ["United States", "Canada"],
    region: "North America",
    cityExamples: ["New York", "Toronto", "Miami", "Montreal"],
  },
  {
    name: "Atlantic Standard Time",
    abbreviation: "AST",
    offset: -4,
    country: ["Canada", "Bermuda"],
    region: "North America",
    cityExamples: ["Halifax", "Charlottetown", "Bermuda"],
  },
  {
    name: "Greenwich Mean Time",
    abbreviation: "GMT",
    offset: 0,
    country: ["United Kingdom", "Portugal"],
    region: "Europe",
    cityExamples: ["London", "Lisbon", "Dublin"],
  },
  {
    name: "Central European Time",
    abbreviation: "CET",
    offset: 1,
    country: ["Germany", "France", "Italy", "Spain"],
    region: "Europe",
    cityExamples: ["Berlin", "Paris", "Rome", "Madrid"],
  },
  {
    name: "Eastern European Time",
    abbreviation: "EET",
    offset: 2,
    country: ["Greece", "Finland", "Romania", "Israel"],
    region: "Europe",
    cityExamples: ["Athens", "Helsinki", "Bucharest", "Tel Aviv"],
  },
  {
    name: "Moscow Standard Time",
    abbreviation: "MSK",
    offset: 3,
    country: ["Russia"],
    region: "Europe/Asia",
    cityExamples: ["Moscow", "Saint Petersburg", "Kazan"],
  },
  {
    name: "Indian Standard Time",
    abbreviation: "IST",
    offset: 5.5,
    country: ["India"],
    region: "Asia",
    cityExamples: ["New Delhi", "Mumbai", "Bangalore", "Chennai"],
  },
  {
    name: "China Standard Time",
    abbreviation: "CST",
    offset: 8,
    country: ["China"],
    region: "Asia",
    cityExamples: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen"],
  },
  {
    name: "Japan Standard Time",
    abbreviation: "JST",
    offset: 9,
    country: ["Japan"],
    region: "Asia",
    cityExamples: ["Tokyo", "Osaka", "Kyoto", "Nagoya"],
  },
  {
    name: "Australian Eastern Standard Time",
    abbreviation: "AEST",
    offset: 10,
    country: ["Australia"],
    region: "Oceania",
    cityExamples: ["Sydney", "Melbourne", "Brisbane", "Canberra"],
  },
  {
    name: "New Zealand Standard Time",
    abbreviation: "NZST",
    offset: 12,
    country: ["New Zealand"],
    region: "Oceania",
    cityExamples: ["Auckland", "Wellington", "Christchurch", "Hamilton"],
  },
];

const placesOfInterest = [
  {
    restaurantName: "Golden Gate Grill",
    address: "San Francisco",
    rating: 4.5,
    reviews: [
      "Amazing food and great service!",
      "The view is stunning and the meals are worth every penny.",
      "Had a wonderful evening with friends here.",
    ],
    cuisineType: "American",
    priceRange: "$$$",
    openingHours: "10:00 AM - 11:00 PM",
  },
  {
    restaurantName: "Le Petit Bistro",
    address: "Paris, France",
    rating: 4.7,
    reviews: [
      "A cozy place with fantastic French cuisine.",
      "The desserts are to die for!",
      "Highly recommend for a romantic dinner.",
    ],
    cuisineType: "French",
    priceRange: "$$$$",
    openingHours: "12:00 PM - 10:00 PM",
  },
  {
    restaurantName: "Sakura Sushi",
    address: "Tokyo, Japan",
    rating: 4.8,
    reviews: ["Best sushi in Tokyo!", "Fresh fish and great atmosphere.", "A bit pricey but worth it."],
    cuisineType: "Japanese",
    priceRange: "$$$$",
    openingHours: "11:00 AM - 9:00 PM",
  },
  {
    restaurantName: "Harbourview Café",
    address: "Sydney, Australia",
    rating: 4.6,
    reviews: [
      "Lovely café with a great view of the harbour.",
      "Perfect spot for brunch.",
      "Friendly staff and delicious food.",
    ],
    cuisineType: "Australian",
    priceRange: "$$",
    openingHours: "8:00 AM - 10:00 PM",
  },
  {
    restaurantName: "Maple Leaf Diner",
    address: "Toronto, Canada",
    rating: 4.4,
    reviews: [
      "Great Canadian dishes with a modern twist.",
      "Loved the poutine and maple syrup pancakes.",
      "Comfortable seating and good service.",
    ],
    cuisineType: "Canadian",
    priceRange: "$$",
    openingHours: "7:00 AM - 9:00 PM",
  },
];

const selectorElementPair = [
  {
    selector: "#id-label-td",
    html: `<label style="display: inherit;" id="id-label-element" data-testid="dti-label-element">Some text for label</label>`,
  },
  {
    selector: "#id-button-td",
    html: `<button style="display: inherit;" id="id-button-element" data-testid="dti-button-element" onclick="buttonOnClick()">Click me!</button>`,
  },
  {
    selector: "#id-checkbox-td",
    html: `<input style="display: inherit;" type="checkbox" id="id-checkbox" data-testid="dti-checkbox" name="name-checkbox" value="checkbox" onclick="checkBoxOnClick()">Checkbox`,
  },
  {
    selector: "#id-input-td",
    html: `<input style="display: inherit;" type="text" id="id-input" data-testid="dti-input" onchange="inputOnChange()">`,
  },
  {
    selector: "#id-textarea-td",
    html: `<textarea style="display: inherit;" id="id-textarea" data-testid="dti-textarea" onchange="textareaOnChange()"></textarea>`,
  },
  {
    selector: "#id-dropdown-td",
    html: `<select style="display: inherit; width: 75px;" id="id-dropdown" name="name-dropdown" id="id-dropdown" data-testid="dti-dropdown" onchange="dropdownOnChange()">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>`,
  },
  {
    selector: "#id-radio-buttons-td",
    html: `<input style="display: inherit;" type="radio" id="id-radio1" data-testid="dti-radio1" onclick="radioButtonOnClick(1)" name="name-radio" value="radio1">
          <label for="radio1">Radio Button 1</label>
          <br />
          <input style="display: inherit;" type="radio" id="id-radio2" data-testid="dti-radio2" onclick="radioButtonOnClick(2)" name="name-radio" value="radio2">
          <label for="radio2">Radio Button 2</label>
          <br />
          <input style="display: inherit;" type="radio" id="id-radio3" data-testid="dti-radio3" onclick="radioButtonOnClick(3)" name="name-radio" value="radio3">
          <label for="radio3">Radio Button 3</label>`,
  },
  {
    selector: "#id-range-td",
    html: `<input style="display: inherit;" type="range" min="0" max="100" value="23" id="id-range" data-testid="dti-range" onchange="rangeOnChange()">`,
  },
  {
    selector: "#id-date-td",
    html: `<input style="display: inherit;" type="date" id="id-date" data-testid="dti-date" onchange="datetimeOnChange()">`,
  },
  {
    selector: "#id-color-td",
    html: `<input style="display: inherit;" type="color" id="id-color" data-testid="dti-color" onchange="colorOnChange()">`,
  },
];

const weatherTypes = [
  "☀️ Sunny",
  "🌤️ Partly Cloudy",
  "⛅ Cloudy",
  "🌦️ Showers",
  "🌧️ Rainy",
  "🌩️ Thunderstorms",
  "❄️ Snowy",
  "💨 Windy",
  "🌫️ Foggy",
];

const moonPhaseTypes = [
  "🌑 New Moon",
  "🌒 Waxing Crescent",
  "🌓 First Quarter",
  "🌔 Waxing Gibbous",
  "🌕 Full Moon",
  "🌖 Waning Gibbous",
  "🌗 Last Quarter",
  "🌘 Waning Crescent",
];

const airQualityIndexAQI = [
  { range: "0-50", quality: "Good", color: "green" },
  { range: "51-100", quality: "Moderate", color: "yellow" },
  { range: "101-150", quality: "Unhealthy for Sensitive Groups", color: "orange" },
  { range: "151-200", quality: "Unhealthy", color: "red" },
  { range: "201-300", quality: "Very Unhealthy", color: "purple" },
  { range: "301-500", quality: "Hazardous", color: "maroon" },
];

const windSpeedTypes = [
  "0-5 km/h",
  "5-10 km/h",
  "10-15 km/h",
  "15-20 km/h",
  "20-25 km/h",
  "25-30 km/h",
  "30-35 km/h",
  "35-40 km/h",
];

const weatherAlertTypes = [
  { name: "None", icon: "" },
  { name: "Thunderstorm Warning", icon: "⛈️" },
  { name: "Tornado Watch", icon: "🌪️" },
  { name: "Flood Advisory", icon: "🌊" },
  { name: "Blizzard Warning", icon: "❄️" },
  { name: "Heat Advisory", icon: "🌡️" },
  { name: "Air Quality Alert", icon: "🌬️" },
  { name: "High Wind Warning", icon: "💨" },
  { name: "Winter Storm Watch", icon: "🌨️" },
  { name: "Volcano Alert", icon: "🌋" },
  { name: "Meteor Alert", icon: "☄️" },
  { name: "Solar Flare Warning", icon: "🔆" },
  { name: "Earthquake Alert", icon: "🌍" },
  { name: "Tsunami Warning", icon: "🌊" },
  { name: "Avalanche Warning", icon: "❄️" },
];

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

const restaurantNames = [
  "Golden Gate Grill",
  "The Italian Kitchen",
  "Sushi Paradise",
  "La Petite Boulangerie",
  "The Big Apple Cafe",
  "Tokyo Nights",
  "Le Parisien",
  "The Golden Dragon",
  "The Red Rose",
  "The Blue Lagoon",
  "The Green Leaf",
  "The Purple Plum",
  "The Orange Peel",
  "The Yellow Submarine",
  "The Pink Panther",
  "The Black Pearl",
  "The White House",
  "The Silver Spoon",
  "The Golden Nugget",
  "The Bronze Bell",
  "The Rustic Table",
  "Sunset Bistro",
  "Urban Spice",
  "Moonlight Diner",
  "The Copper Kettle",
  "Ocean's Delight",
  "Fire & Ice Grill",
  "Velvet Lounge",
  "The Garden Terrace",
  "Twilight Tavern",
  "Harbor House",
  "The Vintage Plate",
  "Maple Street Cafe",
  "Sapphire Steakhouse",
  "Emerald Eats",
  "Crimson Café",
  "The Ivory Tower",
  "Coral Cove",
  "The Jade Palace",
  "Mystic River",
  "Bamboo Garden",
  "Royal Feast",
  "The Silver Fox",
  "Copper Canyon",
  "Eagle's Nest",
  "Crystal Bay",
  "The Golden Goose",
  "The Scarlet Room",
  "Topaz Bistro",
  "Cedar Grove",
];

const restaurantReviews = [
  "Amazing food and great atmosphere!",
  "Service was a bit slow, but the food made up for it.",
  "Best dining experience I've had in a long time.",
  "Not worth the price.",
  "Absolutely fantastic! Will come again.",
  "Food was okay, but the place was too crowded.",
  "A hidden gem in the city.",
  "Loved the ambiance and the cuisine.",
  "Overrated and overpriced.",
  "Perfect spot for a family dinner.",
  "Great for a quick bite.",
  "Would not recommend.",
  "Exceptional service and delicious food.",
  "Just average, nothing special.",
  "A bit too noisy for my taste.",
  "Fantastic place for a date night.",
  "Loved the variety on the menu.",
  "Will definitely be returning soon.",
  "The dessert was to die for.",
  "Not what I expected, but still good.",
];

const restaurantLocations = [
  "Downtown",
  "Uptown",
  "Midtown",
  "Suburb",
  "Waterfront",
  "Mountainview",
  "Riverside",
  "Seaside",
  "Historic District",
  "Business District",
  "Chinatown",
  "Little Italy",
  "Arts District",
  "Tech Park",
  "University Area",
  "Old Town",
  "New Town",
  "Financial District",
  "Industrial Zone",
  "Countryside",
];

const cuisineTypes = [
  "American",
  "Italian",
  "Japanese",
  "French",
  "Chinese",
  "Mexican",
  "Indian",
  "Mediterranean",
  "Thai",
  "Spanish",
  "Greek",
  "Vietnamese",
  "Korean",
  "Brazilian",
  "Turkish",
  "Moroccan",
  "Ethiopian",
  "Lebanese",
  "Caribbean",
  "Russian",
];
