# Nova AI Behavior System Documentation

## Overview

The Nova AI chat system has been refactored to use a behavior-based architecture that allows for easy extension with new behaviors. This modular approach replaces the monolithic `generateAIResponse` function with a plugin-based system where each type of response (commands, games, knowledge base lookups, etc.) is handled by a separate module that can be independently registered with the system.

## Architecture Components

### 1. Behavior Registry (`behavior-registry.js`)

The central registry for all AI behaviors. It provides methods to:

- Register new behaviors
- Find the appropriate behavior for a given message
- Process messages through the registered behaviors

### 2. Base Behavior (`base-behavior.js`)

An abstract base class that all behaviors must extend. It defines the interface that all behaviors must implement:

- `canHandle(message, context)`: Determines if the behavior can handle the given message
- `handle(message, context)`: Processes the message and returns a response

### 3. Message Context (`message-context.js`)

A class that provides context for message processing, including:

- User ID and conversation ID
- Conversation history
- User memory
- Conversation analytics
- Normalized message, command, and topic detection

### 4. Behavior Manager (`behavior-manager.js`)

Initializes all behaviors and registers them with the registry.

## Available Behaviors

### 1. Command Behavior (`command-behavior.js`)

Handles explicit commands like:

- `help`
- `remember <information>`
- `forget <information>`
- `tell me a joke`
- `tell me a fact`
- `what do you know about me`

### 2. Game Behavior (`game-behavior.js`)

Handles games like:

- Rock Paper Scissors
- Number Guessing
- Hangman

### 3. Knowledge Base Behavior (`knowledge-base-behavior.js`)

Handles knowledge base lookups based on user questions.

### 4. Utility Behavior (`utility-behavior.js`)

Handles utility functions like:

- Calculations
- Unit conversions
- Dictionary lookups
- Code examples

### 5. Default Response Behavior (`default-response-behavior.js`)

A fallback behavior for handling basic conversations and responses when no other behavior is applicable.

## Extending the System

To add a new behavior:

1. Create a new class that extends `BaseBehavior`
2. Implement the `canHandle` and `handle` methods
3. Register the behavior in `behavior-manager.js`

Example:

```javascript
// my-custom-behavior.js
const BaseBehavior = require("./base-behavior");

class MyCustomBehavior extends BaseBehavior {
  constructor() {
    // Choose an appropriate priority level
    super("my-custom-behavior", 500);
  }

  canHandle(message, context) {
    // Logic to determine if this behavior can handle the message
    return message.toLowerCase().includes("custom");
  }

  handle(message, context) {
    // Logic to handle the message and generate a response
    return "This is my custom response!";
  }
}

module.exports = MyCustomBehavior;
```

Then register it in `behavior-manager.js`:

```javascript
const MyCustomBehavior = require("./my-custom-behavior");

function initializeBehaviors() {
  // Register existing behaviors
  behaviorRegistry
    .register(new CommandBehavior())
    .register(new GameBehavior())
    // ...
    .register(new MyCustomBehavior()) // Add your custom behavior
    .register(new DefaultResponseBehavior(textProcessingUtils));

  behaviorRegistry.initialized = true;
  return behaviorRegistry;
}
```

## Testing

A test script (`test-behaviors.js`) is provided to test the behavior system directly without going through the API. Run it with:

```
node endpoints/practice/nova/test-behaviors.js
```

This will test various message types to ensure that all behaviors are working correctly.

## Priority System

Behaviors are executed in priority order (highest first) by the behavior registry. If a behavior's `canHandle` method returns true, its `handle` method is called and no further behaviors are checked. This allows for a fallback system where more specific behaviors have higher priority than general ones.

Default priority levels:

- Command behavior: 1000
- Game behavior: 900
- Utility behavior: 800
- Knowledge base behavior: 700
- Default response behavior: 100

## Benefits of the New Architecture

1. **Modularity**: Each behavior is self-contained and can be developed, tested, and debugged independently.
2. **Extensibility**: New behaviors can be added without modifying existing code.
3. **Maintainability**: The code is more organized and easier to understand.
4. **Testability**: Each behavior can be tested in isolation.
5. **Flexibility**: The priority system allows for fine-grained control over behavior execution.
