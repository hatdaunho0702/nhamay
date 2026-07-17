import { Router } from "express";
import { db } from "../db.js";
import { requireSession } from "../middleware/requireSession.js";

const router = Router();

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
 * GET /api/dashboard
 */
router.get("/api/dashboard", requireSession, async (req, res) => {
    const empId = req.employeeId;
    console.log("Fetching dashboard data for:", empId);

    const employee = await db.getEmployee(empId);
    if (!employee) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy nhân viên",
        });
    }

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
router.get("/api/timekeeping", requireSession, (req, res) => {
    const empId = req.employeeId;
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

/**
 * GET /api/payslips
 */
router.get("/api/payslips", requireSession, (req, res) => {
    const empId = req.employeeId;
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
router.get("/api/payslips/:id", requireSession, (req, res) => {
    const { id } = req.params;
    const empId = req.employeeId;
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
router.get("/api/requests", requireSession, async (req, res) => {
    const empId = req.employeeId;
    console.log("Fetching requests list for:", empId);
    return res.status(200).json({
        success: true,
        requests: await db.getRequests(empId),
    });
});

/**
 * POST /api/requests
 */
router.post("/api/requests", requireSession, async (req, res) => {
    const empId = req.employeeId;
    const { type, details, reason } = req.body;
    console.log("Creating new request for:", empId, { type, details, reason });

    if (!type || !details || !reason) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng điền đầy đủ thông tin",
        });
    }

    try {
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
    } catch (err) {
        console.error("Error creating request:", err);
        return res.status(500).json({ success: false, message: "Không thể lưu dữ liệu, vui lòng thử lại sau" });
    }
});

export default router;
