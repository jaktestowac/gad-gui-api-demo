const { isUndefined } = require("../../helpers/compare.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");
const { HTTP_OK, HTTP_NOT_FOUND, HTTP_BAD_REQUEST } = require("../../helpers/response.helpers");
const { areIdsEqual } = require("../../helpers/compare.helpers");

// Unified storage for expenses
let expenses = [
  {
    id: 1,
    title: "Groceries",
    amount: 150.5,
    category: "food",
    date: "2024-11-15T10:00:00Z",
    type: "expense",
  },
  {
    id: 2,
    title: "Monthly Salary",
    amount: 3000,
    category: "salary",
    date: "2024-11-01T08:00:00Z",
    type: "income",
  },
  {
    id: 3,
    title: "Electricity Bill",
    amount: 85.2,
    category: "utilities",
    date: "2024-11-10T14:30:00Z",
    type: "expense",
  },
  {
    id: 4,
    title: "Monthly Salary",
    amount: 2500,
    category: "salary",
    date: "2024-12-01T08:00:00Z",
    type: "income",
  },
  {
    id: 5,
    title: "Electricity Bill",
    amount: 235.2,
    category: "utilities",
    date: "2024-12-10T14:30:00Z",
    type: "expense",
  },
  {
    id: 6,
    title: "Groceries",
    amount: 190.5,
    category: "food",
    date: "2024-12-05T10:00:00Z",
    type: "expense",
  },
  {
    id: 7,
    title: "Monthly Salary",
    amount: 3000,
    category: "salary",
    date: "2025-01-01T08:00:00Z",
    type: "income",
  },
  {
    id: 8,
    title: "Electricity Bill",
    amount: 195.2,
    category: "utilities",
    date: "2025-01-10T14:30:00Z",
    type: "expense",
  },
  {
    id: 9,
    title: "Groceries",
    amount: 182.3,
    category: "food",
    date: "2025-01-15T10:00:00Z",
    type: "expense",
  },
  {
    id: 10,
    title: "Monthly Salary",
    amount: 3000,
    category: "salary",
    date: "2025-02-01T08:00:00Z",
    type: "income",
  },
  {
    id: 11,
    title: "Electricity Bill",
    amount: 185.2,
    category: "utilities",
    date: "2025-02-10T14:30:00Z",
    type: "expense",
  },
  {
    id: 12,
    title: "Groceries",
    amount: 232.3,
    category: "food",
    date: "2025-02-15T10:00:00Z",
    type: "expense",
  },
  {
    id: 13,
    title: "Trip",
    amount: 520,
    category: "other",
    date: "2025-02-16T08:00:00Z",
    type: "expense",
  },
  {
    id: 14,
    title: "Monthly Salary",
    amount: 2700,
    category: "salary",
    date: "2025-03-01T08:00:00Z",
    type: "income",
  },
];

// Transform functions for different versions
const toV1 = (expense, skipIncome = true) => {
  if (skipIncome && expense.type === "income") return null;
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
  };
};

const toV2 = (expense) => ({
  ...toV1(expense, false),
  date: expense.date,
  type: expense.type,
});

const toV3 = (expense) => ({
  ...toV2(expense, false),
});

// Update validation helper to handle versions
function validateExpenseData(data, options = {}) {
  const { version = 1, isPartial = false } = options;
  const errors = [];

  // Title validation (all versions)
  if (!isPartial || data.title !== undefined) {
    if (!data.title) {
      errors.push("Title is required");
    } else if (typeof data.title !== "string" || data.title.length < 3) {
      errors.push("Title must be at least 3 characters long");
    }
  }

  // Amount validation (all versions)
  if (!isPartial || data.amount !== undefined) {
    if (isUndefined(data.amount)) {
      errors.push("Amount is required");
    } else {
      const amount = Number(data.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push("Amount must be a positive number");
      }
    }
  }

  // Category validation (all versions)
  const validCategories = ["food", "rent", "utilities", "transport", "salary", "entertainment", "other"];
  if (!isPartial || data.category !== undefined) {
    if (!data.category) {
      errors.push("Category is required");
    } else if (!validCategories.includes(data.category)) {
      errors.push(`Category must be one of: ${validCategories.join(", ")}`);
    }
  }

  // V2 and V3 specific validations
  if (version >= 2) {
    // Type validation
    if (!isPartial || data.type !== undefined) {
      if (data.type && !["expense", "income"].includes(data.type)) {
        errors.push("Type must be 'expense' or 'income'");
      }
    }

    // Date validation
    if (!isPartial || data.date !== undefined) {
      if (data.date) {
        const dateObj = new Date(data.date);
        if (isNaN(dateObj.getTime())) {
          errors.push("Invalid date format");
        }
      }
    }
  }

  // V1 specific validations
  if (version === 1 && data.type === "income") {
    errors.push("V1 only supports expenses");
  }

  return errors;
}

// V1 Handlers
const expenseV1 = {
  getAll: (req, res) => {
    const filteredExpenses = expenses
      .map(toV1)
      .filter((expense) => expense !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(HTTP_OK).json(filteredExpenses);
  },

  create: (req, res) => {
    const errors = validateExpenseData(req.body, { version: 1 });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const { title, amount, category } = req.body;

    if (isUndefined(title) || isUndefined(amount) || isUndefined(category)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title, amount and category are required"));
    }

    const newExpense = {
      id: expenses.length + 1,
      title,
      amount: Number(amount),
      category,
      date: new Date().toISOString(),
      type: "expense",
    };

    expenses.push(newExpense);
    res.status(HTTP_OK).json(toV1(newExpense));
  },

  update: (req, res, id) => {
    const errors = validateExpenseData(req.body, { version: 1 });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    const { title, amount, category } = req.body;
    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      title: title || expenses[expenseIndex].title,
      amount: amount !== undefined ? Number(amount) : expenses[expenseIndex].amount,
      category: category || expenses[expenseIndex].category,
    };

    res.status(HTTP_OK).json(toV1(expenses[expenseIndex]));
  },

  delete: (req, res, id) => {
    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    if (expenses[expenseIndex].type === "income") {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense v1 does not support deleting income"));
    }

    expenses = expenses.filter((e) => !areIdsEqual(e.id, id));
    res.status(HTTP_OK).json({ message: "Expense deleted" });
  },

  getOne: (req, res, id) => {
    const expense = expenses.find((e) => areIdsEqual(e.id, id));
    if (!expense || expense.type === "income") {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }
    res.status(HTTP_OK).json(toV1(expense));
  },

  patch: (req, res, id) => {
    const errors = validateExpenseData(req.body, { version: 1, isPartial: true });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1 || expenses[expenseIndex].type === "income") {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      ...req.body,
    };

    res.status(HTTP_OK).json(toV1(expenses[expenseIndex]));
  },
};

// V2 Handlers
const expenseV2 = {
  getAll: (req, res) => {
    let filtered = [...expenses];

    // Apply existing filters
    if (req.query.type) {
      filtered = filtered.filter((e) => e.type === req.query.type);
    }
    if (req.query.category) {
      filtered = filtered.filter((e) => e.category === req.query.category);
    }
    if (req.query.fromDate) {
      filtered = filtered.filter((e) => e.date >= req.query.fromDate);
    }
    if (req.query.toDate) {
      filtered = filtered.filter((e) => e.date <= req.query.toDate);
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(HTTP_OK).json(filtered.map(toV2));
  },

  create: (req, res) => {
    const errors = validateExpenseData(req.body, { version: 2 });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const { title, amount, category, type = "expense", date = new Date().toISOString() } = req.body;

    if (isUndefined(title) || isUndefined(amount) || isUndefined(category)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title, amount and category are required"));
    }

    if (type !== "expense" && type !== "income") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Type must be 'expense' or 'income'"));
    }

    const newExpense = {
      id: expenses.length + 1,
      title,
      amount: Number(amount),
      category,
      date,
      type,
    };

    expenses.push(newExpense);
    res.status(HTTP_OK).json(toV2(newExpense));
  },

  update: (req, res, id) => {
    const errors = validateExpenseData(req.body, { version: 2 });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    const { title, amount, category, type, date } = req.body;

    if (type && type !== "expense" && type !== "income") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Type must be 'expense' or 'income'"));
    }

    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      title: title || expenses[expenseIndex].title,
      amount: amount !== undefined ? Number(amount) : expenses[expenseIndex].amount,
      category: category || expenses[expenseIndex].category,
      type: type || expenses[expenseIndex].type,
      date: date || expenses[expenseIndex].date,
    };

    res.status(HTTP_OK).json(toV2(expenses[expenseIndex]));
  },

  delete: (req, res, id) => {
    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    expenses = expenses.filter((e) => !areIdsEqual(e.id, id));
    res.status(HTTP_OK).json({ message: "Expense deleted" });
  },

  getOne: (req, res, id) => {
    const expense = expenses.find((e) => areIdsEqual(e.id, id));
    if (!expense) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }
    res.status(HTTP_OK).json(toV2(expense));
  },

  patch: (req, res, id) => {
    const errors = validateExpenseData(req.body, { version: 2, isPartial: true });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    const { type } = req.body;
    if (type && type !== "expense" && type !== "income") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Type must be 'expense' or 'income'"));
    }

    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      ...req.body,
    };

    res.status(HTTP_OK).json(toV2(expenses[expenseIndex]));
  },
};

// Add V3 Handlers
const expenseV3 = {
  getAll: (req, res) => {
    let filtered = [...expenses];

    // Apply existing filters
    if (req.query.type) {
      filtered = filtered.filter((e) => e.type === req.query.type);
    }
    if (req.query.category) {
      filtered = filtered.filter((e) => e.category === req.query.category);
    }
    if (req.query.fromDate) {
      filtered = filtered.filter((e) => e.date >= req.query.fromDate);
    }
    if (req.query.toDate) {
      filtered = filtered.filter((e) => e.date <= req.query.toDate);
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(HTTP_OK).json(filtered.map(toV3));
  },

  create: (req, res) => {
    const errors = validateExpenseData(req.body, { version: 3 });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const { title, amount, category, type = "expense", date = new Date().toISOString() } = req.body;

    if (isUndefined(title) || isUndefined(amount) || isUndefined(category)) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Title, amount and category are required"));
    }

    if (type !== "expense" && type !== "income") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Type must be 'expense' or 'income'"));
    }

    const newExpense = {
      id: expenses.length + 1,
      title,
      amount: Number(amount),
      category,
      date,
      type,
    };

    expenses.push(newExpense);
    res.status(HTTP_OK).json(toV3(newExpense));
  },

  update: (req, res, id) => {
    const errors = validateExpenseData(req.body, { version: 3 });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    const { title, amount, category, type, date } = req.body;

    if (type && type !== "expense" && type !== "income") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Type must be 'expense' or 'income'"));
    }

    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      title: title || expenses[expenseIndex].title,
      amount: amount !== undefined ? Number(amount) : expenses[expenseIndex].amount,
      category: category || expenses[expenseIndex].category,
      type: type || expenses[expenseIndex].type,
      date: date || expenses[expenseIndex].date,
    };

    res.status(HTTP_OK).json(toV3(expenses[expenseIndex]));
  },

  delete: (req, res, id) => {
    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    expenses = expenses.filter((e) => !areIdsEqual(e.id, id));
    res.status(HTTP_OK).json({ message: "Expense deleted" });
  },

  getOne: (req, res, id) => {
    const expense = expenses.find((e) => areIdsEqual(e.id, id));
    if (!expense) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }
    res.status(HTTP_OK).json(toV3(expense));
  },

  patch: (req, res, id) => {
    const errors = validateExpenseData(req.body, { version: 3, isPartial: true });
    if (errors.length > 0) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(errors.join(", ")));
    }

    const expenseIndex = expenses.findIndex((e) => areIdsEqual(e.id, id));
    if (expenseIndex === -1) {
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Expense not found"));
    }

    const { type } = req.body;
    if (type && type !== "expense" && type !== "income") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Type must be 'expense' or 'income'"));
    }

    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      ...req.body,
    };

    res.status(HTTP_OK).json(toV3(expenses[expenseIndex]));
  },
};

module.exports = {
  expenseV1,
  expenseV2,
  expenseV3,
};
