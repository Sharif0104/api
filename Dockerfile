# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port (default 3000, change if needed)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
