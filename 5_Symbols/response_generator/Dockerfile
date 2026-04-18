FROM node:18-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files in 5_Symbols
COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]
