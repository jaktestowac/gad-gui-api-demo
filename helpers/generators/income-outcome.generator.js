const { RandomValueGeneratorWithSeed } = require("./random-data.generator");

const categoryTypes = [
  { name: "groceries", index: 20, emoji: "🛒" },
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
  { name: "utilities", index: 14, emoji: "💡" },
  { name: "insurance", index: 15, emoji: "🛡️" },
  { name: "subscriptions", index: 16, emoji: "📺" },
  { name: "travel", index: 17, emoji: "✈️" },
  { name: "pet care", index: 18, emoji: "🐾" },
  { name: "charity", index: 19, emoji: "❤️" },
  { name: "alcohol & tobacco", index: 20, emoji: "🍷" },
  { name: "personal care", index: 21, emoji: "💇" },
  { name: "home improvement", index: 22, emoji: "🛠️" },
  { name: "childcare", index: 23, emoji: "👶" },
  { name: "dining out", index: 24, emoji: "🍽️" },
  { name: "hobbies", index: 25, emoji: "🎨" },
  { name: "electronics", index: 26, emoji: "📱" },
  { name: "beauty", index: 27, emoji: "💄" },
  { name: "fitness", index: 28, emoji: "🏋️‍♂️" },
  { name: "furniture", index: 29, emoji: "🛋️" },
  { name: "garden", index: 30, emoji: "🌳" },
  { name: "office supplies", index: 31, emoji: "📎" },
  { name: "taxes", index: 32, emoji: "💼" },
  { name: "events", index: 33, emoji: "🎉" },
  { name: "automotive", index: 34, emoji: "🚙" },
  { name: "books", index: 35, emoji: "📚" },
  { name: "software", index: 36, emoji: "💻" },
  { name: "tools", index: 37, emoji: "🔧" },
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
  { name: "freelance", index: 9, emoji: "📝" },
  { name: "rental income", index: 10, emoji: "🏡" },
  { name: "royalties", index: 11, emoji: "🎵" },
  { name: "commission", index: 12, emoji: "💸" },
  { name: "grants", index: 13, emoji: "🏆" },
  { name: "pension", index: 14, emoji: "👴" },
  { name: "child support", index: 15, emoji: "👶" },
  { name: "alimony", index: 16, emoji: "💔" },
  { name: "inheritance", index: 17, emoji: "🏰" },
  { name: "scholarship", index: 18, emoji: "🎓" },
  { name: "lottery", index: 19, emoji: "🎲" },
  { name: "trust fund", index: 20, emoji: "🏦" },
  { name: "side hustle", index: 21, emoji: "💼" },
  { name: "part-time job", index: 22, emoji: "🕒" },
  { name: "cashback", index: 23, emoji: "💳" },
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

function generateRandomSimplifiedIncomeOutcomeData(nSamples) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - nSamples);

  const pastDays = generateDateStringsFromDateToNow(fromDate);
  const incomeOutcomeData = [];
  for (let i = 0; i < nSamples; i++) {
    const dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
    const transactions = [];
    const date = pastDays[i];

    const maxNumberOfTransactions = date.endsWith("01") || date.endsWith("31") ? 10 : 5;
    const minNumberOfTransactions = date.endsWith("01") || date.endsWith("31") ? 3 : 1;

    const numberOfTransactions = dataGenerator.getNextValue(minNumberOfTransactions, maxNumberOfTransactions);
    for (let j = 0; j < numberOfTransactions; j++) {
      if (dataGenerator.getNextValue(0, 100) < 40) {
        // add income
        const randomCategoryIdx = dataGenerator.getNextValue(0, incomeSources.length - 1);
        const category = incomeSources[randomCategoryIdx];
        let amount = dataGenerator.getNextValue(50, 500);

        if (dataGenerator.getNextValue(0, 100) < 20) {
          amount = dataGenerator.getNextValue(1000, 2000);
        }

        transactions.push({
          category: category,
          amount: amount,
        });
      } else {
        // add expense
        const randomCategoryIdx = dataGenerator.getNextValue(0, categoryTypes.length - 1);
        const category = categoryTypes[randomCategoryIdx];

        let amount = dataGenerator.getNextValue(50, 300) * -1;

        if (dataGenerator.getNextValue(0, 100) < 10) {
          amount = dataGenerator.getNextValue(100, 2000) * -1;
        }

        transactions.push({
          category: category,
          amount: amount,
        });
      }
    }

    const dailyBalance = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);

    const cost = {
      date: date,
      numberOfTransactions: transactions.length,
      dailyBalance,
      transactions,
    };

    incomeOutcomeData.unshift(cost);
  }

  return incomeOutcomeData;
}

function generateIncomeOutcomeData(nSamples) {
  const pastDays = generateDateStringsFromDateToNow("2022-01-01");

  const incomeOutcomeData = [];
  for (let i = 0; i < pastDays.length; i++) {
    const dataGenerator = new RandomValueGeneratorWithSeed(pastDays[i]);

    const date = pastDays[i];
    const transactions = [];

    // add rent
    if (date.endsWith("10")) {
      const rent = dataGenerator.getNextValue(2000, 3000) * -1;
      transactions.push({
        category: categoryTypes.find((category) => category.name === "rent"),
        amount: rent,
      });
    }

    // add subscriptions
    if (date.endsWith("15")) {
      const subscriptions = dataGenerator.getNextValue(400, 600) * -1;
      transactions.push({
        category: categoryTypes.find((category) => category.name === "subscriptions"),
        amount: subscriptions,
      });
    }

    // add salary and bonus
    if (date.endsWith("01")) {
      const salary = dataGenerator.getNextValue(9000, 15000);
      transactions.push({
        category: incomeSources.find((category) => category.name === "salary"),
        amount: salary,
      });
      if (dataGenerator.getNextValue(0, 100) < 10) {
        const salary = dataGenerator.getNextValue(1000, 7000);
        transactions.push({
          category: incomeSources.find((category) => category.name === "bonus"),
          amount: salary,
        });
      }
    }

    const maxNumberOfTransactions = date.endsWith("01") || date.endsWith("31") ? 10 : 5;
    const minNumberOfTransactions = date.endsWith("01") || date.endsWith("31") ? 3 : 0;

    const numberOfTransactions = dataGenerator.getNextValue(minNumberOfTransactions, maxNumberOfTransactions);
    for (let j = 0; j < numberOfTransactions; j++) {
      const randomCategoryIdx = dataGenerator.getNextValue(0, categoryTypes.length - 1);
      const category = categoryTypes[randomCategoryIdx];

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
    if (dataGenerator.getNextValue(0, 100) < 30) {
      const category = incomeSources[dataGenerator.getNextValue(0, incomeSources.length - 1)];
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
      numberOfTransactions: transactions.length,
      dailyBalance,
      monthlyBalance: 0,
      totalBalance: 0,
      transactions,
    };

    incomeOutcomeData.unshift(cost);
  }

  const monthlyBalance = {};
  let totalBalance = 0;
  for (let i = incomeOutcomeData.length - 1; i >= 0; i--) {
    const cost = incomeOutcomeData[i];
    const date = cost.date;

    const month = date.slice(0, 7);
    if (monthlyBalance[month] === undefined) {
      monthlyBalance[month] = 0;
    }
    monthlyBalance[month] += cost.dailyBalance;
    cost.monthlyBalance = monthlyBalance[month];
    totalBalance += cost.dailyBalance;
    cost.totalBalance = totalBalance;
  }

  return incomeOutcomeData.slice(0, nSamples);
}

module.exports = {
  generateIncomeOutcomeData,
  generateRandomSimplifiedIncomeOutcomeData,
};
