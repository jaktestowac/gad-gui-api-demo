const { logDebug } = require("../../helpers/logger-api");

const RESTRICTED_USERNAMES = ["system", "admin", "root", "owner", "moderator", "bot"];

class CodeEditorContext {
  constructor(wss) {
    this.wss = wss;
    this.connectedUsers = {};
    this.currentCode = "";
    this.codeOutput = "";

    this.predefinedNewWorkspace = `// Welcome to the JavaScript Code Editor!
// This is a new workspace for you to experiment with code
// You can run the code by clicking the "Run" button 
// or by pressing Ctrl+Enter or Cmd+Enter

// Try some examples:
console.log("Hello World from 🦎GAD!");
`;

    this.predefinedWorkspaces = {
      Tutorial: {
        code: `// Welcome to the JavaScript Code Editor!
// Here are some examples to get you started:

// 1. Basic console output
console.log("Hello World!");

// 2. Working with variables
let name = "Coder";
console.log(\`Welcome, \${name}!\`);

// 3. Arrays and loops
const numbers = [1, 2, 3, 4, 5];
numbers.forEach(n => console.log(n * 2));

// 4. Objects
const person = {
  name: "John",
  age: 30,
  greet() {
    console.log(\`Hi, I'm \${this.name}\`);
  }
};

person.greet();

// Try running this code with Ctrl+Enter or Cmd+Enter!`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      Playground: {
        code: `// JavaScript Playground
// Try these cool examples!

// 1. Generate random colors
function randomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

console.log("Random color:", randomColor());

// 2. Fun with arrays
const fruits = ['apple', 'banana', 'orange'];
console.log("Original:", fruits);
console.log("Reversed:", [...fruits].reverse());

// 3. Time functions
console.log("Current time:", new Date().toLocaleTimeString());

// 4. Math experiments
console.log("Pi:", Math.PI);
console.log("Random number (1-100):", Math.floor(Math.random() * 100) + 1);

// Edit this code and have fun experimenting!`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      ArrayMethods: {
        code: `// JavaScript Array Methods Tutorial
const numbers = [1, 2, 3, 4, 5];

// Map - Transform each element
console.log('Map:', numbers.map(n => n * 2));

// Filter - Keep elements that pass a test
console.log('Filter:', numbers.filter(n => n > 2));

// Reduce - Accumulate values
console.log('Reduce:', numbers.reduce((sum, n) => sum + n, 0));

// Find - Get first element that matches
console.log('Find:', numbers.find(n => n > 3));

// Some/Every - Test conditions
console.log('Some > 4:', numbers.some(n => n > 4));
console.log('Every > 0:', numbers.every(n => n > 0));

// Practice: Create a chain of array methods
const result = numbers
  .map(n => n * 2)
  .filter(n => n > 5)
  .reduce((sum, n) => sum + n, 0);

console.log('Chained result:', result);`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      Algorithms: {
        code: `// Common Algorithms Examples
// Bubble Sort
function bubbleSort(arr) {
    const array = [...arr];
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length - 1; j++) {
            if (array[j] > array[j + 1]) {
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
            }
        }
    }
    return array;
}

// Binary Search
function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

// Test the algorithms
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log('Original array:', numbers);
console.log('Sorted array:', bubbleSort(numbers));
console.log('Binary search for 22:', binarySearch(bubbleSort(numbers), 22));`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      DOM: {
        code: `// DOM Manipulation Examples
// Note: These examples are for learning purposes
// They won't affect the actual page

// Creating elements
const div = document.createElement('div');
div.textContent = 'Hello DOM!';
div.className = 'my-div';
console.log('Created element:', div.outerHTML);

// Event handling
div.addEventListener('click', () => {
    console.log('Div clicked!');
});

// Working with attributes
div.setAttribute('data-test', 'value');
console.log('Has attribute:', div.hasAttribute('data-test'));
console.log('Get attribute:', div.getAttribute('data-test'));

// Styles
div.style.color = 'blue';
div.style.backgroundColor = '#f0f0f0';
console.log('Element with styles:', div.outerHTML);

// Classes
div.classList.add('active');
div.classList.remove('inactive');
div.classList.toggle('visible');
console.log('Classes:', div.className);`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      AsyncJS: {
        code: `// Asynchronous JavaScript Examples
// Promises
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Async/Await
async function demo() {
    console.log('Starting...');
    
    try {
        await delay(1000);
        console.log('After 1 second');
        
        await delay(1000);
        console.log('After 2 seconds');
        
        throw new Error('Example error');
    } catch (error) {
        console.log('Caught error:', error.message);
    }
    
    return 'Demo completed';
}

// Promise methods
Promise.all([
    delay(500).then(() => 'First'),
    delay(200).then(() => 'Second'),
    delay(300).then(() => 'Third')
])
.then(results => console.log('All completed:', results));

// Run the demo
demo().then(result => console.log(result));`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      ES6Features: {
        code: `// Modern JavaScript Features
// Destructuring
const person = { name: 'John', age: 30, city: 'New York' };
const { name, age } = person;
console.log('Destructured:', name, age);

// Spread operator
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];
console.log('Spread array:', arr2);

// Template literals
const greeting = \`Hello \${name}!
You are \${age} years old.\`;
console.log('Template:', greeting);

// Arrow functions
const double = x => x * 2;
const sum = (a, b) => a + b;
console.log('Arrow functions:', double(5), sum(2, 3));

// Object shorthand
const x = 10, y = 20;
const point = { x, y };
console.log('Object shorthand:', point);

// Optional chaining
const data = { user: { address: null } };
console.log('Optional chain:', data?.user?.address?.street);`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      ES20Features: {
        code: `// ES2020 JavaScript Features

// Nullish coalescing operator
const value = null;
const result = value ?? 'default';
console.log('Nullish coalescing:', result);

// Optional catch binding
try {
    throw new Error('Example error');
} catch {
    console.log('Caught error');
}

// Optional Chaining Operator (?.)
const data = { user: { address: null } };
console.log('Optional chain:', data?.user?.address?.street);

// Logical AND Assignment Operator (&&=)
let count = 0;
count &&= 5;
console.log('Logical AND assignment:', count);

// Logical OR Assignment (||=)
let name = 'John';
name ||= 'Guest';
console.log('Logical OR assignment:', name);

// Nullish Coalescing Assignment (??=)
let value2 = null;
value2 ??= 'default';
console.log('Nullish coalescing assignment:', value2);
`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      ES22Features: {
        code: `// ES22 JavaScript Features

// Private fields
class Person {
  name = 'John Doe'; // Public field
  #age = 30; // Private field

  getAge() {
    return this.#age;
  }
}

const person = new Person();
console.log(person.name); // John Doe
console.log(person.getAge()); // 30
// console.log(person.#age); // Error: Private field

// Array at() method
const arr = [10, 20, 30, 40];

console.log(arr.at(1)); // 20
console.log(arr.at(-1)); // 40
`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      ErrorHandling: {
        code: `// Error Handling in JavaScript
// Different types of errors and how to handle them

try {
  // Type Error
  const num = 42;
  num.toLowerCase();
} catch (e) {
  console.log('Type Error:', e.message);
}

// Custom Error class
class ValidationError extends Error {
  constructor(message) {
  super(message);
    this.name = 'ValidationError';
  }
}

// Using custom error
try {
  throw new ValidationError('Invalid input!');
} catch (e) {
  console.log(\`\${e.name}: \${e.message}\`);
}

// Finally block
try {
  console.log('Try block');
  throw new Error('Test error');
} catch (e) {
  console.log('Catch block:', e.message);
} finally {
  console.log('Finally block always executes');
}
`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      RegexPatterns: {
        code: `// Regular Expressions in JavaScript
// Common regex patterns and usage

// Email validation
const emailRegex = /^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)*\\.[a-zA-Z]{2,}$/;
console.log('Valid email:', emailRegex.test('user@example.com'));
console.log('Invalid email:', emailRegex.test('invalid.email@com'));

// Phone number format (US)
const phoneRegex = /^\\(\\d{3}\\) \\d{3}-\\d{4}$/;
console.log('Valid phone:', phoneRegex.test('(123) 456-7890'));
console.log('Invalid phone:', phoneRegex.test('123-456-7890'));

// Password strength
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;
console.log('Strong password:', passwordRegex.test('Test@1234'));
console.log('Weak password:', passwordRegex.test('password123'));

// String replacement
const text = 'Hello World! Hello JavaScript!';
console.log('Replace first:', text.replace(/Hello/, 'Hi'));
console.log('Replace all:', text.replace(/Hello/g, 'Hi'));`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
      DataStructures: {
        code: `// Common Data Structures in JavaScript
// Implementation examples

// Stack implementation
class Stack {
  #items = [];
  
  push(element) {
    this.#items.push(element);
  }
  
  pop() {
    return this.#items.pop();
  }
  
  peek() {
    return this.#items[this.#items.length - 1];
  }
  
  isEmpty() {
    return this.#items.length === 0;
  }
}

// Queue implementation
class Queue {
  #items = [];
  
  enqueue(element) {
    this.#items.push(element);
  }
  
  dequeue() {
    return this.#items.shift();
  }
  
  front() {
    return this.#items[0];
  }
  
  isEmpty() {
    return this.#items.length === 0;
  }
}

// Usage examples
const stack = new Stack();
stack.push(1);
stack.push(2);
console.log('Stack peek:', stack.peek());
console.log('Stack pop:', stack.pop());

const queue = new Queue();
queue.enqueue('a');
queue.enqueue('b');
console.log('Queue front:', queue.front());
console.log('Queue dequeue:', queue.dequeue());
`,
        output: "",
        password: "",
        users: [],
        owner: "system",
      },
    };

    this.templatesDescription = [
      {
        id: "Tutorial",
        name: "Tutorial",
        description: "Learn JavaScript basics with interactive examples",
        icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
        tags: ["beginner", "tutorial"],
      },
      {
        id: "Playground",
        name: "Code Playground",
        description: "Experiment with code in a sandbox environment",
        icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
        tags: ["sandbox", "tutorial", "playground"],
      },
      {
        id: "ArrayMethods",
        name: "Array Methods",
        description: "Learn and practice JavaScript array methods",
        icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>',
        tags: ["arrays", "methods", "tutorial"],
      },
      {
        id: "Algorithms",
        name: "Algorithms",
        description: "Common algorithm implementations in JavaScript",
        icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
        tags: ["algorithms", "advanced"],
      },
      {
        id: "DOM",
        name: "DOM Manipulation",
        description: "Examples of working with the Document Object Model",
        icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
        tags: ["DOM", "web", "tutorial"],
      },
      {
        id: "AsyncJS",
        name: "Async JavaScript",
        description: "Learn about Promises and async/await",
        icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        tags: ["async", "promises", "advanced", "tutorial"],
      },
      {
        id: "ES6Features",
        name: "ES6+ Features",
        description: "JavaScript features and syntax",
        icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        tags: ["ES6", "features"],
      },
      {
        id: "ES20Features",
        name: "ES20+ Features",
        description: "JavaScript features and syntax",
        icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        tags: ["ES20", "features"],
      },
      {
        id: "ES22Features",
        name: "ES22+ Features",
        description: "JavaScript features and syntax",
        icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        tags: ["ES22", "features"],
      },
      {
        id: "ErrorHandling",
        name: "Error Handling",
        description: "Handling errors and exceptions in JavaScript",
        icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 16 14"/>',
        tags: ["errors", "exceptions"],
      },
      {
        id: "RegexPatterns",
        name: "Regex Patterns",
        description: "Common regular expressions and patterns",
        icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
        tags: ["regex", "patterns"],
      },
      {
        id: "DataStructures",
        name: "Data Structures",
        description: "Implementations of common data structures",
        icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        tags: ["data", "structures"],
      },
    ];

    this.workspaces = JSON.parse(JSON.stringify(this.predefinedWorkspaces));
    this.workspaceSettings = {};
  }

  workspaceExists(workspaceId) {
    return this.workspaces[workspaceId] !== undefined;
  }

  getPredefinedWorkspaceDescription() {
    return this.templatesDescription;
  }

  getWorkspace(workspaceId, createIfNotExists = true) {
    if (!this.workspaces[workspaceId] && createIfNotExists) {
      this.workspaces[workspaceId] = {
        code: this.predefinedNewWorkspace,
        output: "",
        password: "",
        users: [],
        owner: null,
        hidden: false,
      };
    }
    return this.workspaces[workspaceId];
  }

  getWorkspaceSettings(workspaceId) {
    if (!this.workspaceSettings[workspaceId]) {
      this.workspaceSettings[workspaceId] = {
        readonly: false,
        clearDisabled: false,
        runDisabled: false,
      };
    }
    return this.workspaceSettings[workspaceId];
  }

  isWorkspaceOwner(workspaceId, userId) {
    const workspace = this.getWorkspace(workspaceId);
    return workspace.owner === userId;
  }

  broadcast(message, excludeWs = null) {
    this.wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }

  broadcastToWorkspace(workspaceId, message, excludeWs = null) {
    const workspace = this.getWorkspace(workspaceId);

    if (message.type === "codeEditorUserList") {
      message.data.users = workspace.users
        .map((id) => ({
          username: this.connectedUsers[id]?.username,
          isOwner: workspace.owner === id,
        }))
        .filter((u) => u.username);
    }
    workspace.users.forEach((userId) => {
      const client = this.connectedUsers[userId];
      if (client && client !== excludeWs && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  }

  removeUserFromWorkspace(userId) {
    const user = this.connectedUsers[userId];
    if (user && user.workspace) {
      const workspace = this.getWorkspace(user.workspace);
      workspace.users = workspace.users.filter((id) => id !== userId);

      this.broadcastToWorkspace(user.workspace, {
        type: "codeEditorUserList",
        data: {
          users: workspace.users.map((id) => this.connectedUsers[id]?.username).filter(Boolean),
        },
      });
    }
    delete this.connectedUsers[userId];
  }

  isUsernameAvailable(username, workspaceId) {
    const workspace = this.getWorkspace(workspaceId);
    const existingUsers = workspace.users.map((id) => this.connectedUsers[id]?.username).filter(Boolean);

    return !existingUsers.includes(username);
  }

  validateUsername(username) {
    if (RESTRICTED_USERNAMES.includes(username.toLowerCase())) {
      return { valid: false, message: "This username is restricted" };
    }
    return { valid: true };
  }

  getWorkspaceStatus(workspaceId) {
    const workspace = this.workspaces[workspaceId];
    if (!workspace) return null;

    return {
      name: workspaceId,
      isPrivate: Boolean(workspace.password),
      userCount: workspace.users?.length || 0,
      isTemplate: Boolean(this.predefinedWorkspaces[workspaceId]),
      hidden: Boolean(workspace.hidden),
    };
  }

  getActiveWorkspaces() {
    return Object.keys(this.workspaces).reduce((acc, workspaceId) => {
      const workspace = this.workspaces[workspaceId];
      if (!workspace.hidden) {
        acc[workspaceId] = this.getWorkspaceStatus(workspaceId);
      }
      return acc;
    }, {});
  }
}

const codeEditorHandlers = {
  codeEditorJoin: (context, ws, data) => {
    const { username, workspace, password, isNewWorkspace, hidden } = data.data;

    const usernameValidation = context.validateUsername(username);
    if (!usernameValidation.valid) {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: usernameValidation.message },
        })
      );
      return;
    }

    const workspaceExists = context.workspaceExists(workspace);

    if (!workspaceExists && !isNewWorkspace) {
      logDebug(`Workspace not found:`, { workspace });
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Workspace not found" },
        })
      );
      return;
    }

    if (workspaceExists && isNewWorkspace) {
      logDebug(`Workspace already exists:`, { workspace });
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Workspace already exists" },
        })
      );
      return;
    }

    if (!context.isUsernameAvailable(username, workspace)) {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Username already taken in this workspace" },
        })
      );
      return;
    }

    const workspaceData = context.getWorkspace(workspace, isNewWorkspace);

    if (workspaceExists && workspaceData.password && workspaceData.password !== password) {
      logDebug(`Invalid workspace password:`, { workspace });
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Invalid workspace password" },
        })
      );
      return;
    }

    if (!workspaceExists && isNewWorkspace) {
      logDebug(`User ${username} created workspace ${workspace}`);
      workspaceData.password = password || "";
      workspaceData.owner = ws.userId;
      workspaceData.hidden = hidden || false; // Set hidden status
    } else if (workspaceExists && !workspaceData.owner) {
      workspaceData.owner = ws.userId;
    }

    logDebug(`User joined workspace`, { username, workspace });

    context.connectedUsers[ws.userId] = ws;
    workspaceData.users.push(ws.userId);
    ws.workspace = workspace;
    ws.username = username;

    ws.send(
      JSON.stringify({
        type: "codeEditorUpdate",
        data: {
          code: workspaceData.code,
          output: workspaceData.output,
          isOwner: workspaceData.owner === ws.userId,
        },
      })
    );

    ws.send(
      JSON.stringify({
        type: "codeEditorSettingsUpdate",
        data: { settings: context.getWorkspaceSettings(workspace) },
      })
    );

    context.broadcastToWorkspace(workspace, {
      type: "codeEditorUserList",
      data: { users: [] },
    });
  },

  codeEditorGetPredefinedWorkspace: (context, ws, data) => {
    const { workspace } = data.data;
    const template = context.predefinedWorkspaces[workspace];
    const workspaceData = context.getWorkspace(workspace);

    if (template && workspaceData) {
      workspaceData.code = template.code;
    } else {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Predefined workspace not found" },
        })
      );
    }

    if (template) {
      ws.send(
        JSON.stringify({
          type: "codeEditorUpdate",
          data: {
            code: template.code,
            output: "",
            isTemplate: true,
          },
        })
      );
    } else {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Predefined workspace not found" },
        })
      );
    }
  },

  codeEditorUpdate: (context, ws, data) => {
    if (data.data?.code !== undefined && ws.workspace) {
      if (data.data.code.length > 65536) {
        ws.send(
          JSON.stringify({
            type: "codeEditorError",
            data: { message: "Code exceeds maximum length of 65536 characters" },
          })
        );
        return;
      }

      const workspace = context.getWorkspace(ws.workspace);

      workspace.code = data.data.code;
      context.broadcastToWorkspace(
        ws.workspace,
        {
          type: "codeEditorUpdate",
          data: { code: workspace.code },
        },
        ws
      );
    }
  },

  codeEditorRun: (context, ws, data) => {
    if (data.data?.code !== undefined && ws.workspace) {
      const workspace = context.getWorkspace(ws.workspace);
      workspace.code = data.data.code;
      workspace.output = data.data.output || "";

      context.broadcastToWorkspace(ws.workspace, {
        type: "codeEditorRun",
        data: {
          code: workspace.code,
          output: workspace.output,
          triggeredBy: ws.username,
        },
      });
    }
  },

  codeEditorUpdateSettings: (context, ws, data) => {
    if (!ws.workspace || !ws.userId) return;

    const workspace = context.getWorkspace(ws.workspace);
    if (workspace.owner !== ws.userId) {
      ws.send(
        JSON.stringify({
          type: "codeEditorError",
          data: { message: "Only workspace owner can change settings" },
        })
      );
      return;
    }

    const settings = data.data?.settings;
    if (!settings) return;

    context.workspaceSettings[ws.workspace] = {
      readonly: Boolean(settings.readonly),
      clearDisabled: Boolean(settings.clearDisabled),
      runDisabled: Boolean(settings.runDisabled),
    };

    context.broadcastToWorkspace(ws.workspace, {
      type: "codeEditorSettingsUpdate",
      data: { settings: context.getWorkspaceSettings(ws.workspace) },
    });
  },

  codeEditorDisconnect: (context, ws) => {
    if (ws.userId) {
      context.removeUserFromWorkspace(ws.userId);
    }
  },

  codeEditorPurge: (context, ws) => {
    if (ws.userId) {
      const user = context.connectedUsers[ws.userId];
      const workspace = user?.workspace;
      context.removeUserFromWorkspace(ws.userId);
      if (workspace) {
        const workspaceData = context.getWorkspace(workspace);
        if (workspaceData.users.length === 0) {
          delete context.workspaces[workspace];
          delete context.workspaceSettings[workspace];
        }
      }
    }
  },

  codeEditorGetActiveWorkspaces: (context, ws) => {
    const workspaces = context.getActiveWorkspaces();
    ws.send(
      JSON.stringify({
        type: "activeWorkspaces",
        data: { workspaces },
      })
    );
  },

  codeEditorGetPredefinedWorkspaceDescription: (context, ws) => {
    const templates = context.getPredefinedWorkspaceDescription();
    ws.send(
      JSON.stringify({
        type: "predefinedWorkspaceDescription",
        data: { templates },
      })
    );
  },
};

module.exports = { CodeEditorContext, codeEditorHandlers };
