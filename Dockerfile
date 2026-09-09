# Multi-stage Dockerfile for Free LLM Hub & AI API Key Management
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and build assets
COPY . .

# Generate Prisma Client & Build Next/Vite server bundle
RUN npx prisma generate || true
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./dist/index.html

# Expose required port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
