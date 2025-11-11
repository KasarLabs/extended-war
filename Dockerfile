# Use official Node.js LTS image
FROM node:20-alpine AS base

# Enable pnpm
RUN corepack enable pnpm

# Install production dependencies only
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with pnpm (production only, ignore scripts)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the TypeScript application
RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy necessary files from builder and deps
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy config and scripts directories (they exist in the project)
COPY --from=builder /app/config ./config
COPY --from=builder /app/scripts ./scripts

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to nodejs user
USER nodejs

# Expose the port the app runs on
EXPOSE 5004

# Start the application
CMD ["node", "dist/index.js"]
