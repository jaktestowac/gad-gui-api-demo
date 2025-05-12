const { dictionary, unitConversions, codeExamples } = require("./nova-base");

/**
 * Simple word definition lookup
 * @param {string} word - Word to define
 * @returns {string} - Definition or not found message
 */
function getDefinition(word) {
  const normalizedWord = word.toLowerCase().trim();
  if (dictionary[normalizedWord]) {
    return `${word}: ${dictionary[normalizedWord]}`;
  }
  return `I don't have a definition for "${word}" in my dictionary.`;
}

/**
 * Convert between units
 * @param {string} query - Conversion query like "5 km to miles"
 * @returns {string} - Conversion result or error message
 */
function convertUnits(query) {
  // Extract the value and units from the query
  const match = query.match(/(\d+\.?\d*)\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)/i);
  if (!match) {
    return "I couldn't understand the conversion format. Please try something like '5 km to miles'.";
  }

  const value = parseFloat(match[1]);
  const fromUnit = match[2].toLowerCase();
  const toUnit = match[3].toLowerCase();

  const conversionKey = `${fromUnit} to ${toUnit}`;

  if (unitConversions[conversionKey]) {
    return unitConversions[conversionKey](value);
  }

  return `Sorry, I don't know how to convert from ${fromUnit} to ${toUnit}.`;
}

/**
 * Get a code example for a given topic
 * @param {string} topic - Programming topic
 * @returns {string} - Code example or not found message
 */
function getCodeExample(topic) {
  const normalizedTopic = topic.toLowerCase().trim();

  // Try to find an exact match first
  for (const [key, example] of Object.entries(codeExamples)) {
    if (key === normalizedTopic) {
      return `Here's an example of ${key}:\n\n\`\`\`\n${example}\n\`\`\``;
    }
  }

  // Then try to find a partial match
  for (const [key, example] of Object.entries(codeExamples)) {
    if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
      return `Here's an example of ${key}:\n\n\`\`\`\n${example}\n\`\`\``;
    }
  }

  // If just a language is specified, show an example from that language
  const languageKeywords = {
    js: "javascript",
    javascript: "javascript",
    py: "python",
    python: "python",
  };

  const language = languageKeywords[normalizedTopic];
  if (language) {
    // Find the first example for this language
    for (const [key, example] of Object.entries(codeExamples)) {
      if (key.startsWith(language)) {
        return `Here's an example of ${key}:\n\n\`\`\`\n${example}\n\`\`\`\n\nYou can also try more specific topics like "${language} function", "${language} arrays", etc.`;
      }
    }
  }

  return `I don't have a code example for "${topic}". Try asking for examples like "javascript function", "python list comprehension", etc.`;
}

/**
 * Calculate result of a simple mathematical expression
 * @param {string} expression - The mathematical expression
 * @returns {string} - Result or error message
 */
function calculateExpression(expression) {
  try {
    // Remove any potential harmful code by only allowing basic math operations
    const sanitizedExpression = expression.replace(/[^0-9+\-*/(). ]/g, "");

    // Evaluate the expression safely
    const result = Function('"use strict";return (' + sanitizedExpression + ")")();

    return `The result of ${expression} is ${result}`;
  } catch (error) {
    return "Sorry, I couldn't calculate that expression. Please check the format and try again.";
  }
}

// Export utility functions
module.exports = {
  getDefinition,
  convertUnits,
  getCodeExample,
  calculateExpression,
};
