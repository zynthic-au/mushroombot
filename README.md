# MushroomBot

A Discord bot that works across multiple servers without hard-coded guild IDs.

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Configure your `.env` file:
   - Set `DISCORD_TOKEN` to your Discord bot token
   - Set `CLIENT_ID` to your Discord application client ID

## Running the Bot

```bash
npm start
```

## How it Works

This bot uses Discord.js's global command registration system, which allows slash commands to be available across all servers the bot is invited to. Instead of using guild-specific command registration (which would require hard-coded guild IDs), this bot registers all commands globally using:

```javascript
await rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  { body: commands },
);
```

This approach has some considerations:
- Global commands can take up to an hour to propagate to all servers
- For development, you may want to use guild-specific commands for faster testing, then switch to global for production

## Adding Commands

To add new commands:
1. Create a new JavaScript file in the `src/commands` directory
2. Follow the pattern in the existing commands
3. The bot will automatically load and register your new command

## Adding Events

To add new event handlers:
1. Create a new JavaScript file in the `src/events` directory
2. Follow the pattern in the existing event handlers
3. The bot will automatically load and use your new event handler 