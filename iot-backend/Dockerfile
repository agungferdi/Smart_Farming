# Multi-stage Dockerfile for Smart Farming IoT Backend

# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client for production
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder --chown=hono:nodejs /app/dist ./dist

# Copy any other necessary files
COPY --from=builder --chown=hono:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER hono

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --eval "fetch('http://localhost:3000/api/health').then(() => process.exit(0)).catch(() => process.exit(1))"

# Start the application
CMD ["npm", "start"]
