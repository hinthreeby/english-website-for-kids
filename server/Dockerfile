FROM node:20-alpine

WORKDIR /app

# wget dùng cho healthcheck
RUN apk add --no-cache wget

# Cài dependencies (production only, cache layer riêng)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Tạo thư mục persistent
RUN mkdir -p uploads/thumbnails uploads/videos uploads/avatars logs

# Chạy dưới user non-root cho bảo mật
RUN addgroup -S nodejs && adduser -S appuser -G nodejs \
    && chown -R appuser:nodejs /app

USER appuser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:5001/api/health || exit 1

CMD ["node", "server.js"]
