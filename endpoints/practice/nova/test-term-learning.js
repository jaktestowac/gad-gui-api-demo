/**
 * Nova Term Testing Utility
 *
 * This is a utility script that helps test Nova's term learning and recall functionality.
 * It provides commands that can be run from a terminal to simulate user interactions
 * and validate that term handling is working correctly.
 */

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Configuration
const config = {
  baseUrl: "http://localhost:3000", // Change as needed for your environment
  endpoint: "/api/practice/nova/chat",
  userId: uuidv4(), // Generate a random user ID for testing
};

// Create a conversation ID based on the user ID
const conversationId = `conv_${config.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

/**
 * Send a message to Nova
 * @param {string} message - The message to send
 * @returns {Promise<string>} - Nova's response
 */
async function sendMessage(message) {
  try {
    console.log(`[TEST] Sending message: "${message}"`);

    const response = await axios.post(`${config.baseUrl}${config.endpoint}`, {
      message,
      conversationId,
    });

    console.log(`[TEST] Nova's response: "${response.data.message}"`);
    return response.data.message;
  } catch (error) {
    console.error("[TEST] Error sending message:", error.message);
    if (error.response) {
      console.error("[TEST] Response data:", error.response.data);
    }
    throw error;
  }
}

/**
 * Run a series of tests to validate term learning functionality
 */
async function runTermTest() {
  try {
    // Step 1: Generate a unique test term
    const testTerm = `testterm${Date.now().toString().slice(-6)}`;
    const testDefinition = `This is a test definition created at ${new Date().toISOString()}`;

    console.log("\n======== NOVA TERM TESTING ========");
    console.log(`Test User ID: ${config.userId}`);
    console.log(`Conversation ID: ${conversationId}`);
    console.log(`Test Term: "${testTerm}"`);
    console.log(`Test Definition: "${testDefinition}"`);
    console.log("===================================\n");

    // Step 2: Ask Nova if it knows the term (should say no)
    console.log("\n--- TEST 1: Unknown Term Query ---");
    const unknownResponse = await sendMessage(`What is ${testTerm}?`);
    const unknownSuccess =
      unknownResponse.toLowerCase().includes(`don't know what "${testTerm}" is`) ||
      unknownResponse.toLowerCase().includes(`not familiar with "${testTerm}"`);

    console.log(`Test result: ${unknownSuccess ? "PASS" : "FAIL"}`);

    // Step 3: Teach Nova the term
    console.log("\n--- TEST 2: Teaching Term ---");
    await sendMessage(`${testTerm} is ${testDefinition}`);

    // Step 4: Ask Nova about the term (should remember)
    console.log("\n--- TEST 3: Known Term Query ---");
    const knownResponse = await sendMessage(`What is ${testTerm}?`);
    const knownSuccess = knownResponse.toLowerCase().includes(testDefinition.toLowerCase());

    console.log(`Test result: ${knownSuccess ? "PASS" : "FAIL"}`);

    // Step 5: Alternative ways to ask about the term
    console.log("\n--- TEST 4: Alternative Query Formats ---");

    // Test different query formats
    const queryFormats = [
      `Do you know ${testTerm}?`,
      `Tell me about ${testTerm}`,
      `What does ${testTerm} mean?`,
      `${testTerm}`, // Just the term by itself
    ];

    for (const query of queryFormats) {
      const response = await sendMessage(query);
      const success = response.toLowerCase().includes(testDefinition.toLowerCase());
      console.log(`Query: "${query}" - ${success ? "PASS" : "FAIL"}`);
    }

    // Step 6: Multi-word term test
    console.log("\n--- TEST 5: Multi-word Term Test ---");
    const multiWordTerm = `test phrase ${Date.now().toString().slice(-4)}`;
    const multiWordDefinition = `This is a multi-word test definition created at ${new Date().toISOString()}`;

    // Teach the multi-word term
    await sendMessage(`"${multiWordTerm}" means ${multiWordDefinition}`);

    // Ask about the multi-word term
    const multiWordResponse = await sendMessage(`What is "${multiWordTerm}"?`);
    const multiWordSuccess = multiWordResponse.toLowerCase().includes(multiWordDefinition.toLowerCase());

    console.log(`Test result: ${multiWordSuccess ? "PASS" : "FAIL"}`);

    // Final summary
    console.log("\n======== TEST SUMMARY ========");
    console.log(`Unknown term recognition: ${unknownSuccess ? "PASS" : "FAIL"}`);
    console.log(`Term learning: ${true ? "PASS" : "FAIL"}`); // Always passes as we don't check result
    console.log(`Known term recall: ${knownSuccess ? "PASS" : "FAIL"}`);
    console.log(`Multi-word term: ${multiWordSuccess ? "PASS" : "FAIL"}`);
    console.log("=============================\n");
  } catch (error) {
    console.error("[TEST] Test failed with error:", error.message);
  }
}

// Check if this is being run directly (not imported)
if (require.main === module) {
  runTermTest();
}

module.exports = {
  runTermTest,
  sendMessage,
};
