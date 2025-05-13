/**
 * Test script for the text normalization functions
 *
 * This script tests the text normalization features that remove apostrophes
 * to improve matching with user messages where punctuation is often omitted.
 */

// Import the text processing utilities
const textProcessingUtils = require("./text-processing");
const MessageContext = require("./behaviors/message-context");

// Sample messages to test - with and without apostrophes
const testMessages = [
  "What's your name?",
  "Whats your name?",
  "What is your name?",
  "How's it going?",
  "Hows it going?",
  "How is it going?",
  "I don't know what to say",
  "I dont know what to say",
  "What's today's date?",
  "Whats todays date?",
];

console.log("--- TEXT NORMALIZATION TESTS ---");
console.log("Testing apostrophe removal and normalization\n");

// Test the removeApostrophes function
console.log("1. Testing removeApostrophes function:");
testMessages.forEach((msg) => {
  const normalized = textProcessingUtils.removeApostrophes(msg);
  console.log(`Original: "${msg}"`);
  console.log(`Normalized: "${normalized}"`);
  console.log();
});

// Test the normalizeText function
console.log("2. Testing normalizeText function:");
testMessages.forEach((msg) => {
  const normalized = textProcessingUtils.normalizeText(msg);
  console.log(`Original: "${msg}"`);
  console.log(`Normalized: "${normalized}"`);
  console.log();
});

// Test MessageContext preparation with a context
console.log("3. Testing MessageContext.prepareMessage:");
const context = new MessageContext("test-user", "test-convo");
console.log("Creating context for message: What's your name?");
context.prepareMessage("What's your name?", textProcessingUtils);
console.log(`LowerCaseMessage: "${context.lowerCaseMessage}"`);
console.log(`Command: "${context.normalizedCommand}"`);
console.log("\nCreating context for message: Whats your name?");
const context2 = new MessageContext("test-user", "test-convo");
context2.prepareMessage("Whats your name?", textProcessingUtils);
console.log(`LowerCaseMessage: "${context2.lowerCaseMessage}"`);
console.log(`Command: "${context2.normalizedCommand}"`);

console.log("\n--- TEST COMPLETED ---");
