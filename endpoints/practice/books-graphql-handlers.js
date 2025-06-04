const { graphql, buildSchema } = require("graphql");
const { formatErrorResponse } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED } = require("../../helpers/response.helpers");
const jwt = require("jsonwebtoken");

// Validation utilities for backend
const validators = {
  // Username: 3-20 characters, alphanumeric with underscores and hyphens
  username: (value) => {
    if (!value || typeof value !== "string") {
      return "Username is required";
    }
    if (value.length < 3 || value.length > 20) {
      return "Username must be between 3 and 20 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "Username can only contain letters, numbers, underscores and hyphens";
    }
    return null; // No error
  },

  // Email validation
  email: (value) => {
    if (!value || typeof value !== "string") {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return null;
  },

  // Password: minimum 6 chars, at least one letter and one number
  password: (value) => {
    if (!value || typeof value !== "string") {
      return "Password is required";
    }
    if (value.length < 2) {
      return "Password must be at least 2 characters long";
    }
    // if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    //   return "Password must contain at least one letter and one number";
    // }
    return null;
  },

  // Book title: 1-100 characters
  bookTitle: (value) => {
    if (!value || typeof value !== "string") {
      return "Book title is required";
    }
    if (value.length > 100) {
      return "Book title cannot exceed 100 characters";
    }
    return null;
  },

  // Author: 1-50 characters
  author: (value) => {
    if (!value || typeof value !== "string") {
      return "Author name is required";
    }
    if (value.length > 50) {
      return "Author name cannot exceed 50 characters";
    }
    return null;
  },

  // Pages: positive number only, max 10000
  pages: (value) => {
    if (value === null || value === undefined) return null; // Optional field

    // Convert to number if it's a string
    const numPages = typeof value === "string" ? parseInt(value, 10) : value;

    if (isNaN(numPages) || numPages <= 0) {
      return "Pages must be a positive number";
    }
    if (numPages > 10000) {
      return "Pages cannot exceed 10,000";
    }
    return null;
  },

  // Description: max 1000 characters
  description: (value) => {
    if (!value) return null; // Optional field
    if (typeof value !== "string") {
      return "Description must be a string";
    }
    if (value.length > 1000) {
      return "Description cannot exceed 1000 characters";
    }
    return null;
  },

  // Publication date: must not be in the future
  publishDate: (value) => {
    if (!value) return null; // Optional field

    try {
      const pubDate = new Date(value);
      const today = new Date();
      if (isNaN(pubDate.getTime())) {
        return "Invalid date format";
      }
      if (pubDate > today) {
        return "Publication date cannot be in the future";
      }
      return null;
    } catch (err) {
      return "Invalid date format";
    }
  },
};

// Validate multiple fields and return the first error
function validateFields(data, validationRules) {
  for (const [field, validator] of Object.entries(validationRules)) {
    const error = validator(data[field]);
    if (error) {
      return error;
    }
  }
  return null;
}

// In-memory data storage
let books = [
  {
    id: "1",
    name: "Dune",
    author: "Frank Herbert",
    createdAt: "2025-01-15T10:00:00.000Z",
    publishedAt: "1965-08-01T00:00:00.000Z",
    createdBy: "admin",
    pages: 412,
    description: "A science fiction novel about the desert planet Arrakis",
  },
  {
    id: "2",
    name: "1984",
    author: "George Orwell",
    createdAt: "2025-02-20T14:30:00.000Z",
    publishedAt: "1949-06-08T00:00:00.000Z",
    createdBy: "admin",
    pages: 328,
    description: "A dystopian social science fiction novel",
  },
  {
    id: "3",
    name: "Dracula",
    author: "Bram Stoker",
    createdAt: "2025-03-10T12:00:00.000Z",
    publishedAt: "1897-05-26T00:00:00.000Z",
    createdBy: "admin",
    pages: 418,
    description: "A novel about the infamous vampire Count Dracula",
  },
];

let users = [
  {
    id: "1",
    username: "admin",
    password: "admin123", // In a real app, this would be hashed
    email: "admin@example.com",
  },
];

// JWT settings
const JWT_SECRET = "books-graphql-secret-key";

// GraphQL Schema
const schema = buildSchema(`
  type Book {
    id: ID!
    name: String!
    author: String!
    createdAt: String!
    publishedAt: String
    createdBy: String
    pages: Int
    description: String
  }

  type User {
    id: ID!
    username: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input BookInput {
    name: String!
    author: String!
    publishedAt: String
    pages: Int
    description: String
  }

  input UserInput {
    username: String!
    password: String!
    email: String!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  type Query {
    books: [Book]
    book(id: ID!): Book
    me: User
  }

  type Mutation {
    addBook(input: BookInput!): Book
    register(input: UserInput!): AuthPayload
    login(input: LoginInput!): AuthPayload
  }
`);

// Resolver functions
const root = {
  books: () => {
    return books;
  },

  book: ({ id }) => {
    return books.find((book) => book.id === id);
  },

  me: (args, context) => {
    if (!context.user) {
      throw new Error("Not authenticated");
    }

    return users.find((u) => u.id === context.user.id);
  },
  addBook: ({ input }, context) => {
    if (!context.user) {
      throw new Error("You must be logged in to add a book");
    }

    // Validate book data
    const titleError = validators.bookTitle(input.name);
    if (titleError) throw new Error(titleError);

    const authorError = validators.author(input.author);
    if (authorError) throw new Error(authorError);

    const pagesError = validators.pages(input.pages);
    if (pagesError) throw new Error(pagesError);

    const descriptionError = validators.description(input.description);
    if (descriptionError) throw new Error(descriptionError);

    const publishDateError = validators.publishDate(input.publishedAt);
    if (publishDateError) throw new Error(publishDateError);

    const newBook = {
      id: String(books.length + 1),
      name: input.name,
      author: input.author,
      createdAt: new Date().toISOString(),
      publishedAt: input.publishedAt || null,
      createdBy: context.user.username,
      pages: input.pages || null,
      description: input.description || null,
    };

    books.push(newBook);
    return newBook;
  },
  register: ({ input }) => {
    // Validate input fields
    const usernameError = validators.username(input.username);
    if (usernameError) throw new Error(usernameError);

    const emailError = validators.email(input.email);
    if (emailError) throw new Error(emailError);

    const passwordError = validators.password(input.password);
    if (passwordError) throw new Error(passwordError);

    // Check if username already exists
    const existingUser = users.find((u) => u.username === input.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Check if email is already in use
    const existingEmail = users.find((u) => u.email === input.email);
    if (existingEmail) {
      throw new Error("Email is already in use");
    }

    const newUser = {
      id: String(users.length + 1),
      username: input.username,
      password: input.password, // In a real app, this would be hashed
      email: input.email,
    };

    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: "1d" });

    return {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    };
  },
  login: ({ input }) => {
    // Basic validation for required fields
    if (!input.username) {
      throw new Error("Username is required");
    }

    if (!input.password) {
      throw new Error("Password is required");
    }

    // Check user credentials
    const user = users.find((u) => u.username === input.username && u.password === input.password);

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1d" });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  },
};

// GraphQL handler function
async function handleBooksGraphQLRequest(req, res) {
  try {
    // Extract the query and variables from the request
    const { query, variables } = req.body;

    // Extract authorization token
    let token;
    let user;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          user = users.find((u) => u.id === decoded.id);
        } catch (err) {
          // Invalid token - just continue without user
        }
      }
    }

    // Create context with user info
    const context = { user, token, req };

    // Execute the GraphQL query
    const result = await graphql({
      schema,
      source: query,
      rootValue: root,
      contextValue: context,
      variableValues: variables,
    });

    if (result.errors) {
      logDebug("GraphQL Error", { errors: result.errors });
      return res.status(HTTP_BAD_REQUEST).json(result);
    }

    return res.status(HTTP_OK).json(result);
  } catch (error) {
    logDebug("GraphQL Error", { error: error.message });
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse(`GraphQL Error: ${error.message}`));
  }
}

module.exports = {
  handleBooksGraphQLRequest,
};
