const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateConfig, getConfig } = require('../utils/configManager');
const { getMessage, getLanguageValue } = require('../utils/languageManager');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-channel')
    .setDescription(getLanguageValue('commands.welcome_channel.description', 'Set the channel for welcome messages'))
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription(getLanguageValue('commands.welcome_channel.option_channel', 'The channel for welcome messages'))
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
          content: getMessage('commands.welcome_channel.no_permissions', { channel }, `❌ I don't have permissions to send messages in ${channel}. Please give me the required permissions and try again.`),
          flags: 64
        });
        return;
      }
      
      // Get current guild configuration or create a new one
      const config = getConfig();
      const guildConfig = config.welcome?.guilds?.[guildId] || {};
      
      // Update the config with the new channel ID (guild-specific)
      const configUpdated = await updateConfig(`welcome.guilds.${guildId}`, {
        ...guildConfig,
        channelId: channel.id
      });
      
      if (!configUpdated) {
        await interaction.reply({
          content: getMessage('commands.welcome_channel.config_failed', {}, `❌ Failed to update configuration. Please check the bot logs.`),
          flags: 64
        });
        return;
      }
      
      await interaction.reply({
        content: getMessage('commands.welcome_channel.success', { channel }, `✅ Welcome messages will now be sent in ${channel}`),
        flags: 64
      });
      
      // Log the configuration change
      logger.logInfo('welcome-channel', `Guild ${guild.name} (${guildId}) set welcome channel to ${channel.name} (${channel.id})`);
      
    } catch (error) {
      logger.logError('welcome-channel', error);
      
      await interaction.reply({
        content: getMessage('commands.welcome_channel.error', { error: error.message }, `❌ Failed to set welcome channel: ${error.message}`),
        flags: 64
      });
    }
  },
}; 