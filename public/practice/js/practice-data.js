/**
 * Practice page data source. Edit this file to add, remove, or modify sections and links.
 *
 * Structure
 * - Each Section has: id, title, sectionName (tooltip/search), optional headerClass, optional prefixHtml, optional subtitle
 * - items: array of
 *    { type: 'link', href, label, tags: string[] }
 *    { type: 'label', id, label }  // renders an inline labeled anchor inside the section
 */

(function () {
  /**
   * Normalize and deduplicate tag values.
   * Trims whitespace and removes empty entries.
   * @param {string[]} tags
   * @returns {string[]}
   */
  function normalizeTags(tags) {
    const cleaned = (tags || []).map((t) => (t || "").trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
  }

  /**
   * Create a link item.
   * @param {string} href - Relative link path
   * @param {string} label - Displayed button label
   * @param {string[]} tags - Tags used for filtering
   */
  const makeLink = (href, label, tags) => ({ type: "link", href, label, tags: normalizeTags(tags) });

  /**
   * Create an inline label/divider item within a section.
   * @param {string} id - Anchor id for hash links
   * @param {string} label - Display text (e.g., "Advanced:")
   */
  const makeLabel = (id, label) => ({ type: "label", id, label });

  /** @type {Array<{id:string,title:string,sectionName:string,subtitle?:string,headerClass?:string,prefixHtml?:string,items:Array<any>}>>} */
  const PRACTICE_SECTIONS = [
    {
      id: "simpleElements",
      title: "Simple Elements",
      sectionName: "Simple Elements",
      items: [
        makeLink("./simple-elements.html", "With IDs", ["simple"]),
        makeLink("./simple-elements-no-ids.html", "Without IDs", ["simple"]),
        makeLink("./simple-elements-custom-attribute.html", "Custom attribute", ["simple"]),
        makeLink("./simple-multiple-elements-no-ids.html", "Multiple elements", ["simple"]),
      ],
    },
    {
      id: "elementsChangingState",
      title: "Elements with changing state",
      sectionName: "Elements with changing state",
      items: [
        makeLink("./disabled-elements-1.html", "Disabled", ["dynamic"]),
        makeLink("./not-displayed-elements-1.html", "Not displayed", ["dynamic"]),
        makeLink("./not-present-elements-1.html", "Not present", ["dynamic"]),
        makeLink("./not-present-disabled-elements-1.html", "Not present -> enabled", ["dynamic"]),
      ],
    },
    {
      id: "elementsChangingStateExtended",
      title: "Elements with changing state",
      sectionName: "Elements with changing state (extended timeout and delayed)",
      subtitle: "extended timeout and delayed",
      items: [
        makeLink("./not-present-disabled-elements-2.html", "Dynamic elements (extended timeout)", ["dynamic"]),
        makeLink("./delayed-elements-and-delayed-result-1.html", "Dynamic elements (delayed result)", ["dynamic"]),
        makeLink(
          "./delayed-elements-and-delayed-result-2.html",
          "Dynamic elements (delayed result and extended timeout)",
          ["dynamic"]
        ),
      ],
    },
    {
      id: "tables",
      title: "Tables",
      sectionName: "Tables",
      items: [
        makeLink("./simple-tables.html", "Weather table (IDs)", ["simple", "tables"]),
        makeLink("./simple-tables-no-ids.html", "Weather table (no IDs)", ["simple", "tables"]),
        makeLink("./simple-tables-other-attributes.html", "Weather table (other attributes)", ["simple", "tables"]),
        makeLink("./simple-weather-forecast.html", "Simple Weather forecast (API)", ["api", "tables"]),
        makeLink("./simple-weather-forecast-delay.html", "Simple Weather forecast (slow🐌)(API)", ["api", "tables"]),
        makeLink("./simple-nested-table-v1.html", "Nested table v1", ["simple", "tables"]),
        makeLink("./simple-nested-table-v2.html", "Nested table v2", ["simple", "tables"]),
        makeLink("./simple-nested-table-v3.html", "Nested table v3", ["advanced", "tables", "test cases"]),
      ],
    },
    {
      id: "slowlyLoadedData",
      title: "Slowly loaded data",
      sectionName: "Slowly loaded data",
      items: [
        makeLink("./slowly-loaded-table-1.html", "Weather table", ["dynamic", "tables"]),
        makeLink("./slowly-loaded-table-2.html", "Weather table (random data)", ["dynamic", "tables"]),
      ],
    },
    {
      id: "charts",
      title: "Charts",
      sectionName: "Charts",
      items: [
        makeLink("./charts-1.html", "Weather Charts", ["simple", "charts"]),
        makeLink("./charts-2-api.html", "Weather Charts (API)", ["api", "charts"]),
        makeLink("./charts-2-multi.html", "Weather Charts (Multiple)", ["simple", "charts"]),
        makeLink("./charts-3-multi.html", "Weather Charts (Grid)", ["simple", "charts"]),
      ],
    },
    {
      id: "canvas",
      title: "Canvas",
      sectionName: "Canvas",
      items: [
        makeLink("./canvas-1.html", "Weather Canvas", ["simple", "canvas"]),
        makeLink("./canvas-2.html", "Weather Canvas (slow🐌)", ["simple", "canvas"]),
      ],
    },
    {
      id: "dragDrop",
      title: "Drag & drop",
      sectionName: "Drag & drop",
      items: [
        makeLink("./drag-and-drop-1.html", "Drag & drop v1", ["simple", "dynamic", "drag & drop", "file upload"]),
        makeLink("./drag-and-drop-2.html", "Multi Drag & drop v2", [
          "advanced",
          "dynamic",
          "drag & drop",
          "file upload",
        ]),
        makeLink("./drag-and-drop-3.html", "Multi Image Drag & drop v3", [
          "advanced",
          "dynamic",
          "images",
          "drag & drop",
          "file upload",
        ]),
        makeLink("./file-upload-v1.html", "Simple File Upload V1", [
          "advanced",
          "dynamic",
          "drag & drop",
          "file upload",
        ]),
      ],
    },
    {
      id: "dynamicIds",
      title: "Dynamic IDs",
      sectionName: "Dynamic IDs",
      items: [
        makeLink("./dynamic-ids-1.html", "Locations", ["dynamic"]),
        makeLink("./dynamic-ids-2.html", "Random Places of Interest", ["dynamic"]),
      ],
    },
    {
      id: "noIds",
      title: "No IDs",
      sectionName: "No IDs",
      items: [makeLink("./random-places-no-ids-1.html", "Random Places of Interest", ["dynamic"])],
    },
    {
      id: "popupAlerts",
      title: "Popup and alerts",
      sectionName: "Popup and alerts",
      items: [
        makeLink("./alerts-1.html", "Alerts", ["simple", "popup"]),
        makeLink("./login-modal.html", "Login Modal", ["simple", "popup", "canvas"]),
        makeLink("./sub-popup-v1.html", "Subscribe popup", ["popup", "tabs", "dynamic", "cookies", "test cases"]),
        makeLink("./banners-v1.html", "Cookie and Advert banner V1", ["popup", "cookie banner", "advert banner"]),
        makeLink("./banners-v2.html", "Cookie and Advert banner V2", ["popup", "cookie banner", "advert banner"]),
      ],
    },
    {
      id: "iFrames",
      title: "IFrames",
      sectionName: "IFrames",
      items: [
        makeLink("./iframe-0.html", "Forms", ["simple", "iframe"]),
        makeLink("./iframe-1.html", "Time Zones", ["simple", "iframe"]),
        makeLink("./iframe-2.html", "Places of Interest", ["simple", "iframe"]),
        makeLabel("nestedIframes", "Nested IFrames:"),
        makeLink("./iframe-3.html", "Simple Weather forecast (API)", ["api", "iframe"]),
        makeLink("./iframe-4.html", "Simple Registration Form", ["simple", "iframe"]),
      ],
    },
    {
      id: "shadowDom",
      title: "Shadow DOM",
      sectionName: "Shadow DOM",
      items: [
        makeLink("./shadow-dom-0.html", "Simple Example", ["simple", "shadow DOM"]),
        makeLink("./shadow-dom-1.html", "Time Zones", ["simple", "shadow DOM"]),
        makeLink("./shadow-dom-2.html", "Places of Interest", ["simple", "shadow DOM"]),
      ],
    },
    {
      id: "customElements",
      title: "Custom elements",
      sectionName: "Custom elements",
      items: [makeLink("./custom-elements.html", "Custom elements", ["simple"])],
    },
    {
      id: "pagination",
      title: "Pagination",
      sectionName: "Pagination",
      subtitle: "Multi-Select Dropdown\nwith Search in Data Grid",
      items: [
        // L('./pagination-v1.html', 'Employees Data Table', ['simple', 'tables', 'pagination']), // intentionally commented as in original
        makeLink("./pagination-v2.html", "Employees Data Table (API V1)", [
          "api",
          "tables",
          "pagination",
          "test cases",
        ]),
        makeLink("./pagination-v3.html", "Random employees Data Table (API V1)", [
          "api",
          "tables",
          "pagination",
          "test cases",
        ]),
        makeLink("./pagination-v4.html", "Employees Data Table with Extendables (API V1)", [
          "api",
          "tables",
          "pagination",
          "advanced",
          "test cases",
        ]),
        makeLink("./pagination-v5.html", "Employees Data Table with Extendables (API V2)", [
          "api",
          "tables",
          "pagination",
          "advanced",
          "test cases",
        ]),
        makeLink("./infinite-scroll-v1.html", "Infinite Scroll", ["scroll", "tables", "advanced"]),
      ],
    },
    {
      id: "forms",
      title: "Forms",
      sectionName: "Forms",
      items: [makeLink("./form-v1.html", "Multi-Step Form with Summary", ["simple", "popup"])],
    },
    {
      id: "session",
      title: "Session",
      sectionName: "Session",
      items: [
        makeLink("./simple-session-v1.html", "Simple Session V1 (API)", [
          "api",
          "session",
          "dynamic",
          "advanced",
          "cookies",
        ]),
        makeLink("./simple-session-v2.html", "Simple Session V2 (API)", [
          "api",
          "session",
          "dynamic",
          "advanced",
          "cookies",
        ]),
      ],
    },
    {
      id: "mocking",
      title: "Mocking challenges",
      sectionName: "Mocking challenges",
      items: [
        makeLink("./random-simple-user-v1.html", "Random Simple User (API)", ["tables", "api", "test cases"]),
        makeLink("./random-shopping-cart-v1.html", "Random Shopping Cart (API)", ["tables", "api", "test cases"]),
        makeLink("./random-weather-v1.html", "Random Weather (API)", ["tables", "api", "test cases"]),
        makeLink("./random-weather-v2.html", "Random Weather for City (API)", ["tables", "api", "test cases"]),
        makeLink("./simple-bus-card-ticket-v1.html", "Simple Bus Card Ticket (API)", ["tables", "api", "test cases"]),
        makeLink("./household-expenses-today-v1.html", "Random 1-day Household Expenses (API)", [
          "tables",
          "api",
          "test cases",
        ]),
        makeLink("./household-expenses-v1.html", "Random 7-days Household Expenses (API)", [
          "tables",
          "api",
          "canvas",
          "test cases",
        ]),
      ],
    },
    {
      id: "docs",
      title: "Documents (docx, xlsx)",
      sectionName: "Documents (docx, xlsx)",
      items: [
        makeLink("./random-weather-doc-v1.html", "Random Weather (API)", [
          "api",
          "download",
          "files",
          "files (docx xlsx pdf)",
        ]),
        makeLink("./simple-bus-card-ticket-doc-v1.html", "Simple Bus Card Ticket (API)", [
          "api",
          "download",
          "files",
          "files (docx xlsx pdf)",
        ]),
      ],
    },
    {
      id: "animations",
      title: "Animations and Transitions",
      sectionName: "Animations and Transitions",
      items: [
        makeLink("./carousel-v1.html", "Carousel Slider", ["simple", "dynamic"]),
        makeLink("./linked-boxes-v1.html", "Movable Linked Boxes", [
          "advanced",
          "popup",
          "download",
          "files",
          "dynamic",
        ]),
        makeLink("./card-board.html", "Card Board", ["advanced", "dynamic"]),
        makeLink("./sequence-diagram.html", "Sequence Diagram (Canvas)", ["advanced", "canvas", "dynamic"]),
        makeLink("./sequence-diagram-v2.html", "Sequence Diagram", ["advanced", "dynamic"]),
        makeLink("./sortable-list-v1.html", "Sortable List Challenge", ["advanced", "dynamic"]),
        makeLink("./task-board-v1.html", "Task Board", ["advanced", "download", "files", "dynamic", "tabs", "cookies"]),
        makeLink("./math-blocks.html", "Math Blocks", ["advanced", "dynamic"]),
      ],
    },
    {
      id: "websockets",
      title: "WebSockets",
      sectionName: "WebSockets",
      headerClass: "empty-relative",
      prefixHtml: '<span class="star-glow"><i class="fa-solid fa-star"></i></span>',
      items: [
        makeLink("./websocket-v0.html", "Simple Weather Widget", ["WebSocket"]),
        makeLink("./websocket-v1.html", "Random Weather for City", ["WebSocket"]),
        makeLink("./websocket-v2.html", "Advanced Weather Widget", ["WebSocket", "canvas"]),
        makeLink("./websocket-cinema.html", "Cinema Ticket Management", ["WebSocket", "tabs"]),
        makeLink("./websocket-drones.html", "Drone Simulator", ["WebSocket", "multi browsers"]),
        makeLabel("advancedWebSockets", "Advanced:"),
        makeLink("./websocket-chat-v1.html", "Simple Real-Time Chat V1", ["WebSocket", "advanced", "multi browsers"]),
        makeLink("./websocket-chat-v2.html", "Real-Time Chat V2 (with priv messages)", [
          "WebSocket",
          "advanced",
          "multi browsers",
        ]),
        makeLink("./websocket-chat-v3.html", "Real-Time Chat V3 (with priv messages and weather widget)", [
          "WebSocket",
          "advanced",
          "multi browsers",
        ]),
        makeLink("./websocket-chat-v4.html", "Real-Time Chat V4 (with priv message tabs and weather widget)", [
          "WebSocket",
          "advanced",
          "multi browsers",
        ]),
        makeLink("./websocket-chat-v5.html", "WeatherChat (Real-Time Chat V5 with session)", [
          "WebSocket",
          "advanced",
          "multi browsers",
          "💻 webinar",
        ]),
        makeLink("./websocket-docs.html", "Real-time Document Editor", ["WebSocket", "advanced", "multi browsers"]),
      ],
    },
    {
      id: "visualTesting",
      title: "Visual testing challenges",
      sectionName: "Visual testing challenges",
      items: [
        makeLink("./visual-testing-v0.html", "Static widget", ["simple", "visual testing", "charts"]),
        makeLink("./visual-testing-v0B.html", "Static widget (with random border radius)", [
          "simple",
          "visual testing",
          "charts",
          "dynamic",
        ]),
        makeLink("./visual-testing-v1.html", "Static widget with dynamic parts", [
          "dynamic",
          "visual testing",
          "charts",
          "dynamic",
        ]),
        makeLink("./visual-testing-v1B.html", "Static widget with dynamic parts (API V1)", [
          "api",
          "visual testing",
          "charts",
          "dynamic",
        ]),
        makeLink("./visual-testing-v2.html", "Static & dynamic widgets", [
          "simple",
          "visual testing",
          "charts",
          "dynamic",
        ]),
        makeLink("./visual-testing-v3.html", "System metrics monitoring", [
          "simple",
          "visual testing",
          "charts",
          "dynamic",
        ]),
        makeLink("./visual-testing-v4.html", "Multiple elements (static & dynamic)", [
          "simple",
          "visual testing",
          "charts",
          "dynamic",
        ]),
        makeLink("./visual-testing-v5.html", "System metrics monitoring V1 (API V1)", [
          "api",
          "visual testing",
          "dynamic",
        ]),
        makeLink("./visual-testing-v6.html", "System metrics monitoring V2 (only auto refresh) (API V1)", [
          "api",
          "visual testing",
          "dynamic",
        ]),
        makeLink("./visual-testing-v7.html", "System metrics monitoring V3 (only auto refresh) (API V2)", [
          "api",
          "visual testing",
          "dynamic",
        ]),
        makeLink("./fancy-registration.html", "Registration Form", ["visual testing"]),
      ],
    },
    {
      id: "apiVersioning",
      title: "API versioning",
      sectionName: "API versioning",
      items: [
        makeLink("./todoapp/index.html", "TODO App (API)", ["api", "advanced", "popup"]),
        makeLink("./budgetapp/index.html", "Budget App (API)", ["api", "advanced", "charts", "popup", "canvas"]),
      ],
    },
    {
      id: "subPages",
      title: "Page with sub-pages",
      sectionName: "Page with sub-pages",
      items: [
        makeLink("./multipage-v1.html", "Multipage", ["simple", "tabs", "dynamic"]),
        makeLink("./new-page-v1", "New page (tab) Demo (Data Transfer)", ["simple", "data transfer", "new window"]),
        makeLink("./new-window-v1", "New page (window) Demo (Data Transfer)", [
          "simple",
          "data transfer",
          "new window",
        ]),
      ],
    },
    {
      id: "2fa",
      title: "Two-Factor Authentication",
      sectionName: "Two-Factor Authentication",
      headerClass: "empty-relative",
      items: [
        makeLink("./2fa-1.html", "Simple Two-Factor Authentication V1", ["2fa", "two-factor authentication"]),
        makeLink("./2fa-2.html", "Simple Two-Factor Authentication V2", ["2fa", "two-factor authentication"]),
      ],
    },
    {
      id: "GraphQL",
      title: "GraphQL",
      sectionName: "GraphQL",
      items: [
        makeLink("./weather-v1-graphql-playground.html", "Weather GraphQL Playground V1", ["GraphQL", "api"]),
        makeLink("./books-v1.html", "Books V1 (GraphQL)", ["GraphQL", "api"]),
        makeLink("./weatherAppGraphql/index.html", "Weather App V1 (GraphQL)", ["GraphQL", "api"]),
      ],
    },
    {
      id: "a11y",
      title: "Accessibility",
      sectionName: "a11y",
      items: [
        makeLink("./a11y/learn-ai-1.html", "Learn AI (Fixed Accessibility)", ["a11y", "accessibility"]),
        makeLink("./a11y/learn-ai-0.html", "Learn AI (Accessibility issues)", ["a11y", "accessibility"]),
        makeLink("./a11y/learn-ai-2.html", "Learn AI (with broken graphics)", ["a11y", "accessibility"]),
        makeLink("./a11y/learn-ai-3.html", "Learn AI (with dark graphics)", ["a11y", "accessibility"]),
        makeLink("./a11y/banner-1.html", "Banner 1", ["a11y", "accessibility"]),
        makeLink("./a11y/banner-2.html", "Banner 2", ["a11y", "accessibility"]),
        makeLink("./a11y/banner-3.html", "Banner 3", ["a11y", "accessibility"]),
        makeLink("./a11y/banner-4.html", "Banner 4", ["a11y", "accessibility"]),
      ],
    },
    {
      id: "errors",
      title: "Errors in console",
      sectionName: "errors",
      items: [
        makeLink("./restaurant-order.html", "Restaurant Order (API)", ["errors", "api"]),
        makeLink("./loan-processing.html", "Loan Processing (API)", ["errors", "api"]),
      ],
    },
    {
      id: "fileDownload",
      title: "File download",
      sectionName: "File download",
      items: [
        makeLink("./downloads/simple-file-download.html", "Simple File Download", ["download", "files", "api"]),
        makeLink("./downloads/simple-doc-download.html", "Simple Doc File Download", [
          "download",
          "files",
          "api",
          "files (docx xlsx pdf)",
        ]),
        makeLink("./downloads/simple-docx-download.html", "Simple Docx File Download", [
          "download",
          "files",
          "api",
          "files (docx xlsx pdf)",
        ]),
        makeLink("./downloads/custom-file-download.html", "Custom File Download", ["download", "files", "api"]),
      ],
    },
    {
      id: "otherChallenges",
      title: "Other challenges",
      sectionName: "Other challenges",
      items: [
        makeLink("./wheel-of-fortune.html", "Wheel of Fortune", ["game", "canvas"]),
        makeLink("./simple-reservation-v1.html", "Reservation V1", ["simple"]),
        makeLink("./simple-reservation-v2.html", "Reservation V2", ["simple"]),
        makeLink("./complex-hotel-reservation.html", "Hotel Reservation (API)", ["pdf", "advanced", "dynamic", "api"]),
        makeLink("./steps-to-complete-1.html", "Simple game v1", ["simple"]),
        makeLink("./steps-to-complete-2.html", "Simple game v2", ["simple"]),
        makeLink("./simple-reservation-with-errors-v1.html", "Reservation V1 (with errors)", ["simple"]),
        makeLink("./simple-reservation-with-errors-v2.html", "Reservation V2 (with errors)", ["simple"]),
        makeLink("./ems/index.html", "Employee Management System (API)", ["api", "advanced"]),
        makeLink("./code-js.html", "Code JS", ["advanced", "code"]),
        makeLink("./ant-colony.html", "Ant Colony", ["advanced", "simulation"]),
        makeLink("./ant-colony-canvas.html", "Ant Colony (Canvas)", ["advanced", "canvas", "simulation"]),
        makeLink("./lang/index.html", "Language Change V1 (API)", ["advanced", "language", "API"]),
        makeLink("./weatherApp/", "Weather App V1", ["💻 webinar", "Swagger", "API", "session"]),
        makeLink("./weatherAppV2/", "Weather App V2 (different UI)", ["💻 webinar", "Swagger", "API", "session"]),
        makeLink("./testagram/", "Testagram", ["API", "session", "advanced"]),
        makeLink("./chirper/", "Chirper", ["API", "session", "advanced"]),
        makeLink("./gad-drawer.html", "Gad Drawer", ["advanced", "canvas"]),
        // NOTE: Nova Chat and System CMD kept commented out as in original
      ],
    },
  ];
  // Expose globally for the renderer
  window.PRACTICE_SECTIONS = PRACTICE_SECTIONS;
})();
