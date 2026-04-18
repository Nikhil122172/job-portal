# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
#  Stage 1 – Dependency install  (BuildKit npm cache mount)
#  package*.json copied first → this layer only re-runs if lock file changes.
#  --mount=type=cache → ~/.npm cache persists on host, skips re-download.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# ─────────────────────────────────────────────────────────────────────────────
#  Stage 2 – Vite production build
#  Vite: tree-shaking + minification + content-hashed chunks → ~2-5 MB dist/
#  manualChunks in vite.config.ts splits vendor/router/redux for optimal caching.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
# Re-use installed node_modules from deps stage — no second network call
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:docker

# ─────────────────────────────────────────────────────────────────────────────
#  Stage 3 – Serve with nginx:alpine
#  node:20-alpine ≈ 180 MB  →  nginx:1.27-alpine ≈ 25 MB  (−86%)
#  Zero Node.js runtime in production image.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx placeholder page
RUN rm -rf /usr/share/nginx/html/*

# Copy Vite build output and nginx config
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Non-root nginx (security best practice)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
