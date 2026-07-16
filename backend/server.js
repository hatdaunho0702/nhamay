import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { verifyRegistrationResponse, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { db } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ================= SESSION MANAGEMENT =================
const SESSION_SECRET = process.env.SESSION_SECRET || "nbc-secret-key-1234567890";

// Generate a stateless session token (HMAC-SHA256)
function generateSessionToken(employeeId) {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const payload = `${employeeId}.${expiresAt}`;
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    return `${payload}.${signature}`;
}

// Verify a stateless session token
function verifySessionToken(token) {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [employeeId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null;
    const payload = `${employeeId}.${expiresAt}`;
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (signature !== expectedSignature) return null;
    return { employeeId };
}

// Middleware to require a valid session token
function requireSession(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Không có quyền truy cập, vui lòng đăng nhập lại" });
    }
    const token = authHeader.split(" ")[1];
    const session = verifySessionToken(token);
    if (!session) {
        return res.status(401).json({ success: false, message: "Phiên làm việc không hợp lệ hoặc đã hết hạn" });
    }
    req.employeeId = session.employeeId;
    next();
}

// ================= MIDDLEWARE CONFIGURATION =================
app.use(cors());
app.use(express.json());

// Request logging middleware to print incoming requests to the console
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Helper to get employee ID from request headers (legacy)
const getEmployeeId = (req) => {
    return req.headers["x-employee-id"] || "NBC012345";
};

// ================= API ENDPOINTS =================

/**
 * POST /api/login
 * Handles employee authentication.
 */
app.post("/api/login", async (req, res) => {
    const { employeeId, password } = req.body;

    console.log("Login attempt for:", employeeId);

    const employee = await db.getEmployee(employeeId);
    if (employee && employee.password === password) {
        // Sinh session token không trạng thái bảo mật
        const sessionToken = generateSessionToken(employee.employeeId);

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công!",
            sessionToken,
            user: {
                employeeId: employee.employeeId,
                name: employee.name,
                role: employee.role,
            },
        });
    }

    return res.status(401).json({
        success: false,
        message: "Sai tài khoản hoặc mật khẩu",
    });
});

/**
 * POST /api/qr-login
 * Handles employee authentication via QR code.
 */
app.post("/api/qr-login", async (req, res) => {
    const { employeeId } = req.body;

    console.log("QR Login attempt for:", employeeId);

    const employee = await db.getEmployee(employeeId);
    if (employee) {
        // Sinh session token không trạng thái bảo mật
        const sessionToken = generateSessionToken(employee.employeeId);

        return res.status(200).json({
            success: true,
            message: "Đăng nhập bằng QR thành công!",
            sessionToken,
            user: {
                employeeId: employee.employeeId,
                name: employee.name,
                role: employee.role,
            },
        });
    }

    return res.status(404).json({
        success: false,
        message: "Mã nhân viên không tồn tại trên hệ thống",
    });
});

// ================= WEBAUTHN IN-MEMORY DATABASE =================
// Key: credentialId (string), Value: { employeeId, publicKey, counter }
const credentialsDb = {};
// Key: employeeId (string), Value: Array of credentialIds
const employeeCredentials = {};
// Key: employeeId or "login", Value: challenge string
const activeChallenges = {};

/**
 * POST /api/auth/webauthn/register-challenge
 * Generates a registration challenge for the logged-in user.
 */
app.post("/api/auth/webauthn/register-challenge", requireSession, async (req, res) => {
    const empId = req.employeeId;
    const employee = await db.getEmployee(empId);
    if (!employee) {
        return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
    }

    const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";

    // Generate a random challenge (base64url encoded)
    const challenge = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString()).toString("base64url");

    // Sign the challenge to make it stateless
    const expiresAt = Date.now() + 60000; // 1 minute
    const payload = `${challenge}.${expiresAt}.${empId}`;
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    const sessionId = `${payload}.${signature}`;

    return res.status(200).json({
        success: true,
        sessionId,
        publicKey: {
            challenge,
            rp: {
                name: "NBC HR System",
                id: host,
            },
            user: {
                id: Buffer.from(empId).toString("base64url"),
                name: employee.email || empId,
                displayName: employee.name,
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" }, // ES256
                { alg: -257, type: "public-key" }, // RS256
            ],
            timeout: 60000,
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
                residentKey: "required",
                requireResidentKey: true,
            },
            attestation: "none",
        }
    });
});

/**
 * POST /api/auth/webauthn/register-verify
 * Verifies and saves the new credential.
 */
app.post("/api/auth/webauthn/register-verify", requireSession, async (req, res) => {
    const empId = req.employeeId;
    const { credential, sessionId } = req.body;

    if (!credential || !credential.id || !sessionId) {
        return res.status(400).json({ success: false, message: "Dữ liệu xác thực không hợp lệ" });
    }

    // Verify stateless sessionId challenge
    const parts = sessionId.split(".");
    if (parts.length !== 4) {
        return res.status(400).json({ success: false, message: "Phiên đăng ký không hợp lệ" });
    }
    const [savedChallenge, expiresAtStr, challengeEmpId, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt || challengeEmpId !== empId) {
        return res.status(400).json({ success: false, message: "Yêu cầu đăng ký đã hết hạn hoặc không khớp" });
    }
    const payload = `${savedChallenge}.${expiresAt}.${challengeEmpId}`;
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, message: "Chữ ký phiên đăng ký không hợp lệ" });
    }

    try {
        const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
        const origin = req.headers.origin || `https://${host}`;

        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: savedChallenge,
            expectedOrigin: origin,
            expectedRPID: host,
            requireUserVerification: true,
        });

        if (!verification.verified) {
            return res.status(400).json({ success: false, message: "Xác minh đăng ký sinh trắc học thất bại" });
        }

        const { registrationInfo } = verification;
        const { credentialPublicKey, counter } = registrationInfo;

        // Generate a signed credential token for the client to store statelessly
        const credentialInfo = {
            id: credential.id,
            publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
            counter,
            employeeId: empId,
        };
        const credPayload = JSON.stringify(credentialInfo);
        const credSignature = crypto.createHmac("sha256", SESSION_SECRET).update(credPayload).digest("hex");
        const signedCredential = { payload: credPayload, signature: credSignature };

        // Save credential to database
        await db.saveCredential(credential.id, credentialInfo);

        console.log(`Registered biometric credential ${credential.id} for employee ${empId}`);

        return res.status(200).json({
            success: true,
            message: "Đăng ký sinh trắc học thành công!",
            signedCredential,
        });
    } catch (error) {
        console.error("Registration verification error:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi xác minh đăng ký" });
    }
});

/**
 * POST /api/auth/webauthn/unregister
 * Deletes the credential for the logged-in user.
 */
app.post("/api/auth/webauthn/unregister", requireSession, async (req, res) => {
    const empId = req.employeeId;
    await db.deleteCredentialsForEmployee(empId);

    console.log(`Unregistered biometric credentials for employee ${empId}`);

    return res.status(200).json({
        success: true,
        message: "Đã tắt đăng nhập bằng sinh trắc học thành công!",
    });
});

/**
 * POST /api/auth/webauthn/challenge
 * Generates a login challenge.
 */
app.post("/api/auth/webauthn/challenge", (req, res) => {
    const { mode } = req.body || {};
    const ttl = mode === "conditional" ? 300000 : 60000; // 5 minutes for conditional UI, 1 minute otherwise

    // Cơ cơ chế dọn rác: xóa các challenge đã hết hạn
    const now = Date.now();
    Object.keys(activeChallenges).forEach(key => {
        const entry = activeChallenges[key];
        if (entry && entry.createdAt && (now - entry.createdAt > (entry.ttl || 60000))) {
            delete activeChallenges[key];
        }
    });

    // Generate a random challenge
    const challenge = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString()).toString("base64url");

    // Sinh sessionId ngẫu nhiên tránh đụng độ
    const sessionId = crypto.randomBytes(16).toString("hex");
    activeChallenges[sessionId] = { challenge, createdAt: now, ttl };

    return res.status(200).json({
        success: true,
        sessionId,
        publicKey: {
            challenge,
            timeout: ttl,
            rpId: req.hostname === "localhost" ? "localhost" : req.hostname,
            userVerification: "required",
        }
    });
});

/**
 * POST /api/auth/webauthn/verify
 * Verifies the login assertion and authenticates the user.
 */
app.post("/api/auth/webauthn/verify", async (req, res) => {
    const { credential, sessionId, signedCredential } = req.body;

    if (!credential || !credential.id || !sessionId) {
        return res.status(400).json({ success: false, message: "Dữ liệu xác thực không hợp lệ" });
    }

    // Verify stateless sessionId challenge
    const parts = sessionId.split(".");
    if (parts.length !== 3) {
        return res.status(400).json({ success: false, message: "Phiên xác thực không hợp lệ" });
    }
    const [savedChallenge, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return res.status(400).json({ success: false, message: "Phiên xác thực đã hết hạn, vui lòng thử lại" });
    }
    const payload = `${savedChallenge}.${expiresAt}`;
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, message: "Chữ ký phiên xác thực không hợp lệ" });
    }

    // Look up credential in database
    let savedCred = await db.getCredential(credential.id);

    // Fallback to signedCredential if database doesn't have it (for backward compatibility)
    if (!savedCred && signedCredential && signedCredential.payload && signedCredential.signature) {
        const expectedCredSig = crypto.createHmac("sha256", SESSION_SECRET).update(signedCredential.payload).digest("hex");
        if (signedCredential.signature === expectedCredSig) {
            savedCred = JSON.parse(signedCredential.payload);
        }
    }

    if (!savedCred) {
        return res.status(401).json({
            success: false,
            message: "Thiết bị sinh trắc học này chưa được đăng ký hoặc không khớp với tài khoản nào",
        });
    }

    const employee = await db.getEmployee(savedCred.employeeId);
    if (!employee) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy thông tin nhân viên liên kết với thiết bị này",
        });
    }

    try {
        const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
        const origin = req.headers.origin || `https://${host}`;

        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: savedChallenge,
            expectedOrigin: origin,
            expectedRPID: host,
            authenticator: {
                credentialID: Buffer.from(savedCred.id, "base64url"),
                credentialPublicKey: Buffer.from(savedCred.publicKey, "base64url"),
                counter: savedCred.counter,
            },
            requireUserVerification: true,
        });

        if (!verification.verified) {
            return res.status(401).json({ success: false, message: "Xác thực sinh trắc học thất bại" });
        }

        // Cập nhật counter mới và sinh signedCredential mới
        const newCounter = verification.authenticationInfo.newCounter;
        const updatedCredInfo = {
            ...savedCred,
            counter: newCounter,
        };
        await db.saveCredential(credential.id, updatedCredInfo);

        const updatedPayload = JSON.stringify(updatedCredInfo);
        const updatedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(updatedPayload).digest("hex");
        const newSignedCredential = { payload: updatedPayload, signature: updatedSignature };

        // Sinh session token không trạng thái bảo mật
        const sessionToken = generateSessionToken(employee.employeeId);

        console.log(`Biometric login successful for employee ${employee.employeeId}`);

        return res.status(200).json({
            success: true,
            message: "Đăng nhập bằng sinh trắc học thành công!",
            sessionToken,
            signedCredential: newSignedCredential,
            user: {
                employeeId: employee.employeeId,
                name: employee.name,
                role: employee.role,
            },
        });
    } catch (error) {
        console.error("Authentication verification error:", error);
        return res.status(401).json({ success: false, message: "Xác thực sinh trắc học thất bại" });
    }
});

/**
 * GET /api/auth/webauthn/status
 * Helper endpoint to check if the current user has biometric enrolled.
 */
app.get("/api/auth/webauthn/status", requireSession, async (req, res) => {
    const empId = req.employeeId;
    const creds = Object.values(await db.getCredentials()).filter(c => c.employeeId === empId);
    return res.status(200).json({
        success: true,
        hasBiometricEnrolled: creds.length > 0,
    });
});
app.post("/api/forgot-password", (req, res) => {
    const { value } = req.body;

    console.log("Forgot password request for:", value);

    if (!value || !value.trim()) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng cung cấp mã nhân viên hoặc email",
        });
    }

    return res.status(200).json({
        success: true,
        message: `Yêu cầu đặt lại mật khẩu đã được gửi cho: ${value}`,
    });
});

/**
 * GET /api/dashboard
 */
app.get("/api/dashboard", async (req, res) => {
    const empId = getEmployeeId(req);
    console.log("Fetching dashboard data for:", empId);

    const employee = (await db.getEmployee(empId)) || (await db.getEmployee("NBC012345"));

    // Return mock dashboard data matching the UI design
    return res.status(200).json({
        success: true,
        employee: {
            employeeId: employee.employeeId,
            name: employee.name,
            role: employee.role,
            department: employee.department,
            avatar: employee.avatar,
            dob: employee.dob,
            gender: employee.gender,
            email: employee.email,
            phone: employee.phone,
            joinDate: employee.joinDate,
            workLocation: employee.workLocation,
            status: employee.status,
        },
        todayOverview: {
            workDays: {
                current: 1,
                total: 1,
                status: "Đủ công",
            },
            workHours: {
                current: 8.2,
                target: 8,
                unit: "Giờ",
            },
            estimatedSalary: {
                amount: empId.endsWith("5") ? 450000 : 320000, // slightly higher for group leader NBC005
                currency: "VND",
            },
            updatedAt: "08:30",
        },
        announcements: [
            {
                id: 1,
                title: "Thông báo bảo trì hệ thống định kỳ",
                content: "Hệ thống sẽ được bảo trì vào 22:00 ngày 25/05/2025. Cảm ơn anh/chị đã phối hợp.",
                date: "20/05/2025",
                image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
            }
        ]
    });
});

/**
 * GET /api/timekeeping
 */
app.get("/api/timekeeping", (req, res) => {
    const empId = getEmployeeId(req);
    console.log("Fetching timekeeping data for:", empId);

    // Generate May 2025 days (31 days, starting on Thursday)
    const days = [];
    const totalDays = 31;
    const startDayOfWeek = 4; // Thursday

    for (let i = 1; i <= totalDays; i++) {
        const dayOfWeek = (startDayOfWeek + i - 1) % 7;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let status = "Đủ công";
        let checkIn = "07:52";
        let checkOut = "17:05";
        let workHours = 8.2;

        // Mock different statuses for specific days to demonstrate UI states
        if (isWeekend) {
            status = "Nghỉ";
            checkIn = null;
            checkOut = null;
            workHours = 0;
        } else if (i === 5) {
            status = "Đi muộn";
            checkIn = "08:12";
            checkOut = "17:02";
            workHours = 7.8;
        } else if (i === 12) {
            status = "Về sớm";
            checkIn = "07:48";
            checkOut = "16:05";
            workHours = 7.2;
        } else if (i === 19) {
            status = "Nghỉ phép";
            checkIn = null;
            checkOut = null;
            workHours = 0;
        }

        days.push({
            day: i,
            dayOfWeek,
            status,
            checkIn,
            checkOut,
            workHours,
            shiftInfo: isWeekend ? "Nghỉ tuần" : "Ca ngày: 07:30 - 16:30 (Nghỉ 12:00 - 13:00)",
        });
    }

    return res.status(200).json({
        success: true,
        month: "5/2025",
        days,
    });
});

// Mock database for monthly payslips
const getPayslipsForEmployee = (empId) => {
    const baseEarnings = empId.endsWith("5") ? 18000000 : 15200000;
    const basicSalary = empId.endsWith("5") ? 10500000 : 8500000;
    const responsibilityAllowance = empId.endsWith("5") ? 3000000 : 1500000;
    const netPay = baseEarnings - 2350000;

    return {
        "05-2025": {
            id: "05-2025",
            month: "05/2025",
            period: "01/05 - 31/05/2025",
            paymentDate: "05/06/2025",
            status: "Đã thanh toán",
            summary: {
                earnings: baseEarnings,
                deductions: 2350000,
                netPay: netPay,
            },
            breakdown: {
                earnings: [
                    { label: "Lương cơ bản", amount: basicSalary },
                    { label: "Phụ cấp trách nhiệm", amount: responsibilityAllowance },
                    { label: "Phụ cấp chuyên cần", amount: 1000000 },
                    { label: "Lương làm thêm giờ", amount: 2200000 },
                    { label: "Thưởng năng suất", amount: 2000000 },
                ],
                deductions: [
                    { label: "Bảo hiểm xã hội", amount: 1280000 },
                    { label: "Bảo hiểm y tế", amount: 225000 },
                    { label: "Bảo hiểm thất nghiệp", amount: 112000 },
                    { label: "Thuế TNCN", amount: 733000 },
                ]
            }
        }
    };
};

/**
 * GET /api/payslips
 */
app.get("/api/payslips", (req, res) => {
    const empId = getEmployeeId(req);
    console.log("Fetching payslips list for:", empId);

    const mockPayslips = getPayslipsForEmployee(empId);
    const list = Object.values(mockPayslips).map(p => ({
        id: p.id,
        month: p.month,
        period: p.period,
        paymentDate: p.paymentDate,
        status: p.status,
        netPay: p.summary.netPay,
    }));
    return res.status(200).json({
        success: true,
        payslips: list,
    });
});

/**
 * GET /api/payslips/:id
 */
app.get("/api/payslips/:id", (req, res) => {
    const { id } = req.params;
    const empId = getEmployeeId(req);
    console.log("Fetching payslip details for:", id, "employee:", empId);

    const mockPayslips = getPayslipsForEmployee(empId);
    const payslip = mockPayslips[id];
    if (!payslip) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy phiếu lương",
        });
    }
    return res.status(200).json({
        success: true,
        payslip,
    });
});

/**
 * GET /api/requests
 */
app.get("/api/requests", async (req, res) => {
    const empId = getEmployeeId(req);
    console.log("Fetching requests list for:", empId);
    return res.status(200).json({
        success: true,
        requests: await db.getRequests(empId),
    });
});

/**
 * POST /api/requests
 */
app.post("/api/requests", async (req, res) => {
    const empId = getEmployeeId(req);
    const { type, details, reason } = req.body;
    console.log("Creating new request for:", empId, { type, details, reason });

    if (!type || !details || !reason) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng điền đầy đủ thông tin",
        });
    }

    const newRequest = {
        id: (await db.getRequests(empId)).length + 1,
        type,
        details,
        reason,
        status: "Chờ duyệt",
        createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    await db.addRequest(empId, newRequest);

    return res.status(201).json({
        success: true,
        message: "Tạo đơn thành công!",
        request: newRequest,
    });
});

// Middleware to require admin role
async function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Không có quyền truy cập, vui lòng đăng nhập lại" });
    }
    const token = authHeader.split(" ")[1];
    const session = verifySessionToken(token);
    if (!session) {
        return res.status(401).json({ success: false, message: "Phiên làm việc không hợp lệ hoặc đã hết hạn" });
    }
    const employee = await db.getEmployee(session.employeeId);
    if (!employee || employee.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Bạn không có quyền thực hiện hành động này" });
    }
    req.employeeId = session.employeeId;
    next();
}

// ================= ADMIN ENDPOINTS =================

/**
 * GET /api/admin/employees
 */
app.get("/api/admin/employees", requireAdmin, async (req, res) => {
    const employees = await db.getEmployees();
    const list = Object.values(employees).map(({ password, ...rest }) => rest);
    return res.status(200).json({
        success: true,
        employees: list,
    });
});

/**
 * POST /api/admin/employees
 */
app.post("/api/admin/employees", requireAdmin, async (req, res) => {
    const { employeeId, password, name, role, department, dob, gender, email, phone, joinDate, workLocation, status } = req.body;
    if (!employeeId || !password || !name || !role) {
        return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ các thông tin bắt buộc" });
    }
    if (await db.getEmployee(employeeId)) {
        return res.status(400).json({ success: false, message: "Mã nhân viên đã tồn tại" });
    }
    const newEmployee = {
        employeeId,
        password,
        name,
        role,
        department: department || "Chưa xếp phòng",
        avatar: req.body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80",
        dob: dob || "",
        gender: gender || "Nam",
        email: email || "",
        phone: phone || "",
        joinDate: joinDate || new Date().toLocaleDateString("vi-VN"),
        workLocation: workLocation || "Nhà máy NBC",
        status: status || "Đang làm việc",
    };
    await db.saveEmployee(employeeId, newEmployee);
    return res.status(201).json({
        success: true,
        message: "Thêm nhân viên thành công!",
        employee: { employeeId, name, role, department }
    });
});

/**
 * PUT /api/admin/employees/:id
 */
app.put("/api/admin/employees/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const employee = await db.getEmployee(id);
    if (!employee) {
        return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
    }
    const updatedData = { ...req.body };
    delete updatedData.employeeId;
    await db.saveEmployee(id, updatedData);
    return res.status(200).json({
        success: true,
        message: "Cập nhật nhân viên thành công!",
    });
});

/**
 * DELETE /api/admin/employees/:id
 */
app.delete("/api/admin/employees/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (id === req.employeeId) {
        return res.status(400).json({ success: false, message: "Không thể tự xóa tài khoản của chính mình" });
    }
    const employee = await db.getEmployee(id);
    if (!employee) {
        return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
    }
    await db.deleteEmployee(id);
    return res.status(200).json({
        success: true,
        message: "Xóa nhân viên thành công!",
    });
});

// Start Express server
if (process.argv[1] && process.argv[1].endsWith("server.js")) {
    app.listen(PORT, () => console.log(`Server chạy ở port ${PORT}`));
}
export default app;
