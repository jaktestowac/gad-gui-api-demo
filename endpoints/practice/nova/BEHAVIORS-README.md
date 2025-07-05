# Nova Behavior System Documentation

## Overview

The Nova chat system uses a sophisticated behavior-based architecture that allows for easy extension with new behaviors. This modular approach replaces traditional monolithic response generation with a plugin-based system where each type of interaction (commands, games, knowledge base lookups, proactive conversations, etc.) is handled by a specialized module that can be independently registered with the system.

## Core Architecture

### 1. Behavior Registry (`behavior-registry.js`)

The central registry for all behaviors. It provides methods to:

- Register new behaviors
- Find the appropriate behavior for a given message using a sophisticated scoring system
- Process messages through the registered behaviors in priority order
- Support for behavior chaining and composition

### 2. Base Behavior (`base-behavior.js`)

An abstract base class that all behaviors must extend. It defines the interface that all behaviors must implement:

- `canHandle(message, context)`: Determines if the behavior can handle the given message
- `handle(message, context)`: Processes the message and returns a response

### 3. Message Context (`message-context.js`)

A class that provides rich context for message processing, including:

- User ID and conversation ID
- Conversation history with support for multi-turn context
- User memory for persistent information
- Conversation analytics for tracking engagement
- Normalized message, command, and topic detection
- Text normalization (removing apostrophes, case normalization, etc.)
- Support for contextual state tracking

### 4. Behavior Manager (`behavior-manager.js`)

Initializes and orchestrates all behaviors, including:

- Loading and registering all behavior implementations
- Managing behavior dependencies
- Configuring behavior priorities
- Initializing the text processing utilities

### 5. Response Scoring System (`_calculateResponseScore.js`)

A sophisticated system for determining which behavior should handle a message:

- Base score derived from behavior priority values
- Context-aware scoring adjustments based on conversational state
- Special boost for proactive behaviors in certain contexts
- Category-specific scoring for targeted responses
- Support for behavior specialization in specific domains

## Core Behavior Types

### 1. Command Behavior (`command-behavior.js`)

Handles explicit commands with the highest priority (1000):

- `help` - Provides information about available commands
- `topics` - Shows all topics Nova can discuss
- `remember <information>` - Stores user-provided information
- `forget <information>` - Removes previously stored information
- `tell me a joke` - Delivers a random joke
- `tell me a fact` - Shares an interesting fact
- `what do you know about me` - Recalls stored user information

### 2. Game Behavior (`game-behavior.js`)

Manages interactive games with high priority (900):

- Rock Paper Scissors - Turn-based game with win/loss tracking
- Number Guessing - Adaptive difficulty with hints
- Hangman - Word guessing with configurable word lists

The behavior includes game state management, persistence across conversations, and adaptive difficulty.

### 3. Utility Behavior (`utility-behavior.js`)

Handles practical utility functions with high priority (800):

- Calculations - Evaluates mathematical expressions
- Unit conversions - Converts between different measurement units
- Dictionary lookups - Provides definitions for words
- Code examples - Displays example code snippets for various programming concepts

### 4. Knowledge Base Behavior (`knowledge-base-behavior.js`)

Manages knowledge retrieval with high-medium priority (750):

- Direct question answering from a structured knowledge base
- Partial matching for imprecise questions
- Levenshtein distance calculation for fuzzy matching
- Support for follow-up questions about related topics

### 5. Contextual Memory Behavior (`contextual-memory-behavior.js`)

Creates continuity across conversations with medium priority (600):

- Recalls previous conversations and relates them to current context
- References past user statements when relevant
- Maintains a memory of user preferences and conversation history
- Enables more natural, multi-turn conversations

### 6. Personality Behavior (`personality-behavior.js`)

Adds consistent personality traits to responses:

- Ensures Nova maintains a consistent character across interactions
- Adds appropriate emotional tone based on conversation context
- Incorporates personalized expressions and response patterns
- Creates a more engaging and human-like conversation experience

### 7. Proactive Behavior (`proactive-behavior.js`)

Enables Nova to initiate new conversation topics:

- Occasionally starts new topics rather than always being reactive
- Asks follow-up questions about user statements
- Suggests related topics based on conversation history
- Creates a more balanced and natural dialogue flow

### 8. Variation Behavior (`variation-behavior.js`)

Adds natural language variations to prevent repetitiveness:

- Introduces different phrasing for common responses
- Adds conversational fillers and speech patterns
- Varies sentence structure and word choice
- Prevents conversations from feeling robotic or scripted

### 9. Conversational Flow Behavior (`conversational-flow-behavior.js`)

Manages the natural flow of conversations:

- Handles interruptions and topic changes smoothly
- Maintains conversation coherence across multiple turns
- Detects when user changes subject unexpectedly
- Provides graceful transitions between topics

### 10. GAD Feature Behavior (`gad-feature-behavior.js`)

Specializes in answering questions about the GAD (GUI API Demo) application:

- Explains application features and capabilities
- Provides guidance on using the application
- Offers conversation starters related to GAD topics
- Supports learning about test automation practices

### 11. Curiosity Behavior (`curiosity-behavior.js`)

Enhances Nova's ability to express curiosity and ask follow-up questions:

- Shows inquisitiveness when it doesn't fully understand user inputs
- Asks clarifying questions instead of giving generic responses
- Demonstrates interest in ambiguous topics
- Creates more engaging two-way conversations

### 12. Small Talk Behavior (`small-talk-behavior.js`)

Handles realistic conversational exchanges including:

- Greetings and farewells (informal variations like "yo", "hiya", "heya")
- Personal questions about Nova (capability questions)
- Feeling-based questions with nuanced emotion detection
- Weather-related small talk with forecast-related responses
- Time and date questions with various formats
- Compliments with improved recognition of various forms
- Opinion questions with enhanced formats
- Laughter recognition for expressions of humor
- Apologies with appropriate responses
- Confusion with offers for clarification
- Help requests with assistance options
- Agreement with acknowledgment responses
- Disagreement with respectful responses

### 13. Recommendation Behavior (`recommendation-behavior.js`)

Provides personalized recommendations with medium-low priority (300):

- Learning resources based on detected user interests
- Project suggestions and activities tailored to skill level
- Topic exploration recommendations for further learning
- Personalized learning paths based on conversation history

### 14. Default Response Behavior (`default-response-behavior.js`)

A fallback behavior with lowest priority (100) for handling basic conversations when no other behavior is applicable:

- Topic-based general responses
- General conversational capabilities
- Prevention of repetitive responses
- Graceful handling of unrecognized inputs

## Advanced Systems

### User Memory System (`user-memory.js`)

Nova maintains persistent memory about users across conversations:

- **User Information Storage**: Saves information the user shares (name, preferences, etc.)
- **Term Learning**: Records user-defined terms and custom definitions
- **Topic Tracking**: Monitors topics of interest to personalize future interactions
- **Sentiment Analysis**: Tracks user sentiment over time for more appropriate responses
- **Conversation Recall**: Maintains history of important conversation points
- **Interaction Patterns**: Learns user's preferred interaction style

### Text Processing System

Advanced text analysis and normalization capabilities:

- **Text Normalization** (`text-normalization.js`): Standardizes text for better matching
  - Apostrophe removal for handling punctuation variations
  - Case normalization to handle different capitalization styles
- **Text Processing** (`text-processing.js`): Advanced text analysis
  - Levenshtein distance calculation for fuzzy matching
  - Sentiment detection for understanding user emotion
  - Message normalization to identify intent despite typos
  - Knowledge query extraction for better information retrieval

### Response Selection Process

Nova's decision system for choosing the most appropriate response:

1. The user message is processed through text normalization and analysis
2. All behaviors evaluate if they can handle the message via `canHandle()`
3. The response scoring system calculates a score for each capable behavior
4. The behavior with the highest score is selected to handle the message
5. The selected behavior generates a response via its `handle()` method
6. Post-processing adds personality and variations as needed

This process ensures the most appropriate behavior handles each message while maintaining conversation naturalness.

### Debugging and Diagnostics

Tools for troubleshooting and improving Nova's performance:

- **Context Debugging** (`context-debug.js`): Tools for diagnosing context issues
  - Context snapshots for state examination
  - Event logging for behavior decisions
  - Term recognition diagnostics
- **Term Learning Debugging** (`debug-term-learning.js`): Utilities for term learning system
  - Priority handling for term definitions
  - Test functions for verification
- **Term Diagnostics** (`debug-terms.js`): Advanced term diagnostics
  - Term storage inspection
  - Term verification tools
  - Manual term management

## Extending the System

To add a new behavior to Nova:

1. Create a new class that extends `BaseBehavior`
2. Implement the required `canHandle` and `handle` methods
3. Set an appropriate priority level in the constructor
4. Register the behavior in `behavior-manager.js`

Example:

```javascript
// my-custom-behavior.js
const BaseBehavior = require("./base-behavior");
const { logDebug } = require("../../../../helpers/logger-api");

class MyCustomBehavior extends BaseBehavior {
  constructor() {
    // Choose an appropriate priority level (higher = checked first)
    super("my-custom-behavior", 500);
  }

  canHandle(message, context) {
    // Logic to determine if this behavior can handle the message
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes("custom") || lowerMessage.includes("specific");
  }

  handle(message, context) {
    // Log for debugging (optional)
    logDebug(`MyCustomBehavior handling: ${message}`);

    // Extract user ID for personalization
    const userId = context.userId || context.conversationId?.split("_")[0];

    // Access user memory for personalized response
    const userMem = context.userMemory;
    const userName = userMem.name || "there";

    // Generate customized response
    return `Hello ${userName}! This is my custom response tailored just for you.`;
  }
}

module.exports = MyCustomBehavior;
```

Then register it in `behavior-manager.js`:

```javascript
// Import the new behavior
const MyCustomBehavior = require("./my-custom-behavior");

// Add to behavior initialization
function initializeBehaviors() {
  // Register existing behaviors
  behaviorRegistry
    .register(new CommandBehavior())
    .register(new GameBehavior())
    // ... other behaviors
    .register(new MyCustomBehavior()) // Add your custom behavior
    .register(new DefaultResponseBehavior(textProcessingUtils));

  behaviorRegistry.initialized = true;
  return behaviorRegistry;
}
```

## Testing

Nova includes specialized testing utilities:

### Behavior Testing

Test script (`test-behaviors.js`) for verifying behavior functionality:

```bash
node endpoints/practice/nova/test-behaviors.js
```

This tests various message types to ensure behaviors are working correctly.

### Term Learning Testing

Dedicated tool (`test-term-learning.js`) for validating term learning capability:

```bash
node endpoints/practice/nova/test-term-learning.js
```

This simulates user interactions to verify term learning and recall.

## Priority System and Behavior Selection

Nova employs a sophisticated priority and scoring system:

### Default Priority Levels

Behaviors are assigned base priority values:

- Command behavior: 1000 (highest)
- Game behavior: 900
- Utility behavior: 800
- Knowledge base behavior: 750
- Contextual memory behavior: 600
- Personality behavior: 550
- Proactive behavior: 500
- Variation behavior: 450
- Conversational flow behavior: 400
- Small talk behavior: 350
- GAD feature behavior: 325
- Recommendation behavior: 300
- Curiosity behavior: 200
- Default response behavior: 100 (lowest)

### Scoring Adjustments

The final behavior selection factors in:

- Base priority of the behavior
- Contextual boosts based on conversation state
  - +500 for proactive behavior when responding to proactive questions
  - +300 for game behavior when responding to game-related proactive questions
- Additional scoring from behavior-specific logic
- Previous conversation turns and flow

## Benefits and Architectural Advantages

Nova's modular behavior-based architecture offers numerous advantages:

1. **Modularity**: Each behavior is self-contained and can be developed, tested, and debugged independently without affecting other components.

2. **Extensibility**: New behaviors can be added without modifying existing code, allowing for continuous enhancement without regression risk.

3. **Maintainability**: The code organization makes it easier to understand, maintain, and update specific functionality as needed.

4. **Testability**: Individual behaviors can be tested in isolation, enabling better test coverage and more targeted debugging.

5. **Flexibility**: The priority and scoring system allows for fine-grained control over which behaviors activate in specific contexts.

6. **Scalability**: New capabilities can be added as independent modules without increasing complexity of existing components.

7. **Robustness**: If one behavior fails, others continue to function, preventing catastrophic system failure.

8. **Composability**: Multiple behaviors can contribute to a single response, creating complex interactions from simple building blocks.

9. **Adaptability**: The system can easily adjust to changing requirements by adding, removing, or modifying behaviors.

10. **Personalization**: User memory integration allows for increasingly personalized interactions over time.

## Implementation Details

### Message Flow

1. User message is received by the Nova chat handler
2. Message context is created/updated with conversation history and user memory
3. Text normalization and processing is applied to the message
4. The behavior registry evaluates which behavior should handle the message
5. The selected behavior processes the message and generates a base response
6. Response enhancement behaviors (personality, variation) modify the response
7. The final response is returned to the user

### Core Files and Responsibilities

- `nova-chat-handlers.js`: Entry point for message processing
- `behavior-registry.js`: Core behavior selection and management
- `behavior-manager.js`: Behavior initialization and registration
- `message-context.js`: Conversation context management
- `user-memory.js`: Persistent user information storage
- `text-processing.js`: Text analysis and normalization
- `_calculateResponseScore.js`: Behavior scoring and selection logic

## Future Enhancements

Nova's architecture is designed to accommodate future enhancements, including:

1. **Multi-modal Behaviors**: Support for handling images, audio, and other input types
2. **External API Integration**: Behaviors that leverage external APIs for enhanced capabilities
3. **Learning Behaviors**: Components that improve responses based on user feedback
4. **Domain-Specific Behaviors**: Specialized modules for particular knowledge domains
5. **Emotion Recognition**: Enhanced understanding of user emotional state
6. **Multi-language Support**: Behaviors adapted for different languages
7. **Voice Integration**: Support for voice input and output
8. **Interactive Tutorial Behaviors**: Specialized teaching and guidance capabilities

These enhancements can be implemented as new behaviors without disrupting existing functionality, demonstrating the architecture's extensibility and future-proof design.
