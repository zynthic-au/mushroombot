const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { calculateLampsNeeded } = require('../utils/lampCalculator');
const { levelChances } = require('../data/lampProbability');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lamps')
    .setDescription('Calculate how many lamps you need for a specific XP or gold amount')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('What you want to calculate (XP or Gold)')
        .setRequired(true)
        .addChoices(
          { name: 'XP', value: 'xp' },
          { name: 'Gold', value: 'gold' }
        ))
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('The lamp level (1-32)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(32))
    .addIntegerOption(option =>
      option.setName('target')
        .setDescription('Your target XP or gold amount')
        .setRequired(true)
        .setMinValue(1)),
  
  async execute(interaction) {
    try {
      const type = interaction.options.getString('type');
      const lampLevel = interaction.options.getInteger('level');
      const targetAmount = interaction.options.getInteger('target');
      
      const result = calculateLampsNeeded(type, lampLevel, targetAmount);
      
      // Load rarities data
      const configPath = path.join(__dirname, '../config/lampConfig.yml');
      const fileContents = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(fileContents);
      
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
        .setTitle(`${typeEmoji} ${typeName} Requirement Calculator`)
        .setDescription(`Here's how many lamps you'll need for ${result.targetAmount.toLocaleString()} ${typeName} at lamp level ${lampLevel}.`)
        .addFields(
          { 
            name: `Expected ${typeName} per Lamp`,
            value: `${result.averagePerLamp.toFixed(2)} ${typeName}`,
            inline: true
          },
          { 
            name: 'Required Lamps',
            value: `${result.lampsNeeded.toLocaleString()} lamps`, 
            inline: true 
          },
          { 
            name: `Total ${typeName}`,
            value: `${totalObtained.toFixed(2)} ${typeName}`, 
            inline: true 
          },
          {
            name: `Lamp Level Item Chances`,
            value: itemChancesText,
            inline: false
          }
        )
        .setFooter({ text: 'Legend of Mushroom Bot' });
      
      await interaction.reply({
        embeds: [embed],
        flags: 64
      });
      
      // Success logging is now handled in interactionCreate.js
      
    } catch (error) {
      // Log the error using our logger utility - this is now redundant but keeping for safety
      logger.logError('lamps', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000) // Red color for errors
        .setTitle('❌ Error')
        .setDescription(`Failed to calculate lamp requirements: ${error.message}`)
        .setFooter({ text: 'Please try again with different parameters' });
      
      await interaction.reply({
        embeds: [errorEmbed],
        flags: 64
      });
    }
  },
};
