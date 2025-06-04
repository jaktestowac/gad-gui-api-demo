/**
 * Variation Behavior - Adds subtle variations to responses
 *
 * This behavior adds natural variations to responses to avoid repetitiveness
 * and make Nova sound more like a human conversationalist. It introduces
 * different phrasing, fillers, and speech patterns.
 */

const BaseBehavior = require("./base-behavior");

class VariationBehavior extends BaseBehavior {
  constructor() {
    // Low priority as it modifies other behaviors' responses
    super("variation", 50);

    // Phrases that can be varied to add naturalness
    this.introductionVariations = [
      "I think that ",
      "From my perspective, ",
      "In my experience, ",
      "It seems that ",
      "It appears that ",
      "Based on what I know, ",
      "Hmm, ",
      "Well, ",
      "Actually, ",
      "Interestingly, ",
      "You know, ",
      "", // Empty option for no prefix
    ];

    this.fillers = [
      ", you know?",
      ", actually.",
      ", in my opinion.",
      ", if that makes sense.",
      ", I believe.",
      ".",
      "!",
      "...",
    ];

    // Enhanced personality dimensions to vary responses
    this.personalityTraits = {
      enthusiasm: [0.3, 0.8], // Range from calm (0) to enthusiastic (1)
      formality: [0.2, 0.7], // Range from casual (0) to formal (1)
      verbosity: [0.4, 0.8], // Range from concise (0) to verbose (1)
      friendliness: [0.5, 1.0], // Range from neutral (0) to warm/friendly (1)
    };

    // Enhanced conversation starters for proactive engagement
    this.conversationStarters = [
      "By the way, ",
      "On a related note, ",
      "That reminds me, ",
      "Oh, I just remembered that ",
      "Speaking of which, ",
    ];

    // Enhanced response modifiers
    this.emphasisMarkers = [
      "really ",
      "definitely ",
      "absolutely ",
      "certainly ",
      "quite ",
      "simply ",
      "", // Empty for no emphasis
    ];
    this.responsePatterns = {
      // Maps response types to variation functions
      fact: this._addFactualVariation.bind(this),
      opinion: this._addOpinionVariation.bind(this),
      greeting: this._addGreetingVariation.bind(this),
      help: this._addHelpfulVariation.bind(this),
      "small-talk": this._addSmallTalkVariation.bind(this),
      game: this._addGameVariation.bind(this),
      personal: this._addPersonalVariation.bind(this),
      command: this._addCommandVariation.bind(this),
      recommendation: this._addRecommendationVariation.bind(this),
    };
  }

  /**
   * Check if this behavior can handle the given message
   * @param {string} message - The message to check
   * @param {object} context - Context for message processing
   * @returns {boolean} - True if this behavior can handle the message
   */
  canHandle(message, context) {
    // This behavior handles responses after they've been generated
    // It needs a generated response in the context
    return context.generatedResponse && context.generatedResponse.length > 0;
  }

  /**
   * Add variations to the generated response
   * @param {string} message - The original user message
   * @param {object} context - Context for message processing
   * @returns {string} - The response with variations added
   */
  handle(message, context) {
    const response = context.generatedResponse;
    const responseType = context.responseType || "general";

    // Generate current personality dimensions for this response
    const personality = this._generatePersonalitySettings();

    // If we have a special handler for this response type, use it
    if (this.responsePatterns[responseType]) {
      return this.responsePatterns[responseType](response, context, personality);
    }

    // Default variation for general responses
    return this._addGeneralVariation(response, context, personality);
  }

  /**
   * Generate personality settings for this interaction
   * @private
   * @returns {object} - Personality settings for this interaction
   */
  _generatePersonalitySettings() {
    const personality = {};

    // For each trait, choose a random value within its range
    for (const trait in this.personalityTraits) {
      const [min, max] = this.personalityTraits[trait];
      personality[trait] = min + Math.random() * (max - min);
    }

    return personality;
  }

  /**
   * Add variation to factual responses
   * @private
   */
  _addFactualVariation(response, context, personality) {
    // Facts should remain mostly clear but can have some variation in delivery
    const introductions = [
      "I can tell you that ",
      "Actually, ",
      "Interestingly, ",
      "According to my information, ",
      "Based on what I know, ",
      "",
    ];

    const intro = introductions[Math.floor(Math.random() * introductions.length)];

    // Only add the intro if it doesn't make things awkward
    if (intro && !response.toLowerCase().startsWith("i ")) {
      return intro + response.charAt(0).toLowerCase() + response.slice(1);
    }

    // Add emphasis markers based on enthusiasm level
    if (personality.enthusiasm > 0.7 && Math.random() < 0.3) {
      // Find a suitable position to add emphasis
      const sentences = response.split(". ");
      if (sentences.length > 1) {
        const idx = Math.floor(Math.random() * sentences.length);
        const emphasis = this.emphasisMarkers[Math.floor(Math.random() * this.emphasisMarkers.length)];

        if (emphasis) {
          const words = sentences[idx].split(" ");
          if (words.length > 3) {
            const wordIdx = Math.floor(Math.random() * (words.length - 2)) + 1;
            words[wordIdx] = emphasis + words[wordIdx];
            sentences[idx] = words.join(" ");
            return sentences.join(". ");
          }
        }
      }
    }

    return response;
  }

  /**
   * Add variation to opinion responses
   * @private
   */
  _addOpinionVariation(response, context, personality) {
    const qualifiers = [
      "I think ",
      "I believe ",
      "In my opinion, ",
      "My take is that ",
      "If you ask me, ",
      "Personally, ",
      "From my perspective, ",
      "",
    ];

    // Adjust variation probability based on personality
    const variationProbability = 0.5 + personality.verbosity * 0.3;

    // Only add variation some of the time
    if (Math.random() < variationProbability) {
      const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
      if (qualifier && !response.toLowerCase().includes("i think") && !response.toLowerCase().includes("my opinion")) {
        return qualifier + response.charAt(0).toLowerCase() + response.slice(1);
      }
    }

    return response;
  }

  /**
   * Add variation to greeting responses
   * @private
   */
  _addGreetingVariation(response, context, personality) {
    // Greetings should be enthusiastic sometimes, casual other times
    const excitementLevel = personality.enthusiasm + personality.friendliness;
    const exclamation = excitementLevel > 1.2 ? "!" : ".";

    // Add name if we know it and personality is friendly
    if (context.userMemory && context.userMemory.name && personality.friendliness > 0.7 && Math.random() < 0.7) {
      const name = context.userMemory.name;

      if (!response.includes(name)) {
        if (response.includes("!")) {
          return response.replace("!", `, ${name}!`);
        } else if (response.includes(".")) {
          return response.replace(".", `, ${name}.`);
        } else {
          return `${response}, ${name}!`;
        }
      }
    }

    if (response.endsWith(".")) {
      return response.slice(0, -1) + exclamation;
    }

    return response;
  }

  /**
   * Add variation to helpful responses
   * @private
   */
  _addHelpfulVariation(response, context, personality) {
    // Helpful responses can sometimes include additional offers of assistance
    const helpfulAdditions = [
      " Let me know if you need anything else!",
      " I hope that helps!",
      " Does that answer your question?",
      " Would you like more information about this?",
      "",
    ];

    // Adjust probability based on friendliness and verbosity
    const additionProbability = 0.2 + personality.friendliness * 0.2 + personality.verbosity * 0.2;

    if (Math.random() < additionProbability) {
      const addition = helpfulAdditions[Math.floor(Math.random() * helpfulAdditions.length)];
      return response + addition;
    }

    return response;
  }

  /**
   * Add variation to small talk responses
   * @private
   */
  _addSmallTalkVariation(response, context, personality) {
    // Small talk should feel natural and conversational
    if (personality.friendliness > 0.7 && Math.random() < 0.3) {
      // Add more conversational elements
      const conversationalAdditions = [
        " How about you?",
        " What about yourself?",
        " What do you think?",
        " Wouldn't you agree?",
        " Don't you think?",
      ];

      const addition = conversationalAdditions[Math.floor(Math.random() * conversationalAdditions.length)];
      if (!response.includes("?") && !response.includes("you")) {
        return response + addition;
      }
    }

    return response;
  }

  /**
   * Add variation to game responses
   * @private
   */
  _addGameVariation(response, context, personality) {
    // Add enthusiasm to game responses
    if (personality.enthusiasm > 0.6) {
      if (response.includes("won") || response.includes("correct") || response.includes("right")) {
        const excitedAdditions = [" That's awesome!", " Well done!", " Great job!", " You're really good at this!", ""];

        if (Math.random() < 0.4) {
          const addition = excitedAdditions[Math.floor(Math.random() * excitedAdditions.length)];
          return response + addition;
        }
      }
    }

    return response;
  }

  /**
   * Add variation to personal responses
   * @private
   */
  _addPersonalVariation(response, context, personality) {
    // For responses about Nova's personality/identity, add more character
    return response; // No modifications yet - personality is handled by PersonalityBehavior
  }

  /**
   * Add variation to command responses
   * @private
   */
  _addCommandVariation(response, context, personality) {
    // Command responses should be straightforward but can have slight variations
    return response; // Usually keep command responses clear
  }

  /**
   * Add variation to recommendation responses
   * @private
   */
  _addRecommendationVariation(response, context, personality) {
    // Add enthusiasm or confidence to recommendations
    const confidenceMarkers = [
      "I think you'll really like ",
      "You might enjoy ",
      "I'd recommend ",
      "I'm confident you'd like ",
      "Based on what I know, I'd suggest ",
    ];

    if (Math.random() < 0.3 && response.includes("recommend")) {
      const marker = confidenceMarkers[Math.floor(Math.random() * confidenceMarkers.length)];
      return response.replace(/I recommend/i, marker);
    }

    return response;
  }

  /**
   * General variation for any response
   * @private
   */
  _addGeneralVariation(response, context, personality) {
    // Only apply variations some of the time to maintain readability
    const variationProbability = 0.3 + personality.verbosity * 0.1;

    if (Math.random() < variationProbability) {
      const intro = this.introductionVariations[Math.floor(Math.random() * this.introductionVariations.length)];
      if (intro && !response.toLowerCase().startsWith("i ") && response.length > 2) {
        const modified = intro + response.charAt(0).toLowerCase() + response.slice(1);
        return modified;
      }
    }

    // Add filler words or phrases based on formality level
    if (personality.formality < 0.4 && Math.random() < 0.2) {
      const casualFillers = [" actually,", " basically,", " like,", " you know,", " I mean,"];

      // Insert a casual filler at a reasonable position
      const sentences = response.split(". ");
      if (sentences.length > 1) {
        const sentenceIdx = Math.floor(Math.random() * (sentences.length - 1)) + 1;
        const filler = casualFillers[Math.floor(Math.random() * casualFillers.length)];

        const words = sentences[sentenceIdx].split(" ");
        if (words.length > 2) {
          // Insert after first word
          words.splice(1, 0, filler);
          sentences[sentenceIdx] = words.join(" ");
          return sentences.join(". ");
        }
      }
    }

    return response;
  }
}

module.exports = VariationBehavior;
