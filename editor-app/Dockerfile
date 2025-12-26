# --- Base Stage ---
# Use an official Node.js runtime as a parent image
# Using LTS version matching the development environment (adjust if needed)
# Switch from Alpine (musl libc) to Slim/Debian (glibc) for better native module compatibility
FROM node:20-bookworm-slim AS base
# Update npm to the latest version to mitigate potential CVEs in npm itself
RUN npm install -g npm@latest

# Set the working directory in the container
WORKDIR /app

# Install Git (needed for backend versioning). Build tools are less likely needed with glibc base.
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

# --- Backend Builder Stage ---
FROM base AS backend-builder
WORKDIR /app/backend

# Install build tools needed for native modules like sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy backend package files first for layer caching
COPY backend/package*.json ./

# Install backend dependencies.
# For sqlite3, we will uninstall if it came with `npm ci` from a prebuilt binary
# and then reinstall it, forcing build from source for the TARGETARCH.
RUN npm ci && \
    if [ -d "node_modules/sqlite3" ]; then \
        echo "Initial sqlite3 found, reinstalling from source for ARM64" && \
        npm uninstall sqlite3 --no-save && \
        npm_config_build_from_source=true npm_config_arch=arm64 npm install sqlite3 --no-save; \
    else \
        echo "sqlite3 not initially found, installing from source for ARM64" && \
        npm_config_build_from_source=true npm_config_arch=arm64 npm install sqlite3 --no-save; \
    fi && \
    (npm audit fix || npm audit)

# Copy the rest of the backend source code
COPY backend/ ./

# --- Frontend Builder Stage ---
FROM base AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files first for layer caching
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci && (npm audit fix || npm audit)

# Copy homepageversion.txt to /app so vite.config.js can access it during build
# vite.config.js is in /app/frontend and reads ../../homepageversion.txt
# The Docker build context is the project root, where homepageversion.txt resides.
COPY homepageversion.txt /app/homepageversion.txt

# Copy the rest of the frontend source code
COPY frontend/ ./

# Build the frontend application
# Vite's default output directory is 'dist'
RUN npm run build

# --- Final Stage ---
# Start from the base image again for a smaller final image
FROM base AS final
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy built backend (including node_modules) from backend-builder stage
COPY --from=backend-builder /app/backend ./backend/

# Copy built frontend assets from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist


USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends file && \
    rm -rf /var/lib/apt/lists/*

# Create mount points and set permissions
# Ensure node user exists (it does in official node images)
# Create directories if they don't exist and change ownership
# Also change ownership of the app directory itself
RUN mkdir -p /config /data && \
    chown -R node:node /app /config /data

# Switch back to non-root user
USER node

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the backend application
WORKDIR /app/backend
CMD ["node", "server.js"]