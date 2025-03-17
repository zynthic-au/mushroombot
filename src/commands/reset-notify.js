const { SlashCommandBuilder } = require('discord.js');
const { getConfig, updateConfig } = require('../utils/configManager');
const logger = require('../utils/logger');
const { getLanguageValue } = require('../utils/languageManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-notify')
    .setDescription('Set a role to be notified when the server resets')
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('The role to notify when the server resets')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(0x0000000000000008), // ADMINISTRATOR permission
  
  async execute(interaction) {
    try {
      // Defer reply with ephemeral flag
      await interaction.deferReply({ flags: 64 });
      
      const guildId = interaction.guild.id;
      const role = interaction.options.getRole('role');
      const config = getConfig();
      
      // Check if this guild has countdown configuration
      if (!config.countdown?.guilds?.[guildId]) {
        return interaction.editReply({
          content: getLanguageValue('commands.reset_notify.no_config', 'This server is not configured for countdown announcements. Please set up a countdown channel first.'),
          flags: 64
        });
      }
      
      // Update the configuration
      if (!config.countdown.guilds[guildId]) {
        config.countdown.guilds[guildId] = {};
      }
      
      // Update the configuration with the proper path and value
      await updateConfig(`countdown.guilds.${guildId}.notifyRoleId`, role.id);
      
      // Reply to the user with the role name
      await interaction.editReply({
        content: getLanguageValue('commands.reset_notify.success', '✅ The role {roleName} will now be notified when the server resets.').replace('{roleName}', role.name),
        flags: 64
      });
      
      logger.logInfo('reset_notify', `Reset notification role set to ${role.name} (${role.id}) for guild ${guildId}`);
    } catch (error) {
      logger.logError('reset_notify', `Failed to set reset notification role: ${error.message}`);
      await interaction.editReply({
        content: getLanguageValue('commands.reset_notify.error', '❌ Failed to set reset notification role. Please check the bot logs.'),
        flags: 64
      });
    }
  }
}; 