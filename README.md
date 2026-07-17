# NBC HR System

Hệ thống quản lý nhân sự nội bộ tích hợp xác thực sinh trắc học (WebAuthn/Passkey) và đăng nhập nhanh qua mã QR.

---

## 🌟 Tính Năng Chính

- **Đăng nhập đa phương thức:**
  - Đăng nhập bằng mã nhân viên & mật khẩu thông thường.
  - Đăng nhập nhanh bằng mã QR (QR Login).
  - Xác thực sinh trắc học bảo mật cao (WebAuthn/Passkey) sử dụng vân tay hoặc khuôn mặt (TouchID, FaceID, Windows Hello).
- **Bảng điều khiển nhân viên (Dashboard):**
  - Xem thông tin cá nhân, vị trí công tác.
  - Tổng quan chấm công trong ngày, số giờ làm việc và ước tính thu nhập.
  - Xem bảng tin thông báo nội bộ của nhà máy.
- **Quản lý chấm công (Timekeeping):**
  - Lịch chấm công chi tiết hàng tháng.
  - Xem chi tiết giờ check-in, check-out, đi muộn, về sớm hoặc nghỉ phép của từng ngày.
- **Quản lý phiếu lương (Payslips):**
  - Xem danh sách phiếu lương hàng tháng.
  - Chi tiết thu nhập (lương cơ bản, phụ cấp, tăng ca) và các khoản khấu trừ (bảo hiểm, thuế).
  - Hỗ trợ tải phiếu lương dưới dạng PDF.
- **Yêu cầu & Đơn từ (Requests):**
  - Tạo đơn xin nghỉ phép năm, nghỉ ốm, làm thêm giờ (OT).
  - Theo dõi trạng thái phê duyệt của đơn từ.
- **Quản trị viên (Admin Portal):**
  - Quản lý danh sách nhân sự (CRUD nhân viên).
  - Phân quyền vai trò (Admin / Employee).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Frontend
- **Framework:** React (v19) + Vite
- **Styling:** Tailwind CSS (v4)
- **Libraries:** `jsqr` (quét mã QR qua camera)

### Backend
- **Runtime:** Node.js + Express.js
- **Biometrics:** `@simplewebauthn/server` (xác thực WebAuthn)
- **Database:** Firebase Firestore (Production) với cơ chế tự động chuyển đổi sang **Local JSON File** (`db.json`) làm dự phòng khi mất kết nối mạng.

---

## 📁 Cấu Trúc Thư Mục

```text
nhamay/
├── frontend/                  # Mã nguồn giao diện người dùng (React)
│   ├── src/
│   │   ├── pages/             # Các trang: Login, Dashboard, Admin
│   │   ├── App.jsx            # Component chính & quản lý state toàn cục
│   │   └── main.jsx
│   ├── public/                # Tài nguyên tĩnh (icons, logo)
│   ├── vite.config.js         # Cấu hình Vite
│   └── package.json
├── backend/                   # Mã nguồn máy chủ (Node.js + Express)
│   ├── config/                # Cấu hình môi trường (env.js)
│   ├── middleware/            # Middleware xác thực (requireSession, requireAdmin)
│   ├── routes/                # Router API (auth, webauthn, employee, admin)
│   ├── utils/                 # Hàm tiện ích ký HMAC (token.js)
│   ├── db.js                  # Lớp kết nối Database (Firebase/JSON)
│   ├── db.json                # Database cục bộ dự phòng
│   ├── server.js              # Entry point của backend
│   └── package.json
├── vercel.json                # Cấu hình deploy Vercel (Monorepo Services)
└── README.md
```

---

## ⚙️ Biến Môi Trường (Environment Variables)

Tạo file `.env` trong thư mục `backend/` với các biến sau:

```env
PORT=5000
SESSION_SECRET=your-super-secret-key-here

# Cấu hình Firebase (Tùy chọn - nếu không có sẽ tự động dùng db.json cục bộ)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Tải mã nguồn
```bash
git clone https://github.com/hatdaunho0702/nhamay.git
cd nhamay
```

### 2. Cài đặt & Chạy Backend
```bash
cd backend
npm install
# Tạo file .env và cấu hình các biến môi trường
npm start
```
Máy chủ backend sẽ chạy tại: `http://localhost:5000`

### 3. Cài đặt & Chạy Frontend
Mở một terminal mới tại thư mục gốc của dự án:
```bash
cd frontend
npm install
npm run dev
```
Ứng dụng frontend sẽ chạy tại: `http://localhost:5173` (hoặc cổng được Vite chỉ định).

---

## 🔌 Danh Sách API Endpoints

### Xác thực & Tài khoản
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | Public | Đăng nhập bằng mã nhân viên và mật khẩu |
| `POST` | `/api/qr-login` | Public | Đăng nhập nhanh bằng mã QR |
| `POST` | `/api/forgot-password` | Public | Gửi yêu cầu đặt lại mật khẩu |

### Xác thực Sinh trắc học (WebAuthn)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/webauthn/register-challenge` | Employee / Admin | Lấy challenge để đăng ký thiết bị mới |
| `POST` | `/api/auth/webauthn/register-verify` | Employee / Admin | Xác minh và lưu public key thiết bị |
| `POST` | `/api/auth/webauthn/unregister` | Employee / Admin | Hủy đăng ký sinh trắc học của tài khoản |
| `POST` | `/api/auth/webauthn/challenge` | Public | Lấy challenge để đăng nhập sinh trắc học |
| `POST` | `/api/auth/webauthn/verify` | Public | Xác minh chữ ký thiết bị và đăng nhập |
| `GET` | `/api/auth/webauthn/status` | Employee / Admin | Kiểm tra tài khoản đã đăng ký sinh trắc học chưa |

### Nghiệp vụ Nhân viên (Employee)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Employee / Admin | Lấy thông tin tổng quan trang chủ |
| `GET` | `/api/timekeeping` | Employee / Admin | Lấy lịch sử chấm công chi tiết |
| `GET` | `/api/payslips` | Employee / Admin | Lấy danh sách phiếu lương |
| `GET` | `/api/payslips/:id` | Employee / Admin | Xem chi tiết một phiếu lương |
| `GET` | `/api/requests` | Employee / Admin | Lấy danh sách đơn từ đã gửi |
| `POST` | `/api/requests` | Employee / Admin | Gửi đơn từ mới (nghỉ phép, OT...) |

### Quản trị viên (Admin)
| Method | Endpoint | Quyền truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/employees` | Admin | Lấy danh sách toàn bộ nhân viên |
| `POST` | `/api/admin/employees` | Admin | Thêm nhân viên mới |
| `PUT` | `/api/admin/employees/:id` | Admin | Cập nhật thông tin nhân viên |
| `DELETE` | `/api/admin/employees/:id` | Admin | Xóa nhân viên khỏi hệ thống |
