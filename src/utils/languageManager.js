/**
 * Language Manager for the bot
 */
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Default language configuration
const defaultLanguage = {
  countdown: {
    embed: {
      color: '0x3498db',
      title: '⏰ Server Reset Countdown',
      description: 'Time remaining until {serverName} resets at {resetTime} {timezone}.',
      fields: {
        time_remaining: {
          name: '⏱️ Time Remaining',
          value: '**{timeRemaining}**',
          inline: true
        },
        next_reset: {
          name: '🕒 Next Reset',
          value: '**{resetTime} {timezone}**',
          inline: true
        },
        server: {
          name: '🖥️ Server',
          value: '**{serverName}**',
          inline: true
        },
        reminders: {
          name: '📝 Daily Reminders',
          value: '{remindersList}',
          inline: false
        }
      },
      footer: 'Legend of Mushroom Bot • Last updated: {currentTime}'
    }
  },
  reset: {
    auto_delete_hours: 3,
    embed: {
      color: '0xF1C40F',
      title: '🔄 Server Reset Complete',
      description: '**{serverName}** was reset at **{resetTime}** **{timezone}**.',
      thumbnail: 'https://i.imgur.com/bbGNjdZ.png',
      fields: {
        time_elapsed: {
          name: '⏱️ Time Since Reset',
          value: '**{timeElapsed}**',
          inline: true
        },
        reset_time: {
          name: '🕒 Reset Time',
          value: '**{resetTime} {timezone}**',
          inline: true
        },
        server: {
          name: '🖥️ Server',
          value: '**{serverName}**',
          inline: true
        }
      },
      footer: 'Legend of Mushroom Bot • This message will auto-delete in {deleteTime}'
    }
  }
};

// In-memory language cache
let languageCache = null;

/**
 * Get a nested property from an object using a dot-notation path
 * @param {Object} obj - The object to traverse
 * @param {string} path - Dot-notation path (e.g., 'countdown.embed.title')
 * @returns {any} The value at the path, or undefined if not found
 */
const getNestedProperty = (obj, path) => {
  if (!obj) return undefined;
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] !== undefined ? prev[curr] : undefined;
  }, obj);
};

/**
 * Load the language configuration
 * @returns {Object} The language configuration object
 */
const loadLanguage = () => {
  try {
    // Load from YAML file
    const yamlPath = path.join(__dirname, '../config/language.yml');
    if (fs.existsSync(yamlPath)) {
      const yaml = require('js-yaml');
      const fileContents = fs.readFileSync(yamlPath, 'utf8');
      languageCache = yaml.load(fileContents);
      return languageCache;
    }
    
    // If YAML doesn't exist, use default language
    logger.logWarn('languageManager', 'No language file found, using default language');
    languageCache = defaultLanguage;
    return languageCache;
  } catch (error) {
    logger.logError('languageManager', `Failed to load language file: ${error.message}`);
    // Return default language configuration
    languageCache = defaultLanguage;
    return languageCache;
  }
};

// Load language on module initialization to ensure it's always available
loadLanguage();

/**
 * Get the current language configuration
 * @returns {Object} The current language configuration
 */
const getLanguage = () => {
  if (!languageCache) {
    return loadLanguage();
  }
  return languageCache;
};

/**
 * Get a specific language value
 * @param {string} path - Dot-notation path to the language value
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} The language value
 */
const getLanguageValue = (path, defaultValue = null) => {
  try {
    const language = getLanguage();
    const value = getNestedProperty(language, path);
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    logger.logError('languageManager', `Error getting language value for ${path}: ${error.message}`);
    return defaultValue;
  }
};

/**
 * Replace placeholders in a string with their corresponding values
 * @param {string} text - The text containing placeholders
 * @param {Object} replacements - Object with key-value pairs for replacements
 * @returns {string} The text with placeholders replaced
 */
const formatText = (text, replacements = {}) => {
  if (!text) return '';
  
  try {
    return Object.entries(replacements).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{${key}}`, 'g'), value || '');
    }, text);
  } catch (error) {
    logger.logError('languageManager', `Error formatting text: ${error.message}`);
    return text;
  }
};

/**
 * Reload the language configuration from disk
 * @returns {Object} The newly loaded language configuration
 */
const reloadLanguage = () => {
  return loadLanguage();
};

/**
 * Get a message with replacements
 * @param {string} path - Dot-notation path to the message
 * @param {Object} replacements - Object with key-value pairs for replacements
 * @param {string} defaultValue - Default value if message not found
 * @returns {string} The formatted message
 */
const getMessage = (path, replacements = {}, defaultValue = '') => {
  try {
    const message = getLanguageValue(path, defaultValue);
    if (!message) return defaultValue;
    return formatText(message, replacements);
  } catch (error) {
    logger.logError('languageManager', `Error getting message for ${path}: ${error.message}`);
    return defaultValue;
  }
};

module.exports = {
  loadLanguage,
  getLanguage,
  getLanguageValue,
  formatText,
  reloadLanguage,
  getMessage
}; 