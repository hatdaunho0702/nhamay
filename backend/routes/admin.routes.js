import { Router } from "express";
import { db } from "../db.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

/**
 * GET /api/admin/employees
 */
router.get("/api/admin/employees", requireAdmin, async (req, res) => {
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
router.post("/api/admin/employees", requireAdmin, async (req, res) => {
    const { employeeId, password, name, role, department, dob, gender, email, phone, joinDate, workLocation, status } = req.body;
    if (!employeeId || !password || !name || !role) {
        return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ các thông tin bắt buộc" });
    }
    try {
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
    } catch (err) {
        console.error("Error saving employee:", err);
        return res.status(500).json({ success: false, message: "Không thể lưu dữ liệu, vui lòng thử lại sau" });
    }
});

/**
 * PUT /api/admin/employees/:id
 */
router.put("/api/admin/employees/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
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
    } catch (err) {
        console.error("Error updating employee:", err);
        return res.status(500).json({ success: false, message: "Không thể lưu dữ liệu, vui lòng thử lại sau" });
    }
});

/**
 * DELETE /api/admin/employees/:id
 */
router.delete("/api/admin/employees/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    if (id === req.employeeId) {
        return res.status(400).json({ success: false, message: "Không thể tự xóa tài khoản của chính mình" });
    }
    try {
        const employee = await db.getEmployee(id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
        }
        await db.deleteEmployee(id);
        return res.status(200).json({
            success: true,
            message: "Xóa nhân viên thành công!",
        });
    } catch (err) {
        console.error("Error deleting employee:", err);
        return res.status(500).json({ success: false, message: "Không thể lưu dữ liệu, vui lòng thử lại sau" });
    }
});

export default router;
