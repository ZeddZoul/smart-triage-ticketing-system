# =============================================================================
# Smart Triage Ticketing System — Backend Dockerfile
# Multi-stage build: node:20-alpine, non-root user
# @see DESIGN.md §12.2
# =============================================================================

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only package manifests for layer caching
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package.json ./
COPY src/ ./src/

# Use non-root user for security
USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
