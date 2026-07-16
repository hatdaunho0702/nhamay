# NBC Login — hướng dẫn dùng nhanh

## Cài đặt
Chỉ dùng React thuần (không cần thư viện icon hay UI ngoài). Copy 2 file
`LoginPage.jsx` và `LoginPage.css` vào project, ví dụ `src/pages/Login/`.

## Dùng trong route
```jsx
import LoginPage from "./pages/Login/LoginPage";

function App() {
  const handleLogin = async ({ employeeId, password, remember }) => {
    // gọi API đăng nhập thật ở đây, ví dụ:
    // const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ employeeId, password }) });
    // if (!res.ok) throw new Error("Sai tài khoản hoặc mật khẩu");
    // xử lý token, redirect... nếu throw lỗi, form sẽ tự hiện thông báo lỗi
  };

  const handleForgotPassword = (value) => {
    // gọi API gửi yêu cầu quên mật khẩu
  };

  return <LoginPage onLogin={handleLogin} onForgotPassword={handleForgotPassword} />;
}
```

## Hành vi responsive
- `>= 1024px` (laptop/desktop): layout chia 2 cột — bên trái là panel thương
  hiệu xanh kiểu "dashboard" (logo, tagline, vài chỉ số tạm thời), bên phải
  là form đăng nhập.
- `< 1024px` (điện thoại/tablet): panel thương hiệu thu gọn thành phần đầu
  trang, form đăng nhập chiếm toàn màn hình dạng thẻ bo góc — giống trải
  nghiệm app di động.

## Những điểm cần chỉnh khi tích hợp thật
- **QR code**: `QrPlaceholder` trong file JSX chỉ là hình minh hoạ, cần thay
  bằng ảnh QR thật lấy từ backend (ví dụ API trả về base64 hoặc URL ảnh, hoặc
  dùng thư viện tạo QR như `qrcode.react`).
- **Đếm ngược QR**: hiện đang đếm ngược 60s trên client. Nên đồng bộ với
  thời gian sống thật của mã QR từ server, và gọi API tạo mã QR mới khi bấm
  "Làm mới mã QR" hoặc khi hết hạn.
- **Xác thực**: `onLogin` và `onForgotPassword` chỉ là callback rỗng, cần nối
  với API thật. Nếu `onLogin` reject/throw, form sẽ tự hiển thị dòng lỗi đỏ.
- Không có luồng đăng ký vì đây là tài khoản nội bộ do nhân sự cấp — đúng theo
  yêu cầu.

## Các Endpoint Sinh trắc học (WebAuthn/Passkey) mới thêm
Dự án đã tích hợp các endpoint hỗ trợ đăng nhập và đăng ký sinh trắc học (vân tay/Face ID/Windows Hello) tại `backend/server.js`:

### 1. Luồng Đăng ký (Enrollment) - Thực hiện tại tab Cá nhân của Dashboard:
- **POST `/api/auth/webauthn/register-challenge`**: Tạo challenge đăng ký cho nhân viên đang đăng nhập.
- **POST `/api/auth/webauthn/register-verify`**: Nhận credential từ client, xác minh và lưu trữ public key liên kết với mã nhân viên (lưu tạm in-memory).
- **POST `/api/auth/webauthn/unregister`**: Xóa credential sinh trắc học đã lưu của nhân viên.
- **GET `/api/auth/webauthn/status`**: Kiểm tra trạng thái đã đăng ký sinh trắc học của nhân viên.

### 2. Luồng Đăng nhập (Authentication) - Thực hiện tại LoginPage:
- **POST `/api/auth/webauthn/challenge`**: Tạo challenge đăng nhập (không cần định danh trước).
- **POST `/api/auth/webauthn/verify`**: Nhận credential từ client, đối chiếu với cơ sở dữ liệu để tìm nhân viên tương ứng và đăng nhập.
