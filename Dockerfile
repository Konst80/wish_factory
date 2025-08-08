FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies - handle Rollup optional dependencies issue
RUN rm -rf node_modules package-lock.json && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "build/index.js"]