# Fun English 🌟

Nền tảng học tiếng Anh tương tác dành cho trẻ em. Trẻ chơi game và đọc truyện để học tiếng Anh; phụ huynh và giáo viên theo dõi tiến trình; quản trị viên quản lý hệ thống.

## Công nghệ sử dụng

| Tầng | Công nghệ |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router v7 |
| Backend | Express.js 5, Node.js |
| Cơ sở dữ liệu | MongoDB (Mongoose 9) |
| Xác thực | JWT + bcryptjs (HTTP-only cookies), Google OAuth |

## Bắt đầu

### Yêu cầu
- Node.js 18+
- MongoDB (local hoặc Atlas)

### Cài đặt

```bash
# Cài đặt dependencies cho cả client và server
cd client && npm install
cd ../server && npm install
```

### Biến môi trường

Tạo file `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/funEnglish
JWT_SECRET=your_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Chạy ứng dụng

```bash
# Khởi động cả client (cổng 5173) và server (cổng 5000)
npm run dev

# Chỉ client
cd client && npm run dev

# Chỉ server
cd server && npm run dev
```

### Tạo tài khoản Admin

Chạy một lần để khởi tạo tài khoản admin đầu tiên:

```bash
cd server
node scripts/createAdmin.js
```

Thông tin đăng nhập mặc định: `admin` / `Admin@123456` — đổi mật khẩu sau lần đăng nhập đầu tiên.

### Tạo tài khoản Giáo viên

```bash
cd server
node scripts/createTeacher.js
```

## Vai trò người dùng

| Vai trò | Khả năng |
|---|---|
| `child` | Chơi game, đọc truyện, mua sắm, trang trí phòng, theo dõi lộ trình học tập |
| `parent` | Xem tiến trình của con, liên kết tài khoản con |
| `teacher` | Quản lý lớp học, tạo & nộp danh sách từ vựng, đăng nội dung học, tham gia diễn đàn |
| `admin` | Phê duyệt giáo viên/danh sách từ, quản lý tất cả người dùng, quản lý video |

> Tài khoản trẻ em phải được tạo bởi Phụ huynh hoặc Quản trị viên — trẻ không thể tự đăng ký.

## Cấu trúc dự án

```
project/
├── client/
│   └── src/
│       ├── assets/         Hình ảnh, âm thanh game
│       ├── components/     UI dùng chung + role guards
│       ├── context/        AuthContext (trạng thái xác thực toàn cục)
│       ├── data/           Dữ liệu tĩnh (truyện, hành tinh, ...)
│       ├── games/          Các component game (13 game)
│       ├── hooks/          useProgress, useSound, useBgMusic, ...
│       ├── i18n/           Hỗ trợ đa ngôn ngữ
│       ├── lib/            Thư viện tiện ích
│       ├── pages/
│       │   ├── admin/      Dashboard, Users, Approvals, Videos, Profile
│       │   ├── parent/     Dashboard, Child Progress
│       │   ├── teacher/    Dashboard, Classroom, Word List, Contents, Forum
│       │   ├── child/      Child Profile
│       │   └── student/    Student Contents
│       ├── styles/         CSS tùy chỉnh
│       └── utils/          Hàm tiện ích
└── server/
    ├── config/             Cấu hình (email, cookies, OAuth, rate limit, CORS, logger)
    ├── middleware/         JWT auth, CSRF, logging, validation
    ├── models/             18 model (User, GameResult, Classroom, WordList, UserInventory,
    │                         Video, TeacherContent, Roadmap, ForumPost, ...)
    ├── routes/             21 route (auth, progress, shop, parent, teacher, admin,
    │                         videos, forum, roadmap, analytics, AI games, ...)
    ├── scripts/            createAdmin.js, createTeacher.js
    ├── seed/               Dữ liệu khởi tạo
    ├── services/           streakService, emailService, aiVisionService, otpService
    ├── tests/              Test files
    └── utils/              cache, passwordPolicy, sanitize, autoSeedRoadmap
```

## Tổng quan API

| Module | URL gốc | Mục đích |
|---|---|---|
| Auth | `/api/auth` | Đăng nhập, đăng ký, đăng xuất, quên mật khẩu (OTP) |
| Google OAuth | `/api/auth/google` | Đăng nhập bằng tài khoản Google |
| Progress | `/api/progress` | Kết quả game |
| Shop | `/api/shop` | Vật phẩm & mua sắm |
| Parent | `/api/parent` | Quản lý tài khoản con |
| Teacher | `/api/teacher` | Lớp học & danh sách từ vựng |
| Teacher Content | `/api/teacher-content` | Nội dung học do giáo viên tạo |
| Student Content | `/api/student-content` | Truy cập nội dung học |
| Admin | `/api/admin` | Quản lý người dùng & nội dung |
| Videos | `/api/videos` | Xem & quản lý video học tập |
| Forum | `/api/forum` | Diễn đàn giáo viên |
| Roadmap | `/api/roadmap` | Lộ trình học tập |
| Analytics | `/api/analytics` | Thống kê tiến trình trẻ & lớp học |
| AI Games | `/api/draw-game`, `/api/chat-game` | Game tích hợp AI |
| Upload | `/api/upload` | Tải lên tệp |
| Transcribe | `/api/transcribe` | Chuyển đổi giọng nói thành văn bản |

## Các trò chơi

| Game | Mô tả |
|---|---|
| ABCLetters | Học bảng chữ cái tiếng Anh |
| PictureWords | Kết hợp từ với hình ảnh |
| CountLearn | Học đếm số |
| ColorFun | Nhận biết màu sắc |
| AnimalSounds | Nhận biết âm thanh động vật |
| MatchIt | Ghép cặp từ vựng |
| SpacePronounce | Luyện phát âm theo chủ đề không gian |
| FunnyAnimals | Nhận diện động vật vui nhộn |
| CleanOceanHero | Game bảo vệ đại dương |
| Draw & Guess | Vẽ và đoán hình — tích hợp AI nhận dạng |
| Talk with Luna | Trò chuyện với Luna — AI chat |
| FamilyPhoto | Game chủ đề gia đình |
| FindObject | Tìm vật thể trong trường học |

Các game nằm tại `client/src/games/`.

## Tính năng nổi bật

- **Xác thực đa dạng**: Đăng nhập bằng tài khoản thường hoặc Google OAuth; hỗ trợ quên mật khẩu qua OTP email
- **Lộ trình học tập**: Hệ thống roadmap theo đơn vị/bài học giúp trẻ học theo trình tự có cấu trúc
- **Game AI**: Draw & Guess dùng AI nhận dạng hình vẽ; Talk with Luna dùng AI trò chuyện
- **Hệ thống video**: Giáo viên và admin đăng tải video học tập; học sinh xem và theo dõi lịch sử xem
- **Diễn đàn giáo viên**: Giáo viên chia sẻ bài viết, bình luận, thích bài và theo dõi nhau
- **Trang trí phòng**: Trẻ dùng điểm thưởng mua vật phẩm trang trí phòng riêng
- **Streak & thành tích**: Hệ thống điểm liên tiếp khuyến khích học hàng ngày
- **Phân tích nâng cao**: Thống kê chi tiết tiến trình từng trẻ và hiệu suất lớp học
- **Đa ngôn ngữ**: Giao diện hỗ trợ nhiều ngôn ngữ (i18n)
- **Bảo mật nâng cao**: CSRF protection, giới hạn tốc độ API, chính sách mật khẩu mạnh, ghi log bảo mật và quản trị

---

Chúng em đã biết làm web và hiểu hệ thống web hoạt động như thế nào.
