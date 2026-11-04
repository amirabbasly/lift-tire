# ── Lift Tire API ─────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ffmpeg/curl برای ابزارهای جانبی و healthcheck
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src
RUN mkdir -p /app/uploads

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fsS http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "src/server.js"]
