/**
 * Enhanced Logger Utility for Mushroom Bot
 * Provides consistent, readable logging across the application
 */

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m"
};

// Log level colors and prefixes
const logLevels = {
  info: {
    color: colors.blue,
    prefix: 'INFO'
  },
  success: {
    color: colors.green,
    prefix: 'SUCCESS'
  },
  warn: {
    color: colors.yellow,
    prefix: 'WARN'
  },
  error: {
    color: colors.red,
    prefix: 'ERROR'
  },
  command: {
    color: colors.yellow,
    prefix: 'CMD'
  }
};

/**
 * Get formatted timestamp for logging
 * @returns {string} Formatted timestamp [YYYY-MM-DD HH:MM:SS]
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * Format a log message with consistent styling
 * @param {string} level - Log level (info, success, warn, error, command)
 * @param {string} source - Source of the log message
 * @param {string} message - The log message
 * @returns {string} Formatted log message
 */
const formatLogMessage = (level, source, message) => {
  const timestamp = getTimestamp();
  const levelInfo = logLevels[level] || logLevels.info;
  
  return `${colors.cyan}[${timestamp}]${colors.reset} ${colors.bright}${levelInfo.color}${levelInfo.prefix.padEnd(7)}${colors.reset} ${colors.magenta}${source.padEnd(15)}${colors.reset} │ ${message}`;
};

/**
 * Log informational message
 * @param {string} source - Source of the information
 * @param {string} message - The informational message
 */
const logInfo = (source, message) => {
  console.log(formatLogMessage('info', source, message));
};

/**
 * Log successful operation
 * @param {string} source - Source of the success
 * @param {string} message - Details about the successful operation
 */
const logSuccess = (source, message) => {
  console.log(formatLogMessage('success', source, message));
};

/**
 * Log warning message
 * @param {string} source - Source of the warning
 * @param {string} message - The warning message
 */
const logWarn = (source, message) => {
  console.log(formatLogMessage('warn', source, message));
};

/**
 * Log an error
 * @param {string} source - Source of the error
 * @param {Error|string} error - The error object or error message
 */
const logError = (source, error) => {
  // Format error message
  let errorMessage = '';
  
  if (error instanceof Error) {
    // It's an Error object
    errorMessage = `${error.message}`;
    
    // Add first line of stack trace if available
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(1);
      if (stackLines.length > 0) {
        const firstLine = stackLines[0].trim();
        // Only add stack trace if it adds useful information
        if (!firstLine.includes('at Object.<anonymous>')) {
          errorMessage += `\n    ${colors.dim}→ ${firstLine}${colors.reset}`;
        }
      }
    }
  } else if (typeof error === 'object' && error !== null) {
    // It's another type of object
    try {
      errorMessage = JSON.stringify(error, null, 2);
    } catch (e) {
      errorMessage = `[Object ${Object.prototype.toString.call(error)}]`;
    }
  } else {
    // It's a string or other primitive
    errorMessage = String(error);
  }
  
  console.log(formatLogMessage('error', source, `${colors.red}${errorMessage}${colors.reset}`));
};

/**
 * Log a command execution
 * @param {Object} interaction - Discord interaction object
 * @param {string} status - Status of the command (Success, Error, or null for pending)
 * @param {string} details - Additional details about the command execution
 */
const logCommand = (interaction, status = null, details = null) => {
  const user = interaction.user.tag;
  const guild = interaction.guild ? interaction.guild.name : 'DM';
  const commandName = interaction.commandName;
  
  // Get all options provided by the user
  const options = [];
  if (interaction.options && interaction.options.data.length > 0) {
    interaction.options.data.forEach(option => {
      options.push(`${option.name}: ${option.value}`);
    });
  }

  // Format status text and color
  let statusText = "Pending";
  let statusColor = colors.dim;
  
  if (status === 'Success') {
    statusText = "Success";
    statusColor = colors.green;
  } else if (status === 'Error') {
    statusText = "Failed";
    statusColor = colors.red;
    if (details) {
      statusText += ` (${details})`;
    }
  }
  
  // Build the command log message
  let message = `${colors.bright}${colors.green}${commandName}${colors.reset}`;
  
  // Add user and guild info
  message += ` from ${user} in ${guild}`;
  
  // Add options if present
  if (options.length > 0) {
    message += `\n    ${colors.dim}Options:${colors.reset} ${options.join(', ')}`;
  }
  
  // Add status
  message += `\n    ${colors.dim}Status:${colors.reset} ${statusColor}${statusText}${colors.reset}`;
  
  console.log(formatLogMessage('command', 'discord', message));
};

/**
 * Log system startup information
 * @param {string} message - Startup information
 */
const logStartup = (message) => {
  const divider = `${colors.bright}${colors.green}${'═'.repeat(80)}${colors.reset}`;
  console.log(divider);
  console.log(`${colors.bright}${colors.green}  MUSHROOM BOT STARTING${colors.reset}`);
  console.log(`  ${message}`);
  console.log(divider);
};

/**
 * Log system shutdown information
 * @param {string} message - Shutdown information
 */
const logShutdown = (message) => {
  const divider = `${colors.bright}${colors.red}${'═'.repeat(80)}${colors.reset}`;
  console.log(divider);
  console.log(`${colors.bright}${colors.red}  MUSHROOM BOT SHUTTING DOWN${colors.reset}`);
  console.log(`  ${message}`);
  console.log(divider);
};

module.exports = {
  logInfo,
  logSuccess,
  logWarn,
  logError,
  logCommand,
  logStartup,
  logShutdown
}; 