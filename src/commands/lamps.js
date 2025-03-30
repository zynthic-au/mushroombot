const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { calculateLampsNeeded } = require('../utils/lampCalculator');
const { levelChances } = require('../data/lampProbability');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { getMessage, getLanguageValue } = require('../utils/languageManager');

// Load lamp configuration
const loadLampConfig = () => {
  try {
    const yamlPath = path.join(__dirname, '../config/lampConfig.yml');
    if (fs.existsSync(yamlPath)) {
      const fileContents = fs.readFileSync(yamlPath, 'utf8');
      return yaml.load(fileContents);
    }
    logger.logWarn('lamps', 'No lamp config file found, using default configuration');
    return {
      lamps: {
        common: { base: 100, multiplier: 1 },
        rare: { base: 200, multiplier: 1.5 },
        epic: { base: 300, multiplier: 2 },
        legendary: { base: 400, multiplier: 2.5 }
      }
    };
  } catch (error) {
    logger.logError('lamps', error);
    return {
      lamps: {
        common: { base: 100, multiplier: 1 },
        rare: { base: 200, multiplier: 1.5 },
        epic: { base: 300, multiplier: 2 },
        legendary: { base: 400, multiplier: 2.5 }
      }
    };
  }
};

const lampConfig = loadLampConfig();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lamps')
    .setDescription(getLanguageValue('commands.lamps.description', 'Calculate how many lamps you need for a specific XP or gold amount'))
    .addStringOption(option =>
      option.setName('type')
        .setDescription(getLanguageValue('commands.lamps.option_type', 'What you want to calculate (XP or Gold)'))
        .setRequired(true)
        .addChoices(
          { name: 'XP', value: 'xp' },
          { name: 'Gold', value: 'gold' }
        ))
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription(getLanguageValue('commands.lamps.option_level', 'The lamp level (1-32)'))
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(32))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription(getLanguageValue('commands.lamps.option_amount', 'Your target XP or gold amount'))
        .setRequired(true)
        .setMinValue(1)),
  
  async execute(interaction) {
    try {
      const type = interaction.options.getString('type');
      const lampLevel = interaction.options.getInteger('level');
      const targetAmount = interaction.options.getInteger('amount');
      
      const result = calculateLampsNeeded(type, lampLevel, targetAmount);
      
      // Load rarities data
      const config = lampConfig;
      
      // Set emoji and title based on type
      const typeEmoji = type === 'xp' ? '⚡' : '💰';
      const embedColor = type === 'xp' ? 0x3498db : 0xf1c40f; // Blue for XP, Yellow for Gold
      const typeName = type === 'xp' ? 'XP' : 'Gold';
      
      // Get probabilities for the chosen lamp level
      const probabilities = levelChances[lampLevel];
      const rarityNames = Object.keys(config.rarities);
      
      // Create the item chances array
      const activeRarities = [];
      
      for (let i = 0; i < probabilities.length; i++) {
        const probability = probabilities[i];
        if (probability > 0) {
          const rarityName = rarityNames[i];
          const value = config.rarities[rarityName][type.toLowerCase()];
          const percentChance = (probability * 100).toFixed(2);
          activeRarities.push({
            name: rarityName,
            chance: percentChance,
            value: value
          });
        }
      }
      
      // Format with Discord indents - use the triple greater-than for better formatting
      let itemChancesText = '';
      
      if (activeRarities.length > 0) {
        itemChancesText = '>>> ';
        
        for (const rarity of activeRarities) {
          itemChancesText += `**${rarity.name}**: ${rarity.chance}% (${rarity.value} ${typeName})\n`;
        }
      } else {
        itemChancesText = "No chances available for this lamp level.";
      }
      
      // Calculate total obtained
      const totalObtained = result.lampsNeeded * result.averagePerLamp;
      
      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(getMessage('commands.lamps.embed.title', { typeEmoji, typeName }, `${typeEmoji} ${typeName} Requirement Calculator`))
        .setDescription(getMessage('commands.lamps.embed.description', { 
          targetAmount: targetAmount.toLocaleString(), 
          typeName, 
          lampLevel 
        }, `Here's how many lamps you'll need for ${targetAmount.toLocaleString()} ${typeName} at lamp level ${lampLevel}.`))
        .addFields(
          { name: 'Expected per Lamp', value: `${result.averagePerLamp.toLocaleString()} ${typeName}`, inline: true },
          { name: 'Required Lamps', value: `${result.lampsNeeded.toLocaleString()} lamps`, inline: true },
          { name: 'Total Obtained', value: `${totalObtained.toLocaleString()} ${typeName}`, inline: true },
          {
            name: 'Lamp Level Item Chances',
            value: itemChancesText,
            inline: false
          }
        )
        .setFooter({ text: 'Legend of Mushroom Bot' });
      
      await interaction.reply({
        embeds: [embed],
        flags: 0 // Not ephemeral, so others can see the calculation
      });
      
      // Success logging is now handled in interactionCreate.js
      
    } catch (error) {
      // Log the error using our logger utility - this is now redundant but keeping for safety
      logger.logError('lamps', error);
      
      // Create an error embed
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000) // Red
        .setTitle(getMessage('commands.lamps.error.title', {}, '❌ Error'))
        .setDescription(getMessage('commands.lamps.error.description', { error: error.message }, `Failed to calculate lamp requirements: ${error.message}`))
        .setFooter({ text: 'Legend of Mushroom Bot' });
      
      // Send the error embed
      await interaction.reply({
        embeds: [errorEmbed],
        flags: 64 // Ephemeral, only visible to the user
      });
    }
  },
};
