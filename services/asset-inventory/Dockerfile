# Node.js Alpine base image
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache curl openssl

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/prisma ./prisma
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3003

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]
