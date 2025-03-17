const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateConfig, getConfig } = require('../utils/configManager');
const { startGuildCountdown, stopGuildCountdown, cleanupOldMessages } = require('../utils/countdownManager');
const { getMessage, getLanguageValue } = require('../utils/languageManager');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement-channel')
    .setDescription(getLanguageValue('commands.announcement_channel.description', 'Set the channel for server reset countdown announcements'))
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription(getLanguageValue('commands.announcement_channel.option_channel', 'The channel for server reset announcements'))
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only administrators can use this
  
  async execute(interaction) {
    try {
      // Get the selected channel and guild information
      const channel = interaction.options.getChannel('channel');
      const guild = interaction.guild;
      const guildId = guild.id;
      
      // Check permissions
      if (!channel.viewable || !channel.permissionsFor(interaction.client.user).has(['SendMessages', 'EmbedLinks'])) {
        await interaction.reply({
          content: getMessage('commands.announcement_channel.no_permissions', { channel }, `❌ I don't have permissions to send messages in ${channel}. Please give me the required permissions and try again.`),
          flags: 64
        });
        return;
      }
      
      // Get current guild configuration or create a new one
      const config = getConfig();
      const guildConfig = config.countdown?.guilds?.[guildId] || {};
      
      // First, send a response so the user knows the command is being processed
      await interaction.deferReply({ flags: 64 });
      
      // Clean up old messages in the previous channel if it exists and is different
      const previousChannelId = guildConfig.channelId;
      if (previousChannelId && previousChannelId !== channel.id) {
        try {
          const previousChannel = await interaction.client.channels.fetch(previousChannelId).catch(() => null);
          if (previousChannel) {
            logger.logInfo('announcement-channel', `Cleaning up old messages in previous channel ${previousChannel.name} (${previousChannelId})`);
            await cleanupOldMessages(previousChannel);
          }
        } catch (error) {
          logger.logError('announcement-channel', `Error cleaning up previous channel: ${error.message}`);
          // Continue with the command even if cleanup fails
        }
      }
      
      // Stop existing countdown if it exists
      stopGuildCountdown(guildId);
      
      // Update the config with the new channel ID (guild-specific)
      const configUpdated = await updateConfig(`countdown.guilds.${guildId}`, {
        ...guildConfig,
        channelId: channel.id,
        // You could add guild-specific settings here in the future
      });
      
      if (!configUpdated) {
        await interaction.editReply({
          content: getMessage('commands.announcement_channel.config_failed', {}, `❌ Failed to update configuration. Please check the bot logs.`)
        });
        return;
      }
      
      // Start the countdown in the new channel for this guild
      const countdownStarted = await startGuildCountdown(interaction.client, guildId, channel.id);
      
      if (countdownStarted) {
        await interaction.editReply({
          content: getMessage('commands.announcement_channel.success', { channel }, `✅ Server reset countdown will now be posted in ${channel}`)
        });
        
        // Log the configuration change
        logger.logInfo('announcement-channel', `Guild ${guild.name} (${guildId}) set countdown channel to ${channel.name} (${channel.id})`);
      } else {
        await interaction.editReply({
          content: getMessage('commands.announcement_channel.start_failed', {}, `⚠️ Configuration saved, but there was an issue starting the countdown. Please check the bot logs or try again later.`)
        });
      }
      
    } catch (error) {
      logger.logError('announcement-channel', error);
      
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content: getMessage('commands.announcement_channel.error', { error: error.message }, `❌ Failed to set announcement channel: ${error.message}`)
          });
        } else {
          await interaction.reply({
            content: getMessage('commands.announcement_channel.error', { error: error.message }, `❌ Failed to set announcement channel: ${error.message}`),
            flags: 64
          });
        }
      } catch (replyError) {
        logger.logError('announcement-channel', `Failed to send error response: ${replyError.message}`);
      }
    }
  },
}; 