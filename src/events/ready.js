const { ActivityType } = require('discord.js');
const { getBotPresence } = require('../utils/configManager');
const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    // Use logger for startup messages instead of console.log
    logger.logInfo('system', `Bot ready and logged in as ${client.user.tag}`);
    logger.logInfo('system', `Currently serving ${client.guilds.cache.size} guilds`);
    
    // Set the bot's presence based on config
    try {
      const presenceConfig = getBotPresence();
      
      // Map the activity type from config to Discord.js ActivityType
      const activityTypeMap = {
        'PLAYING': ActivityType.Playing,
        'STREAMING': ActivityType.Streaming,
        'LISTENING': ActivityType.Listening,
        'WATCHING': ActivityType.Watching,
        'COMPETING': ActivityType.Competing
      };
      
      const activityType = activityTypeMap[presenceConfig.type] || ActivityType.Playing;
      
      client.user.setPresence({
        activities: [{ 
          name: presenceConfig.text,
          type: activityType
        }],
        status: presenceConfig.status
      });
      
      logger.logSuccess('ready', `Bot presence set to: ${presenceConfig.type} ${presenceConfig.text} (${presenceConfig.status})`);
    } catch (error) {
      logger.logError('ready', error);
    }
  },
}; 