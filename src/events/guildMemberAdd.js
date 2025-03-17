const { Events } = require('discord.js');
const { getConfig } = require('../utils/configManager');
const { getMessage } = require('../utils/languageManager');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    try {
      const guildId = member.guild.id;
      const config = getConfig();
      
      // Get the welcome channel ID for this guild
      const welcomeChannelId = config.welcome?.guilds?.[guildId]?.channelId;
      
      if (!welcomeChannelId) {
        // No welcome channel configured for this guild
        return;
      }
      
      // Get the channel
      const channel = await member.guild.channels.fetch(welcomeChannelId).catch((error) => {
        logger.logError('guildMemberAdd', `Failed to fetch welcome channel: ${error.message}`);
        return null;
      });
      
      if (!channel) {
        logger.logError('guildMemberAdd', `Could not find welcome channel with ID ${welcomeChannelId} in guild ${guildId}`);
        return;
      }
      
      // Get welcome message from language file
      const welcomeMessage = getMessage('welcome.member_join', { member }, '{member} has joined the New Order!');
      
      // Send the welcome message
      await channel.send(welcomeMessage).catch((error) => {
        logger.logError('guildMemberAdd', `Failed to send welcome message: ${error.message}`);
      });
      
      logger.logInfo('guildMemberAdd', `Welcomed ${member.user.tag} in guild ${member.guild.name}`);
      
    } catch (error) {
      logger.logError('guildMemberAdd', `Error handling new member: ${error.message}`);
    }
  },
}; 