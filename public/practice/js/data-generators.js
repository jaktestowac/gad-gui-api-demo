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
