const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { levelChances } = require('../data/lampProbability');

// Load lamp rarity configuration
const loadLampConfig = () => {
  try {
    const configPath = path.join(__dirname, '../config/lampConfig.yml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    return yaml.load(fileContents);
  } catch (error) {
    console.error('Error loading lamp configuration:', error);
    return null;
  }
};

/**
 * Calculate the average XP or gold per lamp for a specific lamp level
 * @param {string} type - 'xp' or 'gold'
 * @param {number} lampLevel - Level of the lamp (1-32)
 * @returns {number} - Average XP or gold per lamp
 */
const calculateAveragePerLamp = (type, lampLevel) => {
  if (!levelChances[lampLevel]) {
    throw new Error(`Invalid lamp level: ${lampLevel}. Valid levels are 1-32.`);
  }

  const config = loadLampConfig();
  if (!config) {
    throw new Error('Failed to load lamp configuration');
  }

  const rarityValues = Object.values(config.rarities);
  const probabilities = levelChances[lampLevel];

  // Calculate weighted average based on probabilities for each rarity
  let averageValue = 0;
  for (let i = 0; i < probabilities.length; i++) {
    const probability = probabilities[i];
    const value = rarityValues[i][type.toLowerCase()];
    averageValue += probability * value;
  }

  return averageValue;
};

/**
 * Calculate how many lamps are needed to reach a target XP or gold amount
 * @param {string} type - 'xp' or 'gold'
 * @param {number} lampLevel - Level of the lamp (1-32)
 * @param {number} targetAmount - Target XP or gold amount
 * @returns {Object} - Result with lamp count and additional information
 */
const calculateLampsNeeded = (type, lampLevel, targetAmount) => {
  const averagePerLamp = calculateAveragePerLamp(type, lampLevel);
  const lampsNeeded = Math.ceil(targetAmount / averagePerLamp);
  
  return {
    lampsNeeded,
    averagePerLamp,
    targetAmount,
    type: type.toUpperCase(),
    lampLevel
  };
};

module.exports = {
  calculateLampsNeeded,
  calculateAveragePerLamp
}; 