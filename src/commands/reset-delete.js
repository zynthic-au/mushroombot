const { SlashCommandBuilder } = require('discord.js');
const { getConfig } = require('../utils/configManager');
const { stopResetTimer, deleteResetMessage } = require('../utils/countdownManager');
const logger = require('../utils/logger');
const { getLanguageValue } = require('../utils/languageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-delete')
    .setDescription('Delete the server reset complete message')
    .setDefaultMemberPermissions(0x0000000000000008), // ADMINISTRATOR permission
  
  async execute(interaction) {
    try {
      // Defer reply with ephemeral flag
      await interaction.deferReply({ flags: 64 });
      
      const guildId = interaction.guild.id;
      const config = getConfig();
      
      // Check if this guild has countdown configuration
      if (!config.countdown?.guilds?.[guildId]) {
        return interaction.editReply({
          content: getLanguageValue('commands.reset_delete.no_config', 'This server is not configured for countdown announcements. Please set up a countdown channel first.'),
          flags: 64
        });
      }
      
      // Get the channel ID from the configuration
      const channelId = config.countdown.guilds[guildId].channelId;
      if (!channelId) {
        return interaction.editReply({
          content: getLanguageValue('commands.reset_delete.no_channel', 'No announcement channel is configured for this server. Please set up a countdown channel first.'),
          flags: 64
        });
      }
      
      // Delete the reset message and stop the timer
      await deleteResetMessage(guildId, 0); // Pass 0 to delete immediately
      stopResetTimer(guildId);
      
      // Reply to the user
      await interaction.editReply({
        content: getLanguageValue('commands.reset_delete.success', '✅ Server reset complete message has been deleted.'),
        flags: 64
      });
      
      logger.logInfo('reset-delete', `Reset message deleted for guild ${guildId} by ${interaction.user.tag}`);
      
    } catch (error) {
      logger.logError('reset-delete', error);
      
      await interaction.editReply({
        content: getLanguageValue('commands.reset_delete.error', '❌ Failed to delete reset message: {error}', { error: error.message }),
        flags: 64
      });
    }
  },
}; 