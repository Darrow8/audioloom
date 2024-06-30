FROM node:20
WORKDIR /Users/darrowhartman/Desktop/repos/podcast-pro/backend
COPY package*.json server.js ./
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
