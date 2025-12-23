FROM node:20-alpine

WORKDIR /app

# Install dependencies for argon2 native build
RUN apk add --no-cache python3 make g++

# Expose port
EXPOSE 3000

# Default command
CMD ["sh", "-c", "npm install && npm run db:push && npm run dev"]
