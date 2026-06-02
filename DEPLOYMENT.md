# Hướng dẫn Deploy Fun English lên VPS

> Stack: Docker · VPS (Ubuntu 22.04) · Cloudinary · MongoDB Atlas · DNS `funenglish.id.vn`

---

## Mục lục

1. [Yêu cầu VPS](#1-yêu-cầu-vps)
2. [Cài đặt Docker trên VPS](#2-cài-đặt-docker-trên-vps)
3. [MongoDB Atlas](#3-mongodb-atlas)
4. [Cloudinary (lưu trữ media)](#4-cloudinary-lưu-trữ-media)
5. [Cấu hình DNS](#5-cấu-hình-dns)
6. [Clone & cấu hình project](#6-clone--cấu-hình-project)
7. [Deploy lần đầu (HTTP)](#7-deploy-lần-đầu-http)
8. [Cấp SSL với Let's Encrypt](#8-cấp-ssl-với-lets-encrypt)
9. [Chuyển sang HTTPS](#9-chuyển-sang-https)
10. [Cập nhật Google OAuth](#10-cập-nhật-google-oauth)
11. [Quản lý & Monitoring](#11-quản-lý--monitoring)
12. [Quy trình cập nhật code](#12-quy-trình-cập-nhật-code)
13. [Xử lý sự cố](#13-xử-lý-sự-cố)

---

## 1. Yêu cầu VPS

| Thành phần | Tối thiểu | Khuyến nghị |
|---|---|---|
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| RAM | 1 GB | 2 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 20 GB SSD | 40 GB SSD |
| Băng thông | Unlimited | Unlimited |

**Nhà cung cấp VPS phù hợp:** DigitalOcean, Vultr, Linode, Hetzner, hoặc VPS Việt Nam (Bizfly, AZDIGI).

**Mở port trên firewall VPS:**
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

## 2. Cài đặt Docker trên VPS

SSH vào VPS rồi chạy:

```bash
# Cập nhật apt
sudo apt-get update && sudo apt-get upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com | sh

# Thêm user hiện tại vào group docker (tránh phải sudo mỗi lần)
sudo usermod -aG docker $USER
newgrp docker

# Kiểm tra Docker hoạt động
docker --version
docker compose version
```

---

## 3. MongoDB Atlas

### 3.1 Tạo cluster miễn phí

1. Đăng ký tại [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Tạo **Free Cluster** (M0 Sandbox)
3. Chọn region gần Việt Nam: **Singapore** (ap-southeast-1)
4. Đặt tên cluster: `funenglish-prod`

### 3.2 Tạo database user

1. Vào **Database Access** → **Add New Database User**
2. Chọn **Password** authentication
3. Username: `funenglish_prod`
4. Password: Tạo password mạnh, lưu lại
5. Role: **Atlas Admin** (hoặc `readWriteAnyDatabase`)

### 3.3 Cấu hình Network Access

1. Vào **Network Access** → **Add IP Address**
2. Nhập IP của VPS (xem IP bằng `curl ifconfig.me` trên VPS)
3. Hoặc dùng `0.0.0.0/0` nếu muốn allow all (kém bảo mật hơn)

### 3.4 Lấy Connection String

1. Vào **Database** → **Connect** → **Connect your application**
2. Driver: **Node.js**, Version: **5.5 or later**
3. Copy connection string dạng:
   ```
   mongodb+srv://funenglish_prod:<password>@funenglish-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Thay `<password>` bằng password thực tế
5. Thêm tên database vào cuối:
   ```
   mongodb+srv://funenglish_prod:PASSWORD@funenglish-prod.xxxxx.mongodb.net/funEnglish?retryWrites=true&w=majority&appName=funenglish-prod
   ```

---

## 4. Cloudinary (lưu trữ media)

Cloudinary lưu ảnh và video trên cloud, tránh mất dữ liệu khi rebuild container và cung cấp CDN toàn cầu.

### 4.1 Tạo tài khoản

1. Đăng ký tại [cloudinary.com](https://cloudinary.com) (free tier: 25 GB storage, 25 GB bandwidth/tháng)
2. Vào **Dashboard** → lấy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 4.2 Tích hợp Cloudinary vào backend (tùy chọn nâng cao)

Hiện tại project dùng **disk storage + Docker volume** cho uploads. Nếu muốn dùng Cloudinary:

```bash
# Trong thư mục server/
npm install cloudinary multer-storage-cloudinary
```

Thêm vào `server/.env.production`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Cập nhật `server/config/upload.js` để dùng `CloudinaryStorage` thay vì `diskStorage` trong môi trường production.

> **Lưu ý:** Với setup hiện tại (Docker volume), ảnh/video vẫn được bảo toàn qua restarts và updates. Cloudinary chỉ cần thiết khi scale lên nhiều server.

---

## 5. Cấu hình DNS

Truy cập vào nhà cung cấp domain quản lý `funenglish.id.vn` và thêm các record:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `<IP_VPS>` | 300 |
| A | `www` | `<IP_VPS>` | 300 |

Thay `<IP_VPS>` bằng địa chỉ IP public của VPS.

Kiểm tra DNS đã propagate chưa (thường mất 5–30 phút):
```bash
nslookup funenglish.id.vn
# hoặc
ping funenglish.id.vn
```

---

## 6. Clone & cấu hình project

```bash
# Clone repo về VPS
git clone https://github.com/<your-username>/fun-english.git /opt/funenglish
cd /opt/funenglish
```

### 6.1 Tạo file `.env.production` cho backend

```bash
cp server/.env.example server/.env.production
nano server/.env.production
```

Điền đầy đủ các biến:

```env
# ── Core ──────────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=5001
TRUST_PROXY=true

# ── Database (MongoDB Atlas) ───────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://funenglish_prod:PASSWORD@funenglish-prod.xxxxx.mongodb.net/funEnglish?retryWrites=true&w=majority&appName=funenglish-prod

# ── JWT & Session (dùng giá trị ngẫu nhiên mạnh, tối thiểu 64 ký tự) ─────────
JWT_SECRET=<random-64-chars>
SESSION_SECRET=<random-64-chars>

# ── Frontend URL ───────────────────────────────────────────────────────────────
CLIENT_URL=https://funenglish.id.vn

# ── Email (Resend) ─────────────────────────────────────────────────────────────
RESEND_API_KEY=re_your_production_key
EMAIL_FROM=no-reply@funenglish.id.vn

# ── Google OAuth ───────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://funenglish.id.vn/auth/google/callback

# ── Cookie ────────────────────────────────────────────────────────────────────
COOKIE_SECURE=true
COOKIE_SAMESITE=none

# ── AI APIs ───────────────────────────────────────────────────────────────────
GROQ_API_KEY=your_groq_api_key
GROQ_DRAW_API_KEY=your_groq_draw_api_key

# ── Cloudinary (nếu dùng) ─────────────────────────────────────────────────────
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
```

> **Tạo secret ngẫu nhiên:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 7. Deploy lần đầu (HTTP)

Bước đầu deploy với HTTP để kiểm tra ứng dụng hoạt động, **trước khi** cấp SSL.

### 7.1 Kiểm tra docker-compose.yml dùng HTTP config

`docker-compose.yml` đã được cấu hình sẵn để mount `nginx/nginx.http.conf` ở bước đầu — không cần làm gì thêm.

### 7.2 Build và chạy containers

```bash
docker compose build --no-cache
docker compose up -d
```

### 7.3 Kiểm tra

```bash
# Xem trạng thái containers
docker compose ps

# Xem logs
docker compose logs -f

# Test API health
curl http://funenglish.id.vn/api/health
```

Nếu thấy `{"ok":true,"environment":"production",...}` thì backend đã chạy.

Truy cập `http://funenglish.id.vn` để xem frontend.

---

## 8. Cấp SSL với Let's Encrypt

```bash
# Cài Certbot
sudo apt-get install -y certbot

# Dừng nginx container tạm để certbot dùng port 80
docker compose stop nginx

# Lấy SSL cert (standalone mode)
sudo certbot certonly --standalone \
  -d funenglish.id.vn \
  -d www.funenglish.id.vn \
  --email nguyenphuc1629@gmail.com \
  --agree-tos \
  --non-interactive

# Cert được lưu tại: /etc/letsencrypt/live/funenglish.id.vn/
ls /etc/letsencrypt/live/funenglish.id.vn/
```

Kết quả thành công sẽ có các file:
- `fullchain.pem` — certificate chain
- `privkey.pem` — private key

---

## 9. Chuyển sang HTTPS

### 9.1 Đổi sang nginx config SSL

Mở `docker-compose.yml`, tìm dòng volumes của service `nginx` và đổi:
```yaml
# Đổi từ:
- ./nginx/nginx.http.conf:/etc/nginx/conf.d/default.conf:ro
# Thành:
- ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

Hoặc dùng lệnh sed trên VPS:
```bash
sed -i 's|nginx/nginx.http.conf|nginx/nginx.conf|' docker-compose.yml
```

### 9.2 Khởi động lại với HTTPS

```bash
docker compose up -d nginx
```

### 9.3 Kiểm tra HTTPS

```bash
curl https://funenglish.id.vn/api/health
```

Truy cập `https://funenglish.id.vn` — trình duyệt phải hiện ổ khóa xanh.

### 9.4 Tự động renew SSL (Certbot tự làm, nhưng cần reload nginx)

Tạo cron job cho renewal:

```bash
sudo crontab -e
```

Thêm dòng sau (chạy lúc 3 giờ sáng mỗi ngày):

```cron
0 3 * * * certbot renew --quiet && docker exec funenglish-web nginx -s reload
```

---

## 10. Cập nhật Google OAuth

Sau khi có domain và SSL, cập nhật Google Cloud Console:

1. Vào [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials** → chọn OAuth 2.0 Client
3. **Authorized JavaScript origins:** thêm `https://funenglish.id.vn`
4. **Authorized redirect URIs:** thêm `https://funenglish.id.vn/auth/google/callback`
5. Lưu lại

---

## 11. Quản lý & Monitoring

### Lệnh thường dùng

```bash
# Xem logs realtime
docker compose logs -f
docker compose logs -f backend    # chỉ backend
docker compose logs -f nginx      # chỉ nginx

# Restart một service
docker compose restart backend

# Xem resource usage (CPU, RAM)
docker stats

# Vào shell trong container
docker exec -it funenglish-api sh
docker exec -it funenglish-web sh

# Xem uploads đã lưu
docker exec -it funenglish-api ls -la uploads/

# Kiểm tra health
curl https://funenglish.id.vn/api/health
```

### Backup uploads

```bash
# Backup Docker volume ra file tar
docker run --rm \
  -v funenglish_uploads_data:/data \
  -v /backup:/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /data .
```

### Disk usage

```bash
# Dọn Docker images/containers cũ
docker system prune -f

# Xem dung lượng volumes
docker system df
```

---

## 12. Quy trình cập nhật code

```bash
cd /opt/funenglish

# Pull code mới
git pull origin main

# Rebuild và restart (zero-downtime với --no-deps)
docker compose build --no-cache backend
docker compose up -d --no-deps backend

# Nếu thay đổi frontend
docker compose build --no-cache nginx
docker compose up -d --no-deps nginx

# Xem logs sau khi update
docker compose logs -f --tail=50
```

---

## 13. Xử lý sự cố

### Container không start

```bash
docker compose logs backend --tail=50
# Kiểm tra file .env.production có đúng không
cat server/.env.production | grep NODE_ENV
```

### Backend không kết nối MongoDB

```bash
# Kiểm tra MONGODB_URI trong .env.production
# Kiểm tra IP VPS đã được whitelist trong Atlas Network Access chưa
docker exec -it funenglish-api node -e "
  require('./config/env');
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => { console.log('OK'); process.exit(0); })
    .catch(e => { console.error(e.message); process.exit(1); });
"
```

### Nginx lỗi 502 Bad Gateway

```bash
# Backend có chạy không?
docker compose ps
# Logs backend có lỗi không?
docker compose logs backend --tail=30
```

### SSL cert hết hạn

```bash
sudo certbot renew --force-renewal
docker exec funenglish-web nginx -s reload
```

### Xem logs Pino (JSON format)

```bash
# Cần cài jq
sudo apt-get install -y jq

docker compose logs backend --no-log-prefix | jq '.'
# Chỉ lỗi
docker compose logs backend --no-log-prefix | jq 'select(.level >= 50)'
```

---

## Kiến trúc tổng quan

```
Internet
    │
    ▼ :80/:443
┌─────────────────────────────────────┐
│   Container: funenglish-web         │
│   Image: nginx:1.27-alpine          │
│   ┌─────────────────────────────┐   │
│   │  React SPA (dist/)          │   │
│   │  /           → index.html   │   │
│   │  /api/*      → backend:5001 │   │
│   │  /auth/*     → backend:5001 │   │
│   │  /uploads/*  → backend:5001 │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
    │ Docker network: funenglish-net
    ▼ :5001
┌─────────────────────────────────────┐
│   Container: funenglish-api         │
│   Image: node:20-alpine             │
│   Express.js + Passport + Mongoose  │
│   Volumes:                          │
│     uploads_data → /app/uploads     │
│     logs_data    → /app/logs        │
└─────────────────────────────────────┘
    │                │
    ▼                ▼
MongoDB Atlas    Cloudinary / Docker Volume
(Singapore)      (media storage)
```
