# Use Node.js 20 on Alpine Linux as base image
FROM node:20-alpine

# Install dependencies for Puppeteer (Chrome)
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      git

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Install root dependencies
RUN npm ci

# Copy client package files
COPY client/package.json client/

# Install client dependencies
RUN cd client && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm run build

# Build backend
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
