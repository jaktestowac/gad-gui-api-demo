/**
 * GAD Feature Behavior - Handles conversations about GAD application features
 *
 * This behavior responds to questions about the GAD (GUI API Demo) application,
 * its features, and how to use it for test automation practice.
 */

const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class GADFeatureBehavior extends BaseBehavior {
  constructor() {
    // Medium-high priority to handle GAD-specific questions
    super("gad-feature", 850);

    // Flag to track if we've offered GAD introduction to the user
    this.hasOfferedGADIntro = false;

    // Keywords related to GAD and testing that might trigger this behavior
    this.triggerKeywords = [
      "gad",
      "gui api demo",
      "gecko app",
      "gecko application",
      "test automation",
      "practice",
      "testing",
      "features",
      "application",
      "app",
      "gui test",
      "api test",
      "automation practice",
      "automation sandbox",
      "test sandbox",
      "testing practice",
      "test demo",
      "demo application",
      "test environment",
      "automation environment",
      "practice website",
      "practice application",
      "learning automation",
      "automation learning",
      "test learning",
      "learning testing",
      // Specific features
      "todo",
      "forms",
      "authentication",
      "drag and drop",
      "tables",
      "file upload",
      "chat",
      "swagger",
      "documentation",
      "api docs",
      "links",
      "urls",
      "pages",
      // Practice page categories
      "simple elements",
      "changing state",
      "extended timeout",
      "slowly loaded",
      "charts",
      "canvas",
      "dynamic ids",
      "no ids",
      "popups",
      "alerts",
      "iframes",
      "shadow dom",
      "custom elements",
      "pagination",
      "session",
      "mocking",
      "documents",
      "animations",
      "transitions",
      "websockets",
      "visual testing",
      "api versioning",
      "sub-pages",
      "two-factor",
      "2fa",
      "graphql",
      "weather app",
      "simple",
      "dynamic",
      "advanced",
      "test cases",
      "files",
      "docx",
      "xlsx",
      "pdf",
      "cookie banner",
      "advert banner",
      "tabs",
      "cookies",
      "multi browsers",
      "images",
      "scroll",
      "infinite scroll",
      "simulation",
      "language",
      "code",
      "multi-step form",
      "real-time",
      "document editor",
      "cinema ticket",
      "drone simulator",
      "employee management",
      "budget app",
      "nested table",
      "slowly loaded data",
      "random data",
      "custom attribute",
      "multiple elements",
      "delayed result",
      "nested iframes",
      "multi drag and drop",
      "movable linked boxes",
      "sequence diagram",
      "sortable list",
      "task board",
      "card board",
      "reservation",
      "bus card ticket",
      "household expenses",
      "shopping cart",
      "system metrics",
      "wheel of fortune",
      "step game",
      "ant colony",
      "language change",
      "modal",
      "subscribe popup",
      "multipage",
      "carousel",
      "nested iframes",
      "multi drag and drop",
      "movable linked boxes",
      "sequence diagram",
      "sortable list",
      "task board",
      "card board",
      "reservation",
      "bus card ticket",
      "household expenses",
      "shopping cart",
      "system metrics",
      "wheel of fortune",
      "step game",
      "ant colony",
      "language change",
      "modal",
      "subscribe popup",
      "multipage",
      "carousel",
    ];

    // Information about GAD and its features
    this.gadInfo = {
      general: {
        description:
          "GAD (GUI API Demo) is an application designed for practicing test automation. It provides a comprehensive environment with both GUI and API components in a secure sandbox.",
        purpose:
          "GAD was created to help testers practice automation skills with realistic scenarios, including intentional bugs and design challenges to discover and test against.",
        mascot:
          "The GAD application is represented by a small lizard 🦎 icon (hence the name GAD, which sounds like Gecko).",
      },
      // Adding links to pages and important sections
      links: {
        homepage: `<a href="/" target="_blank" rel="noopener">Home Page</a>`,
        practicePages: `<a href="/practice" target="_blank" rel="noopener">Practice Pages</a>`,
        apiDocs: `<a href="/tools/swagger.html" target="_blank" rel="noopener">API Documentation</a>`,

        // Categories based on the practice page structure
        categories: {
          simpleElements: `<a href="/practice#simpleElements" target="_blank" rel="noopener">/practice#simpleElements</a>`,
          changingState: `<a href="/practice#elementsChangingState" target="_blank" rel="noopener">/practice#elementsChangingState</a>`,
          extendedTimeout: `<a href="/practice#elementsChangingStateExtended" target="_blank" rel="noopener">/practice#elementsChangingStateExtended</a>`,
          tables: `<a href="/practice#tables" target="_blank" rel="noopener">/practice#tables</a>`,
          slowlyLoaded: `<a href="/practice#slowlyLoadedData" target="_blank" rel="noopener">/practice#slowlyLoadedData</a>`,
          charts: `<a href="/practice#charts" target="_blank" rel="noopener">/practice#charts</a>`,
          canvas: `<a href="/practice#canvas" target="_blank" rel="noopener">/practice#canvas</a>`,
          dragDrop: `<a href="/practice#dragDrop" target="_blank" rel="noopener">/practice#dragDrop</a>`,
          dynamicIds: `<a href="/practice#dynamicIds" target="_blank" rel="noopener">/practice#dynamicIds</a>`,
          noIds: `<a href="/practice#noIds" target="_blank" rel="noopener">/practice#noIds</a>`,
          popupAlerts: `<a href="/practice#popupAlerts" target="_blank" rel="noopener">/practice#popupAlerts</a>`,
          iframes: `<a href="/practice#iFrames" target="_blank" rel="noopener">/practice#iFrames</a>`,
          shadowDom: `<a href="/practice#shadowDom" target="_blank" rel="noopener">/practice#shadowDom</a>`,
          customElements: `<a href="/practice#customElements" target="_blank" rel="noopener">/practice#customElements</a>`,
          pagination: `<a href="/practice#pagination" target="_blank" rel="noopener">/practice#pagination</a>`,
          forms: `<a href="/practice#forms" target="_blank" rel="noopener">/practice#forms</a>`,
          session: `<a href="/practice#session" target="_blank" rel="noopener">/practice#session</a>`,
          mocking: `<a href="/practice#mocking" target="_blank" rel="noopener">/practice#mocking</a>`,
          documents: `<a href="/practice#docs" target="_blank" rel="noopener">/practice#docs</a>`,
          animations: `<a href="/practice#animations" target="_blank" rel="noopener">/practice#animations</a>`,
          websockets: `<a href="/practice#websockets" target="_blank" rel="noopener">/practice#websockets</a>`,
          visualTesting: `<a href="/practice#visualTesting" target="_blank" rel="noopener">/practice#visualTesting</a>`,
          apiVersioning: `<a href="/practice#apiVersioning" target="_blank" rel="noopener">/practice#apiVersioning</a>`,
          subPages: `<a href="/practice#subPages" target="_blank" rel="noopener">/practice#subPages</a>`,
          twoFactorAuth: `<a href="/practice#2fa" target="_blank" rel="noopener">/practice#2fa</a>`,
          graphQL: `<a href="/practice#GraphQL" target="_blank" rel="noopener">/practice#GraphQL</a>`,
        },
        specificPages: {
          // Applications
          todo: `<a href="/practice/todoapp/" target="_blank" rel="noopener">/practice/todoapp/</a>`,
          weatherApp: `<a href="/practice/weatherApp/" target="_blank" rel="noopener">/practice/weatherApp/</a>`,
          weatherAppGraphql: `<a href="/practice/weatherAppGraphql/" target="_blank" rel="noopener">/practice/weatherAppGraphql/</a>`,
          employeeManagement: `<a href="/practice/ems/" target="_blank" rel="noopener">/practice/ems/</a>`,
          budgetApp: `<a href="/practice/budgetapp/" target="_blank" rel="noopener">/practice/budgetapp/</a>`,
          languageChange: `<a href="/practice/lang/" target="_blank" rel="noopener">/practice/lang/</a>`,

          // Authentication and Session
          auth: `<a href="/practice/simple-session-v1.html" target="_blank" rel="noopener">/practice/simple-session-v1.html</a>`,
          advancedAuth: `<a href="/practice/simple-session-v2.html" target="_blank" rel="noopener">/practice/simple-session-v2.html</a>`,
          twoFactorAuth: `<a href="/practice/2fa-1.html" target="_blank" rel="noopener">/practice/2fa-1.html</a>`,

          // Interactive Components
          dragdrop: `<a href="/practice/drag-and-drop-1.html" target="_blank" rel="noopener">/practice/drag-and-drop-1.html</a>`,
          multiDragdrop: `<a href="/practice/drag-and-drop-2.html" target="_blank" rel="noopener">/practice/drag-and-drop-2.html</a>`,
          imageDragdrop: `<a href="/practice/drag-and-drop-3.html" target="_blank" rel="noopener">/practice/drag-and-drop-3.html</a>`,

          // Real-time Communication
          chat: `<a href="/practice/websocket-chat-v1.html" target="_blank" rel="noopener">/practice/websocket-chat-v1.html</a>`,
          advancedChat: `<a href="/practice/websocket-chat-v5.html" target="_blank" rel="noopener">/practice/websocket-chat-v5.html</a>`,
          docEditor: `<a href="/practice/websocket-docs.html" target="_blank" rel="noopener">/practice/websocket-docs.html</a>`,

          // Charts and Data Visualization
          charts: `<a href="/practice/charts-1.html" target="_blank" rel="noopener">/practice/charts-1.html</a>`,
          chartGrid: `<a href="/practice/charts-3-multi.html" target="_blank" rel="noopener">/practice/charts-3-multi.html</a>`,
          systemMetrics: `<a href="/practice/visual-testing-v3.html" target="_blank" rel="noopener">/practice/visual-testing-v3.html</a>`,

          // Tables and Data Grids
          tables: `<a href="/practice/simple-tables.html" target="_blank" rel="noopener">/practice/simple-tables.html</a>`,
          nestedTables: `<a href="/practice/simple-nested-table-v3.html" target="_blank" rel="noopener">/practice/simple-nested-table-v3.html</a>`,
          pagination: `<a href="/practice/pagination-v4.html" target="_blank" rel="noopener">/practice/pagination-v4.html</a>`,
          infiniteScroll: `<a href="/practice/infinite-scroll-v1.html" target="_blank" rel="noopener">/practice/infinite-scroll-v1.html</a>`,

          // Forms and Inputs
          simpleForm: `<a href="/practice/simple-elements.html" target="_blank" rel="noopener">/practice/simple-elements.html</a>`,
          multiStepForm: `<a href="/practice/form-v1.html" target="_blank" rel="noopener">/practice/form-v1.html</a>`,
          loginModal: `<a href="/practice/login-modal.html" target="_blank" rel="noopener">/practice/login-modal.html</a>`,

          // Advanced UI Challenges
          shadowDOM: `<a href="/practice/shadow-dom-1.html" target="_blank" rel="noopener">/practice/shadow-dom-1.html</a>`,
          iframesNested: `<a href="/practice/iframe-3.html" target="_blank" rel="noopener">/practice/iframe-3.html</a>`,
          dynamicIds: `<a href="/practice/dynamic-ids-1.html" target="_blank" rel="noopener">/practice/dynamic-ids-1.html</a>`,

          // Animations and Interactive Elements
          carousel: `<a href="/practice/carousel-v1.html" target="_blank" rel="noopener">/practice/carousel-v1.html</a>`,
          cardBoard: `<a href="/practice/card-board.html" target="_blank" rel="noopener">/practice/card-board.html</a>`,
          taskBoard: `<a href="/practice/task-board-v1.html" target="_blank" rel="noopener">/practice/task-board-v1.html</a>`,
          sequence: `<a href="/practice/sequence-diagram-v2.html" target="_blank" rel="noopener">/practice/sequence-diagram-v2.html</a>`,

          // Special Cases & Games
          wheelOfFortune: `<a href="/practice/wheel-of-fortune.html" target="_blank" rel="noopener">/practice/wheel-of-fortune.html</a>`,
          antColony: `<a href="/practice/ant-colony.html" target="_blank" rel="noopener">/practice/ant-colony.html</a>`,
          codeJS: `<a href="/practice/code-js.html" target="_blank" rel="noopener">/practice/code-js.html</a>`,

          // API Testing
          graphQL: `<a href="/practice/weather-v1-graphql-playground.html" target="_blank" rel="noopener">/practice/weather-v1-graphql-playground.html</a>`,
          booksAPI: `<a href="/practice/books-v1.html" target="_blank" rel="noopener">/practice/books-v1.html</a>`,
          weatherData: `<a href="/practice/random-weather-v2.html" target="_blank" rel="noopener">/practice/random-weather-v2.html</a>`,
        },
      },

      guiFeatures: {
        description: "The GUI part of GAD offers various interactive components ideal for UI automation practice.",
        features: [
          "Multiple form elements with validation logic",
          "Dynamic content loading",
          "Drag and drop interfaces",
          "Modal dialogs and popups",
          "Responsive designs for testing across different viewports",
          "Authentication flows with various security measures",
          "Navigation patterns common in modern web applications",
          "Intentionally placed bugs and edge cases to discover",
        ],
      },

      apiFeatures: {
        description: "GAD's API provides numerous endpoints for practicing API automation testing.",
        features: [
          "RESTful API endpoints with complete CRUD operations",
          "Authentication endpoints with JWT implementation",
          "Swagger/OpenAPI documentation for API exploration",
          "Different response types (JSON, XML, etc.)",
          "Various status codes for testing error handling",
          "Rate limiting and performance testing opportunities",
          "Deliberate API inconsistencies for validation testing",
        ],
        swagger: "You can access the API documentation via the built-in Swagger interface at /api-docs",
      },

      practiceAreas: {
        description: "GAD includes specific practice areas designed for different testing scenarios:",
        areas: [
          "Todo application - for basic CRUD testing",
          "Article management - for content and state management testing",
          "User authentication - for security testing",
          "File uploads - for boundary testing and security validation",
          "Form validation - for input validation testing",
          "Search functionality - for performance and accuracy testing",
          "Messaging system - for real-time communication testing",
        ],
      },

      testingApproaches: {
        description: "GAD supports multiple testing approaches:",
        approaches: [
          "End-to-end testing of user flows",
          "Component-level testing of UI elements",
          "API integration testing",
          "Performance testing for bottlenecks",
          "Accessibility testing for compliance",
          "Security testing for vulnerabilities",
          "Cross-browser compatibility testing",
        ],
      },

      toolsSupport: {
        description: "GAD works well with various testing tools and frameworks:",
        uiTools: ["Selenium WebDriver", "Cypress", "Playwright", "Puppeteer", "TestCafe"],
        apiTools: ["Postman", "REST Assured", "SuperTest", "Karate DSL", "SoapUI"],
      },
    };
  }

  /**
   * Check if this behavior can handle questions about GAD features
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior can handle the message
   */
  canHandle(message, context) {
    const lowerMessage = context.lowerCaseMessage;

    // Intent-based detection for GAD conversations
    const gadIntent = [
      "tell me about test automation",
      "how can i practice testing",
      "automation tools",
      "test practice",
      "learn testing",
      "learn automation",
      "test application",
      "demo app for testing",
      "practice app",
      "help me with test automation",
      "how do i start with testing",
      "automation practice",
      "gad app",
      "gad",
      "gui api demo",
    ].some((intent) => lowerMessage.includes(intent));

    // Check if message contains any trigger keywords
    const hasKeyword = this.triggerKeywords.some((keyword) => lowerMessage.includes(keyword));

    // Check for link-related queries
    const isLinkQuery =
      lowerMessage.includes("link") ||
      lowerMessage.includes("url") ||
      lowerMessage.includes("address") ||
      lowerMessage.includes("where can i find") ||
      lowerMessage.includes("how to access") ||
      lowerMessage.includes("how do i get to");

    // Check if message is a question or informational request
    const isQuestion =
      message.includes("?") ||
      lowerMessage.startsWith("what") ||
      lowerMessage.startsWith("how") ||
      lowerMessage.startsWith("tell me") ||
      lowerMessage.startsWith("can you") ||
      lowerMessage.startsWith("explain") ||
      lowerMessage.startsWith("describe");

    // Direct mentions of GAD that are high probability matches
    const directGADMention =
      lowerMessage.includes("what is gad") ||
      lowerMessage.includes("gad features") ||
      lowerMessage.includes("gad application") ||
      lowerMessage.includes("tell me about gad") ||
      lowerMessage.includes("practice with gad") ||
      lowerMessage.includes("gui api demo") ||
      lowerMessage.includes("testing sandbox") ||
      lowerMessage.includes("automation practice site") ||
      lowerMessage.includes("test automation practice") ||
      lowerMessage.includes("automation demo") ||
      lowerMessage.includes("tell me about gad") ||
      lowerMessage === "gad";

    // User context-based detection
    const userHasTestingContext =
      context.userMemory &&
      context.userMemory.topics &&
      (context.userMemory.topics.includes("testing") || context.userMemory.topics.includes("automation"));

    // Testing interest without GAD knowledge detection
    const potentialTestingInterest =
      !this.hasOfferedGADIntro &&
      (lowerMessage.includes("automation") ||
        lowerMessage.includes("testing") ||
        lowerMessage.includes("selenium") ||
        lowerMessage.includes("cypress") ||
        lowerMessage.includes("playwright") ||
        lowerMessage.includes("webdriver") ||
        lowerMessage.includes("test framework")) &&
      !lowerMessage.includes("gad") &&
      !lowerMessage.includes("gecko");

    // Combined detection approach
    return (
      directGADMention ||
      gadIntent ||
      (isQuestion && hasKeyword) ||
      (isLinkQuery && hasKeyword) ||
      potentialTestingInterest ||
      (userHasTestingContext && isQuestion && message.length < 25)
    ); // Short question from someone interested in testing
  }

  /**
   * Handle questions about GAD features
   * @param {string} message - The message to handle
   * @param {object} context - Context for message processing
   * @returns {string} - The response about GAD features
   */
  handle(message, context) {
    const lowerMessage = context.lowerCaseMessage;

    // Store that user is interested in testing/GAD in their memory
    if (!context.userMemory.topics) {
      context.userMemory.topics = [];
    }
    if (!context.userMemory.topics.includes("testing")) {
      context.userMemory.topics.push("testing");
    }
    if (!context.userMemory.topics.includes("gad")) {
      context.userMemory.topics.push("gad");
    }

    // Check if user is showing interest in testing but hasn't been introduced to GAD
    if (
      !this.hasOfferedGADIntro &&
      (lowerMessage.includes("testing") ||
        lowerMessage.includes("automation") ||
        lowerMessage.includes("selenium") ||
        lowerMessage.includes("cypress") ||
        lowerMessage.includes("playwright")) &&
      !lowerMessage.includes("gad") &&
      !lowerMessage.includes("gecko")
    ) {
      this.hasOfferedGADIntro = true;
      return `I noticed you're interested in testing! 🔍 \n\nYou might want to check out the GAD (GUI API Demo) application. It's a comprehensive sandbox designed specifically for practicing test automation with both UI and API components.\n\nWould you like to learn more about GAD and how it can help you practice testing? Just say "Tell me about GAD" or "Show GAD features".`;
    }

    // Check if this is a general inqury that should provide GAD topic hints
    if (
      message.length < 15 &&
      (lowerMessage.includes("gad") || lowerMessage.includes("testing") || lowerMessage.includes("automation"))
    ) {
      return this._provideGADConversationStarters();
    }

    // User asks specifically for links or URLs
    if (
      lowerMessage.includes("link") ||
      lowerMessage.includes("url") ||
      lowerMessage.includes("address") ||
      lowerMessage.includes("where can i find") ||
      lowerMessage.includes("how to access")
    ) {
      return this._provideLinks(lowerMessage);
    }

    // General questions about GAD
    if (
      lowerMessage.includes("what is gad") ||
      lowerMessage.includes("tell me about gad") ||
      lowerMessage.includes("gad application") ||
      lowerMessage === "gad"
    ) {
      return `${this.gadInfo.general.description}\n\n${this.gadInfo.general.purpose}\n\n${
        this.gadInfo.general.mascot
      }\n\nYou can access the main application at ${this.gadInfo.links.homepage} and the practice areas at ${
        this.gadInfo.links.practicePages
      }.\n\n${this._getTopicSuggestions()}`;
    }

    // Questions about GUI features
    if (
      lowerMessage.includes("gui") ||
      lowerMessage.includes("user interface") ||
      lowerMessage.includes("frontend") ||
      (lowerMessage.includes("ui") && !lowerMessage.includes("api"))
    ) {
      const guiFeatures = this.gadInfo.guiFeatures.features.map((f) => `• ${f}`).join("\n");

      return `${this.gadInfo.guiFeatures.description}\n\nKey GUI features include:\n${guiFeatures}\n\nYou can access the practice pages at ${this.gadInfo.links.practicePages}.\n\nThese features are designed to help you practice various UI testing scenarios. Would you like more information about a specific aspect of GUI testing?`;
    }

    // Questions about API features
    if (
      lowerMessage.includes("api") ||
      lowerMessage.includes("endpoint") ||
      lowerMessage.includes("backend") ||
      lowerMessage.includes("rest") ||
      lowerMessage.includes("swagger")
    ) {
      const apiFeatures = this.gadInfo.apiFeatures.features.map((f) => `• ${f}`).join("\n");

      return `${this.gadInfo.apiFeatures.description}\n\nKey API features include:\n${apiFeatures}\n\n${this.gadInfo.apiFeatures.swagger}\n\nYou can access the API documentation at ${this.gadInfo.links.apiDocs} and the Swagger interface at ${this.gadInfo.links.swagger}.\n\nThese endpoints provide excellent practice for API testing scenarios. Is there a specific aspect of API testing you're interested in?`;
    } // Questions about practice areas
    if (
      lowerMessage.includes("practice area") ||
      lowerMessage.includes("what can i practice") ||
      lowerMessage.includes("areas") ||
      lowerMessage.includes("scenarios") ||
      lowerMessage.includes("what does gad have") ||
      lowerMessage.includes("categories")
    ) {
      return (
        `${this.gadInfo.practiceAreas.description}\n\nGAD includes many practice areas organized into categories:\n\n` +
        `• UI Components: Form elements, buttons, dropdowns, etc. at ${this.gadInfo.links.categories.simpleElements}\n` +
        `• Dynamic Content: Elements that change state at ${this.gadInfo.links.categories.changingState}\n` +
        `• Data Handling: Tables and pagination at ${this.gadInfo.links.categories.tables}\n` +
        `• Interactive Features: Drag & drop at ${this.gadInfo.links.categories.dragDrop}, Charts at ${this.gadInfo.links.categories.charts}\n` +
        `• Advanced UI: Shadow DOM at ${this.gadInfo.links.categories.shadowDom}, Custom elements at ${this.gadInfo.links.categories.customElements}\n` +
        `• Authentication: Session management at ${this.gadInfo.links.categories.session}, Two-factor auth at ${this.gadInfo.links.categories.twoFactorAuth}\n` +
        `• Real-time Applications: WebSockets chat at ${this.gadInfo.links.categories.websockets}\n` +
        `• API Testing: API versioning at ${this.gadInfo.links.categories.apiVersioning}, GraphQL at ${this.gadInfo.links.categories.graphQL}\n\n` +
        `You can see all categories at ${this.gadInfo.links.practicePages}. Would you like details on a specific practice area?`
      );
    }

    // Questions about testing approaches
    if (
      lowerMessage.includes("approach") ||
      lowerMessage.includes("testing method") ||
      lowerMessage.includes("how to test") ||
      lowerMessage.includes("what kind of test")
    ) {
      const approaches = this.gadInfo.testingApproaches.approaches.map((a) => `• ${a}`).join("\n");

      return `${this.gadInfo.testingApproaches.description}\n\n${approaches}\n\nGAD is designed to support all these testing approaches, giving you comprehensive practice opportunities. Which approach are you most interested in?`;
    }

    // Questions about tool support
    if (
      lowerMessage.includes("tool") ||
      lowerMessage.includes("framework") ||
      lowerMessage.includes("selenium") ||
      lowerMessage.includes("cypress") ||
      lowerMessage.includes("playwright") ||
      lowerMessage.includes("postman")
    ) {
      const uiTools = this.gadInfo.toolsSupport.uiTools.map((t) => `• ${t}`).join("\n");
      const apiTools = this.gadInfo.toolsSupport.apiTools.map((t) => `• ${t}`).join("\n");

      return `${this.gadInfo.toolsSupport.description}\n\nFor UI testing:\n${uiTools}\n\nFor API testing:\n${apiTools}\n\nYou can use any of these tools to practice automation with GAD. Are you looking to use a specific tool?`;
    } // If asking about todo application

    // Check if user is asking for GAD help
    if (message === "gad help" || message.includes("gad command") || message.includes("gad option")) {
      return this._provideGADHelp();
    }

    // Default case - general features overview
    const generalOverview = `GAD (GUI API Demo) offers a comprehensive environment for practicing test automation, including:

• Various UI components for frontend testing (forms, tables, animations)
• Interactive elements (drag & drop, charts, canvas)
• Complex scenarios (dynamic IDs, shadow DOM, iframes)
• Authentication flows including two-factor authentication
• Real-time features with WebSockets
• API testing with both REST and GraphQL
• Visual testing challenges and mocking challenges

You can access the main application at ${this.gadInfo.links.homepage}.
The practice pages are located at ${this.gadInfo.links.practicePages}.
API documentation is available at ${this.gadInfo.links.apiDocs}.

Would you like more information about:
1. UI testing features
2. API testing features
3. Specific practice categories
4. Supported testing tools

Or you can ask for 'all practice links' to see the full list of available practice areas.`;

    return generalOverview;
  }

  /**
   * Provide GAD conversation starters to help users begin exploring GAD topics
   * @private
   * @returns {string} - Response with conversation starters
   */
  _provideGADConversationStarters() {
    return `I'd be happy to tell you about the GAD (GUI API Demo) application! 🦎\n\nGAD is a comprehensive platform designed for practicing test automation with both UI and API components.\n\nHere are some topics you can ask me about:

• "What is GAD?" - Learn about the purpose and overview of the application
• "Show me GAD features" - See the main features available for testing practice  
• "GAD UI testing" - Learn about user interface testing capabilities
• "GAD API testing" - Discover API testing opportunities
• "Show all practice categories" - View all available practice areas
• "GAD applications" - See complete applications available for end-to-end testing
• "GAD tools compatibility" - Learn which testing tools work well with GAD
• "How to start with GAD" - Get tips for beginning your test automation practice

What would you like to know about GAD?`;
  }

  /**
   * Get topic suggestions for GAD conversations
   * @private
   * @returns {string} - Response with topic suggestions
   */
  _getTopicSuggestions() {
    return `Would you like to know more about:

• UI testing features in GAD
• API testing capabilities 
• Specific practice categories
• Complete applications for end-to-end testing
• Best practices for test automation with GAD

Just ask about any of these topics, or type "GAD help" for more options!`;
  }

  /**
   * Provide appropriate links based on user query
   * @private
   * @param {string} message - Lowercase user message
   * @returns {string} - Response with relevant links
   */
  _provideLinks(message) {
    // Determine which links to provide based on the query
    let response = "Here are the links to access various parts of the GAD application:\n\n";

    // Check for category-specific requests
    if (
      message.includes("categor") ||
      message.includes("section") ||
      message.includes("all practice") ||
      message.includes("what practice") ||
      message.includes("available practice")
    ) {
      response += "GAD practice includes the following categories:\n\n";
      response += `• Simple Elements: ${this.gadInfo.links.categories.simpleElements}\n`;
      response += `• Elements with Changing State: ${this.gadInfo.links.categories.changingState}\n`;
      response += `• Tables: ${this.gadInfo.links.categories.tables}\n`;
      response += `• Charts: ${this.gadInfo.links.categories.charts}\n`;
      response += `• Canvas: ${this.gadInfo.links.categories.canvas}\n`;
      response += `• Drag & Drop: ${this.gadInfo.links.categories.dragDrop}\n`;
      response += `• Forms: ${this.gadInfo.links.categories.forms}\n`;
      response += `• Dynamic IDs: ${this.gadInfo.links.categories.dynamicIds}\n`;
      response += `• Popups and Alerts: ${this.gadInfo.links.categories.popupAlerts}\n`;
      response += `• IFrames: ${this.gadInfo.links.categories.iframes}\n`;
      response += `• Shadow DOM: ${this.gadInfo.links.categories.shadowDom}\n`;
      response += `• WebSockets: ${this.gadInfo.links.categories.websockets}\n`;
      response += `• Two-Factor Authentication: ${this.gadInfo.links.categories.twoFactorAuth}\n`;
      response += `• GraphQL: ${this.gadInfo.links.categories.graphQL}\n`;
      response += `• Visual Testing: ${this.gadInfo.links.categories.visualTesting}\n`;
      response += `• Animations: ${this.gadInfo.links.categories.animations}\n`;
      response += `• Documents: ${this.gadInfo.links.categories.documents}\n`;
      response += `• Mocking: ${this.gadInfo.links.categories.mocking}\n`;
      response += `• API Versioning: ${this.gadInfo.links.categories.apiVersioning}\n`;
      response += `• Sessions: ${this.gadInfo.links.categories.session}\n`;
      response += `• Custom Elements: ${this.gadInfo.links.categories.customElements}\n`;
      response += `• Pagination: ${this.gadInfo.links.categories.pagination}\n`;
      return (
        response +
        '\nIs there a specific category you\'d like to know more about? You can ask me things like "Tell me about WebSockets testing" or "How can I practice with Shadow DOM".'
      );
    }

    // Application-specific requests
    if (message.includes("application") || message.includes("app") || message.includes("complete")) {
      response += "GAD includes complete applications for testing:\n\n";
      response += `• Todo Application: ${this.gadInfo.links.specificPages.todo}\n`;
      response += `• Weather Application: ${this.gadInfo.links.specificPages.weatherApp}\n`;
      response += `• Weather App (GraphQL): ${this.gadInfo.links.specificPages.weatherAppGraphql}\n`;
      response += `• Employee Management System: ${this.gadInfo.links.specificPages.employeeManagement}\n`;
      response += `• Budget Application: ${this.gadInfo.links.specificPages.budgetApp}\n`;
      response += `• Language Change App: ${this.gadInfo.links.specificPages.languageChange}\n`;
      return (
        response +
        "\nThese applications provide end-to-end testing scenarios. Would you like more information about a specific app?"
      );
    }

    // If asking about todo application
    if (message.includes("todo") || message.includes("task management") || message.includes("task app")) {
      response += `• Todo Practice App: ${this.gadInfo.links.specificPages.todo}\n`;
      response += `• Task Board: ${this.gadInfo.links.specificPages.taskBoard}\n`;
    }

    // If asking about form-related testing
    if (message.includes("form") || message.includes("input") || message.includes("field")) {
      response += `• Forms Section: ${this.gadInfo.links.categories.forms}\n`;
      response += `• Simple Form Elements: ${this.gadInfo.links.specificPages.simpleForm}\n`;
      response += `• Multi-Step Form: ${this.gadInfo.links.specificPages.multiStepForm}\n`;
      response += `• Login Modal: ${this.gadInfo.links.specificPages.loginModal}\n`;
    }

    // If asking about authentication-related testing
    if (
      message.includes("auth") ||
      message.includes("login") ||
      message.includes("session") ||
      message.includes("security")
    ) {
      response += `• Session Management: ${this.gadInfo.links.categories.session}\n`;
      response += `• Simple Authentication: ${this.gadInfo.links.specificPages.auth}\n`;
      response += `• Advanced Authentication: ${this.gadInfo.links.specificPages.advancedAuth}\n`;
      response += `• Two-Factor Authentication: ${this.gadInfo.links.specificPages.twoFactorAuth}\n`;
      response += `• Login Modal: ${this.gadInfo.links.specificPages.loginModal}\n`;
    }

    // If asking about drag and drop
    if (message.includes("drag") || message.includes("drop") || message.includes("dnd")) {
      response += `• Drag and Drop Section: ${this.gadInfo.links.categories.dragDrop}\n`;
      response += `• Simple Drag and Drop: ${this.gadInfo.links.specificPages.dragdrop}\n`;
      response += `• Multi-element Drag and Drop: ${this.gadInfo.links.specificPages.multiDragdrop}\n`;
      response += `• Image Drag and Drop: ${this.gadInfo.links.specificPages.imageDragdrop}\n`;
    }

    // If asking about tables, data grids, or pagination
    if (
      message.includes("table") ||
      message.includes("grid") ||
      message.includes("data") ||
      message.includes("pagination")
    ) {
      response += `• Tables Section: ${this.gadInfo.links.categories.tables}\n`;
      response += `• Pagination Section: ${this.gadInfo.links.categories.pagination}\n`;
      response += `• Simple Tables: ${this.gadInfo.links.specificPages.tables}\n`;
      response += `• Nested Tables: ${this.gadInfo.links.specificPages.nestedTables}\n`;
      response += `• Advanced Pagination: ${this.gadInfo.links.specificPages.pagination}\n`;
      response += `• Infinite Scroll: ${this.gadInfo.links.specificPages.infiniteScroll}\n`;
    }

    // If asking about charts, graphs, or data visualization
    if (
      message.includes("chart") ||
      message.includes("graph") ||
      message.includes("visual") ||
      message.includes("dashboard")
    ) {
      response += `• Charts Section: ${this.gadInfo.links.categories.charts}\n`;
      response += `• Visual Testing: ${this.gadInfo.links.categories.visualTesting}\n`;
      response += `• Weather Charts: ${this.gadInfo.links.specificPages.charts}\n`;
      response += `• Chart Grid: ${this.gadInfo.links.specificPages.chartGrid}\n`;
      response += `• System Metrics Dashboard: ${this.gadInfo.links.specificPages.systemMetrics}\n`;
    }

    // If asking about canvas
    if (message.includes("canvas") || message.includes("drawing")) {
      response += `• Canvas Elements: ${this.gadInfo.links.categories.canvas}\n`;
      response += `• Sequence Diagram: ${this.gadInfo.links.specificPages.sequence}\n`;
    }

    // If asking about popups, alerts, or dialogs
    if (
      message.includes("alert") ||
      message.includes("popup") ||
      message.includes("dialog") ||
      message.includes("modal")
    ) {
      response += `• Popup and Alerts: ${this.gadInfo.links.categories.popupAlerts}\n`;
      response += `• Login Modal: ${this.gadInfo.links.specificPages.loginModal}\n`;
    }

    // If asking about iframes
    if (message.includes("iframe") || message.includes("frame")) {
      response += `• IFrames: ${this.gadInfo.links.categories.iframes}\n`;
      response += `• Nested IFrames: ${this.gadInfo.links.specificPages.iframesNested}\n`;
    }

    // If asking about Shadow DOM
    if (message.includes("shadow") || message.includes("dom") || message.includes("web component")) {
      response += `• Shadow DOM: ${this.gadInfo.links.categories.shadowDom}\n`;
      response += `• Shadow DOM Example: ${this.gadInfo.links.specificPages.shadowDOM}\n`;
      response += `• Custom Elements: ${this.gadInfo.links.categories.customElements}\n`;
    }

    // If asking about websockets or real-time communication
    if (
      message.includes("chat") ||
      message.includes("message") ||
      message.includes("socket") ||
      message.includes("real-time") ||
      message.includes("realtime")
    ) {
      response += `• WebSockets Section: ${this.gadInfo.links.categories.websockets}\n`;
      response += `• Simple Chat: ${this.gadInfo.links.specificPages.chat}\n`;
      response += `• Advanced Chat: ${this.gadInfo.links.specificPages.advancedChat}\n`;
      response += `• Real-time Document Editor: ${this.gadInfo.links.specificPages.docEditor}\n`;
    }

    // If asking about weather application
    if (message.includes("weather")) {
      response += `• Weather Application: ${this.gadInfo.links.specificPages.weatherApp}\n`;
      response += `• Weather App (GraphQL): ${this.gadInfo.links.specificPages.weatherAppGraphql}\n`;
      response += `• Weather Data API: ${this.gadInfo.links.specificPages.weatherData}\n`;
    }

    // If asking about animations, transitions or interactive elements
    if (message.includes("animation") || message.includes("transition") || message.includes("interactive")) {
      response += `• Animations and Transitions: ${this.gadInfo.links.categories.animations}\n`;
      response += `• Carousel: ${this.gadInfo.links.specificPages.carousel}\n`;
      response += `• Card Board: ${this.gadInfo.links.specificPages.cardBoard}\n`;
      response += `• Task Board: ${this.gadInfo.links.specificPages.taskBoard}\n`;
      response += `• Sequence Diagram: ${this.gadInfo.links.specificPages.sequence}\n`;
    }

    // If asking about document handling or file formats
    if (
      message.includes("document") ||
      message.includes("docx") ||
      message.includes("xlsx") ||
      message.includes("file") ||
      message.includes("pdf")
    ) {
      response += `• Documents (docx, xlsx): ${this.gadInfo.links.categories.documents}\n`;
    }

    // If asking about mocking or data simulation
    if (message.includes("mock") || message.includes("simulation") || message.includes("fake data")) {
      response += `• Mocking Challenges: ${this.gadInfo.links.categories.mocking}\n`;
      response += `• Weather Data: ${this.gadInfo.links.specificPages.weatherData}\n`;
      response += `• Ant Colony Simulation: ${this.gadInfo.links.specificPages.antColony}\n`;
    }

    // If asking about games or special challenges
    if (
      message.includes("game") ||
      message.includes("challenge") ||
      message.includes("special") ||
      message.includes("fun")
    ) {
      response += `• Wheel of Fortune: ${this.gadInfo.links.specificPages.wheelOfFortune}\n`;
      response += `• Ant Colony Simulation: ${this.gadInfo.links.specificPages.antColony}\n`;
      response += `• Code JS: ${this.gadInfo.links.specificPages.codeJS}\n`;
    }

    // If asking about API documentation, endpoints, or GraphQL
    if (
      message.includes("api") ||
      message.includes("swagger") ||
      message.includes("endpoint") ||
      message.includes("documentation") ||
      message.includes("graphql")
    ) {
      response += `• API Versioning: ${this.gadInfo.links.categories.apiVersioning}\n`;
      response += `• GraphQL: ${this.gadInfo.links.categories.graphQL}\n`;
      response += `• GraphQL Playground: ${this.gadInfo.links.specificPages.graphQL}\n`;
      response += `• Books API: ${this.gadInfo.links.specificPages.booksAPI}\n`;
      response += `• Swagger Interface: ${this.gadInfo.links.apiDocs}\n`;
    }

    // If asking about advanced UI challenges
    if (
      message.includes("advanced") ||
      message.includes("complex") ||
      message.includes("difficult") ||
      message.includes("challenge")
    ) {
      response += `• Shadow DOM: ${this.gadInfo.links.specificPages.shadowDOM}\n`;
      response += `• Nested IFrames: ${this.gadInfo.links.specificPages.iframesNested}\n`;
      response += `• Dynamic IDs: ${this.gadInfo.links.specificPages.dynamicIds}\n`;
      response += `• Advanced Pagination: ${this.gadInfo.links.specificPages.pagination}\n`;
      response += `• Task Board: ${this.gadInfo.links.specificPages.taskBoard}\n`;
      response += `• Advanced Chat: ${this.gadInfo.links.specificPages.advancedChat}\n`;
    }

    // General links if nothing specific was matched or if explicitly asked for main links
    if (
      response === "Here are the links to access various parts of the GAD application:\n\n" ||
      message.includes("all") ||
      message.includes("main") ||
      message.includes("general")
    ) {
      response += `• Homepage: ${this.gadInfo.links.homepage}\n`;
      response += `• Practice Pages: ${this.gadInfo.links.practicePages}\n`;
      response += `• API Documentation: ${this.gadInfo.links.apiDocs}\n`;
      response += `• Todo App: ${this.gadInfo.links.specificPages.todo}\n`;
      response += `• Weather App: ${this.gadInfo.links.specificPages.weatherApp}\n`;
      response += `• Authentication: ${this.gadInfo.links.specificPages.auth}\n`;
      response += `• WebSockets Chat: ${this.gadInfo.links.specificPages.chat}\n`;
      response += `• Employee Management System: ${this.gadInfo.links.specificPages.employeeManagement}\n`;
      response += `• Budget App: ${this.gadInfo.links.specificPages.budgetApp}\n`;
    }

    // If no specific links were added (edge case), provide general links
    if (response === "Here are the links to access various parts of the GAD application:\n\n") {
      response += `• Homepage: ${this.gadInfo.links.homepage}\n`;
      response += `• Practice Pages: ${this.gadInfo.links.practicePages}\n`;
      response += `• API Documentation: ${this.gadInfo.links.apiDocs}\n`;
    }

    response +=
      "\nIs there a specific type of testing or feature you're interested in? You can ask for 'all categories' to see the full list of practice sections, or 'applications' to see complete apps for testing.";

    return response;
  }

  /**
   * Provide comprehensive help for GAD-related conversations
   * @private
   * @returns {string} - Response with comprehensive GAD help
   */
  _provideGADHelp() {
    return `# 🦎 GAD (GUI API Demo) Help Guide

GAD is a comprehensive test automation practice platform. Here's how you can talk to me about it:

## General GAD Topics
• "What is GAD?" - Basic overview and purpose
• "Tell me about GAD" - Introduction to the application
• "GAD features" - Overview of testing features
• "How to get started with GAD" - Beginner guidance

## Testing Categories
• "Show all GAD categories" - List all practice areas
• "GAD UI testing" - User interface testing features
• "GAD API testing" - API testing capabilities
• "GAD visual testing" - Visual testing features
• "Tell me about [specific feature]" - Details on websockets, shadow DOM, etc.

## Applications & Examples
• "GAD applications" - Complete applications for E2E testing
• "GAD examples" - Example code and test cases
• "GAD best practices" - Testing best practices
• "Testing tools for GAD" - Compatible automation tools

## Links & Navigation
• "GAD links" - Important application URLs
• "Where can I find [feature]" - Location of specific features

What would you like to know about GAD?`;
  }
}

module.exports = GADFeatureBehavior;
