import { Router } from "express";
import { db } from "../db.js";
import { generateSessionToken } from "../utils/token.js";

const router = Router();

/**
 * POST /api/login
 * Handles employee authentication.
 */
router.post("/api/login", async (req, res) => {
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
router.post("/api/qr-login", async (req, res) => {
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

/**
 * POST /api/forgot-password
 */
router.post("/api/forgot-password", (req, res) => {
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

export default router;
