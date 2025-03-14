FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Create a non-root user and switch to it (letting Alpine assign IDs)
RUN addgroup botuser && \
    adduser -G botuser -s /bin/sh -D botuser && \
    chown -R botuser:botuser /app

USER botuser

# Command to run the bot
CMD ["node", "src/index.js"] 