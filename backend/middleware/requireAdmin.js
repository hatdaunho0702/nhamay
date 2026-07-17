import { verifySessionToken } from "../utils/token.js";
import { db } from "../db.js";

export async function requireAdmin(req, res, next) {
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
