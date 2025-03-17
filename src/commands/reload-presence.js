const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getBotPresence } = require('../utils/configManager');
const { getMessage, getLanguageValue } = require('../utils/languageManager');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload-presence')
    .setDescription(getLanguageValue('commands.reload_presence.description', 'Reload the bot\'s status/presence from the config file'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only administrators can use this
  
  async execute(interaction) {
    try {
      // Get the bot's presence configuration
      const presenceConfig = getBotPresence();
      
      // Update the bot's presence
      await interaction.client.user.setPresence({
        activities: [{
          name: presenceConfig.text,
          type: getActivityType(presenceConfig.type)
        }],
        status: presenceConfig.status
      });
      
      // Log the presence update
      logger.logSuccess('reload-presence', `Bot presence updated to: ${presenceConfig.type} ${presenceConfig.text} (${presenceConfig.status})`);
      
      // Reply to the user
      await interaction.reply({
        content: getMessage('commands.reload_presence.success', {
          type: presenceConfig.type,
          text: presenceConfig.text,
          status: presenceConfig.status
        }, `✅ Bot presence updated to: **${presenceConfig.type} ${presenceConfig.text}** (${presenceConfig.status})`),
        flags: 64
      });
      
    } catch (error) {
      logger.logError('reload-presence', error);
      
      await interaction.reply({
        content: getMessage('commands.reload_presence.error', { error: error.message }, `❌ Failed to update bot presence: ${error.message}`),
        flags: 64
      });
    }
  },
};

// Helper function to convert presence type string to Discord.js ActivityType
function getActivityType(type) {
  switch (type.toUpperCase()) {
    case 'PLAYING': return 0;
    case 'STREAMING': return 1;
    case 'LISTENING': return 2;
    case 'WATCHING': return 3;
    case 'COMPETING': return 5;
    default: return 0; // Default to PLAYING
  }
} 