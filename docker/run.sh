#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Usage info
usage() {
  echo -e "${YELLOW}Usage:${NC} $0 [dev|prod]"
  echo "  dev  - Start the bot in development mode with logs"
  echo "  prod - Start the bot in production mode detached"
  exit 1
}

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${RED}Error:${NC} .env file not found. Please create one based on .env.example"
  exit 1
fi

# Check command line argument
if [ $# -ne 1 ]; then
  usage
fi

case "$1" in
  dev)
    echo -e "${GREEN}Starting MushroomBot in development mode...${NC}"
    docker-compose up --build
    ;;
  prod)
    echo -e "${GREEN}Starting MushroomBot in production mode...${NC}"
    docker-compose up --build -d
    echo -e "${GREEN}Bot is running in the background.${NC}"
    echo -e "Use ${YELLOW}docker-compose logs -f${NC} to view logs"
    ;;
  *)
    usage
    ;;
esac 