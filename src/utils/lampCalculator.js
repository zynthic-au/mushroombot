const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require('./logger');
const { levelChances } = require('../data/lampProbability');

// Load lamp configuration
const loadLampConfig = () => {
  try {
    const yamlPath = path.join(__dirname, '../config/lampConfig.yml');
    if (fs.existsSync(yamlPath)) {
      const fileContents = fs.readFileSync(yamlPath, 'utf8');
      return yaml.load(fileContents);
    }
    logger.logWarn('lampCalculator', 'No lamp config file found, using default configuration');
    return {
      lamps: {
        // Default lamp configuration
        common: { base: 100, multiplier: 1 },
        rare: { base: 200, multiplier: 1.5 },
        epic: { base: 300, multiplier: 2 },
        legendary: { base: 400, multiplier: 2.5 }
      }
    };
  } catch (error) {
    logger.logError('lampCalculator', error);
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