const { graphql, buildSchema } = require("graphql");
const weatherApp = require("./weather-app-handlers-v1");
const { formatErrorResponse } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST } = require("../../helpers/response.helpers");

const schemaRaw = `
  type Query {
    # Weather data queries
    currentWeather: WeatherData
    weatherByDay(day: String!): WeatherData
    
    # Weather event queries
    weatherEvents(day: String): [WeatherEvent]
    weatherEvent(id: Int!): WeatherEvent
    
    # User queries
    currentUser: User
    
    # Admin queries
    allData: AdminData
  }

  type Mutation {
    # Weather event mutations
    createWeatherEvent(day: String!, event: String!): WeatherEvent
    updateWeatherEvent(id: Int!, event: String!): WeatherEvent
    deleteWeatherEvent(id: Int!): DeleteResponse
    
    # Auth mutations
    register(username: String!, password: String!, isAdmin: Boolean): AuthResponse
    login(username: String!, password: String!): AuthResponse
    logout: MessageResponse
  }
  # Weather types
  type WeatherData {
    temp: Int
    date: String
    wind: Int
  }
  # Weather event types

  # Weather event types
  type WeatherEvent {
    id: Int
    day: String
    event: String
    userId: Int
    username: String
    createdAt: String
    updatedAt: String
  }

  # User types
  type User {
    id: Int
    username: String
    isAdmin: Boolean
  }

  # Response types
  type AuthResponse {
    message: String
    token: String
    user: User
  }

  type MessageResponse {
    message: String
  }

  type DeleteResponse {
    message: String
    event: WeatherEvent
  }

  type AdminData {
    users: [User]
    events: [WeatherEvent]
  }
`;

// Define GraphQL schema
const schema = buildSchema(schemaRaw);

// Create mock request and response objects for the resolver functions
function createMockReq(args = {}, user = null, headers = {}) {
  return {
    body: args,
    query: args,
    params: args,
    user,
    headers,
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    cookies: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    send(data) {
      this.data = data;
      return this;
    },
    cookie(name, value, options) {
      this.cookies[name] = { value, options };
      return this;
    },
    clearCookie(name) {
      delete this.cookies[name];
      return this;
    },
  };
  return res;
}

// Define resolvers
const root = {
  // Weather data queries
  currentWeather: () => {
    const req = createMockReq();
    const res = createMockRes();
    weatherApp.getCurrentWeather(req, res, 1); // Explicitly use scope 1
    return res.data;
  },

  weatherByDay: ({ day }) => {
    const req = createMockReq({ day });
    const res = createMockRes();
    weatherApp.getWeatherByDay(req, res, 1); // Explicitly use scope 1
    return res.data;
  },

  // Weather event queries
  weatherEvents: (args, context) => {
    if (!context.user) {
      throw new Error("Authentication required");
    }

    const req = createMockReq(args, context.user);
    const res = createMockRes();
    weatherApp.getWeatherEvents(req, res);
    return res.data;
  },

  weatherEvent: ({ id }, context) => {
    if (!context.user) {
      throw new Error("Authentication required");
    }

    const req = createMockReq({ id }, context.user);
    req.params = { id };
    const res = createMockRes();
    weatherApp.getWeatherEventById(req, res);
    return res.data;
  },

  // User queries
  currentUser: (args, context) => {
    if (!context.user) {
      throw new Error("Authentication required");
    }

    const req = createMockReq({}, context.user);
    const res = createMockRes();
    weatherApp.getCurrentUser(req, res);
    return res.data;
  },

  // Admin queries
  allData: (args, context) => {
    if (!context.user || !context.user.isAdmin) {
      throw new Error("Admin access required");
    }

    const req = createMockReq({}, context.user);
    const res = createMockRes();
    weatherApp.getAllData(req, res);
    return res.data;
  },

  // Weather event mutations
  createWeatherEvent: ({ day, event }, context) => {
    if (!context.user) {
      throw new Error("Authentication required");
    }

    const req = createMockReq({ day, event }, context.user);
    const res = createMockRes();
    weatherApp.createWeatherEvent(req, res);
    return res.data;
  },

  updateWeatherEvent: ({ id, event }, context) => {
    if (!context.user) {
      throw new Error("Authentication required");
    }
    // Forward Authorization header and token for backend validation
    const authHeaders = context.token ? { authorization: `Bearer ${context.token}` } : {};
    const req = createMockReq({ id, event }, context.user, authHeaders);
    // Ensure req.token is available as backend compares req.token with header token
    req.token = context.token;
    req.params = { id };
    const res = createMockRes();
    weatherApp.updateWeatherEvent(req, res);
    return res.data;
  },

  deleteWeatherEvent: ({ id }, context) => {
    if (!context.user) {
      throw new Error("Authentication required");
    }

    const req = createMockReq({ id }, context.user);
    req.params = { id };
    const res = createMockRes();
    weatherApp.deleteWeatherEvent(req, res);
    return res.data;
  },

  // Auth mutations
  register: ({ username, password, isAdmin }) => {
    const req = createMockReq({ username, password, isAdmin });
    const res = createMockRes();
    weatherApp.register(req, res);
    if (res.statusCode !== 200) {
      // Ensure GraphQL surfaces this as an error
      const errMsg = (res.data && (res.data.error?.message || res.data.message)) || "Registration failed";
      throw new Error(errMsg);
    }
    return res.data;
  },

  login: ({ username, password }) => {
    const req = createMockReq({ username, password });
    const res = createMockRes();
    weatherApp.login(req, res);
    if (res.statusCode !== 200) {
      const errMsg = (res.data && (res.data.error?.message || res.data.message)) || "Login failed";
      throw new Error(errMsg);
    }
    return res.data;
  },

  logout: (args, context) => {
    const req = createMockReq({}, null, { authorization: `Bearer ${context.token}` });
    const res = createMockRes();
    weatherApp.logout(req, res);
    return res.data;
  },
};

// GraphQL handler function
async function handleGraphQLRequest(req, res) {
  try {
    // Extract the query and variables from the request
    const { query, variables } = req.body;

    // Extract authorization token
    let token;
    let user;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Access sessions directly because they're in the same module scope
      // This references the in-memory sessions object from weather-app-handlers-v1.js
      if (token) {
        // We'll need to directly check for active sessions
        const sessionData = require("./weather-app-handlers-v1").sessions;
        if (sessionData && sessionData[token]) {
          user = sessionData[token];
        }
      }
    }

    // Create context with user info
    const context = { user, token };

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
  handleGraphQLRequest,
  schema,
  schemaRaw,
};
