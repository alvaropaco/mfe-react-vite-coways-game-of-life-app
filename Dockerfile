# Base dev image for Vite monorepo (Yarn 4, Node 20)
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Useful tooling
RUN apk add --no-cache bash

# Ensure corepack (Yarn) is available inside the container
RUN corepack enable

# Default command keeps the container alive if started directly
CMD ["sleep", "infinity"]