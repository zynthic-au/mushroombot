const { SlashCommandBuilder } = require('discord.js');
const { getConfig } = require('../utils/configManager');
const { sendResetAnnouncement } = require('../utils/countdownManager');
const logger = require('../utils/logger');
const { getLanguageValue } = require('../utils/languageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-announcement')
    .setDescription('Manually send a server reset announcement')
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
          content: getLanguageValue('commands.reset_announcement.no_config', 'This server is not configured for countdown announcements. Please set up a countdown channel first.'),
          flags: 64
        });
      }
      
      // Get the channel ID from the configuration
      const channelId = config.countdown.guilds[guildId].channelId;
      if (!channelId) {
        return interaction.editReply({
          content: getLanguageValue('commands.reset_announcement.no_channel', 'No announcement channel is configured for this server. Please set up a countdown channel first.'),
          flags: 64
        });
      }
      
      // Send the reset announcement
      const success = await sendResetAnnouncement(interaction.client, guildId, channelId);
      
      if (success) {
        return interaction.editReply({
          content: getLanguageValue('commands.reset_announcement.success', 'Server reset announcement has been sent successfully!'),
          flags: 64
        });
      } else {
        return interaction.editReply({
          content: getLanguageValue('commands.reset_announcement.error', 'Failed to send server reset announcement. Check the bot logs for details.'),
          flags: 64
        });
      }
    } catch (error) {
      logger.logError('reset-announcement', `Error executing command: ${error.message}`);
      return interaction.editReply({
        content: getLanguageValue('commands.reset_announcement.error', 'Failed to send server reset announcement. Check the bot logs for details.'),
        flags: 64
      });
    }
  }
}; 