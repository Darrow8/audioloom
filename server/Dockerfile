# Build stage
FROM node:20-alpine as builder

WORKDIR /usr/src/app

# Copy package files from server
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the shared directory from parent folder
COPY . .

COPY assets ./dist/server/assets

# Production stage
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg


WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built JavaScript files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

COPY prompts ./prompts 

EXPOSE 3000

CMD ["node", "dist/server/server.js"]
