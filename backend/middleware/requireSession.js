import { verifySessionToken } from "../utils/token.js";

export function requireSession(req, res, next) {
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
