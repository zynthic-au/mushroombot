# MushroomBot Docker Setup

This document explains how to run MushroomBot using Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Setup Instructions

1. **Create an .env file**

   Copy the example environment file and fill in your Discord token and client ID:
   
   ```bash
   cp .env.example .env
   # Edit .env with your favorite text editor
   ```

2. **Build and Run**

   ### Development Mode
   
   Run the bot in development mode to see logs in real-time:
   
   ```bash
   ./docker/run.sh dev
   ```
   
   ### Production Mode
   
   Run the bot in production mode (detached):
   
   ```bash
   ./docker/run.sh prod
   ```
   
   To view logs when running in production mode:
   
   ```bash
   docker-compose logs -f
   ```

3. **Stop the Bot**

   ```bash
   docker-compose down
   ```

## Configuration

- Bot configuration files are stored in the `config` directory
- Logs are stored in the `logs` directory
- Both directories are mounted as volumes for persistence

## Updating

To update the bot with new code:

```bash
git pull
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify your Discord token in the `.env` file
3. Ensure your bot has proper permissions in Discord
4. Try rebuilding the container: `docker-compose build --no-cache` 