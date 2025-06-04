/**
 * Custom debug command to list all learned terms for Nova
 *
 * This file adds a simple /list-terms command that lists all terms
 * that Nova has learned from the user.
 */

const { userMemory } = require("./user-memory");
const { logDebug } = require("../../../helpers/logger-api");

/**
 * Process the /list-terms command to show all learned terms
 * @param {string} userId - User ID
 * @returns {string} - Debug information about learned terms
 */
function processListTermsCommand(userId) {
  if (!userId || !userMemory[userId]) {
    return "DEBUG: No user memory found.";
  }

  if (!userMemory[userId].learnedTerms) {
    return `DEBUG: User ${userId} has no learned terms.`;
  }

  const terms = Object.keys(userMemory[userId].learnedTerms);
  const termDetails = terms.map((term) => {
    const termData = userMemory[userId].learnedTerms[term];
    return `"${term}": "${termData.definition}" (used ${termData.usageCount || 0} times)`;
  });

  return `DEBUG: User "${userId}" has provided ${terms.length} terms:\n${termDetails.join("\n")}`;
}

module.exports = {
  processListTermsCommand,
};
