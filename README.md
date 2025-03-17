# Mushroom Bot

A Discord bot for managing server reset countdowns and announcements.

## Features

- **Server Reset Countdowns**: Set up customized countdown timers for your server resets
- **Reset Announcements**: Automatic announcements when your server resets with elapsed time tracking
- **Web Dashboard**: Manage all your bot settings from a web interface
- **Multiple Server Support**: Configure different countdown settings for each Discord server
- **Timezone Support**: Set countdowns in your local timezone

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mushroombot.git
   cd mushroombot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your Discord bot token and other settings.

5. Start the bot:
   ```
   npm start
   ```

## Discord Commands

- `/announcement-channel [channel]` - Set the channel for countdown announcements
- `/welcome-channel [channel]` - Set the channel for welcome messages
- `/reload-presence` - Reload the bot's presence
- `/lamps` - Toggle lamps on/off

## Web Dashboard

The bot includes a web dashboard for easy configuration. To access it:

1. Start the bot with `npm start`
2. Visit `http://localhost:3000` in your browser (or the URL you configured)
3. Log in with your Discord account
4. Configure your server settings

## Configuration

The bot can be configured through the web dashboard or by editing the configuration files:

- `src/config/config.js` - Main configuration file
- `src/config/language.yml` - Customizable messages and embeds

## Development

To run the bot in development mode with automatic reloading:

```
npm run dev
```

## License

This project is licensed under the ISC License - see the LICENSE file for details. 