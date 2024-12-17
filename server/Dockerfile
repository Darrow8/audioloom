# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine as builder

WORKDIR /usr/src/app

# Copy package files from server
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the shared directory from parent folder
COPY . .

# Production stage
FROM --platform=$TARGETPLATFORM node:20-alpine

WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built JavaScript files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

COPY prompts ./prompts 
COPY temp-data ./temp-data
COPY logs ./logs

EXPOSE 3000

# CMD ["npm", "run", "start"]
CMD ["node", "dist/server/server.js"]
