/**
 * Configuration Manager for the bot
 */
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const yaml = require('js-yaml');

// In-memory config cache
let configCache = null;

// Default configuration
const defaultConfig = {
  bot: {
    presence: {
      type: 'PLAYING',
      text: 'Legend of Mushroom',
      status: 'online'
    }
  },
  countdown: {
    updateInterval: 60000,
    serverName: "Server",
    resetTime: "00:00:00",
    timezone: "UTC",
    guilds: {}
  }
};

/**
 * Get a nested property from an object using a dot-notation path
 * @param {Object} obj - The object to traverse
 * @param {string} path - Dot-notation path (e.g., 'countdown.channelId')
 * @returns {any} The value at the path, or undefined if not found
 */
const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] !== undefined ? prev[curr] : undefined;
  }, obj);
};

/**
 * Set a nested property on an object using a dot-notation path
 * @param {Object} obj - The object to modify
 * @param {string} path - Dot-notation path (e.g., 'countdown.channelId')
 * @param {any} value - The value to set
 */
const setNestedProperty = (obj, path, value) => {
  const parts = path.split('.');
  const last = parts.pop();
  const parent = parts.reduce((prev, curr) => {
    if (!prev[curr]) prev[curr] = {};
    return prev[curr];
  }, obj);
  parent[last] = value;
};

/**
 * Load the main bot configuration
 * @returns {Object} The configuration object
 */
const loadConfig = () => {
  try {
    // Load from YAML file
    const yamlPath = path.join(__dirname, '../config/config.yml');
    if (fs.existsSync(yamlPath)) {
      const fileContents = fs.readFileSync(yamlPath, 'utf8');
      configCache = yaml.load(fileContents);
      return configCache;
    }
    
    // If YAML doesn't exist, use default configuration
    logger.logWarn('configManager', 'No config file found, using default configuration');
    configCache = defaultConfig;
    return configCache;
  } catch (error) {
    logger.logError('configManager', error);
    // Return default configuration
    configCache = defaultConfig;
    return configCache;
  }
};

/**
 * Get the current configuration
 * @returns {Object} The current configuration
 */
const getConfig = () => {
  if (!configCache) {
    return loadConfig();
  }
  return configCache;
};

/**
 * Get a specific configuration value
 * @param {string} path - Dot-notation path to the config value
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} The configuration value
 */
const getConfigValue = (path, defaultValue = null) => {
  const config = getConfig();
  const value = getNestedProperty(config, path);
  return value !== undefined ? value : defaultValue;
};

/**
 * Update a configuration value and save to disk
 * @param {string} configPath - Dot-notation path to the config value
 * @param {any} value - The new value
 * @returns {boolean} True if successful, false otherwise
 */
const updateConfig = (configPath, value) => {
  try {
    if (!configPath) {
      logger.logError('configManager', 'No config path provided for update');
      return false;
    }

    const config = getConfig();
    setNestedProperty(config, configPath, value);
    
    // Update cache
    configCache = config;
    
    logger.logInfo('configManager', `Updated config: ${configPath} = ${JSON.stringify(value)}`);
    return true;
  } catch (error) {
    logger.logError('configManager', `Failed to update config: ${error.message}`);
    return false;
  }
};

/**
 * Get the bot's presence configuration
 * @returns {Object} The presence configuration
 */
const getBotPresence = () => {
  const config = getConfig();
  return config.bot?.presence || {
    type: 'PLAYING',
    text: 'Legend of Mushroom',
    status: 'online'
  };
};

/**
 * Get configuration for a specific guild
 * @param {string} guildId - The Discord guild ID
 * @returns {Object} The guild configuration
 */
const getGuildConfig = async (guildId) => {
  try {
    const config = getConfig();
    const guildConfig = config.countdown?.guilds?.[guildId] || {};
    
    // Return guild config with defaults for missing values
    return {
      serverName: guildConfig.serverName || config.countdown?.serverName || 'Server',
      resetTime: guildConfig.resetTime || config.countdown?.resetTime || '00:00:00',
      timezone: guildConfig.timezone || config.countdown?.timezone || 'UTC',
      channelId: guildConfig.channelId || null
    };
  } catch (error) {
    logger.logError('configManager', `Failed to get guild config: ${error.message}`);
    return {
      serverName: 'Server',
      resetTime: '00:00:00',
      timezone: 'UTC',
      channelId: null
    };
  }
};

/**
 * Update configuration for a specific guild
 * @param {string} guildId - The Discord guild ID
 * @param {Object} guildConfig - The new guild configuration
 * @returns {boolean} True if successful, false otherwise
 */
const updateGuildConfig = async (guildId, guildConfig) => {
  try {
    if (!guildId) {
      logger.logError('configManager', 'No guild ID provided for update');
      return false;
    }
    
    // If guildConfig is null, remove the guild configuration
    if (guildConfig === null) {
      return updateConfig(`countdown.guilds.${guildId}`, undefined);
    }
    
    // Update the guild configuration
    return updateConfig(`countdown.guilds.${guildId}`, guildConfig);
  } catch (error) {
    logger.logError('configManager', `Failed to update guild config: ${error.message}`);
    return false;
  }
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
  getConfig,
  getConfigValue,
  updateConfig,
  getBotPresence,
  reloadConfig,
  getGuildConfig,
  updateGuildConfig
}; 