# ── Stage 1: Base ─────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Cài dependencies riêng để tận dụng Docker layer cache
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: Production ───────────────────────────────────────────
FROM node:20-alpine AS production

# Tạo user không phải root (bảo mật)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy node_modules từ stage base
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs . .

# Chạy với user nodejs (không phải root)
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

# Start command
CMD ["node", "src/server.js"]