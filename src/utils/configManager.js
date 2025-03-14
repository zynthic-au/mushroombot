/**
 * Configuration Manager for the bot
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require('./logger');

/**
 * Load the main bot configuration
 * @returns {Object} The configuration object
 */
const loadConfig = () => {
  try {
    const configPath = path.join(__dirname, '../config/config.yml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    return yaml.load(fileContents);
  } catch (error) {
    logger.logError('configManager', 'system', new Error(`Failed to load configuration: ${error.message}`));
    // Return default configuration
    return {
      bot: {
        presence: {
          type: 'PLAYING',
          text: 'Legend of Mushroom',
          status: 'online'
        }
      }
    };
  }
};

/**
 * Get the bot's presence configuration
 * @returns {Object} The presence configuration
 */
const getBotPresence = () => {
  const config = loadConfig();
  return config.bot?.presence || {
    type: 'PLAYING',
    text: 'Legend of Mushroom',
    status: 'online'
  };
};

/**
 * Reload the configuration from disk
 * @returns {Object} The newly loaded configuration
 */
const reloadConfig = () => {
  return loadConfig();
};

module.exports = {
  loadConfig,
  getBotPresence,
  reloadConfig
}; 