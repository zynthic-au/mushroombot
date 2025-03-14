/**
 * Logger utility for consistent logging across the bot
 */

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
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
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
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
 * Log informational message
 * @param {string} source - Source of the information
 * @param {string} message - The informational message
 */
const logInfo = (source, message) => {
  const timestamp = getTimestamp();
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors.bright}${colors.blue}INFO${colors.reset} ${colors.magenta}${source}${colors.reset}: ${message}`);
};

/**
 * Log a command execution
 * @param {Object} interaction - Discord interaction object
 * @param {string} status - Status of the command (Success or Error)
 * @param {string} details - Additional details about the command execution
 */
const logCommand = (interaction, status = null, details = null) => {
  const timestamp = getTimestamp();
  const user = interaction.user.tag;
  const userId = interaction.user.id;
  const guild = interaction.guild ? interaction.guild.name : 'DM';
  const guildId = interaction.guild ? interaction.guild.id : 'DM';
  const commandName = interaction.commandName;
  
  // Get all options provided by the user
  const options = [];
  if (interaction.options && interaction.options.data.length > 0) {
    interaction.options.data.forEach(option => {
      options.push(`${option.name}: ${option.value}`);
    });
  }

  // Display status text and color based on status parameter
  let statusText = "Pending...";
  let statusColor = colors.reset;
  
  if (status === 'Success') {
    statusText = "Success";
    statusColor = colors.green;
  } else if (status === 'Error') {
    statusText = "Failed";
    statusColor = colors.red;
    if (details) {
      statusText += ` - ${details}`;
    }
  }
  
  // Log the command with its status
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors.bright}${colors.yellow}COMMAND${colors.reset} ${colors.green}${commandName}${colors.reset}:`);
  console.log(`${colors.dim}---------------------------------------${colors.reset}`);
  console.log(`  ${colors.dim}User:${colors.reset} ${user} (${userId})`);
  console.log(`  ${colors.dim}Server:${colors.reset} ${guild} (${guildId})`);
  console.log(`  ${colors.dim}Options:${colors.reset} ${options.length > 0 ? options.join(', ') : 'None'}`);
  console.log(`  ${colors.dim}Status:${colors.reset} ${statusColor}${statusText}${colors.reset}`);
  console.log(`${colors.dim}---------------------------------------${colors.reset}`);
};

/**
 * Log successful command completion
 * @param {string} source - Source of the success (command name or system component)
 * @param {string} details - Details about the successful execution
 */
const logSuccess = (source, details) => {
  const timestamp = getTimestamp();
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors.bright}${colors.green}SUCCESS${colors.reset} ${colors.magenta}${source}${colors.reset}: ${details}`);
};

/**
 * Log an error
 * @param {string} source - Source of the error (command name or system component)
 * @param {Error} error - The error object
 */
const logError = (source, error) => {
  const timestamp = getTimestamp();
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors.bright}${colors.red}ERROR${colors.reset} ${colors.magenta}${source}${colors.reset}:`);
  console.log(`  ${colors.red}${error.message}${colors.reset}`);
  if (error.stack) {
    console.log(`  ${colors.dim}${error.stack.split('\n').slice(1).join('\n')}${colors.reset}`);
  }
  console.log(`${colors.dim}---------------------------------------${colors.reset}`);
};

module.exports = {
  logInfo,
  logCommand,
  logSuccess,
  logError
}; 