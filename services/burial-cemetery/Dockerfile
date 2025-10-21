# Node.js Alpine base image for smaller size
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm ci --only=production && \
    npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app

# Install curl and openssl for healthcheck and Prisma
RUN apk add --no-cache curl openssl

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy dependencies from deps stage (including generated Prisma Client)
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/prisma ./prisma

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create uploads directory
RUN mkdir -p /app/uploads/documents /app/uploads/permits && \
    chown -R nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 3001

# Push database schema and start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]
