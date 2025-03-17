const { EmbedBuilder } = require('discord.js');
const { getConfig, updateConfig } = require('./configManager');
const { getLanguageValue, formatText } = require('./languageManager');
const logger = require('./logger');

/**
 * CountdownManager - Handles server reset countdowns and announcements
 * 
 * This module manages countdown timers for server resets and generates
 * announcements when servers reset. It supports multiple guilds with
 * different reset times and configurations.
 */

// Maps to store state for multiple servers
const state = {
  // Countdown timers and messages
  countdownIntervals: new Map(),
  countdownMessages: new Map(),
  
  // Reset announcement timers and messages
  resetMessages: new Map(),
  resetTimers: new Map(),
  lastResetTimes: new Map(),
  
  // Channel tracking
  channelIds: new Map() // Track current channel IDs for each guild
};

// ===========================
// Time calculation functions
// ===========================

/**
 * Calculate time remaining until the next reset time
 * @param {string} resetTime - The time of day for reset (HH:MM:SS)
 * @param {string} timezone - The timezone for the reset time (e.g., UTC-4)
 * @returns {Object} Object containing hours, minutes, seconds until reset
 */
function calculateTimeRemaining(resetTime = '00:00:00', timezone = 'UTC-4') {
  // Current time in UTC
  const now = new Date();
  
  // Parse reset time parts
  const [resetHours, resetMinutes, resetSeconds] = resetTime.split(':').map(Number);
  
  // Calculate UTC offset based on timezone string (assuming format like UTC-4)
  const offsetMatch = timezone.match(/UTC([+-]\d+)/);
  const utcOffset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
  
  // Create reset time for today
  const resetDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    resetHours - utcOffset, // Adjust for timezone
    resetMinutes,
    resetSeconds
  ));
  
  // If reset time has already passed today, set it for tomorrow
  if (now > resetDate) {
    resetDate.setUTCDate(resetDate.getUTCDate() + 1);
  }
  
  // Calculate time difference in milliseconds
  const timeDiff = resetDate - now;
  
  // Convert to hours, minutes, seconds
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  // Check if reset is about to happen (within 5 seconds)
  const isResetImminent = hours === 0 && minutes === 0 && seconds <= 5;
  
  return { hours, minutes, seconds, isResetImminent, resetDate };
}

/**
 * Format time duration in a human-readable format
 * @param {number} hours - Hours
 * @param {number} minutes - Minutes
 * @param {number} seconds - Seconds (not used in display, kept for API compatibility)
 * @returns {string} Formatted time string
 */
function formatTime(hours, minutes, seconds) {
  const hourText = hours === 1 ? "1hr" : `${hours}hrs`;
  const minuteText = minutes === 1 ? "1min" : `${minutes}mins`;
  
  if (hours > 0) {
    return `${hourText} ${minuteText}`;
  } else {
    return minuteText;
  }
}

/**
 * Parse a reset time string and timezone into a Date object
 * @param {string} resetTime - The time string in HH:MM:SS format
 * @param {string} timezone - The timezone string (e.g., 'UTC-4')
 * @returns {Date} The parsed reset time as a Date object
 */
function parseResetTime(resetTime = '00:00:00', timezone = 'UTC-4') {
  // Parse reset time parts
  const [hours, minutes, seconds] = resetTime.split(':').map(Number);
  
  // Calculate UTC offset based on timezone string (assuming format like UTC-4)
  const offsetMatch = timezone.match(/UTC([+-]\d+)/);
  const utcOffset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
  
  // Create reset time for today
  const now = new Date();
  const resetDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours - utcOffset, // Adjust for timezone
    minutes,
    seconds
  ));
  
  // If reset time has already passed today, set it for tomorrow
  if (now > resetDate) {
    resetDate.setUTCDate(resetDate.getUTCDate() + 1);
  }
  
  return resetDate;
}

// ===========================
// Embed creation functions
// ===========================

/**
 * Create the countdown embed
 * @param {string} guildId - ID of the guild for customization
 * @param {number} hours - Hours
 * @param {number} minutes - Minutes
 * @param {number} seconds - Seconds (not used in display, kept for API compatibility)
 * @returns {EmbedBuilder} Discord embed for the countdown
 */
function createCountdownEmbed(guildId, hours, minutes, seconds) {
  try {
    const config = getConfig();
    
    // Get guild-specific settings or fallback to defaults
    const guildSettings = config.countdown?.guilds?.[guildId] || {};
    const serverName = guildSettings.serverName || config.countdown?.serverName || 'Server';
    const timezone = guildSettings.timezone || config.countdown?.timezone || 'UTC-4';
    const resetTime = guildSettings.resetTime || config.countdown?.resetTime || '00:00:00';
    
    // Format time remaining
    const timeRemaining = formatTime(hours, minutes, 0); // Always use 0 seconds for display
    
    // Current time for footer
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Get embed configuration from language file
    const embedColorStr = getLanguageValue('countdown.embed.color', '0x3498db').toString();
    // Properly convert hex color string to a number, handling both '0x' prefix and without
    let embedColor = parseColorString(embedColorStr, 0x3498db, 'countdown');
    
    const embedTitle = getLanguageValue('countdown.embed.title', '⏰ Server Reset Countdown');
    const embedDescription = getLanguageValue('countdown.embed.description', 'Time remaining until {serverName} resets at {resetTime} {timezone}.');
    const embedThumbnail = getLanguageValue('countdown.embed.thumbnail');
    const embedFooter = getLanguageValue('countdown.embed.footer', 'Legend of Mushroom Bot • Last updated: {currentTime}');
    
    // Get field configurations
    const timeRemainingField = {
      name: getLanguageValue('countdown.embed.fields.time_remaining.name', '⏱️ Time Until Reset'),
      value: getLanguageValue('countdown.embed.fields.time_remaining.value', '**{timeRemaining}**'),
      inline: getLanguageValue('countdown.embed.fields.time_remaining.inline', true)
    };
    
    const nextResetField = {
      name: getLanguageValue('countdown.embed.fields.next_reset.name', '🕒 Reset Time'),
      value: getLanguageValue('countdown.embed.fields.next_reset.value', '**{resetTime} {timezone}**'),
      inline: getLanguageValue('countdown.embed.fields.next_reset.inline', true)
    };
    
    const serverField = {
      name: getLanguageValue('countdown.embed.fields.server.name', '🖥️ Server'),
      value: getLanguageValue('countdown.embed.fields.server.value', '**{serverName}**'),
      inline: getLanguageValue('countdown.embed.fields.server.inline', true)
    };
    
    // Replace placeholders in texts
    const replacements = {
      serverName,
      resetTime,
      timezone,
      timeRemaining,
      currentTime
    };
    
    const formattedDescription = formatText(embedDescription, replacements);
    const formattedTimeRemainingValue = formatText(timeRemainingField.value, replacements);
    const formattedNextResetValue = formatText(nextResetField.value, replacements);
    const formattedServerValue = formatText(serverField.value, replacements);
    const formattedFooter = formatText(embedFooter, replacements);
    
    // Create the embed with language configuration
    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(embedTitle)
      .setDescription(formattedDescription)
      .setThumbnail(embedThumbnail)
      .addFields(
        { 
          name: timeRemainingField.name,
          value: formattedTimeRemainingValue,
          inline: timeRemainingField.inline
        },
        {
          name: nextResetField.name,
          value: formattedNextResetValue,
          inline: nextResetField.inline
        },
        {
          name: serverField.name,
          value: formattedServerValue,
          inline: serverField.inline
        }
      )
      .setFooter({ text: formattedFooter });
    
    return embed;
  } catch (error) {
    logger.logError('countdown', `Error creating countdown embed: ${error.message}`);
    // Return a simple error embed if something goes wrong
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(getLanguageValue('countdown.error.title', '⚠️ Error Creating Countdown'))
      .setDescription(getLanguageValue('countdown.error.description', 'There was an error creating the countdown display. Please check the bot logs.'))
      .setFooter({ text: 'Legend of Mushroom Bot' });
  }
}

/**
 * Create the reset announcement embed
 * @param {string} guildId - ID of the guild for customization
 * @param {Date} resetTime - The time when the reset occurred
 * @returns {EmbedBuilder} Discord embed for the reset announcement
 */
function createResetEmbed(guildId, resetTime) {
  try {
    const config = getConfig();
    
    // Get guild-specific settings or fallback to defaults
    const guildSettings = config.countdown?.guilds?.[guildId] || {};
    const serverName = guildSettings.serverName || config.countdown?.serverName || 'Server';
    const timezone = guildSettings.timezone || config.countdown?.timezone || 'UTC-4';
    
    // Calculate time elapsed since reset
    const now = new Date();
    const timeDiff = now - resetTime;
    
    // Convert to hours, minutes, seconds
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format time elapsed
    const timeElapsed = formatTime(hours, minutes, 0); // Always use 0 seconds for display
    
    // Format reset time
    const resetTimeString = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Get auto-delete time
    const autoDeleteHours = getLanguageValue('reset.auto_delete_hours', 3);
    const remainingHours = autoDeleteHours - hours;
    const remainingMinutes = minutes === 0 ? 0 : 59 - minutes;
    const deleteTime = remainingMinutes === 0 ? `${remainingHours}hrs` : `${remainingHours - 1}hrs ${remainingMinutes}mins`;
    
    // Get embed configuration from language file
    const embedColorStr = getLanguageValue('reset.embed.color', '15844367').toString();
    // Properly convert hex color string to a number
    let embedColor = parseColorString(embedColorStr, 0xF1C40F, 'reset');
    
    const embedTitle = getLanguageValue('reset.embed.title', '🔄 Server Reset Complete');
    const embedDescription = getLanguageValue('reset.embed.description', '**{serverName}** was reset at **{resetTime}** **{timezone}**.');
    const embedThumbnail = getLanguageValue('reset.embed.thumbnail', 'https://i.imgur.com/bbGNjdZ.png');
    const embedFooter = getLanguageValue('reset.embed.footer', 'Legend of Mushroom Bot • This message will auto-delete in {deleteTime}');
    
    // Get field configurations
    const timeElapsedField = {
      name: getLanguageValue('reset.embed.fields.time_elapsed.name', '⏱️ Time Since Reset'),
      value: getLanguageValue('reset.embed.fields.time_elapsed.value', '**{timeElapsed}**'),
      inline: getLanguageValue('reset.embed.fields.time_elapsed.inline', true)
    };
    
    const resetTimeField = {
      name: getLanguageValue('reset.embed.fields.reset_time.name', '🕒 Reset Time'),
      value: getLanguageValue('reset.embed.fields.reset_time.value', '**{resetTime} {timezone}**'),
      inline: getLanguageValue('reset.embed.fields.reset_time.inline', true)
    };
    
    const serverField = {
      name: getLanguageValue('reset.embed.fields.server.name', '🖥️ Server'),
      value: getLanguageValue('reset.embed.fields.server.value', '**{serverName}**'),
      inline: getLanguageValue('reset.embed.fields.server.inline', true)
    };
    
    // Replace placeholders in texts
    const replacements = {
      serverName,
      resetTime: resetTimeString,
      timezone,
      timeElapsed,
      deleteTime
    };
    
    const formattedDescription = formatText(embedDescription, replacements);
    const formattedTimeElapsedValue = formatText(timeElapsedField.value, replacements);
    const formattedResetTimeValue = formatText(resetTimeField.value, replacements);
    const formattedServerValue = formatText(serverField.value, replacements);
    const formattedFooter = formatText(embedFooter, replacements);
    
    // Create the embed with language configuration
    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(embedTitle)
      .setDescription(formattedDescription)
      .setThumbnail(embedThumbnail)
      .addFields(
        { 
          name: timeElapsedField.name,
          value: formattedTimeElapsedValue,
          inline: timeElapsedField.inline
        },
        {
          name: resetTimeField.name,
          value: formattedResetTimeValue,
          inline: resetTimeField.inline
        },
        {
          name: serverField.name,
          value: formattedServerValue,
          inline: serverField.inline
        }
      )
      .setFooter({ text: formattedFooter });
    
    return embed;
  } catch (error) {
    logger.logError('reset', `Error creating reset embed: ${error.message}`);
    // Return a simple error embed if something goes wrong
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('⚠️ Error Creating Reset Announcement')
      .setDescription('There was an error creating the reset announcement. Please check the bot logs.')
      .setFooter({ text: 'Legend of Mushroom Bot' });
  }
}

/**
 * Parse a color string to a number
 * @param {string} colorStr - The color string to parse
 * @param {number} defaultColor - The default color to use if parsing fails
 * @param {string} logContext - The context for logging errors
 * @returns {number} The parsed color
 */
function parseColorString(colorStr, defaultColor, logContext) {
  try {
    let color = colorStr.startsWith('0x') 
      ? parseInt(colorStr.substring(2), 16) 
      : parseInt(colorStr, 16);
    
    // Make sure the color is valid
    if (isNaN(color) || color < 0 || color > 0xFFFFFF) {
      return defaultColor;
    }
    
    return color;
  } catch (error) {
    logger.logError(logContext, `Failed to parse color "${colorStr}": ${error.message}`);
    return defaultColor;
  }
}

// ===========================
// Channel management functions
// ===========================

/**
 * Clean up old countdown and reset messages in a channel
 * @param {TextChannel} channel - The Discord channel to clean
 * @returns {Promise<void>}
 */
async function cleanupOldMessages(channel) {
  try {
    // Fetch the last 100 messages in the channel
    const messages = await channel.messages.fetch({ limit: 100 });
    
    // Filter for messages from the bot that are countdown or reset announcements
    const oldMessages = messages.filter(msg => 
      msg.author.id === channel.client.user.id && 
      msg.embeds.length > 0 && 
      (msg.embeds[0].title?.includes('Server Reset Countdown') ||
       msg.embeds[0].title?.includes('Server Reset Complete'))
    );
    
    if (oldMessages.size > 0) {
      logger.logInfo('cleanup', `Found ${oldMessages.size} old messages to clean up in ${channel.name}`);
      await channel.bulkDelete(oldMessages).catch(error => {
        // If bulk delete fails (messages > 14 days old), delete them one by one
        if (error.code === 50034) {
          return Promise.all(oldMessages.map(msg => msg.delete().catch(() => null)));
        }
        throw error;
      });
    }
  } catch (error) {
    logger.logError('cleanup', `Error cleaning up old messages: ${error.message}`);
  }
}

/**
 * Get guild configuration with fallbacks to default values
 * @param {string} guildId - ID of the guild
 * @returns {Object} Guild configuration with fallbacks
 */
function getGuildConfig(guildId) {
  const config = getConfig();
  const guildSettings = config.countdown?.guilds?.[guildId] || {};
  
  return {
    serverName: guildSettings.serverName || config.countdown?.serverName || 'Server',
    timezone: guildSettings.timezone || config.countdown?.timezone || 'UTC-4',
    resetTime: guildSettings.resetTime || config.countdown?.resetTime || '00:00:00',
    channelId: guildSettings.channelId
  };
}

// ===========================
// Countdown management functions
// ===========================

/**
 * Start a countdown for a specific guild
 * @param {Client} client - Discord.js client
 * @param {string} guildId - ID of the guild
 * @param {string} channelId - ID of the channel to post in
 * @returns {Promise<boolean>} True if started successfully, false otherwise
 */
async function startCountdown(client, guildId, channelId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      logger.logError('countdown', `Failed to find channel ${channelId} for guild ${guildId}`);
      return false;
    }

    // Clean up old messages first
    await cleanupOldMessages(channel);

    // Get guild config
    const guildConfig = getGuildConfig(guildId);
    const resetDate = parseResetTime(guildConfig.resetTime, guildConfig.timezone);
    const { hours, minutes, seconds } = calculateTimeRemaining(guildConfig.resetTime, guildConfig.timezone);

    // Save the current reset time before clearing state
    const currentResetTime = state.lastResetTimes.get(guildId);

    // Clear any existing state for this guild
    clearState(guildId);

    // Send initial countdown message
    const embed = createCountdownEmbed(guildId, hours, minutes, seconds);
    if (!embed) {
      logger.logError('countdown', `Failed to create countdown embed for guild ${guildId}`);
      return false;
    }

    const message = await channel.send({ embeds: [embed] });
    
    // Update state with new message
    state.countdownMessages.set(guildId, message);
    state.channelIds.set(guildId, channelId);
    state.lastResetTimes.set(guildId, resetDate);

    // Schedule the next update
    const interval = setInterval(() => updateCountdownTimer(client, guildId), 60000);
    state.countdownIntervals.set(guildId, interval);

    // If there was an active reset message, recreate it in the new channel
    if (currentResetTime) {
      // Wait a short moment to ensure the countdown message is fully sent
      setTimeout(async () => {
        await sendResetAnnouncement(client, guildId, channelId, currentResetTime);
      }, 1000);
    }

    logger.logInfo('countdown', `Started countdown for guild ${guildId}`);
    return true;
  } catch (error) {
    logger.logError('countdown', `Error starting countdown for guild ${guildId}: ${error}`);
    return false;
  }
}

/**
 * Update function used by the countdown timer
 * @param {Client} client - Discord.js client
 * @param {string} guildId - ID of the guild
 * @param {string} channelId - ID of the channel
 */
async function updateCountdownTimer(client, guildId, channelId) {
  try {
    // Get updated configuration
    const { resetTime, timezone } = getGuildConfig(guildId);
    
    // Calculate time remaining
    const { hours, minutes, seconds, isResetImminent, resetDate } = calculateTimeRemaining(resetTime, timezone);
    
    // Create new embed
    const newEmbed = createCountdownEmbed(guildId, hours, minutes, 0); // Always use 0 seconds for display
    if (!newEmbed) {
      logger.logError('countdown', 'Failed to create new embed for update');
      return;
    }
    
    // Get saved message
    const savedMessage = state.countdownMessages.get(guildId);
    if (!savedMessage) {
      clearInterval(state.countdownIntervals.get(guildId));
      state.countdownIntervals.delete(guildId);
      return;
    }
    
    // Update the message
    try {
      await savedMessage.edit({ embeds: [newEmbed] });
      
      // Check if reset is imminent and trigger reset announcement
      if (isResetImminent) {
        scheduleResetAnnouncement(client, guildId, channelId, resetDate);
      }
    } catch (error) {
      handleCountdownUpdateError(error, guildId);
    }
  } catch (error) {
    logger.logError('countdown', `Error updating countdown for guild ${guildId}: ${error.message}`);
  }
}

/**
 * Schedule a reset announcement at the exact reset time
 * @param {Client} client - Discord.js client
 * @param {string} guildId - ID of the guild
 * @param {string} channelId - ID of the channel
 * @param {Date} resetDate - The exact date/time of the reset
 */
function scheduleResetAnnouncement(client, guildId, channelId, resetDate) {
  // Wait until the exact reset time
  const timeUntilReset = resetDate - new Date();
  if (timeUntilReset > 0) {
    setTimeout(() => {
      sendResetAnnouncement(client, guildId, channelId, resetDate)
        .catch(error => {
          logger.logError('countdown', `Failed to send reset announcement: ${error.message}`);
        });
    }, timeUntilReset);
  } else {
    // If we're already past the reset time, send immediately
    sendResetAnnouncement(client, guildId, channelId, resetDate)
      .catch(error => {
        logger.logError('countdown', `Failed to send reset announcement: ${error.message}`);
      });
  }
}

/**
 * Handle errors during countdown update
 * @param {Error} error - The error that occurred
 * @param {string} guildId - ID of the guild
 */
function handleCountdownUpdateError(error, guildId) {
  if (error.message.includes('Unknown Message')) {
    // Message was deleted, remove it from our tracking
    state.countdownMessages.delete(guildId);
    clearInterval(state.countdownIntervals.get(guildId));
    state.countdownIntervals.delete(guildId);
    logger.logWarn('countdown', `Countdown message for guild ${guildId} was deleted, will recreate on next update`);
  } else {
    logger.logError('countdown', `Failed to update countdown message: ${error.message}`);
  }
}

/**
 * Stop the countdown timer for a specific guild
 * @param {string} guildId - ID of the guild
 */
function stopCountdown(guildId) {
  // Clear the interval
  if (state.countdownIntervals.has(guildId)) {
    clearInterval(state.countdownIntervals.get(guildId));
    state.countdownIntervals.delete(guildId);
  }
  
  // Clear the message reference
  if (state.countdownMessages.has(guildId)) {
    state.countdownMessages.delete(guildId);
  }
}

/**
 * Stop all countdown timers
 */
function stopAllCountdowns() {
  // Clear all intervals
  for (const [guildId, interval] of state.countdownIntervals.entries()) {
    clearInterval(interval);
    state.countdownIntervals.delete(guildId);
  }
  
  // Clear all message references
  state.countdownMessages.clear();
}

/**
 * Update the countdown message for a specific guild on demand
 * @param {Client} client - Discord.js client
 * @param {string} guildId - ID of the guild
 * @returns {Promise<void>}
 */
async function updateCountdown(client, guildId) {
  try {
    const config = getConfig();
    if (!config.countdown?.guilds?.[guildId]) {
      return;
    }

    const guildConfig = config.countdown.guilds[guildId];
    const { resetTime, timezone, channelId } = guildConfig;

    if (!resetTime || !channelId) {
      return;
    }

    // Calculate time remaining
    const { hours, minutes, seconds, isResetImminent, resetDate } = calculateTimeRemaining(resetTime, timezone);

    // Create the countdown embed
    const embed = createCountdownEmbed(guildId, hours, minutes, 0); // Always use 0 seconds for display
    if (!embed) {
      return;
    }

    // Check if we have a saved message
    const savedMessage = state.countdownMessages.get(guildId);
    if (!savedMessage) {
      // Try to recreate the message
      await recreateCountdownMessage(client, guildId, channelId, embed);
      return;
    }

    // Update the existing message
    try {
      await savedMessage.edit({ embeds: [embed] });
      
      // Check if reset is imminent and trigger reset announcement
      if (isResetImminent) {
        scheduleResetAnnouncement(client, guildId, channelId, resetDate);
      }
    } catch (error) {
      handleCountdownUpdateError(error, guildId);
    }
  } catch (error) {
    logger.logError('countdown', `Error updating countdown for guild ${guildId}: ${error.message}`);
  }
}

/**
 * Recreate a countdown message if it doesn't exist
 * @param {Client} client - Discord.js client
 * @param {string} guildId - ID of the guild
 * @param {string} channelId - ID of the channel
 * @param {EmbedBuilder} embed - The embed to send
 */
async function recreateCountdownMessage(client, guildId, channelId, embed) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      logger.logWarn('countdown', `Could not find channel with ID ${channelId} for guild ${guildId}`);
      return;
    }

    const newMessage = await channel.send({ embeds: [embed] });
    state.countdownMessages.set(guildId, newMessage);
    logger.logInfo('countdown', `Recreated countdown message for guild ${guildId} in channel ${channel.name}`);
  } catch (error) {
    logger.logError('countdown', `Failed to recreate countdown message for guild ${guildId}: ${error.message}`);
  }
}

// ===========================
// Reset announcement functions
// ===========================

/**
 * Sends a reset announcement message with an optional role mention and starts a count-up timer.
 * @param {import('discord.js').Client} client - The Discord.js client instance.
 * @param {string} guildId - The ID of the guild where the announcement is sent.
 * @param {string} channelId - The ID of the channel to post the announcement in.
 * @param {Date} [resetTime] - The specific reset time to use; defaults to current time if omitted.
 * @returns {Promise<boolean>} Resolves to true if the announcement is sent successfully, false otherwise.
 */
async function sendResetAnnouncement(client, guildId, channelId, resetTime = null) {
  try {
    // Validate inputs
    if (!client?.isReady() || !guildId || !channelId) {
      logger.logError('reset', 'Invalid parameters: client, guildId, or channelId missing or invalid');
      return false;
    }

    // Fetch guild and channel
    const guild = await client.guilds.fetch(guildId).catch((error) => {
      logger.logError('reset', `Failed to fetch guild ${guildId}: ${error.message}`);
      return null;
    });
    const channel = await client.channels.fetch(channelId).catch((error) => {
      logger.logError('reset', `Failed to fetch channel ${channelId}: ${error.message}`);
      return null;
    });

    if (!guild || !channel || !channel.isTextBased()) {
      logger.logError('reset', `Invalid guild (${guildId}) or channel (${channelId})`);
      return false;
    }

    // Stop any existing reset timer for this guild
    stopResetTimer(guildId);

    // Set reset time
    const actualResetTime = resetTime instanceof Date && !isNaN(resetTime) ? resetTime : new Date();
    state.lastResetTimes.set(guildId, actualResetTime);

    // Create initial reset embed
    const embed = createResetEmbed(guildId, actualResetTime);
    if (!embed) {
      logger.logError('reset', `Failed to create reset embed for guild ${guildId}`);
      return false;
    }

    // Get notification role mention
    const config = getConfig();
    const notifyRoleId = config.countdown?.guilds?.[guildId]?.notifyRoleId;
    let content = '';

    if (notifyRoleId) {
      const role = guild.roles.cache.get(notifyRoleId);
      if (role) {
        content = `${role}`; // Use role.toString() for clean mention
        logger.logInfo('reset', `Including role notification for role ID ${notifyRoleId} (${role.name})`);
      } else {
        logger.logWarn('reset', `Role ID ${notifyRoleId} not found in guild ${guildId}`);
      }
    }

    // Send the announcement
    const message = await channel.send({
      content,
      embeds: [embed],
    }).catch((error) => {
      logger.logError('reset', `Failed to send reset announcement in channel ${channelId}: ${error.message}`);
      return null;
    });

    if (!message) {
      return false;
    }

    // Store message reference
    state.resetMessages.set(guildId, message);

    // Start update timer (configurable interval)
    const updateIntervalMs = config.countdown?.updateIntervalMs || 60000; // Default to 1 minute
    const interval = setInterval(() => updateResetTimer(guildId), updateIntervalMs);
    state.resetTimers.set(guildId, interval);

    logger.logInfo('reset', `Server reset announcement sent for guild ${guildId} in channel ${channel.name}`);
    return true;
  } catch (error) {
    logger.logError('reset', `Unexpected error sending reset announcement for guild ${guildId}: ${error.message}`);
    return false;
  }
}

/**
 * Update function used by the reset timer
 * @param {string} guildId - ID of the guild
 */
async function updateResetTimer(guildId) {
  try {
    const resetTime = state.lastResetTimes.get(guildId);
    if (!resetTime) {
      clearInterval(state.resetTimers.get(guildId));
      state.resetTimers.delete(guildId);
      return;
    }
    
    // Check if it's time to delete the message
    const now = new Date();
    const hoursSinceReset = (now - resetTime) / (1000 * 60 * 60);
    const autoDeleteHours = getLanguageValue('reset.auto_delete_hours', 3);
    
    if (hoursSinceReset >= autoDeleteHours) {
      await deleteResetMessage(guildId, autoDeleteHours);
      state.lastResetTimes.delete(guildId); // Clear the reset time when message is deleted
      return;
    }
    
    // Update the message
    await updateResetMessage(guildId, resetTime);
  } catch (error) {
    logger.logError('reset', `Error updating reset announcement for guild ${guildId}: ${error.message}`);
  }
}

/**
 * Delete a reset message when it's time
 * @param {string} guildId - ID of the guild
 * @param {number} autoDeleteHours - Number of hours after which to delete
 */
async function deleteResetMessage(guildId, autoDeleteHours) {
  // Time to delete the message
  const message = state.resetMessages.get(guildId);
  if (message) {
    await message.delete().catch((error) => {
      logger.logError('reset', `Failed to delete reset announcement: ${error.message}`);
    });
  }
  
  // Clean up
  state.resetMessages.delete(guildId);
  clearInterval(state.resetTimers.get(guildId));
  state.resetTimers.delete(guildId);
  logger.logInfo('reset', `Auto-deleted reset announcement for guild ${guildId} after ${autoDeleteHours} hours`);
}

/**
 * Update a reset message
 * @param {string} guildId - ID of the guild
 * @param {Date} resetTime - The time when the reset occurred
 */
async function updateResetMessage(guildId, resetTime) {
  const newEmbed = createResetEmbed(guildId, resetTime);
  if (!newEmbed) {
    return;
  }
  
  const savedMessage = state.resetMessages.get(guildId);
  if (!savedMessage) {
    clearInterval(state.resetTimers.get(guildId));
    state.resetTimers.delete(guildId);
    return;
  }
  
  await savedMessage.edit({ embeds: [newEmbed] }).catch((error) => {
    if (error.message.includes('Unknown Message')) {
      state.resetMessages.delete(guildId);
      clearInterval(state.resetTimers.get(guildId));
      state.resetTimers.delete(guildId);
    } else {
      logger.logError('reset', `Failed to update reset announcement: ${error.message}`);
    }
  });
}

/**
 * Stop the reset timer for a specific guild
 * @param {string} guildId - ID of the guild
 */
function stopResetTimer(guildId) {
  // Clear the interval
  if (state.resetTimers.has(guildId)) {
    clearInterval(state.resetTimers.get(guildId));
    state.resetTimers.delete(guildId);
  }
  
  // Clear the message reference
  if (state.resetMessages.has(guildId)) {
    state.resetMessages.delete(guildId);
  }
}

// ===========================
// State management functions
// ===========================

/**
 * Get the current state for a guild
 * @param {string} guildId - ID of the guild
 * @returns {Object|null} The current state for the guild
 */
function getState(guildId) {
  return {
    channelId: state.channelIds.get(guildId),
    messageId: state.countdownMessages.get(guildId)?.id,
    resetMessageId: state.resetMessages.get(guildId)?.id,
    lastUpdate: Date.now(),
    resetTime: state.lastResetTimes.get(guildId)?.getTime()
  };
}

/**
 * Set the state for a guild
 * @param {string} guildId - ID of the guild
 * @param {Object} newState - The new state to set
 */
function setState(guildId, newState) {
  const { channelId, messageId, lastUpdate, resetTime } = newState;
  
  if (channelId) {
    state.channelIds.set(guildId, channelId);
  }
  
  if (messageId) {
    state.countdownMessages.set(guildId, { id: messageId });
  }
  
  if (resetTime) {
    state.lastResetTimes.set(guildId, new Date(resetTime));
  }
}

/**
 * Clear the state for a guild
 * @param {string} guildId - ID of the guild
 */
function clearState(guildId) {
  state.channelIds.delete(guildId);
  state.countdownMessages.delete(guildId);
  state.resetMessages.delete(guildId);
  state.lastResetTimes.delete(guildId);
  
  // Clear any running intervals/timers
  if (state.countdownIntervals.has(guildId)) {
    clearInterval(state.countdownIntervals.get(guildId));
    state.countdownIntervals.delete(guildId);
  }
  
  if (state.resetTimers.has(guildId)) {
    clearInterval(state.resetTimers.get(guildId));
    state.resetTimers.delete(guildId);
  }
}

// ===========================
// Initialization functions
// ===========================

/**
 * Initialize all countdowns when the bot starts
 * @param {Client} client - Discord.js client
 */
async function initializeCountdown(client) {
  try {
    // Clear any existing state
    clearAllState();
    
    logger.logInfo('countdown', 'Countdown system initialized');
    logger.logSuccess('countdown', 'Countdown initialization complete');
  } catch (error) {
    logger.logError('countdown', `Error initializing countdowns: ${error.message || error}`);
  }
}

/**
 * Clear all state (messages, intervals, timers)
 */
function clearAllState() {
  // Clear countdown state
  state.countdownMessages.clear();
  for (const interval of state.countdownIntervals.values()) {
    clearInterval(interval);
  }
  state.countdownIntervals.clear();
  state.channelIds.clear();
  
  // Clear reset state
  state.resetMessages.clear();
  for (const timer of state.resetTimers.values()) {
    clearInterval(timer);
  }
  state.resetTimers.clear();
  state.lastResetTimes.clear();
}

// ===========================
// Legacy compatibility functions
// ===========================

/**
 * Legacy start countdown function (for backward compatibility)
 * @param {Client} client - Discord.js client
 * @param {string} channelId - ID of the channel to post in
 * @returns {Promise<boolean>} True if started successfully, false otherwise
 */
async function startLegacyCountdown(client, channelId) {
  try {
    const config = getConfig();
    const defaultGuildId = config.countdown?.defaultGuildId || 'default';
    return await startCountdown(client, defaultGuildId, channelId);
  } catch (error) {
    logger.logError('countdown', `Legacy countdown start failed: ${error.message}`);
    return false;
  }
}

/**
 * Legacy stop countdown function (for backward compatibility)
 */
function stopLegacyCountdown() {
  const config = getConfig();
  const defaultGuildId = config.countdown?.defaultGuildId || 'default';
  stopCountdown(defaultGuildId);
}

// ===========================
// Module exports
// ===========================

/**
 * Handle channel move for a guild
 * @param {Client} client - Discord.js client
 * @param {string} guildId - ID of the guild
 * @param {string} oldChannelId - ID of the old channel
 * @param {string} newChannelId - ID of the new channel
 * @returns {Promise<boolean>} True if handled successfully, false otherwise
 */
async function handleChannelMove(client, guildId, oldChannelId, newChannelId) {
  try {
    if (!client || !guildId || !newChannelId) {
      logger.logError('countdown', `Invalid parameters for channel move`);
      return false;
    }

    // Get the old channel to clean up messages
    if (oldChannelId) {
      const oldChannel = await client.channels.fetch(oldChannelId).catch(() => null);
      if (oldChannel) {
        // Clean up old countdown message
        const oldCountdownMessage = state.countdownMessages.get(guildId);
        if (oldCountdownMessage) {
          await oldCountdownMessage.delete().catch(() => null);
          state.countdownMessages.delete(guildId);
        }

        // Clean up old reset message and save its reset time if it exists
        const oldResetMessage = state.resetMessages.get(guildId);
        const oldResetTime = state.lastResetTimes.get(guildId);
        if (oldResetMessage) {
          await oldResetMessage.delete().catch(() => null);
          state.resetMessages.delete(guildId);
        }

        // Clean up any other old messages
        await cleanupOldMessages(oldChannel);
      }
    }

    // Stop existing timers but keep the reset time if it exists
    const existingResetTime = state.lastResetTimes.get(guildId);
    stopCountdown(guildId);
    stopResetTimer(guildId);

    // Start new countdown in the new channel
    const success = await startCountdown(client, guildId, newChannelId);

    // If there was an active reset message, recreate it in the new channel with the original reset time
    if (existingResetTime && success) {
      await sendResetAnnouncement(client, guildId, newChannelId, existingResetTime);
    }

    return success;
  } catch (error) {
    logger.logError('countdown', `Error handling channel move for guild ${guildId}: ${error.message}`);
    return false;
  }
}

module.exports = {
  // Main functions
  startGuildCountdown: startCountdown,
  stopGuildCountdown: stopCountdown,
  stopAllCountdowns,
  initializeCountdown,
  updateCountdown,
  sendResetAnnouncement,
  stopResetTimer,
  deleteResetMessage,
  handleChannelMove,
  cleanupOldMessages,
  // Legacy methods for backward compatibility
  startCountdown: startLegacyCountdown,
  stopCountdown: stopLegacyCountdown,
  getState,
  setState,
  clearState,
  clearAllState
};