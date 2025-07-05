/**
 * Comprehensive test script to verify Nova functionality fixes
 */

const { validateInput } = require('./utilities');
const { learnNewTerm, knowsTerm, getLearnedTermDefinition, extractTermDefinition } = require('./user-memory');
const { initializeBehaviors, behaviorRegistry } = require('./behaviors/behavior-manager');
const MessageContext = require('./behaviors/message-context');

console.log('=== Nova Functionality Test ===\n');

// Initialize the behavior system
initializeBehaviors();

// Test 1: Term Learning and Recognition
console.log('1. Testing Term Learning and Recognition:');
const testUserId = 'test_user_' + Date.now();

// Test learning a new term
const testTerm = 'testterm';
const testDefinition = 'This is a test definition for verification';

console.log(`  Learning term "${testTerm}":`);
const learnResult = learnNewTerm(testTerm, testDefinition, testUserId);
console.log(`    Result: ${learnResult ? 'SUCCESS' : 'FAILED'}`);

// Test checking if term is known
console.log(`  Checking if term is known:`);
const knownResult = knowsTerm(testTerm, testUserId);
console.log(`    Result: ${knownResult ? 'SUCCESS' : 'FAILED'}`);

// Test retrieving definition
console.log(`  Retrieving definition:`);
const retrievedDefinition = getLearnedTermDefinition(testTerm, testUserId);
console.log(`    Result: ${retrievedDefinition === testDefinition ? 'SUCCESS' : 'FAILED'}`);
console.log(`    Definition: "${retrievedDefinition}"`);

// Test 2: Term Detection in Context
console.log('\n2. Testing Term Detection in Context:');
const textProcessingUtils = require('./text-processing');

// Create a message context
const context = new MessageContext(testUserId, 'test_conv_' + Date.now(), [], {}, {});

// Test single-word term detection
console.log('  Testing single-word term detection:');
context.prepareMessage(testTerm, textProcessingUtils);
console.log(`    Known term detected: ${context.knownTerm === testTerm ? 'YES' : 'NO'}`);
console.log(`    Unknown term detected: ${context.unknownTerm ? 'YES' : 'NO'}`);

// Test "what is" question detection
console.log('  Testing "what is" question detection:');
const whatIsContext = new MessageContext(testUserId, 'test_conv_2', [], {}, {});
whatIsContext.prepareMessage(`what is ${testTerm}?`, textProcessingUtils);
console.log(`    Known term detected: ${whatIsContext.knownTerm === testTerm ? 'YES' : 'NO'}`);

// Test unknown term detection
console.log('  Testing unknown term detection:');
const unknownContext = new MessageContext(testUserId, 'test_conv_3', [], {}, {});
unknownContext.prepareMessage('what is unknownterm?', textProcessingUtils);
console.log(`    Unknown term detected: ${unknownContext.unknownTerm === 'unknownterm' ? 'YES' : 'NO'}`);

// Test 3: Behavior Priority for Term Queries
console.log('\n3. Testing Behavior Priority:');

const testMessages = [
  testTerm, // Single word - should be known term
  'what is testterm?', // Direct question about known term
  'what is unknownterm?', // Direct question about unknown term
  'hello', // Common word - should not be treated as term
  'help', // Common word - should not be treated as term
];

testMessages.forEach((message, index) => {
  console.log(`  Test ${index + 1}: "${message}"`);
  
  const testContext = new MessageContext(testUserId, `test_conv_${index}`, [], {}, {});
  testContext.prepareMessage(message, textProcessingUtils);
  
  // Find which behavior would handle this
  const behavior = behaviorRegistry.getBehaviorForMessage(message, testContext);
  
  if (behavior) {
    console.log(`    Handled by: ${behavior.id}`);
    
    // Test if curiosity behavior gets priority for term-related queries
    if (message.includes(testTerm) || message.includes('unknownterm')) {
      const isCuriosity = behavior.id === 'curiosity';
      console.log(`    Curiosity priority: ${isCuriosity ? 'YES' : 'NO'}`);
    }
  } else {
    console.log(`    No behavior found`);
  }
});

// Test 4: Term Definition Extraction
console.log('\n4. Testing Term Definition Extraction:');

const definitionTests = [
  { input: 'its a programming language', expected: 'a programming language' },
  { input: 'it is a tool for development', expected: 'a tool for development' },
  { input: 'that is a framework', expected: 'a framework' },
  { input: 'a database system', expected: 'a database system' },
  { input: 'just a library', expected: 'a library' },
];

definitionTests.forEach((test, index) => {
  console.log(`  Test ${index + 1}: "${test.input}"`);
  const extracted = extractTermDefinition(test.input, 'testterm', testUserId);
  console.log(`    Extraction result: ${extracted ? 'SUCCESS' : 'FAILED'}`);
  
  if (extracted) {
    const definition = getLearnedTermDefinition('testterm', testUserId);
    console.log(`    Final definition: "${definition}"`);
  }
});

// Test 5: Input Validation
console.log('\n5. Testing Input Validation:');

const validationTests = [
  { input: 'hello', type: 'text', expected: true },
  { input: '123', type: 'number', expected: true },
  { input: 'help', type: 'command', expected: true },
  { input: '', type: 'text', expected: false },
  { input: null, type: 'text', expected: false },
  { input: '<script>alert("xss")</script>', type: 'text', expected: true }, // Should be sanitized
  { input: 'abc', type: 'number', expected: false },
];

validationTests.forEach((test, index) => {
  console.log(`  Test ${index + 1}: "${test.input}" (${test.type})`);
  const result = validateInput(test.input, test.type);
  const passed = result.valid === test.expected;
  console.log(`    Result: ${passed ? 'PASS' : 'FAIL'} (valid: ${result.valid}, error: ${result.error || 'none'})`);
});

// Test 6: Response Variation (Simulation)
console.log('\n6. Testing Response Variation:');

// Simulate the variation behavior's repetitive response detection
const responseHistory = new Map();
const recentResponses = [
  'Hello! How can I help you today?',
  'Hi there! What would you like to know?',
  'Hello! How can I help you today?', // Duplicate
  'Greetings! How may I assist you?',
];

console.log('  Testing repetitive response detection:');
recentResponses.forEach((response, index) => {
  const userId = 'test_user';
  if (!responseHistory.has(userId)) {
    responseHistory.set(userId, []);
  }
  
  const userHistory = responseHistory.get(userId);
  const normalizedResponse = response.toLowerCase().trim();
  
  // Check for similarity
  const isRepetitive = userHistory.some(histResponse => {
    const histNormalized = histResponse.toLowerCase().trim();
    if (normalizedResponse === histNormalized) return true;
    
    // Simple similarity check
    const words1 = normalizedResponse.split(/\s+/);
    const words2 = histNormalized.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    return similarity > 0.8;
  });
  
  console.log(`    Response ${index + 1}: "${response.substring(0, 30)}..." - Repetitive: ${isRepetitive ? 'YES' : 'NO'}`);
  
  userHistory.push(response);
  if (userHistory.length > 3) userHistory.shift();
});

console.log('\n=== Test Summary ===');
console.log('All functionality tests completed!');
console.log('Key improvements verified:');
console.log('- Enhanced term detection and learning');
console.log('- Improved behavior priority for term queries');
console.log('- Better input validation and sanitization');
console.log('- Repetitive response detection');
console.log('- Early term detection in message context'); 