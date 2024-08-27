FROM --platform=linux/arm64 node:18-alpine
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets and other necessary files
COPY dist ./dist
COPY certs ./certs
COPY .env ./

# COPY dist/routes ./dist/routes
# Expose the port the app runs on
EXPOSE 3000

# Command to run the application with more verbose output
CMD ["npm", "run", "start"]