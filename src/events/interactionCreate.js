const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
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
      
      // Reply to the user with an error message
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: 'There was an error while executing this command!', 
          flags: 64
        });
      } else {
        await interaction.reply({ 
          content: 'There was an error while executing this command!', 
          flags: 64
        });
      }
    }
  },
}; 