const { RandomValueGenerator } = require("./random-data.generator");

const categoryTypes = [
  { name: "food", index: 0, emoji: "🍔" },
  { name: "rent", index: 1, emoji: "🏠" },
  { name: "transport", index: 2, emoji: "🚗" },
  { name: "entertainment", index: 3, emoji: "🎮" },
  { name: "clothing", index: 4, emoji: "👗" },
  { name: "health", index: 5, emoji: "🏥" },
  { name: "education", index: 6, emoji: "🎓" },
  { name: "other", index: 7, emoji: "🔧" },
  { name: "cleaning", index: 8, emoji: "🧹" },
  { name: "gift", index: 9, emoji: "🎁" },
  { name: "investment", index: 10, emoji: "💹" },
  { name: "loan", index: 11, emoji: "💸" },
  { name: "savings", index: 12, emoji: "💰" },
  { name: "repairs", index: 13, emoji: "🔨" },
];

const incomeSources = [
  { name: "salary", index: 0, emoji: "💼" },
  { name: "investment", index: 1, emoji: "📈" },
  { name: "loan", index: 2, emoji: "💳" },
  { name: "savings", index: 3, emoji: "🏦" },
  { name: "other", index: 4, emoji: "🔍" },
  { name: "dividends", index: 5, emoji: "💵" },
  { name: "gift", index: 6, emoji: "🎁" },
  { name: "bonus", index: 7, emoji: "💰" },
  { name: "refund", index: 8, emoji: "🔄" },
];

function generateDateStrings(pastDays) {
  const dateStrings = [];
  for (let i = 0; i < pastDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dateStrings.push(date.toISOString().split("T")[0]);
  }
  return dateStrings;
}

function generateDateStringsFromDateToNow(pastDate) {
  const dateStrings = [];
  const date = new Date(pastDate);
  const currentDate = new Date();
  while (date < currentDate) {
    dateStrings.push(date.toISOString().split("T")[0]);
    date.setDate(date.getDate() + 1);
  }
  return dateStrings;
}

function generateIncomeOutcomeData(nSamples) {
  const pastDays = generateDateStringsFromDateToNow("2022-01-01");

  const incomeOutcomeData = [];
  for (let i = 0; i < pastDays.length; i++) {
    const dataGenerator = new RandomValueGenerator(pastDays[i]);
    // const transactionsGenerator = new RandomValueGenerator(pastDays[i] + "-transactions");

    const date = pastDays[i];
    const transactions = [];

    if (date.endsWith("01")) {
      const salary = dataGenerator.getNextValue(9000, 15000);
      transactions.push({
        category: incomeSources.find((category) => category.name === "salary"),
        amount: salary,
      });
      if (dataGenerator.getNextValue(0, 100) < 10) {
        const salary = dataGenerator.getNextValue(1000, 6000);
        transactions.push({
          category: incomeSources.find((category) => category.name === "bonus"),
          amount: salary,
        });
      }
    }

    const numberOfTransactions = dataGenerator.getNextValue(1, 5);
    for (let j = 0; j < numberOfTransactions; j++) {
      const category = categoryTypes[dataGenerator.getNextValue(0, categoryTypes.length)];
      let amount = dataGenerator.getNextValue(50, 300) * -1;

      if (dataGenerator.getNextValue(0, 100) < 10) {
        amount = dataGenerator.getNextValue(100, 2000) * -1;
      }

      transactions.push({
        category: category,
        amount: amount,
      });
    }

    // add additional income
    if (dataGenerator.getNextValue(0, 100) < 50) {
      const category = incomeSources[dataGenerator.getNextValue(0, incomeSources.length)];
      let amount = dataGenerator.getNextValue(50, 500);

      if (dataGenerator.getNextValue(0, 100) < 20) {
        amount = dataGenerator.getNextValue(1000, 2000);
      }
      transactions.push({
        category: category,
        amount: amount,
      });
    }

    const dailyBalance = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);

    const cost = {
      date: date,
      dailyBalance,
      totalBalance: 0,
      transactions,
    };

    incomeOutcomeData.unshift(cost);
  }

  const monthlyBalance = {};
  for (let i = incomeOutcomeData.length - 1; i >= 0; i--) {
    const cost = incomeOutcomeData[i];
    const date = cost.date;

    const month = date.slice(0, 7);
    if (monthlyBalance[month] === undefined) {
      monthlyBalance[month] = 0;
    }
    monthlyBalance[month] += cost.dailyBalance;
    cost.totalBalance = monthlyBalance[month];
  }

  return incomeOutcomeData.slice(0, nSamples);
}

module.exports = {
  generateIncomeOutcomeData,
};
