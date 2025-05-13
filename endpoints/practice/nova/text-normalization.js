/**
 * Remove apostrophes from a string
 * @param {string} text - Text to process
 * @returns {string} - Text without apostrophes
 */
function removeApostrophes(text) {
  return text ? text.replace(/[']/g, "") : text;
}

/**
 * Normalize text for better matching by removing apostrophes and converting to lowercase
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text) return "";
  // Convert to lowercase and remove apostrophes
  return removeApostrophes(text.toLowerCase());
}

module.exports = {
  removeApostrophes,
  normalizeText,
};
