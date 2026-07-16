# BÁO CÁO LUỒNG HOẠT ĐỘNG HỆ THỐNG NHÂN SỰ NBC

Tài liệu này mô tả chi tiết luồng hoạt động, các file xử lý, các hàm được gọi và chức năng tương ứng của từng thành phần trong hệ thống.

---

## 1. LUỒNG ĐĂNG NHẬP (AUTHENTICATION FLOW)

Luồng này xử lý khi người dùng truy cập ứng dụng, kiểm tra trạng thái đăng nhập cũ hoặc thực hiện đăng nhập mới.

### Các hàm & File xử lý:

| File | Hàm / Hook | Vai trò & Xử lý |
| :--- | :--- | :--- |
| **`src/App.jsx`** | `useEffect` (Mount) | **Kiểm tra đăng nhập tự động**: Đọc `localStorage.getItem("user")`. Nếu có, gọi `fetchDashboardData()` để tải dữ liệu và chuyển thẳng vào Dashboard. Nếu lỗi parse JSON, tự động xóa cache và đưa về màn hình đăng nhập. |
| **`src/App.jsx`** | `handleLogin` | **Gửi yêu cầu đăng nhập**: Nhận `employeeId`, `password`, `remember`. Gửi `POST /api/login` lên backend. Nếu thành công, gọi tiếp `fetchDashboardData()` để lấy dữ liệu tổng quan, lưu thông tin user vào state và `localStorage` (nếu chọn "Ghi nhớ"), sau đó chuyển sang Dashboard. |
| **`backend/server.js`** | `app.post("/api/login")` | **Xác thực tài khoản**: Kiểm tra `employeeId === "NBC012345"` và `password === "password123"`. Trả về thông tin user và thông báo thành công hoặc lỗi 401. |
| **`src/pages/Login/LoginPage.jsx`** | `handleSubmit` | **Xử lý submit form**: Ngăn hành vi mặc định của form, kiểm tra tính hợp lệ của dữ liệu đầu vào, đặt trạng thái `submitting` và gọi hàm `onLogin` (trỏ đến `handleLogin` ở `App.jsx`). |

---

## 2. LUỒNG TỔNG QUAN TRANG CHỦ (DASHBOARD OVERVIEW FLOW)

Luồng này tải dữ liệu tổng quan cho trang chủ Dashboard ngay sau khi đăng nhập thành công.

### Các hàm & File xử lý:

| File | Hàm / Hook | Vai trò & Xử lý |
| :--- | :--- | :--- |
| **`src/App.jsx`** | `fetchDashboardData` | **Tải dữ liệu tổng quan**: Gửi yêu cầu `GET /api/dashboard?t=timestamp` (sử dụng tham số thời gian để tránh cache trình duyệt). Lưu kết quả vào state `dashboardData`. |
| **`backend/server.js`** | `app.get("/api/dashboard")` | **Cung cấp dữ liệu tổng quan**: Trả về thông tin hồ sơ nhân viên (`employee`), thống kê ngày công/giờ làm/lương tạm tính hôm nay (`todayOverview`) và danh sách thông báo (`announcements`). |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `DashboardPage` (Render) | **Hiển thị trang chủ**: Nhận `data` từ `App.jsx`, destructure thành `employee`, `todayOverview`, `announcements` và hiển thị lên giao diện tab Trang chủ (`home`). |

---

## 3. LUỒNG CHẤM CÔNG (TIMEKEEPING FLOW)

Luồng này tải và hiển thị lịch chấm công chi tiết của nhân viên.

### Các hàm & File xử lý:

| File | Hàm / Hook | Vai trò & Xử lý |
| :--- | :--- | :--- |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `useEffect` (Timekeeping) | **Tự động tải dữ liệu**: Kích hoạt khi `activeTab === "timekeeping"`. Gửi yêu cầu `GET /api/timekeeping` lên backend và lưu vào state `timekeepingData`. Tự động chọn ngày mặc định là ngày 20. |
| **`backend/server.js`** | `app.get("/api/timekeeping")` | **Tạo lịch chấm công**: Tự động tạo danh sách 31 ngày của tháng 5/2025. Gán trạng thái (`Đủ công`, `Đi muộn`, `Về sớm`, `Nghỉ phép`, `Nghỉ`) và giờ check-in/out tương ứng cho từng ngày. |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `renderCalendar` | **Vẽ lịch chấm công**: Hiển thị lưới lịch 31 ngày kèm các dấu chấm màu chỉ thị trạng thái chấm công. |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `renderDayDetails` | **Hiển thị chi tiết ngày**: Khi người dùng click vào một ngày trên lịch, hàm này hiển thị chi tiết giờ Check-in, Check-out, số giờ làm việc và thông tin ca làm việc của ngày đó. |

---

## 4. LUỒNG PHIẾU LƯƠNG (PAYSLIP FLOW)

Luồng này hiển thị danh sách phiếu lương các tháng và chi tiết thu nhập/khấu trừ của từng tháng.

### Các hàm & File xử lý:

| File | Hàm / Hook | Vai trò & Xử lý |
| :--- | :--- | :--- |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `useEffect` (Payslips List) | **Tải danh sách phiếu lương**: Kích hoạt khi `activeTab === "payslip"`. Gửi yêu cầu `GET /api/payslips` lên backend và lưu vào state `payslips`. |
| **`backend/server.js`** | `app.get("/api/payslips")` | **Cung cấp danh sách phiếu lương**: Trả về danh sách tóm tắt các phiếu lương (tháng, kỳ lương, ngày thanh toán, thực lĩnh, trạng thái). |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `renderPayslipsList` | **Hiển thị danh sách**: Vẽ danh sách phiếu lương. Khi click vào một phiếu lương sẽ set state `selectedPayslipId`. |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `useEffect` (Payslip Detail) | **Tải chi tiết phiếu lương**: Kích hoạt khi `selectedPayslipId` thay đổi. Gửi yêu cầu `GET /api/payslips/:id` lên backend và lưu vào state `payslipDetail`. |
| **`backend/server.js`** | `app.get("/api/payslips/:id")` | **Cung cấp chi tiết phiếu lương**: Tìm kiếm phiếu lương theo ID trong mock database và trả về chi tiết các khoản thu nhập (Lương cơ bản, phụ cấp, tăng ca...) và khấu trừ (bảo hiểm, thuế...). |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `renderPayslipDetail` | **Hiển thị chi tiết**: Vẽ bảng phân tích chi tiết thu nhập, khấu trừ và số tiền thực lĩnh của tháng được chọn. |

---

## 5. LUỒNG ĐƠN TỪ (REQUESTS FLOW)

Luồng này quản lý danh sách đơn từ (lọc theo trạng thái) và gửi đơn từ mới lên hệ thống.

### Các hàm & File xử lý:

| File | Hàm / Hook | Vai trò & Xử lý |
| :--- | :--- | :--- |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `useEffect` (Requests List) | **Tải danh sách đơn từ**: Kích hoạt khi `activeTab === "requests"`. Gửi yêu cầu `GET /api/requests` lên backend và lưu vào state `requests`. |
| **`backend/server.js`** | `app.get("/api/requests")` | **Cung cấp danh sách đơn từ**: Trả về mảng danh sách đơn từ hiện tại. |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `renderRequestsTab` | **Hiển thị & Lọc đơn từ**: Hiển thị các tab bộ lọc (`Tất cả`, `Chờ duyệt`, `Đã duyệt`, `Từ chối`). Lọc danh sách đơn theo trạng thái được chọn và hiển thị kèm nút mở Modal tạo đơn mới. |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `handleCreateRequest` | **Gửi đơn từ mới**: Kích hoạt khi submit form trong Modal. Gửi yêu cầu `POST /api/requests` kèm dữ liệu form (`type`, `details`, `reason`). Khi backend phản hồi thành công, chèn đơn mới vào đầu danh sách `requests` trong state để cập nhật UI ngay lập tức. |
| **`backend/server.js`** | `app.post("/api/requests")` | **Tiếp nhận đơn từ mới**: Kiểm tra dữ liệu đầu vào, tạo đối tượng đơn mới với trạng thái mặc định là `Chờ duyệt` và ngày tạo hiện tại, thêm vào đầu mảng `mockRequests` trong bộ nhớ và trả về đơn vừa tạo. |

---

## 6. LUỒNG SINH TRẮC HỌC (BIOMETRIC FLOW)

Luồng này xử lý việc đăng ký (enrollment), hủy đăng ký (unenrollment) và đăng nhập bằng sinh trắc học (vân tay/Face ID/Windows Hello) thông qua chuẩn WebAuthn có sẵn của trình duyệt.

### 6.1. Luồng Đăng ký & Hủy đăng ký (Trong tab Cá nhân của Dashboard)

| File | Hàm / Hook | Vai trò & Xử lý |
| :--- | :--- | :--- |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `useEffect` (Mount/Tab Profile) | **Kiểm tra trạng thái**: Khi chuyển sang tab `profile`, kiểm tra thiết bị có hỗ trợ sinh trắc học không qua `checkBiometricSupport()`. Đồng thời gọi `GET /api/auth/webauthn/status` để kiểm tra nhân viên đã đăng ký chưa, lưu vào state `hasBiometricEnrolled` và đồng bộ vào `localStorage`. |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `handleRegisterBiometric` | **Đăng ký sinh trắc học**: <br>1. Gọi `POST /api/auth/webauthn/register-challenge` để lấy challenge từ server.<br>2. Gọi API trình duyệt `navigator.credentials.create({ publicKey })` để kích hoạt hộp thoại quét vân tay/khuôn mặt.<br>3. Gửi credential nhận được lên `POST /api/auth/webauthn/register-verify` để server lưu trữ.<br>4. Lưu trạng thái `nbc_biometric_enrolled = true` vào `localStorage`. |
| **`backend/server.js`** | `app.post("/api/auth/webauthn/register-challenge")` | **Sinh challenge đăng ký**: Tạo challenge ngẫu nhiên dạng base64url và lưu vào `activeChallenges[empId]` để đối chiếu khi verify. Trả về cấu hình `publicKey` chuẩn WebAuthn. |
| **`backend/server.js`** | `app.post("/api/auth/webauthn/register-verify")` | **Xác minh & Lưu credential**: Nhận credential từ client, kiểm tra challenge hợp lệ, lưu thông tin credential (ID, public key) vào cơ sở dữ liệu in-memory (`credentialsDb` và `employeeCredentials`). |
| **`src/pages/Dashboard/DashboardPage.jsx`** | `handleUnregisterBiometric` | **Hủy đăng ký**: Gửi yêu cầu `POST /api/auth/webauthn/unregister` lên server để xóa credential đã lưu, cập nhật state và đặt `nbc_biometric_enrolled = false` trong `localStorage`. |
| **`backend/server.js`** | `app.post("/api/auth/webauthn/unregister")` | **Xóa credential**: Xóa toàn bộ credential sinh trắc học liên kết với mã nhân viên trong `credentialsDb` và `employeeCredentials`. |

### 6.2. Luồng Đăng nhập Sinh trắc học (Tại màn hình Login)

| File | Hàm / Hook | Vai trò & Xử lý |
| :--- | :--- | :--- |
| **`src/pages/Login/LoginPage.jsx`** | `useEffect` (Mount) | **Kiểm tra hỗ trợ**: Gọi `checkBiometricSupport()` để kiểm tra thiết bị. Nếu hỗ trợ và `hasBiometricEnrolled === true` (đọc từ `localStorage`), hiển thị nút "Đăng nhập bằng sinh trắc học" phía trên các tab. |
| **`src/pages/Login/LoginPage.jsx`** | `handleBiometricLoginClick` | **Thực hiện đăng nhập**: <br>1. Gọi `POST /api/auth/webauthn/challenge` để lấy challenge đăng nhập.<br>2. Gọi API trình duyệt `navigator.credentials.get({ publicKey })` để người dùng xác thực vân tay/khuôn mặt.<br>3. Gửi credential assertion nhận được lên `POST /api/auth/webauthn/verify` để xác thực.<br>4. Nếu thành công, gọi callback `onBiometricLogin(verifyData)`. |
| **`backend/server.js`** | `app.post("/api/auth/webauthn/challenge")` | **Sinh challenge đăng nhập**: Tạo challenge ngẫu nhiên dạng base64url và lưu vào `activeChallenges["login"]`. |
| **`backend/server.js`** | `app.post("/api/auth/webauthn/verify")` | **Xác thực đăng nhập**: Nhận credential từ client, đối chiếu credential ID trong `credentialsDb` để tìm ra `employeeId` tương ứng. Trả về thông tin user đăng nhập thành công. |
| **`src/App.jsx`** | `handleBiometricLogin` | **Xử lý session**: Nhận dữ liệu phản hồi thành công từ `LoginPage`, gọi `fetchDashboardData()` để tải dữ liệu trang chủ, lưu thông tin user vào state và `localStorage`, sau đó tự động chuyển hướng vào Dashboard. |

---

## 7. LUỒNG QUẢN TRỊ VIÊN (ADMIN FLOW)

Luồng này dành riêng cho tài khoản có vai trò `Admin` (ví dụ: tài khoản `admin` / `admin123`). Sau khi đăng nhập, hệ thống sẽ chuyển hướng Admin vào trang quản trị để thực hiện các thao tác CRUD nhân viên.

### Các hàm & File xử lý:

| File | Hàm / Hook | Vai trò & Xử lý |
| :--- | :--- | :--- |
| **`src/App.jsx`** | `useEffect` (Mount) & `handleLogin` | **Định tuyến vai trò**: Kiểm tra nếu `user.role === "Admin"`, bỏ qua việc tải dữ liệu Dashboard của nhân viên thường và hiển thị trực tiếp component `AdminPage`. |
| **`src/pages/Admin/AdminPage.jsx`** | `AdminPage` (Render) | **Giao diện Quản trị**: Hiển thị danh sách nhân viên dưới dạng bảng, cung cấp thanh tìm kiếm theo tên/mã nhân viên và nút mở Modal thêm/sửa nhân viên. |
| **`src/pages/Admin/AdminPage.jsx`** | `fetchEmployees` | **Tải danh sách**: Gửi yêu cầu `GET /api/admin/employees` kèm token xác thực để lấy toàn bộ danh sách nhân viên từ backend. |
| **`src/pages/Admin/AdminPage.jsx`** | `handleSubmit` | **Thêm/Sửa nhân viên**: Gửi yêu cầu `POST /api/admin/employees` (khi thêm mới) hoặc `PUT /api/admin/employees/:id` (khi cập nhật) kèm thông tin nhân viên từ form. |
| **`src/pages/Admin/AdminPage.jsx`** | `handleDelete` | **Xóa nhân viên**: Gửi yêu cầu `DELETE /api/admin/employees/:id` để xóa nhân viên khỏi hệ thống (không cho phép tự xóa tài khoản admin đang đăng nhập). |
| **`backend/server.js`** | `requireAdmin` | **Middleware bảo vệ**: Xác thực token phiên làm việc và kiểm tra vai trò của người dùng. Chỉ cho phép tài khoản có `role === "Admin"` đi tiếp. |
| **`backend/server.js`** | `GET /api/admin/employees` | **API lấy danh sách**: Trả về danh sách tất cả nhân viên trong cơ sở dữ liệu (đã ẩn mật khẩu để bảo mật). |
| **`backend/server.js`** | `POST /api/admin/employees` | **API thêm mới**: Kiểm tra mã nhân viên trùng lặp, lưu thông tin nhân viên mới vào `db.json`. |
| **`backend/server.js`** | `PUT /api/admin/employees/:id` | **API cập nhật**: Cập nhật thông tin chi tiết của nhân viên theo ID trong `db.json`. |
| **`backend/server.js`** | `DELETE /api/admin/employees/:id` | **API xóa**: Xóa nhân viên khỏi `db.json`, đồng thời dọn dẹp các đơn từ và thiết bị sinh trắc học liên kết. |
