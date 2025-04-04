require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const { initializeCountdown } = require('./utils/countdownManager');
const { loadConfig } = require('./utils/configManager');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// Create collections for commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    logger.logWarn('loader', `The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Register slash commands globally (for all guilds the bot is in)
async function registerCommands() {
  try {
    const commands = [];
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    logger.logInfo('system', 'Started refreshing application (/) commands globally.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    logger.logSuccess('system', 'Successfully reloaded application (/) commands globally.');
  } catch (error) {
    logger.logError('registerCommands', error);
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// When the client is ready, register commands and initialize features
client.once('ready', async () => {
  logger.logStartup(`Logged in as ${client.user.tag}`);
  
  // Register commands
  await registerCommands();
  
  // Load configuration
  loadConfig();
  
  // Initialize the server reset countdown
  await initializeCountdown(client);
  
  logger.logSuccess('system', 'Bot initialization complete!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.logShutdown('Received SIGINT signal');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.logShutdown('Received SIGTERM signal');
  client.destroy();
  process.exit(0);
});

// Login to Discord with your token
client.login(process.env.DISCORD_TOKEN); 