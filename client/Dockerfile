# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Nhận API URL lúc build (override .env.production)
ARG VITE_API_URL=https://funenglish.id.vn
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve với Nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Xóa config mặc định
RUN rm /etc/nginx/conf.d/default.conf

# Copy React build từ stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
