// Knowledge base for common questions
const knowledgeBase = {
  // Programming concepts
  "what is javascript":
    "JavaScript is a programming language that allows you to implement complex features on web pages. It's an essential part of web applications and most modern browsers support it without the need for plugins.",
  "what is node.js":
    "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine that allows you to run JavaScript on the server side.",
  "what is typescript":
    "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It adds static types to JavaScript, helping catch errors early and making code more robust.",
  "what is python":
    "Python is a high-level, interpreted programming language known for its readability and simple syntax. It's widely used for web development, data analysis, AI, machine learning, automation, and many other applications.",
  "what is java":
    "Java is a class-based, object-oriented programming language designed to have minimal implementation dependencies. It follows the 'write once, run anywhere' principle, allowing code to run on all platforms that support Java.",
  "what is c#":
    "C# (C-Sharp) is a modern, object-oriented programming language developed by Microsoft. It's part of the .NET framework and is widely used for Windows applications, game development with Unity, and enterprise software.",
  "what is react":
    "React is a JavaScript library for building user interfaces, particularly single-page applications. It's maintained by Facebook and focuses on component-based architecture for building reusable UI components.",
  "what is angular":
    "Angular is a platform and framework for building single-page client applications using HTML and TypeScript. It's maintained by Google and offers features like two-way data binding, dependency injection, and modular development.",
  "what is vue":
    "Vue.js is a progressive JavaScript framework used for building user interfaces. It's designed to be incrementally adoptable and focuses on declarative rendering and component composition.",

  // Web development concepts
  "what is api":
    "API (Application Programming Interface) is a set of definitions and protocols for building and integrating application software. It lets your product or service communicate with other products and services without having to know how they're implemented.",
  "what is rest api":
    "REST (Representational State Transfer) API is an architectural style for an API that uses HTTP requests to access and use data. It can use those data to GET, PUT, POST and DELETE data types, which refers to reading, updating, creating and deleting operations.",
  "what is graphql":
    "GraphQL is a query language for APIs and a runtime for executing those queries with your existing data. It allows clients to request exactly the data they need, making it possible to get all required data in a single request.",
  "what is json":
    "JSON (JavaScript Object Notation) is a lightweight data-interchange format. It's easy for humans to read and write and easy for machines to parse and generate.",
  "what is html":
    "HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. It defines the structure and content of web pages.",
  "what is css":
    "CSS (Cascading Style Sheets) is a stylesheet language used to describe the presentation of a document written in HTML. It controls layout, formatting, and the visual appearance of web pages.",
  "what is http":
    "HTTP (Hypertext Transfer Protocol) is the foundation of data communication on the World Wide Web. It's an application layer protocol for distributed, collaborative, hypermedia information systems.",
  "what is https":
    "HTTPS (Hypertext Transfer Protocol Secure) is an extension of HTTP used for secure communication over a computer network. It encrypts the data exchanged between your browser and the website using TLS or SSL.",
  "what is oauth":
    "OAuth is an open standard authorization protocol that allows secure designated access to assets without sharing passwords. It's commonly used for allowing users to grant third-party applications access to their information.",

  // Database concepts
  "what is sql":
    "SQL (Structured Query Language) is a programming language used to manage relational databases. It allows you to create, read, update, and delete data in database systems.",
  "what is mongodb":
    "MongoDB is a source-available cross-platform document-oriented database program. It uses JSON-like documents with optional schemas and is classified as a NoSQL database.",
  "what is nosql":
    "NoSQL (Not only SQL) refers to non-relational database management systems designed for distributed data stores. They can store and process large volumes of unstructured or semi-structured data.",

  // DevOps and tools
  "what is git":
    "Git is a distributed version control system for tracking changes in source code during software development. It's designed for coordinating work among programmers, but can be used to track changes in any set of files.",
  "what is docker":
    "Docker is a platform that uses OS-level virtualization to deliver software in packages called containers. Containers are isolated from one another and bundle their own software, libraries, and configuration files.",
  "what is kubernetes":
    "Kubernetes is an open-source container orchestration system for automating application deployment, scaling, and management. It groups containers into logical units for easy management and discovery.",
  "what is ci/cd":
    "CI/CD (Continuous Integration/Continuous Deployment) is a method to frequently deliver apps to customers by introducing automation into the stages of app development. It builds, tests, and deploys code changes automatically.",

  // AI & ML concepts
  "what is machine learning":
    "Machine Learning is a subset of artificial intelligence that provides systems with the ability to automatically learn and improve from experience without being explicitly programmed.",
  "what is deep learning":
    "Deep Learning is a subset of machine learning based on artificial neural networks with representation learning. It can learn from large amounts of unstructured data and is behind many recent advances in AI.",
  "what is natural language processing":
    "Natural Language Processing (NLP) is a field of AI that gives machines the ability to read, understand, and derive meaning from human language. It's used in applications like chatbots, translation services, and sentiment analysis.",

  // Security concepts
  "what is encryption":
    "Encryption is the process of converting information into a code to prevent unauthorized access. It ensures that only authorized parties can access the information.",
  "what is two-factor authentication":
    "Two-factor authentication (2FA) is a security process requiring users to provide two different authentication factors to verify their identity, making it harder for attackers to gain access to devices or online accounts.",
  "what is xss":
    "Cross-Site Scripting (XSS) is a type of security vulnerability typically found in web applications that allows attackers to inject client-side scripts into web pages viewed by other users.",
  "what is sql injection":
    "SQL Injection is a code injection technique used to attack data-driven applications by inserting malicious SQL statements into entry fields for execution.",

  // About the AI
  "who made you":
    "I'm a simple AI assistant created as part of a demo application. I was built to demonstrate basic AI chat functionality.",
  "what is your name": "I'm GadAI, a simple AI assistant created for the GAD application demo.",
  "what can you do":
    "I can answer questions about programming concepts, help with calculations, remember information about you, play simple games like rock-paper-scissors, tell jokes and facts, and have basic conversations. Try typing 'help' for more information!",
};

// Fun facts to share
const funFacts = [
  "The first computer programmer was a woman named Ada Lovelace, who worked on Charles Babbage's Analytical Engine in the 1840s.",
  "The first computer bug was a literal bug - a moth found trapped in a Harvard Mark II computer in 1947.",
  "The average computer user blinks 7 times a minute, less than half the normal rate of 20.",
  "The world's first website, created by Tim Berners-Lee, went live on August 6, 1991.",
  "The term 'robot' comes from the Czech word 'robota' meaning forced labor.",
  "The first computer mouse was made of wood in 1964 by Doug Engelbart.",
  "About 90% of the world's currency is digital and only exists on computers.",
  "The first 1GB hard drive was announced in 1980, weighed 550 pounds, and cost $40,000.",
  "QWERTY keyboard layout was designed to slow typing and prevent jamming on mechanical typewriters.",
  "The original name for Windows was 'Interface Manager'.",
];

// Collection of jokes
const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs!",
  "Why do Java developers wear glasses? Because they don't C#!",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
  "A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'",
  "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings.",
  "Why did the developer go broke? Because he used up all his cache!",
  "What's a programmer's favorite hangout? The Foo Bar.",
  "What do you call 8 hobbits? A hobbyte!",
  "Why is HTML like a bad criminal? It's always getting caught!",
  "Why was the React component having a bad day? It was suffering from a state of depression!",
  "Why do C# developers never get lost? Because they follow using statements!",
  "Why was the function sad after a party? It didn't get called!",
  "What do you call a programmer who doesn't comment their code? A villain!",
  "What is a programmer's favorite snack? Cookies!",
  "What did the Python say when it was asked its age? I'm version 3.10!",
  "What is a computer's favorite snack? Microchips!",
  "Why did the programmer quit his job? Because he didn't get arrays (a raise)!",
  "Why don't programmers like nature? It has too many bugs!",
];

// Simple dictionary for word definitions
const dictionary = {
  algorithm: "A step-by-step procedure for solving a problem or accomplishing a task.",
  bug: "An error or flaw in a computer program that causes it to produce an incorrect or unexpected result.",
  compiler: "A program that translates source code into an executable form.",
  database: "An organized collection of data stored and accessed electronically.",
  encryption: "The process of converting information into a code to prevent unauthorized access.",
  framework:
    "A platform for developing software applications that provides a foundation on which developers can build programs.",
  git: "A distributed version control system for tracking changes in source code during software development.",
  hash: "A function that maps data of arbitrary size to fixed-size values, typically used for quick data retrieval or verification.",
  interface:
    "A shared boundary across which two or more separate components of a computer system exchange information.",
  javascript: "A high-level, interpreted programming language that conforms to the ECMAScript specification.",
  kernel: "The central component of an operating system that manages operations of the computer and hardware.",
  library: "A collection of pre-written code that can be used to simplify tasks.",
  middleware: "Software that acts as a bridge between an operating system or database and applications.",
  network: "A collection of computers and devices connected together to communicate and share resources.",
  object:
    "A data structure in object-oriented programming that can contain data, in the form of fields, and code, in the form of methods.",
  protocol: "A set of rules governing the exchange or transmission of data between devices.",
  query: "A request for data or information from a database.",
  recursion: "A method where the solution to a problem depends on solutions to smaller instances of the same problem.",
  server:
    "A computer or system that provides resources, data, services, or programs to other computers, known as clients.",
  token: "A sequence of characters that serves as a unit of information in programming or authentication.",
  url: "Uniform Resource Locator, a reference to a web resource that specifies its location on a computer network.",
  variable: "A storage location paired with an associated symbolic name that contains a value.",
  web: "A system of interlinked hypertext documents accessed via the Internet.",
  xml: "Extensible Markup Language, a markup language that defines a set of rules for encoding documents.",
  yaml: "YAML Ain't Markup Language, a human-readable data serialization standard.",
  "zero-day":
    "A previously unknown computer software vulnerability that hackers can exploit to adversely affect programs, data, or a network.",
};

// Unit conversion utilities
const unitConversions = {
  // Length conversions
  "cm to inches": (value) => `${value} centimeters = ${(value * 0.393701).toFixed(2)} inches`,
  "inches to cm": (value) => `${value} inches = ${(value * 2.54).toFixed(2)} centimeters`,
  "m to feet": (value) => `${value} meters = ${(value * 3.28084).toFixed(2)} feet`,
  "feet to m": (value) => `${value} feet = ${(value * 0.3048).toFixed(2)} meters`,
  "km to miles": (value) => `${value} kilometers = ${(value * 0.621371).toFixed(2)} miles`,
  "miles to km": (value) => `${value} miles = ${(value * 1.60934).toFixed(2)} kilometers`,

  // Weight conversions
  "kg to pounds": (value) => `${value} kilograms = ${(value * 2.20462).toFixed(2)} pounds`,
  "pounds to kg": (value) => `${value} pounds = ${(value * 0.453592).toFixed(2)} kilograms`,
  "g to oz": (value) => `${value} grams = ${(value * 0.035274).toFixed(2)} ounces`,
  "oz to g": (value) => `${value} ounces = ${(value * 28.3495).toFixed(2)} grams`,

  // Temperature conversions
  "c to f": (value) => `${value}°C = ${((value * 9) / 5 + 32).toFixed(2)}°F`,
  "f to c": (value) => `${value}°F = ${(((value - 32) * 5) / 9).toFixed(2)}°C`,

  // Digital storage conversions
  "mb to gb": (value) => `${value} MB = ${(value / 1024).toFixed(4)} GB`,
  "gb to mb": (value) => `${value} GB = ${(value * 1024).toFixed(0)} MB`,
  "gb to tb": (value) => `${value} GB = ${(value / 1024).toFixed(4)} TB`,
  "tb to gb": (value) => `${value} TB = ${(value * 1024).toFixed(0)} GB`,

  // Time conversions
  "minutes to seconds": (value) => `${value} minutes = ${(value * 60).toFixed(0)} seconds`,
  "hours to minutes": (value) => `${value} hours = ${(value * 60).toFixed(0)} minutes`,
  "days to hours": (value) => `${value} days = ${(value * 24).toFixed(0)} hours`,
  "weeks to days": (value) => `${value} weeks = ${(value * 7).toFixed(0)} days`,
};

// Simple programming examples to demonstrate concepts
const codeExamples = {
  "javascript function": `// JavaScript function example
function greet(name) {
  return "Hello, " + name + "!";
}

// Usage
const greeting = greet("World");
console.log(greeting); // Output: Hello, World!`,

  "javascript promise": `// JavaScript Promise example
function fetchData() {
  return new Promise((resolve, reject) => {
    // Simulating an API call
    setTimeout(() => {
      const success = true;
      if (success) {
        resolve({ data: "Here is your data" });
      } else {
        reject(new Error("Failed to fetch data"));
      }
    }, 1000);
  });
}

// Usage
fetchData()
  .then(result => console.log(result.data))
  .catch(error => console.error(error));`,

  "javascript array methods": `// JavaScript array methods
const numbers = [1, 2, 3, 4, 5];

// Map - transform each element
const doubled = numbers.map(num => num * 2);
// [2, 4, 6, 8, 10]

// Filter - select elements that pass a condition
const evenNumbers = numbers.filter(num => num % 2 === 0);
// [2, 4]

// Reduce - aggregate all elements into a single value
const sum = numbers.reduce((total, num) => total + num, 0);
// 15`,

  "python function": `# Python function example
def greet(name):
    return f"Hello, {name}!"

# Usage
greeting = greet("World")
print(greeting)  # Output: Hello, World!`,

  "python list comprehension": `# Python list comprehension example
numbers = [1, 2, 3, 4, 5]

# Create a new list with squared values
squares = [num**2 for num in numbers]
# [1, 4, 9, 16, 25]

# Create a filtered list with even numbers only
even_numbers = [num for num in numbers if num % 2 == 0]
# [2, 4]`,

  "html basic structure": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
  </header>
  <main>
    <p>This is a basic HTML page structure.</p>
  </main>
  <footer>
    <p>&copy; 2025 My Website</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`,

  "css flexbox": `.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item {
  flex: 1;
  margin: 10px;
  padding: 20px;
  background-color: #f0f0f0;
}

/* Responsive layout */
@media (max-width: 600px) {
  .container {
    flex-direction: column;
  }
}`,

  "react component": `// React functional component example
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

export default Counter;`,
};

// Command help text
const helpText = `
Here are some things you can ask me:

Basic Commands:
- help: Show this help message
- clear: Clear conversation history
- remember [something]: I'll remember this information about you
- forget [something]: I'll forget this specific information
- forget all: I'll forget all information I know about you

Fun Features:
- tell me a joke: I'll tell you a random joke
- tell me a fact: I'll share an interesting fact
- play rock paper scissors: Let's play a game!
- play number guessing: I'll think of a number, you guess it
- play hangman: A word guessing game
- calculate [expression]: I'll solve simple math expressions

Knowledge and Learning:
- define [word]: Get programming/tech word definitions
- convert [value] [unit] to [unit]: Convert between units
- show example [topic]: See code examples (javascript, python, etc.)
- explain [programming concept]: Get simple explanations
- what is [technology/term]: Get info about programming concepts

Questions:
- You can ask me about JavaScript, Node.js, APIs, or other programming topics
- You can ask me about the time, date, or day of the week
- You can ask questions about my identity or capabilities

I'm always learning! Feel free to chat with me about anything.
`;

// Emotion/sentiment detection patterns
const sentimentPatterns = [
  {
    pattern: /(?:^|\s)(love|great|excellent|amazing|awesome|fantastic|wonderful|happy|excited|thankyou|thanks)/i,
    sentiment: "positive",
  },
  { pattern: /(?:^|\s)(good|nice|cool|helpful|interesting|neat|okay|ok)/i, sentiment: "neutral-positive" },
  { pattern: /(?:^|\s)(confused|unsure|unclear|not sure|don't understand|dont understand)/i, sentiment: "confused" },
  { pattern: /(?:^|\s)(bad|terrible|awful|horrible|hate|dislike|stupid|useless|broken|sucks)/i, sentiment: "negative" },
  { pattern: /(?:^|\s)(wtf|fuck|shit|damn|crap|idiot|moron|ass)/i, sentiment: "very-negative" },
];

module.exports = {
  knowledgeBase,
  funFacts,
  jokes,
  dictionary,
  unitConversions,
  codeExamples,
  sentimentPatterns,
  helpText,
};
