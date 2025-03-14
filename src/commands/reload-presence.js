const { SlashCommandBuilder, ActivityType, PermissionFlagsBits } = require('discord.js');
const { reloadConfig, getBotPresence } = require('../utils/configManager');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload-presence')
    .setDescription('Reload the bot\'s status/presence from the config file')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only administrators can use this
  
  async execute(interaction) {
    try {
      // Reload the config
      reloadConfig();
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
      
      // Set the new presence
      await interaction.client.user.setPresence({
        activities: [{ 
          name: presenceConfig.text,
          type: activityType
        }],
        status: presenceConfig.status
      });
      
      await interaction.reply({
        content: `✅ Bot presence updated to: **${presenceConfig.type} ${presenceConfig.text}** (${presenceConfig.status})`,
        flags: 64,
      });
      
      // Success logging is now handled in interactionCreate.js
    } catch (error) {
      logger.logError('reload-presence', error);
      
      await interaction.reply({
        content: `❌ Failed to update bot presence: ${error.message}`,
        flags: 64,
      });
    }
  },
}; 