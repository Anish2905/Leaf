FROM node:20-alpine

WORKDIR /app

# Install dependencies
# (Argon2 removed, so native build deps not strictly needed, but keeping libc6-compat if needed)
RUN apk add --no-cache libc6-compat

# Expose port
EXPOSE 3000

# Default command
CMD ["sh", "-c", "npm install && npm run db:push && npm run dev"]
