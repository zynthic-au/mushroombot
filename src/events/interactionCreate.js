const logger = require('../utils/logger');
const { getMessage } = require('../utils/languageManager');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.logWarn('commands', `No command matching ${interaction.commandName} was found`);
      return;
    }

    // Log command usage with details
    logger.logCommand(interaction);

    try {
      await command.execute(interaction);
      
      // Log successful command completion
      logger.logCommand(interaction, 'Success');
    } catch (error) {
      // Log command error
      logger.logError(interaction.commandName, error);
      logger.logCommand(interaction, 'Error', error.message);
      
      // Get error message from language file
      const errorMessage = getMessage('errors.command_execution', {}, 'There was an error while executing this command!');
      
      // Reply to the user with an error message
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: errorMessage, 
          flags: 64
        });
      } else {
        await interaction.reply({ 
          content: errorMessage, 
          flags: 64
        });
      }
    }
  },
}; 