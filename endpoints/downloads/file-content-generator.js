const { logDebug } = require("../../helpers/logger-api");

/**
 * Data Provider Interface
 * Abstracts data generation to allow easy replacement with faker-js
 */
class DataProvider {
  // Person data
  static firstName() {
    const names = ["John", "Jane", "Michael", "Sarah", "David", "Emma", "Chris", "Lisa", "Robert", "Maria"];
    return names[Math.floor(Math.random() * names.length)];
  }

  static lastName() {
    const names = [
      "Smith",
      "Johnson",
      "Brown",
      "Williams",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  static fullName() {
    return `${this.firstName()} ${this.lastName()}`;
  }

  // Address data
  static streetName() {
    const streets = ["Main St", "Oak Ave", "Pine Rd", "Elm St", "Maple Dr", "Cedar Ln", "Birch Blvd", "Spruce Way"];
    return streets[Math.floor(Math.random() * streets.length)];
  }

  static streetAddress() {
    return `${Math.floor(Math.random() * 999) + 1} ${this.streetName()}`;
  }

  static city() {
    const cities = [
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
    ];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  static state() {
    const states = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI"];
    return states[Math.floor(Math.random() * states.length)];
  }

  static zipCode() {
    return `${Math.floor(Math.random() * 90000) + 10000}`;
  }

  static country() {
    const countries = ["USA", "Canada", "UK", "Germany", "France", "Australia", "Japan", "Brazil"];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  // Company data
  static companyName() {
    const companies = [
      "TechCorp Inc",
      "Global Solutions",
      "Innovate LLC",
      "Digital Dynamics",
      "Smart Systems",
      "Future Tech",
      "DataCorp",
      "CloudNine",
    ];
    return companies[Math.floor(Math.random() * companies.length)];
  }

  static companySuffix() {
    const suffixes = ["Inc", "LLC", "Corp", "Ltd", "GmbH", "SAS", "PLC"];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
  }

  // Internet data
  static email(firstName, lastName) {
    const domains = ["test.test.com", "mygad.gad", "test.gad", "acme.gad", "acme.corp", "example.com"];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  }

  static domainName() {
    const domains = ["test.test.com", "mygad.gad", "acme.corp", "example.com", "company.org"];
    return domains[Math.floor(Math.random() * domains.length)];
  }

  static url() {
    return `https://${this.domainName()}`;
  }

  // Phone data
  static phoneNumber() {
    return `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${
      Math.floor(Math.random() * 9000) + 1000
    }`;
  }

  // Product data
  static productName() {
    const products = [
      "Wireless Headphones",
      "Smart Watch",
      "Laptop Computer",
      "Coffee Maker",
      "Running Shoes",
      "Board Game",
      "Cookbook",
      "T-shirt",
      "Garden Tools",
      "Basketball",
      "Puzzle Set",
    ];
    return products[Math.floor(Math.random() * products.length)];
  }

  static productCategory() {
    const categories = ["Electronics", "Books", "Clothing", "Home & Garden", "Sports", "Toys"];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  static price(min = 10, max = 500) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Date/Time data
  static past(days = 365) {
    return new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000);
  }

  static future(days = 365) {
    return new Date(Date.now() + Math.random() * days * 24 * 60 * 60 * 1000);
  }

  static recent(minutes = 60) {
    return new Date(Date.now() - Math.random() * minutes * 60 * 1000);
  }

  // Random data
  static boolean() {
    return Math.random() > 0.5;
  }

  static number(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  static uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  static words(count = 3) {
    const wordList = [
      "lorem",
      "ipsum",
      "dolor",
      "sit",
      "amet",
      "consectetur",
      "adipiscing",
      "elit",
      "sed",
      "do",
      "eiusmod",
      "tempor",
      "incididunt",
      "ut",
      "labore",
      "et",
      "dolore",
      "magna",
      "aliqua",
    ];
    const words = [];
    for (let i = 0; i < count; i++) {
      words.push(this.randomElement(wordList));
    }
    return words.join(" ");
  }

  static sentence() {
    return this.words(Math.floor(Math.random() * 10) + 5) + ".";
  }

  // Finance data
  static amount(min = 0, max = 1000) {
    return Math.floor(Math.random() * (max - min) * 100) / 100;
  }

  static currencyCode() {
    const codes = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];
    return codes[Math.floor(Math.random() * codes.length)];
  }

  // System data
  static userAgent() {
    const agents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  static ip() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(
      Math.random() * 256
    )}.${Math.floor(Math.random() * 256)}`;
  }

  static statusCode() {
    const codes = [200, 201, 400, 401, 403, 404, 500];
    return codes[Math.floor(Math.random() * codes.length)];
  }
}

/**
 * File Content Generator
 * Generates various types of realistic file content based on request parameters
 * Uses DataProvider for easy replacement with faker-js
 */
class FileContentGenerator {
  /**
   * Generate content based on type and parameters
   * @param {string} type - Type of content to generate
   * @param {object} params - Parameters for content generation
   * @returns {string} Generated content
   */
  static generate(type, params = {}) {
    try {
      switch (type) {
        case "text":
          return this.generateTextContent(params);
        case "json":
          return this.generateJsonContent(params);
        case "csv":
          return this.generateCsvContent(params);
        case "report":
          return this.generateReportContent(params);
        case "log":
          return this.generateLogContent(params);
        case "config":
          return this.generateConfigContent(params);
        case "xml":
          return this.generateXmlContent(params);
        case "yaml":
          return this.generateYamlContent(params);
        case "sql":
          return this.generateSqlContent(params);
        case "user-data":
          return this.generateUserDataContent(params);
        case "api-response":
          return this.generateApiResponseContent(params);
        default:
          return this.generateDefaultContent(params);
      }
    } catch (error) {
      logDebug("FileContentGenerator:generate error", { error: error.message, type, params });
      return `Error generating content: ${error.message}`;
    }
  }

  /**
   * Generate realistic plain text content
   */
  static generateTextContent(params) {
    const {
      title = "Business Report",
      author = DataProvider.fullName(),
      company = DataProvider.companyName(),
      includeTimestamp = true,
      sections = 3,
    } = params;

    let content = `${company}\n`;
    content += `${title}\n`;
    content += "=".repeat(Math.max(company.length, title.length)) + "\n\n";

    if (includeTimestamp) {
      content += `Prepared by: ${author}\n`;
      content += `Date: ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}\n\n`;
    }

    const sectionTitles = [
      "Executive Summary",
      "Market Analysis",
      "Financial Overview",
      "Technical Specifications",
      "Recommendations",
      "Conclusion",
    ];

    for (let i = 0; i < sections; i++) {
      const sectionTitle = sectionTitles[i] || `Section ${i + 1}`;
      content += `${i + 1}. ${sectionTitle}\n`;
      content += "-".repeat(sectionTitle.length + 3) + "\n";

      // Generate realistic paragraph content
      content += this.generateRealisticParagraph(sectionTitle.toLowerCase());
      content += "\n\n";
    }

    content += `Document generated on ${new Date().toLocaleString()}\n`;
    content += "Confidential - For internal use only\n";

    return content;
  }

  /**
   * Generate realistic JSON content
   */
  static generateJsonContent(params) {
    const { structure = "api-response", count = 5 } = params;

    switch (structure) {
      case "user-list":
        return this.generateUserListJson(count);
      case "product-catalog":
        return this.generateProductCatalogJson(count);
      case "api-response":
      default:
        return this.generateApiResponseJson();
    }
  }

  /**
   * Generate user list JSON
   */
  static generateUserListJson(count) {
    const users = [];

    for (let i = 1; i <= count; i++) {
      const firstName = DataProvider.firstName();
      const lastName = DataProvider.lastName();
      const email = DataProvider.email(firstName, lastName);

      users.push({
        id: i,
        firstName,
        lastName,
        email,
        phone: DataProvider.phoneNumber(),
        address: {
          street: DataProvider.streetAddress(),
          city: DataProvider.city(),
          state: DataProvider.state(),
          zipCode: DataProvider.zipCode(),
        },
        registeredDate: DataProvider.past(365).toISOString(),
        isActive: DataProvider.boolean(),
        role: DataProvider.randomElement(["user", "admin", "moderator"]),
      });
    }

    return JSON.stringify(
      {
        success: true,
        data: users,
        total: users.length,
        timestamp: new Date().toISOString(),
        apiVersion: "v1.0",
      },
      null,
      2
    );
  }

  /**
   * Generate product catalog JSON
   */
  static generateProductCatalogJson(count) {
    const products = [];

    for (let i = 1; i <= count; i++) {
      const name = DataProvider.productName();
      const basePrice = DataProvider.price(10, 500);

      products.push({
        id: i,
        name: `${name} ${i}`,
        category: DataProvider.productCategory(),
        price: basePrice,
        originalPrice: DataProvider.boolean() ? basePrice * 1.2 : basePrice,
        currency: "USD",
        inStock: DataProvider.boolean(),
        stockQuantity: DataProvider.number(0, 100),
        rating: Math.round(DataProvider.number(30, 50) / 10) / 10, // 3.0 to 5.0
        reviews: DataProvider.number(0, 500),
        description: `High-quality ${name.toLowerCase()} with excellent features and great value.`,
        tags: this.getRandomTags(),
        createdAt: DataProvider.past(365).toISOString(),
      });
    }

    return JSON.stringify(
      {
        success: true,
        data: {
          products,
          pagination: {
            page: 1,
            limit: count,
            total: products.length,
            totalPages: 1,
          },
          filters: {
            categories: [...new Set(products.map((p) => p.category))],
            priceRange: {
              min: Math.min(...products.map((p) => p.price)),
              max: Math.max(...products.map((p) => p.price)),
            },
          },
        },
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Generate API response JSON
   */
  static generateApiResponseJson() {
    return JSON.stringify(
      {
        success: true,
        message: "Data retrieved successfully",
        data: {
          system: {
            status: "operational",
            uptime: `${DataProvider.number(1, 30)} days`,
            version: "2.1.4",
            environment: "production",
          },
          metrics: {
            totalUsers: DataProvider.number(5000, 15000),
            activeUsers: DataProvider.number(1000, 5000),
            totalOrders: DataProvider.number(10000, 60000),
            revenue: DataProvider.number(100000, 1000000),
          },
          recentActivity: [
            {
              id: 1,
              type: "user_registration",
              description: "New user registered",
              timestamp: DataProvider.recent(300).toISOString(),
            },
            {
              id: 2,
              type: "order_completed",
              description: "Order #12345 completed",
              timestamp: DataProvider.recent(60).toISOString(),
            },
          ],
        },
        timestamp: new Date().toISOString(),
        requestId: DataProvider.uuid(),
      },
      null,
      2
    );
  }

  /**
   * Generate realistic CSV content
   */
  static generateCsvContent(params) {
    const { type = "user-data", rows = 10 } = params;

    switch (type) {
      case "sales":
        return this.generateSalesCsv(rows);
      case "inventory":
        return this.generateInventoryCsv(rows);
      case "user-data":
      default:
        return this.generateUserDataCsv(rows);
    }
  }

  /**
   * Generate user data CSV
   */
  static generateUserDataCsv(rows) {
    let content = "ID,First Name,Last Name,Email,Phone,Registration Date,Status,City,Country\n";

    for (let i = 1; i <= rows; i++) {
      const firstName = DataProvider.firstName();
      const lastName = DataProvider.lastName();
      const email = DataProvider.email(firstName, lastName);
      const phone = DataProvider.phoneNumber();
      const regDate = DataProvider.past(365).toISOString().split("T")[0];
      const status = DataProvider.randomElement(["Active", "Inactive", "Pending", "Suspended"]);
      const city = DataProvider.city();
      const country = DataProvider.country();

      content += `${i},"${firstName}","${lastName}","${email}","${phone}","${regDate}","${status}","${city}","${country}"\n`;
    }

    return content;
  }

  /**
   * Generate sales CSV
   */
  static generateSalesCsv(rows) {
    let content = "Order ID,Date,Customer Name,Product,Quantity,Unit Price,Total,Payment Method,Status\n";

    for (let i = 1; i <= rows; i++) {
      const orderId = `ORD-${String(i).padStart(4, "0")}`;
      const date = DataProvider.past(90).toISOString().split("T")[0];
      const customer = DataProvider.companyName();
      const product = DataProvider.productName();
      const quantity = DataProvider.number(1, 10);
      const unitPrice = DataProvider.price(10, 500);
      const total = quantity * unitPrice;
      const paymentMethod = DataProvider.randomElement(["Credit Card", "PayPal", "Bank Transfer", "Check"]);
      const status = DataProvider.randomElement(["Completed", "Processing", "Shipped", "Delivered"]);

      content += `${orderId},"${date}","${customer}","${product}",${quantity},${unitPrice},${total},"${paymentMethod}","${status}"\n`;
    }

    return content;
  }

  /**
   * Generate inventory CSV
   */
  static generateInventoryCsv(rows) {
    let content = "SKU,Product Name,Category,Stock Level,Reorder Point,Unit Cost,Selling Price,Supplier,Location\n";

    for (let i = 1; i <= rows; i++) {
      const sku = `SKU-${String(i).padStart(6, "0")}`;
      const product = DataProvider.productName();
      const category = DataProvider.productCategory();
      const stockLevel = DataProvider.number(0, 1000);
      const reorderPoint = DataProvider.number(10, 100);
      const unitCost = DataProvider.price(10, 200);
      const sellingPrice = unitCost * (1 + Math.random() * 0.5); // 0-50% markup
      const supplier = DataProvider.companyName();
      const location = DataProvider.randomElement(["Warehouse A", "Warehouse B", "Store Front", "Online Inventory"]);

      content += `${sku},"${product}","${category}",${stockLevel},${reorderPoint},${unitCost.toFixed(
        2
      )},${sellingPrice.toFixed(2)},"${supplier}","${location}"\n`;
    }

    return content;
  }

  /**
   * Generate professional report content
   */
  static generateReportContent(params) {
    const { title = "Quarterly Business Report", company = DataProvider.companyName(), period = "Q4 2024" } = params;

    let content = `${company}\n`;
    content += `${title}\n`;
    content += `Period: ${period}\n`;
    content += "=".repeat(60) + "\n\n";

    content += `Report Generated: ${new Date().toLocaleString()}\n`;
    content += `Prepared for: Executive Management\n\n`;

    // Executive Summary
    content += "EXECUTIVE SUMMARY\n";
    content += "=================\n\n";
    content += "This quarterly report provides a comprehensive overview of our company's performance,\n";
    content += "including financial results, operational metrics, and strategic initiatives.\n\n";

    // Key Metrics Table
    content += "KEY PERFORMANCE METRICS\n";
    content += "========================\n\n";
    content += this.generateMetricsTable();
    content += "\n";

    // Financial Overview
    content += "FINANCIAL OVERVIEW\n";
    content += "==================\n\n";
    content += `Revenue: $${DataProvider.number(1000000, 5000000).toLocaleString()}\n`;
    content += `Profit Margin: ${DataProvider.number(5, 20)}%\n`;
    content += `Operating Expenses: $${DataProvider.number(500000, 2000000).toLocaleString()}\n`;
    content += `Net Profit: $${DataProvider.number(100000, 1000000).toLocaleString()}\n\n`;

    // Operational Highlights
    content += "OPERATIONAL HIGHLIGHTS\n";
    content += "======================\n\n";
    content += "• Successfully launched 3 new product features\n";
    content += "• Improved customer satisfaction scores by 15%\n";
    content += "• Reduced operational costs by 8%\n";
    content += "• Expanded market reach to 5 new regions\n\n";

    // Future Outlook
    content += "FUTURE OUTLOOK\n";
    content += "==============\n\n";
    content += "The coming quarter will focus on:\n";
    content += "• Digital transformation initiatives\n";
    content += "• Market expansion strategies\n";
    content += "• Technology infrastructure upgrades\n";
    content += "• Talent acquisition and development\n\n";

    content += "CONCLUSION\n";
    content += "==========\n\n";
    content += "Overall, the quarter has been successful with strong performance across all key metrics.\n";
    content += "The foundation has been set for continued growth and success in the upcoming period.\n\n";

    content += "--- End of Report ---\n";
    content += `Generated by FileContentGenerator v2.0\n`;

    return content;
  }

  /**
   * Generate realistic log content
   */
  static generateLogContent(params) {
    const { entries = 20, level = "mixed", application = "web-server" } = params;

    const timestamp = new Date().toISOString();
    let content = `# Log file for ${application}\n`;
    content += `# Generated: ${timestamp}\n`;
    content += `# Total entries: ${entries}\n\n`;

    const logLevels = ["DEBUG", "INFO", "WARN", "ERROR"];
    const components = ["auth-service", "api-gateway", "database", "cache", "worker", "scheduler"];

    for (let i = 1; i <= entries; i++) {
      const logTime = DataProvider.recent(entries - i).toISOString();
      const logLevel = level === "mixed" ? DataProvider.randomElement(logLevels) : level;
      const component = DataProvider.randomElement(components);
      const message = this.generateLogMessage(logLevel, component);

      content += `${logTime} ${logLevel} [${component}] ${message}\n`;
    }

    return content;
  }

  /**
   * Generate configuration content
   */
  static generateConfigContent(params) {
    const { format = "yaml", environment = "production" } = params;

    if (format === "json") {
      return JSON.stringify(
        {
          application: {
            name: "Enterprise Web Application",
            version: "2.1.4",
            environment: environment,
          },
          server: {
            host: "0.0.0.0",
            port: 8443,
            ssl: {
              enabled: true,
              certificate: "/etc/ssl/certs/app.crt",
              key: "/etc/ssl/private/app.key",
            },
            cors: {
              enabled: true,
              origins: ["https://app.company.com", "https://admin.company.com"],
            },
          },
          database: {
            type: "postgresql",
            host: "db.company.internal",
            port: 5432,
            name: `app_${environment}`,
            user: "app_user",
            password: "${DB_PASSWORD}",
            connectionPool: {
              min: 5,
              max: 20,
              idleTimeout: 300000,
            },
          },
          cache: {
            type: "redis",
            host: "cache.company.internal",
            port: 6379,
            ttl: 3600,
          },
          logging: {
            level: "INFO",
            format: "json",
            outputs: [{ type: "file", path: "/var/log/app/application.log" }, { type: "console" }],
          },
          features: {
            userRegistration: true,
            emailNotifications: true,
            analytics: true,
            apiRateLimiting: true,
          },
        },
        null,
        2
      );
    } else {
      // YAML format
      return `# Application Configuration
# Environment: ${environment}
# Generated: ${new Date().toISOString()}

application:
  name: "Enterprise Web Application"
  version: "2.1.4"
  environment: "${environment}"

server:
  host: "0.0.0.0"
  port: 8443
  ssl:
    enabled: true
    certificate: "/etc/ssl/certs/app.crt"
    key: "/etc/ssl/private/app.key"
  cors:
    enabled: true
    origins:
      - "https://app.company.com"
      - "https://admin.company.com"

database:
  type: "postgresql"
  host: "db.company.internal"
  port: 5432
  name: "app_${environment}"
  user: "app_user"
  password: "\${DB_PASSWORD}"
  connectionPool:
    min: 5
    max: 20
    idleTimeout: 300000

cache:
  type: "redis"
  host: "cache.company.internal"
  port: 6379
  ttl: 3600

logging:
  level: "INFO"
  format: "json"
  outputs:
    - type: "file"
      path: "/var/log/app/application.log"
    - type: "console"

features:
  userRegistration: true
  emailNotifications: true
  analytics: true
  apiRateLimiting: true
`;
    }
  }

  /**
   * Generate XML content
   */
  static generateXmlContent(params) {
    const { type = "data", count = 3 } = params;

    let content = '<?xml version="1.0" encoding="UTF-8"?>\n';
    content += "<root>\n";
    content += `  <generated timestamp="${new Date().toISOString()}"/>\n`;

    if (type === "users") {
      content += "  <users>\n";
      for (let i = 1; i <= count; i++) {
        content += `    <user id="${i}">\n`;
        content += `      <name>${DataProvider.fullName()}</name>\n`;
        content += `      <email>${DataProvider.email(DataProvider.firstName(), DataProvider.lastName())}</email>\n`;
        content += `      <active>true</active>\n`;
        content += "    </user>\n";
      }
      content += "  </users>\n";
    } else {
      content += "  <data>\n";
      for (let i = 1; i <= count; i++) {
        content += `    <item id="${i}">\n`;
        content += `      <title>${DataProvider.words(3)}</title>\n`;
        content += `      <description>${DataProvider.sentence()}</description>\n`;
        content += `      <value>${DataProvider.number(0, 100)}</value>\n`;
        content += "    </item>\n";
      }
      content += "  </data>\n";
    }

    content += "</root>\n";
    return content;
  }

  /**
   * Generate YAML content
   */
  static generateYamlContent(params) {
    const { type = "config" } = params;

    if (type === "deployment") {
      return `# Kubernetes Deployment Configuration
# Generated: ${new Date().toISOString()}

apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: company/web-app:2.1.4
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "${DataProvider.randomElement(["db-service", "postgres-service"])}"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
`;
    } else {
      return `# Application Configuration
# Generated: ${new Date().toISOString()}

app:
  name: "${DataProvider.words(2)}"
  version: "1.0.0"
  environment: "development"

database:
  host: "${DataProvider.randomElement(["localhost", "db.local"])}"
  port: 5432
  name: "sample_db"

features:
  - authentication
  - user_management
  - reporting

settings:
  debug: ${DataProvider.boolean()}
  log_level: "${DataProvider.randomElement(["info", "debug", "warn"])}"
  max_connections: ${DataProvider.number(10, 100)}
`;
    }
  }

  /**
   * Generate SQL content
   */
  static generateSqlContent(params) {
    const { type = "insert", table = "users", count = 5 } = params;

    let content = `-- SQL Script Generated: ${new Date().toISOString()}\n`;
    content += `-- Table: ${table}\n\n`;

    if (type === "create") {
      content += `CREATE TABLE ${table} (\n`;
      content += `  id SERIAL PRIMARY KEY,\n`;
      content += `  name VARCHAR(100) NOT NULL,\n`;
      content += `  email VARCHAR(255) UNIQUE NOT NULL,\n`;
      content += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
      content += `  active BOOLEAN DEFAULT true\n`;
      content += `);\n\n`;
    } else if (type === "insert") {
      for (let i = 1; i <= count; i++) {
        const firstName = DataProvider.firstName();
        const lastName = DataProvider.lastName();
        content += `INSERT INTO ${table} (name, email, active) VALUES\n`;
        content += `  ('${firstName} ${lastName}', '${DataProvider.email(
          firstName,
          lastName
        )}', ${DataProvider.boolean()});\n`;
      }
      content += "\n";
    }

    content += `-- End of script\n`;
    return content;
  }

  // Helper methods for generating realistic data

  static generateRealisticParagraph(topic) {
    const paragraphs = {
      "executive summary":
        "This comprehensive analysis reveals key insights into our operational performance and market position. The data indicates strong growth in core metrics while highlighting areas for strategic improvement. Overall performance exceeds expectations with notable achievements in customer satisfaction and operational efficiency.",
      "market analysis":
        "The current market landscape shows increasing competition and evolving customer preferences. Our analysis indicates a shift towards digital solutions with growing demand for integrated platforms. Key opportunities exist in emerging markets and underserved customer segments.",
      "financial overview":
        "Financial results demonstrate solid performance with revenue growth of 15% quarter-over-quarter. Operating margins improved through cost optimization initiatives while maintaining investment in strategic capabilities. Cash flow remains strong supporting continued growth initiatives.",
      "technical specifications":
        "The system architecture leverages modern technologies including cloud-native design patterns and microservices. Performance benchmarks show sub-second response times with 99.9% uptime. Security measures include encryption, access controls, and regular vulnerability assessments.",
      recommendations:
        "Based on the analysis, we recommend prioritizing digital transformation initiatives and expanding market reach. Key focus areas include technology modernization, talent development, and customer experience enhancement. Implementation should follow phased approach with measurable milestones.",
      conclusion:
        "In conclusion, the organization demonstrates strong foundation for future growth with clear strategic direction. Continued focus on innovation, operational excellence, and customer-centric approaches will drive sustained success in competitive market environment.",
    };

    return (
      paragraphs[topic] ||
      "This section provides detailed analysis and insights into the specified area. The information presented here is based on comprehensive data collection and analysis methodologies. Key findings and recommendations are outlined for strategic decision-making."
    );
  }

  static generateMetricsTable() {
    const metrics = [
      { name: "Revenue Growth", value: `${DataProvider.number(10, 25)}.${DataProvider.number(0, 9)}%`, target: "12%" },
      { name: "Customer Satisfaction", value: `${DataProvider.number(85, 98)}%`, target: "90%" },
      { name: "Market Share", value: `${DataProvider.number(15, 30)}.${DataProvider.number(0, 9)}%`, target: "25%" },
      { name: "Employee Engagement", value: `${DataProvider.number(80, 95)}%`, target: "85%" },
      { name: "Operational Efficiency", value: `${DataProvider.number(85, 98)}%`, target: "88%" },
    ];

    let table = "+---------------------+----------------+----------------+\n";
    table += "| Metric             | Actual        | Target        |\n";
    table += "+---------------------+----------------+----------------+\n";

    metrics.forEach((metric) => {
      table += `| ${metric.name.padEnd(19)} | ${metric.value.padEnd(14)} | ${metric.target.padEnd(14)} |\n`;
    });

    table += "+---------------------+----------------+----------------+\n";

    return table;
  }

  static generateLogMessage(level, component) {
    const messages = {
      DEBUG: {
        "auth-service": [
          "User authentication attempt",
          "Token validation successful",
          "Session created",
          "Permission check passed",
        ],
        "api-gateway": ["Request routing completed", "Rate limit check", "Header validation", "CORS policy applied"],
        database: ["Connection pool status", "Query execution plan", "Index usage statistics", "Cache hit ratio"],
        cache: ["Cache miss for key", "TTL refresh completed", "Memory usage check", "Eviction policy executed"],
      },
      INFO: {
        "auth-service": ["User login successful", "Password reset completed", "Account created", "Profile updated"],
        "api-gateway": [
          "API request processed",
          "Service discovery updated",
          "Load balancer health check",
          "Rate limit reset",
        ],
        database: [
          "Database connection established",
          "Transaction completed",
          "Backup process started",
          "Index optimization finished",
        ],
        cache: [
          "Cache warmed successfully",
          "Cluster node joined",
          "Memory cleanup completed",
          "Performance metrics updated",
        ],
      },
      WARN: {
        "auth-service": [
          "Multiple failed login attempts",
          "Session timeout warning",
          "Password policy violation",
          "Account lockout imminent",
        ],
        "api-gateway": [
          "High request volume detected",
          "Service response delay",
          "Rate limit approaching",
          "Circuit breaker activated",
        ],
        database: [
          "Connection pool nearly exhausted",
          "Slow query detected",
          "Disk space running low",
          "Replication lag increasing",
        ],
        cache: ["Cache hit rate dropping", "Memory usage high", "Network partition detected", "Node health degraded"],
      },
      ERROR: {
        "auth-service": [
          "Authentication service unavailable",
          "Database connection failed",
          "Token validation error",
          "Account lockout",
        ],
        "api-gateway": [
          "Service timeout",
          "Internal server error",
          "Database connection lost",
          "Authentication failed",
        ],
        database: ["Connection pool exhausted", "Transaction rollback", "Data integrity violation", "Disk I/O error"],
        cache: ["Cache cluster failure", "Memory allocation failed", "Network timeout", "Data corruption detected"],
      },
    };

    const levelMessages = messages[level]?.[component] || messages.INFO["api-gateway"];
    return DataProvider.randomElement(levelMessages);
  }

  static getRandomTags() {
    const allTags = [
      "bestseller",
      "new",
      "sale",
      "premium",
      "eco-friendly",
      "wireless",
      "portable",
      "durable",
      "compact",
      "professional",
    ];
    const numTags = DataProvider.number(1, 4);
    const tags = [];
    for (let i = 0; i < numTags; i++) {
      tags.push(DataProvider.randomElement(allTags));
    }
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate default content
   */
  static generateDefaultContent(params) {
    const { customText = "Generated content" } = params;

    return `${customText}\n\nGenerated at: ${new Date().toISOString()}\nThis is a sophisticated content generator that creates realistic file content for testing purposes.`;
  }
}

module.exports = {
  FileContentGenerator,
  DataProvider,
};
