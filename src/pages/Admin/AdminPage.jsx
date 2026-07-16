import React, { useState, useEffect } from "react";

const IconSearch = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const IconPlus = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5v14" />
    </svg>
);

const IconEdit = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);

const IconTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
    </svg>
);

const IconLogout = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
);

export default function AdminPage({ user, onLogout }) {
    const [employees, setEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    // Form State
    const [formValues, setFormValues] = useState({
        employeeId: "",
        password: "",
        name: "",
        role: "Nhân viên Sản xuất",
        department: "",
        dob: "",
        gender: "Nam",
        email: "",
        phone: "",
        joinDate: "",
        workLocation: "Nhà máy NBC - KCN VSIP II",
        status: "Đang làm việc",
    });

    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("sessionToken");
            const res = await fetch("/api/admin/employees", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                setEmployees(data.employees);
            } else {
                alert(data.message || "Không thể tải danh sách nhân viên");
            }
        } catch (err) {
            console.error("Error fetching employees:", err);
            alert("Lỗi kết nối đến server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleOpenAddModal = () => {
        setEditingEmployee(null);
        setFormValues({
            employeeId: "",
            password: "",
            name: "",
            role: "Nhân viên Sản xuất",
            department: "",
            dob: "",
            gender: "Nam",
            email: "",
            phone: "",
            joinDate: new Date().toLocaleDateString("vi-VN"),
            workLocation: "Nhà máy NBC - KCN VSIP II",
            status: "Đang làm việc",
        });
        setFormError("");
        setModalOpen(true);
    };

    const handleOpenEditModal = (emp) => {
        setEditingEmployee(emp);
        setFormValues({
            employeeId: emp.employeeId,
            password: "", // leave empty to keep unchanged
            name: emp.name || "",
            role: emp.role || "Nhân viên Sản xuất",
            department: emp.department || "",
            dob: emp.dob || "",
            gender: emp.gender || "Nam",
            email: emp.email || "",
            phone: emp.phone || "",
            joinDate: emp.joinDate || "",
            workLocation: emp.workLocation || "Nhà máy NBC - KCN VSIP II",
            status: emp.status || "Đang làm việc",
        });
        setFormError("");
        setModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        // Validation
        if (!formValues.employeeId.trim()) {
            setFormError("Vui lòng nhập Mã nhân viên");
            return;
        }
        if (!editingEmployee && !formValues.password) {
            setFormError("Vui lòng nhập Mật khẩu cho nhân viên mới");
            return;
        }
        if (!formValues.name.trim()) {
            setFormError("Vui lòng nhập Họ và tên");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem("sessionToken");
            const url = editingEmployee
                ? `/api/admin/employees/${editingEmployee.employeeId}`
                : "/api/admin/employees";
            const method = editingEmployee ? "PUT" : "POST";

            // Clean up empty password for edit
            const bodyData = { ...formValues };
            if (editingEmployee && !bodyData.password) {
                delete bodyData.password;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            });

            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setModalOpen(false);
                fetchEmployees();
            } else {
                setFormError(data.message || "Đã xảy ra lỗi");
            }
        } catch (err) {
            console.error("Error submitting employee:", err);
            setFormError("Lỗi kết nối đến server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (empId) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa nhân viên ${empId}?`)) {
            return;
        }

        try {
            const token = localStorage.getItem("sessionToken");
            const res = await fetch(`/api/admin/employees/${empId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchEmployees();
            } else {
                alert(data.message || "Xóa nhân viên thất bại");
            }
        } catch (err) {
            console.error("Error deleting employee:", err);
            alert("Lỗi kết nối đến server");
        }
    };

    const filteredEmployees = employees.filter(
        (emp) =>
            emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
            {/* Top Header */}
            <header className="bg-[#0f6e46] text-white px-6 py-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-xl tracking-wide bg-white text-[#0f6e46] px-3 py-1.5 rounded-lg">NBC</span>
                    <h1 className="text-lg font-semibold hidden md:block">Hệ thống Quản trị Nhân sự</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                        <p className="text-xs text-white/75">Quản trị viên</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border-none text-white px-3.5 py-2 rounded-lg cursor-pointer text-sm transition-all"
                    >
                        <IconLogout />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Danh sách nhân viên</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Tổng số: {filteredEmployees.length} nhân viên</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="relative flex items-center">
                                <span className="absolute left-3 text-gray-400">
                                    <IconSearch />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên hoặc mã NV..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2.5 w-full sm:w-64 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46] focus:ring-1 focus:ring-[#0f6e46]"
                                />
                            </div>
                            {/* Add Button */}
                            <button
                                onClick={handleOpenAddModal}
                                className="flex items-center justify-center gap-1.5 bg-[#0f6e46] hover:bg-[#0f6e46]/90 border-none text-white px-4 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition-all"
                            >
                                <IconPlus />
                                <span>Thêm nhân viên</span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="py-12 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0f6e46] border-t-transparent"></div>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            Không tìm thấy nhân viên nào khớp với từ khóa tìm kiếm.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="pb-3 pl-4">Nhân viên</th>
                                        <th className="pb-3">Mã NV</th>
                                        <th className="pb-3">Chức vụ</th>
                                        <th className="pb-3">Phòng ban</th>
                                        <th className="pb-3">Trạng thái</th>
                                        <th className="pb-3 pr-4 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.employeeId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3.5 pl-4 flex items-center gap-3">
                                                <img
                                                    src={emp.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80"}
                                                    alt={emp.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                                                    <p className="text-xs text-gray-500">{emp.email || "Chưa cập nhật email"}</p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 text-sm font-medium text-gray-600">{emp.employeeId}</td>
                                            <td className="py-3.5 text-sm text-gray-600">{emp.role}</td>
                                            <td className="py-3.5 text-sm text-gray-600">{emp.department}</td>
                                            <td className="py-3.5 text-sm">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${emp.status === "Đang làm việc"
                                                            ? "bg-green-50 text-green-700"
                                                            : emp.status === "Nghỉ phép"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : "bg-red-50 text-red-700"
                                                        }`}
                                                >
                                                    {emp.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 pr-4 text-right">
                                                <div className="inline-flex gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(emp)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 border-none bg-transparent rounded-lg cursor-pointer transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <IconEdit />
                                                    </button>
                                                    {emp.employeeId !== "admin" && (
                                                        <button
                                                            onClick={() => handleDelete(emp.employeeId)}
                                                            className="p-2 text-red-600 hover:bg-red-50 border-none bg-transparent rounded-lg cursor-pointer transition-all"
                                                            title="Xóa"
                                                        >
                                                            <IconTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 relative">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {editingEmployee ? "Cập nhật thông tin nhân viên" : "Thêm nhân viên mới"}
                        </h3>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Mã nhân viên *</span>
                                <input
                                    type="text"
                                    name="employeeId"
                                    value={formValues.employeeId}
                                    onChange={handleInputChange}
                                    disabled={!!editingEmployee}
                                    placeholder="VD: NBC006"
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46] disabled:bg-gray-50 disabled:text-gray-400"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">
                                    Mật khẩu {editingEmployee ? "(Để trống nếu không đổi)" : "*"}
                                </span>
                                <input
                                    type="password"
                                    name="password"
                                    value={formValues.password}
                                    onChange={handleInputChange}
                                    placeholder={editingEmployee ? "••••••••" : "Nhập mật khẩu"}
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Họ và tên *</span>
                                <input
                                    type="text"
                                    name="name"
                                    value={formValues.name}
                                    onChange={handleInputChange}
                                    placeholder="Nhập họ và tên"
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Vai trò *</span>
                                <select
                                    name="role"
                                    value={formValues.role}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46] bg-white"
                                >
                                    <option value="Nhân viên Sản xuất">Nhân viên Sản xuất</option>
                                    <option value="Nhân viên Kỹ thuật">Nhân viên Kỹ thuật</option>
                                    <option value="Nhân viên Kiểm hàng">Nhân viên Kiểm hàng</option>
                                    <option value="Nhân viên Vận hành">Nhân viên Vận hành</option>
                                    <option value="Nhân viên Đóng gói">Nhân viên Đóng gói</option>
                                    <option value="Trưởng nhóm Sản xuất">Trưởng nhóm Sản xuất</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Phòng ban</span>
                                <input
                                    type="text"
                                    name="department"
                                    value={formValues.department}
                                    onChange={handleInputChange}
                                    placeholder="VD: Phòng QC - Line 2"
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Ngày sinh</span>
                                <input
                                    type="text"
                                    name="dob"
                                    value={formValues.dob}
                                    onChange={handleInputChange}
                                    placeholder="VD: 12/05/1992"
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Giới tính</span>
                                <select
                                    name="gender"
                                    value={formValues.gender}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46] bg-white"
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Email</span>
                                <input
                                    type="email"
                                    name="email"
                                    value={formValues.email}
                                    onChange={handleInputChange}
                                    placeholder="VD: email@nbc.com.vn"
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Số điện thoại</span>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formValues.phone}
                                    onChange={handleInputChange}
                                    placeholder="VD: 0987 654 321"
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Ngày vào làm</span>
                                <input
                                    type="text"
                                    name="joinDate"
                                    value={formValues.joinDate}
                                    onChange={handleInputChange}
                                    placeholder="VD: 15/08/2020"
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Địa điểm làm việc</span>
                                <input
                                    type="text"
                                    name="workLocation"
                                    value={formValues.workLocation}
                                    onChange={handleInputChange}
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Trạng thái</span>
                                <select
                                    name="status"
                                    value={formValues.status}
                                    onChange={handleInputChange}
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46] bg-white"
                                >
                                    <option value="Đang làm việc">Đang làm việc</option>
                                    <option value="Nghỉ phép">Nghỉ phép</option>
                                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1 sm:col-span-2">
                                <span className="text-xs font-semibold text-gray-600">Link ảnh đại diện (Avatar URL)</span>
                                <input
                                    type="text"
                                    name="avatar"
                                    value={formValues.avatar || ""}
                                    onChange={handleInputChange}
                                    placeholder="https://images.unsplash.com/..."
                                    className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0f6e46]"
                                />
                            </label>

                            <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4.5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl cursor-pointer text-sm font-semibold transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4.5 py-2.5 border-none bg-[#0f6e46] hover:bg-[#0f6e46]/90 text-white rounded-xl cursor-pointer text-sm font-semibold transition-all disabled:opacity-50"
                                >
                                    {submitting ? "Đang lưu..." : "Lưu lại"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
