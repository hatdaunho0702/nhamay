import React, { useState, useEffect } from "react";
import { checkBiometricSupport } from "../Login/LoginPage";

/* ---------- Inline SVG Icons ---------- */
const IconHome = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const IconCalendar = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
);

const IconPayslip = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
        <path d="M6 14h.01M10 14h.01M14 14h.01" />
    </svg>
);

const IconRequest = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const IconUser = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const IconBell = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);

const IconLogout = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
);

const IconPlus = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="5" y2="19" />
        <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
);

export default function DashboardPage({ data, user = {}, onLogout }) {
    // ================= STATE MANAGEMENT =================
    const [activeTab, setActiveTab] = useState("home"); // Current active tab: "home" | "timekeeping" | "payslip" | "requests" | "profile"

    // Destructure dashboard overview data with robust fallback defaults
    const { employee = {}, todayOverview = {}, announcements = [] } = data || {};

    // Navigation items configuration
    const navItems = [
        { id: "home", label: "Trang chủ", icon: IconHome },
        { id: "timekeeping", label: "Chấm công", icon: IconCalendar },
        { id: "payslip", label: "Phiếu lương", icon: IconPayslip },
        { id: "requests", label: "Đơn từ", icon: IconRequest },
        { id: "profile", label: "Cá nhân", icon: IconUser },
    ];

    // Timekeeping & Payslip States
    const [timekeepingData, setTimekeepingData] = useState(null); // Calendar days data
    const [selectedDay, setSelectedDay] = useState(null); // Currently selected day in calendar
    const [payslips, setPayslips] = useState(null); // List of monthly payslips
    const [selectedPayslipId, setSelectedPayslipId] = useState(null); // ID of selected payslip for detailed view
    const [payslipDetail, setPayslipDetail] = useState(null); // Detailed breakdown of selected payslip

    // Loading States
    const [loadingTimekeeping, setLoadingTimekeeping] = useState(false);
    const [loadingPayslips, setLoadingPayslips] = useState(false);
    const [loadingPayslipDetail, setLoadingPayslipDetail] = useState(false);

    // Requests States
    const [requests, setRequests] = useState(null); // List of employee requests
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [activeRequestFilter, setActiveRequestFilter] = useState("Tất cả"); // Request filter: "Tất cả" | "Chờ duyệt" | "Đã duyệt" | "Từ chối"
    const [showCreateModal, setShowCreateModal] = useState(false); // Toggle for "Create Request" modal

    // Form state for new request
    const [requestType, setRequestType] = useState("Nghỉ phép năm");
    const [requestDetails, setRequestDetails] = useState("");
    const [requestReason, setRequestReason] = useState("");
    const [submittingRequest, setSubmittingRequest] = useState(false);

    /* ---------- Biometric Registration State & Logic ---------- */
    const [biometricSupported, setBiometricSupported] = useState(false);
    const [hasBiometricEnrolled, setHasBiometricEnrolled] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [biometricError, setBiometricError] = useState("");

    // Helper functions for base64url conversions
    const base64urlToBuffer = (base64url) => {
        const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
        const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
        const binStr = window.atob(base64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binStr.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const bufferToBase64url = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binStr = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binStr += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binStr);
        return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    };

    const checkBiometricStatus = async () => {
        try {
            const token = localStorage.getItem("sessionToken");
            const res = await fetch("/api/auth/webauthn/status", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            });
            const data = await res.json();
            if (data.success) {
                setHasBiometricEnrolled(data.hasBiometricEnrolled);
                localStorage.setItem("nbc_biometric_enrolled", data.hasBiometricEnrolled ? "true" : "false");
            }
        } catch (err) {
            console.error("Error checking biometric status:", err);
        }
    };

    useEffect(() => {
        if (activeTab === "profile" && (employee.employeeId || user.employeeId)) {
            checkBiometricSupport().then(setBiometricSupported);
            checkBiometricStatus();
        }
    }, [activeTab, employee.employeeId, user.employeeId]);

    const handleRegisterBiometric = async () => {
        setBiometricLoading(true);
        setBiometricError("");
        try {
            const token = localStorage.getItem("sessionToken");
            // 1. Lấy challenge đăng ký từ server
            const challengeRes = await fetch("/api/auth/webauthn/register-challenge", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            const challengeData = await challengeRes.json();
            if (!challengeData.success) {
                throw new Error(challengeData.message || "Không thể lấy challenge đăng ký từ server");
            }

            const { publicKey, sessionId } = challengeData;

            // Chuyển đổi các trường ArrayBuffer từ base64url
            publicKey.challenge = base64urlToBuffer(publicKey.challenge);
            publicKey.user.id = base64urlToBuffer(publicKey.user.id);

            // 2. Gọi navigator.credentials.create
            const credential = await navigator.credentials.create({ publicKey });
            if (!credential) {
                throw new Error("Đăng ký sinh trắc học bị hủy hoặc thất bại");
            }

            // Chuyển đổi credential sang định dạng JSON để gửi lên server
            const credentialJSON = {
                id: credential.id,
                rawId: bufferToBase64url(credential.rawId),
                type: credential.type,
                response: {
                    clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
                    attestationObject: bufferToBase64url(credential.response.attestationObject),
                }
            };

            // 3. Gửi kết quả lên server để xác minh và lưu trữ
            const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ credential: credentialJSON, sessionId }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
                throw new Error(verifyData.message || "Xác minh đăng ký sinh trắc học thất bại");
            }

            setHasBiometricEnrolled(true);
            localStorage.setItem("nbc_biometric_enrolled", "true");
            if (verifyData.signedCredential) {
                localStorage.setItem("nbc_signed_credential", JSON.stringify(verifyData.signedCredential));
            }
            alert("Đăng ký sinh trắc học thành công!");
        } catch (err) {
            console.error("Biometric registration error:", err);
            setBiometricError(err.message || "Đăng ký sinh trắc học thất bại. Vui lòng thử lại.");
        } finally {
            setBiometricLoading(false);
        }
    };

    const handleUnregisterBiometric = async () => {
        if (!confirm("Bạn có chắc chắn muốn tắt đăng nhập bằng sinh trắc học trên thiết bị này?")) {
            return;
        }
        setBiometricLoading(true);
        setBiometricError("");
        try {
            const token = localStorage.getItem("sessionToken");
            const res = await fetch("/api/auth/webauthn/unregister", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || "Không thể tắt sinh trắc học");
            }

            setHasBiometricEnrolled(false);
            localStorage.setItem("nbc_biometric_enrolled", "false");
            localStorage.removeItem("nbc_signed_credential");
            alert("Đã tắt đăng nhập bằng sinh trắc học thành công!");
        } catch (err) {
            console.error("Biometric unregistration error:", err);
            setBiometricError(err.message || "Không thể tắt sinh trắc học. Vui lòng thử lại.");
        } finally {
            setBiometricLoading(false);
        }
    };
    /* ----------------------------------------------------------- */

    // ================= DATA FETCHING EFFECTS =================

    /**
     * Fetch Timekeeping Data
     * Triggered when switching to "timekeeping" tab if not already loaded.
     */
    useEffect(() => {
        if (activeTab === "timekeeping" && !timekeepingData && user.employeeId) {
            setLoadingTimekeeping(true);
            fetch("/api/timekeeping", {
                headers: {
                    "x-employee-id": user.employeeId,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setTimekeepingData(data);
                        // Auto-select May 20th as a default demo day
                        const day20 = data.days.find((d) => d.day === 20);
                        setSelectedDay(day20 || data.days[0]);
                    }
                })
                .catch((err) => console.error("Error fetching timekeeping:", err))
                .finally(() => setLoadingTimekeeping(false));
        }
    }, [activeTab, timekeepingData, user.employeeId]);

    /**
     * Fetch Payslips List
     * Triggered when switching to "payslip" tab if not already loaded.
     */
    useEffect(() => {
        if (activeTab === "payslip" && !payslips && user.employeeId) {
            setLoadingPayslips(true);
            fetch("/api/payslips", {
                headers: {
                    "x-employee-id": user.employeeId,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setPayslips(data.payslips);
                    }
                })
                .catch((err) => console.error("Error fetching payslips:", err))
                .finally(() => setLoadingPayslips(false));
        }
    }, [activeTab, payslips, user.employeeId]);

    /**
     * Fetch Payslip Detail
     * Triggered when a specific payslip is selected.
     */
    useEffect(() => {
        if (selectedPayslipId && user.employeeId) {
            setLoadingPayslipDetail(true);
            fetch(`/api/payslips/${selectedPayslipId}`, {
                headers: {
                    "x-employee-id": user.employeeId,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setPayslipDetail(data.payslip);
                    }
                })
                .catch((err) => console.error("Error fetching payslip detail:", err))
                .finally(() => setLoadingPayslipDetail(false));
        } else {
            setPayslipDetail(null);
        }
    }, [selectedPayslipId, user.employeeId]);

    /**
     * Fetch Requests List
     * Triggered when switching to "requests" tab if not already loaded.
     */
    useEffect(() => {
        if (activeTab === "requests" && !requests && user.employeeId) {
            setLoadingRequests(true);
            fetch("/api/requests", {
                headers: {
                    "x-employee-id": user.employeeId,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setRequests(data.requests);
                    }
                })
                .catch((err) => console.error("Error fetching requests:", err))
                .finally(() => setLoadingRequests(false));
        }
    }, [activeTab, requests, user.employeeId]);

    // ================= EVENT HANDLERS =================

    /**
     * handleCreateRequest
     * Submits a new request to the backend and prepends it to the local list.
     */
    const handleCreateRequest = (e) => {
        e.preventDefault();
        if (!requestDetails.trim() || !requestReason.trim()) {
            alert("Vui lòng điền đầy đủ thông tin");
            return;
        }
        setSubmittingRequest(true);
        fetch("/api/requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-employee-id": user.employeeId,
            },
            body: JSON.stringify({
                type: requestType,
                details: requestDetails,
                reason: requestReason,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setRequests((prev) => [data.request, ...(prev || [])]);
                    setShowCreateModal(false);
                    // Reset form fields
                    setRequestType("Nghỉ phép năm");
                    setRequestDetails("");
                    setRequestReason("");
                    alert("Tạo đơn thành công!");
                }
            })
            .catch((err) => console.error("Error creating request:", err))
            .finally(() => setSubmittingRequest(false));
    };

    // ================= COMPONENT RENDERING HELPERS =================

    /**
     * renderCalendar
     * Renders the interactive calendar grid for the Timekeeping tab.
     */
    const renderCalendar = () => {
        if (loadingTimekeeping) {
            return (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0f6e46] border-t-transparent"></div>
                </div>
            );
        }

        if (!timekeepingData) return null;

        const weekdayHeaders = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
        const emptyCells = Array(3).fill(null); // May 2025 starts on Thursday, so 3 empty cells (Mon, Tue, Wed)

        const statusColors = {
            "Đủ công": "bg-green-500",
            "Đi muộn": "bg-yellow-500",
            "Về sớm": "bg-orange-500",
            "Nghỉ phép": "bg-blue-500",
            "Nghỉ": "bg-gray-300",
        };

        return (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                {/* Month Selector */}
                <div className="flex justify-center items-center gap-6 mb-6">
                    <button className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 cursor-pointer bg-transparent text-gray-600">
                        &lt;
                    </button>
                    <span className="font-bold text-gray-800 text-sm">Tháng 5/2025</span>
                    <button className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 cursor-pointer bg-transparent text-gray-600">
                        &gt;
                    </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
                    {weekdayHeaders.map((h) => (
                        <span key={h} className="text-xs font-semibold text-gray-400">
                            {h}
                        </span>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-3 text-center">
                    {emptyCells.map((_, idx) => (
                        <div key={`empty-${idx}`} />
                    ))}
                    {timekeepingData.days.map((dayData) => {
                        const isSelected = selectedDay && selectedDay.day === dayData.day;
                        const dotColor = statusColors[dayData.status] || "bg-transparent";

                        return (
                            <button
                                key={dayData.day}
                                onClick={() => setSelectedDay(dayData)}
                                className={`flex flex-col items-center justify-center p-1.5 rounded-full border-none cursor-pointer transition-all mx-auto w-9 h-9 relative ${isSelected
                                    ? "bg-[#0f6e46] text-white"
                                    : "bg-transparent text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <span className="text-xs font-semibold">{dayData.day}</span>
                                {dayData.status !== "Nghỉ" && (
                                    <span
                                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : dotColor
                                            }`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-gray-100 mt-6 pt-4 text-[10px] font-medium text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Đủ công</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span>Đi muộn</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span>Về sớm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Nghỉ phép</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        <span>Nghỉ</span>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * renderDayDetails
     * Renders the details panel for the selected day in the Timekeeping tab.
     */
    const renderDayDetails = () => {
        if (!selectedDay) return null;

        const getDayName = (dayOfWeek) => {
            const names = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
            return names[dayOfWeek];
        };

        const statusBadges = {
            "Đủ công": "bg-green-50 text-green-600",
            "Đi muộn": "bg-yellow-50 text-yellow-600",
            "Về sớm": "bg-orange-50 text-orange-600",
            "Nghỉ phép": "bg-blue-50 text-blue-600",
            "Nghỉ": "bg-gray-100 text-gray-500",
        };

        return (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mt-6 lg:mt-0">
                <div className="flex justify-between items-center mb-5">
                    <h4 className="text-sm font-bold text-gray-800">
                        {getDayName(selectedDay.dayOfWeek)}, {selectedDay.day}/05/2025
                    </h4>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadges[selectedDay.status]}`}>
                        {selectedDay.status}
                    </span>
                </div>

                {selectedDay.status !== "Nghỉ" && selectedDay.status !== "Nghỉ phép" ? (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Check-in */}
                            <div className="border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-0.5">Check-in</span>
                                    <span className="text-sm font-bold text-gray-700">{selectedDay.checkIn}</span>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selectedDay.status === "Đi muộn" ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"
                                    }`}>
                                    {selectedDay.status === "Đi muộn" ? "Muộn" : "Đúng giờ"}
                                </span>
                            </div>

                            {/* Check-out */}
                            <div className="border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] text-gray-400 block mb-0.5">Check-out</span>
                                    <span className="text-sm font-bold text-gray-700">{selectedDay.checkOut}</span>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${selectedDay.status === "Về sớm" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                                    }`}>
                                    {selectedDay.status === "Về sớm" ? "Sớm" : "Đúng giờ"}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-50 pt-4 text-sm">
                            <span className="text-gray-500">Giờ làm việc</span>
                            <span className="font-bold text-gray-800">{selectedDay.workHours} giờ</span>
                        </div>
                    </div>
                ) : null}

                <div className="flex justify-between items-center border-t border-gray-50 pt-4 text-sm">
                    <span className="text-gray-500">Thông tin ca</span>
                    <span className="font-medium text-gray-700">{selectedDay.shiftInfo}</span>
                </div>
            </div>
        );
    };

    /**
     * renderPayslipsList
     * Renders the list of monthly payslips.
     */
    const renderPayslipsList = () => {
        if (loadingPayslips) {
            return (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0f6e46] border-t-transparent"></div>
                </div>
            );
        }

        if (!payslips) return null;

        return (
            <div className="flex flex-col gap-4">
                {payslips.map((p) => (
                    <div
                        key={p.id}
                        onClick={() => setSelectedPayslipId(p.id)}
                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-[#0f6e46]/30 transition-all cursor-pointer flex justify-between items-center"
                    >
                        <div>
                            <h4 className="text-base font-bold text-gray-800 mb-1">{p.month}</h4>
                            <span className="text-xs text-gray-400 block mb-1">Kỳ lương: {p.period}</span>
                            <span className="text-[10px] text-gray-400 block">Ngày thanh toán: {p.paymentDate}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-base font-bold text-gray-800 block mb-1">
                                    {p.netPay.toLocaleString("vi-VN")} VND
                                </span>
                                <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                    {p.status}
                                </span>
                            </div>

                            <button className="p-2 text-gray-400 hover:text-[#0f6e46] border-none bg-transparent cursor-pointer rounded-full hover:bg-gray-50">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" x2="12" y1="15" y2="3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    /**
     * renderPayslipDetail
     * Renders the detailed breakdown of a selected payslip.
     */
    const renderPayslipDetail = () => {
        if (loadingPayslipDetail || !payslipDetail) {
            return (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0f6e46] border-t-transparent"></div>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-6">
                {/* Back Button */}
                <button
                    onClick={() => setSelectedPayslipId(null)}
                    className="self-start flex items-center gap-1.5 border-none bg-transparent text-xs font-semibold text-gray-500 hover:text-[#0f6e46] cursor-pointer"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" x2="5" y1="12" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Quay lại danh sách
                </button>

                {/* Payslip Card Header */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Phiếu lương tháng {payslipDetail.month}</h3>
                    <span className="text-xs text-gray-400 block mb-1">Kỳ lương: {payslipDetail.period}</span>
                    <span className="text-xs text-gray-400 block mb-3">Ngày thanh toán: {payslipDetail.paymentDate}</span>
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full inline-block">
                        {payslipDetail.status}
                    </span>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-500 block mb-1">Tổng thu nhập</span>
                        <span className="text-base font-bold text-gray-800">
                            {payslipDetail.summary.earnings.toLocaleString("vi-VN")}
                        </span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-500 block mb-1">Tổng khấu trừ</span>
                        <span className="text-base font-bold text-gray-800">
                            {payslipDetail.summary.deductions.toLocaleString("vi-VN")}
                        </span>
                    </div>
                </div>

                {/* Net Pay (Thực lĩnh) */}
                <div className="bg-gradient-to-r from-[#0f6e46] to-[#2ba85f] text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
                    <span className="text-xs text-white/80 block mb-1">Thực lĩnh</span>
                    <span className="text-2xl font-black">
                        {payslipDetail.summary.netPay.toLocaleString("vi-VN")} VND
                    </span>
                </div>

                {/* Breakdown Sections */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-6">
                    {/* Earnings */}
                    <div>
                        <h4 className="text-sm font-bold text-[#0f6e46] border-b border-gray-100 pb-2 mb-3">
                            THU NHẬP
                        </h4>
                        <div className="flex flex-col gap-3">
                            {payslipDetail.breakdown.earnings.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-500">{item.label}</span>
                                    <span className="font-semibold text-gray-800">
                                        {item.amount.toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Deductions */}
                    <div>
                        <h4 className="text-sm font-bold text-red-600 border-b border-gray-100 pb-2 mb-3">
                            KHẤU TRỪ
                        </h4>
                        <div className="flex flex-col gap-3">
                            {payslipDetail.breakdown.deductions.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-500">{item.label}</span>
                                    <span className="font-semibold text-gray-800">
                                        -{item.amount.toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Download Button */}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold border-none bg-gradient-to-r from-[#0f6e46] to-[#2ba85f] text-white shadow-md cursor-pointer transition-all active:scale-[0.99]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    Tải phiếu lương (PDF)
                </button>
            </div>
        );
    };

    /**
     * renderRequestsTab
     * Renders the list of requests with status filter tabs.
     */
    const renderRequestsTab = () => {
        if (loadingRequests) {
            return (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0f6e46] border-t-transparent"></div>
                </div>
            );
        }

        if (!requests) return null;

        const filters = ["Tất cả", "Chờ duyệt", "Đã duyệt", "Từ chối"];
        const filteredRequests = requests.filter(
            (r) => activeRequestFilter === "Tất cả" || r.status === activeRequestFilter
        );

        const statusBadges = {
            "Chờ duyệt": "bg-yellow-50 text-yellow-600",
            "Đã duyệt": "bg-green-50 text-green-600",
            "Từ chối": "bg-red-50 text-red-600",
        };

        const getRequestIcon = (type) => {
            switch (type) {
                case "Nghỉ phép năm":
                    return (
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <IconCalendar active={true} />
                        </div>
                    );
                case "Làm thêm giờ":
                    return (
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                    );
                case "Nghỉ ốm":
                    return (
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                    );
                default:
                    return (
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
                            <IconRequest active={true} />
                        </div>
                    );
            }
        };

        return (
            <div className="flex flex-col gap-6">
                {/* Filter Tabs */}
                <div className="flex border-b border-gray-100 bg-white p-1 rounded-xl shadow-sm gap-1">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveRequestFilter(f)}
                            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg border-none cursor-pointer transition-all ${activeRequestFilter === f
                                ? "bg-[#0f6e46] text-white"
                                : "bg-transparent text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Requests List */}
                <div className="flex flex-col gap-4">
                    {filteredRequests.length > 0 ? (
                        filteredRequests.map((r) => (
                            <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex justify-between items-start gap-4">
                                <div className="flex gap-4">
                                    {getRequestIcon(r.type)}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">{r.type}</h4>
                                        <span className="text-xs text-gray-500 block mb-1">{r.details}</span>
                                        <span className="text-xs text-gray-400 block mb-2">Lý do: {r.reason}</span>
                                        <span className="text-[10px] text-gray-400 block">Ngày tạo: {r.createdAt}</span>
                                    </div>
                                </div>

                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${statusBadges[r.status]}`}>
                                    {r.status}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                            <span className="text-3xl block mb-2" aria-hidden="true">📭</span>
                            <p className="text-xs text-gray-500">Không có đơn từ nào trong danh mục này.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    /**
     * renderContent
     * Switches content based on the active tab.
     */
    const renderContent = () => {
        switch (activeTab) {
            case "home":
                return (
                    <div className="flex flex-col gap-6">
                        {/* Today Overview Section */}
                        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-semibold text-gray-800">Tổng quan hôm nay</h3>
                                <span className="text-xs text-gray-400">Cập nhật {todayOverview.updatedAt}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {/* Work Days */}
                                <div className="bg-gray-50 rounded-xl p-3.5 text-center">
                                    <span className="text-xs text-gray-500 block mb-1">Ngày công</span>
                                    <span className="text-lg font-bold text-[#0f6e46] block">
                                        {todayOverview.workDays?.current} / {todayOverview.workDays?.total}
                                    </span>
                                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                        {todayOverview.workDays?.status}
                                    </span>
                                </div>

                                {/* Work Hours */}
                                <div className="bg-gray-50 rounded-xl p-3.5 text-center">
                                    <span className="text-xs text-gray-500 block mb-1">Giờ làm</span>
                                    <span className="text-lg font-bold text-[#0f6e46] block">
                                        {todayOverview.workHours?.current} / {todayOverview.workHours?.target}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block mt-1">
                                        {todayOverview.workHours?.unit}
                                    </span>
                                </div>

                                {/* Estimated Salary */}
                                <div className="bg-gray-50 rounded-xl p-3.5 text-center">
                                    <span className="text-xs text-gray-500 block mb-1">Lương tạm tính</span>
                                    <span className="text-lg font-bold text-blue-600 block">
                                        {todayOverview.estimatedSalary?.amount?.toLocaleString("vi-VN")}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block mt-1">
                                        {todayOverview.estimatedSalary?.currency}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Quick Utilities Section */}
                        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-800 mb-4">Tiện ích nhanh</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <button onClick={() => setActiveTab("timekeeping")} className="flex flex-col items-center gap-2 border-none bg-transparent cursor-pointer group">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-all group-hover:scale-105">
                                        <IconCalendar active={true} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">Chấm công</span>
                                </button>

                                <button onClick={() => setActiveTab("payslip")} className="flex flex-col items-center gap-2 border-none bg-transparent cursor-pointer group">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center transition-all group-hover:scale-105">
                                        <IconPayslip active={true} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">Phiếu lương</span>
                                </button>

                                <button onClick={() => setActiveTab("requests")} className="flex flex-col items-center gap-2 border-none bg-transparent cursor-pointer group">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center transition-all group-hover:scale-105">
                                        <IconRequest active={true} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">Đơn từ</span>
                                </button>

                                <button className="flex flex-col items-center gap-2 border-none bg-transparent cursor-pointer group">
                                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center transition-all group-hover:scale-105">
                                        <IconBell />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">Thông báo</span>
                                </button>
                            </div>
                        </section>

                        {/* Announcements Section */}
                        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-semibold text-gray-800">Thông báo & Tin tức</h3>
                                <button className="text-xs font-semibold text-[#0f6e46] border-none bg-transparent cursor-pointer hover:underline">
                                    Xem tất cả
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all border border-gray-50">
                                        <img
                                            src={ann.image}
                                            alt={ann.title}
                                            className="w-20 h-20 rounded-lg object-cover shrink-0"
                                        />
                                        <div className="flex flex-col justify-between py-0.5">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 mb-1">{ann.title}</h4>
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-400">{ann.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                );
            case "timekeeping":
                return (
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            {renderCalendar()}
                        </div>
                        <div className="w-full lg:w-80 shrink-0">
                            {renderDayDetails()}
                        </div>
                    </div>
                );
            case "payslip":
                return selectedPayslipId ? renderPayslipDetail() : renderPayslipsList();
            case "requests":
                return renderRequestsTab();
            case "profile":
                return (
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Hồ sơ cá nhân</h3>
                        <div className="flex flex-col items-center mb-6">
                            <img
                                src={employee.avatar}
                                alt={employee.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-[#0f6e46]/10 mb-3"
                            />
                            <h4 className="text-lg font-bold text-gray-800">{employee.name}</h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full mt-1">
                                {employee.status}
                            </span>
                        </div>

                        <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Mã nhân viên</span>
                                <span className="font-semibold text-gray-800">{employee.employeeId}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Ngày sinh</span>
                                <span className="font-semibold text-gray-800">{employee.dob}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Giới tính</span>
                                <span className="font-semibold text-gray-800">{employee.gender}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Email</span>
                                <span className="font-semibold text-gray-800">{employee.email}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Số điện thoại</span>
                                <span className="font-semibold text-gray-800">{employee.phone}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Phòng ban</span>
                                <span className="font-semibold text-gray-800">{employee.department}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Ngày vào công ty</span>
                                <span className="font-semibold text-gray-800">{employee.joinDate}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Nơi làm việc</span>
                                <span className="font-semibold text-gray-800">{employee.workLocation}</span>
                            </div>
                        </div>

                        {/* Bảo mật đăng nhập Card */}
                        {biometricSupported && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-4">Bảo mật đăng nhập</h4>
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-700 block">Đăng nhập bằng sinh trắc học</span>
                                            <span className="text-[11px] text-gray-400 block mt-0.5">
                                                {hasBiometricEnrolled
                                                    ? "Sử dụng vân tay hoặc khuôn mặt để đăng nhập nhanh."
                                                    : "Bật để đăng nhập nhanh bằng vân tay hoặc khuôn mặt."}
                                            </span>
                                        </div>
                                        {hasBiometricEnrolled ? (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                Đã bật
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                                                Chưa bật
                                            </span>
                                        )}
                                    </div>

                                    {biometricError && (
                                        <p className="text-xs text-red-500 m-0">{biometricError}</p>
                                    )}

                                    <div className="mt-1">
                                        {hasBiometricEnrolled ? (
                                            <button
                                                type="button"
                                                disabled={biometricLoading}
                                                onClick={handleUnregisterBiometric}
                                                className="w-full py-2.5 rounded-xl text-xs font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                                            >
                                                {biometricLoading ? "Đang xử lý..." : "Tắt sinh trắc học"}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={biometricLoading}
                                                onClick={handleRegisterBiometric}
                                                className="w-full py-2.5 rounded-xl text-xs font-semibold border-none bg-gradient-to-r from-[#0f6e46] to-[#2ba85f] text-white shadow-sm cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                                            >
                                                {biometricLoading ? "Đang xử lý..." : "Bật đăng nhập bằng sinh trắc học"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 border-t border-gray-100 pt-6">
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-all active:scale-[0.99]"
                            >
                                <IconLogout />
                                <span>Đăng xuất tài khoản</span>
                            </button>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                        <span className="text-4xl block mb-3" aria-hidden="true">🚧</span>
                        <h3 className="text-base font-semibold text-gray-800 mb-1">Tính năng đang phát triển</h3>
                        <p className="text-xs text-gray-500">Chức năng {navItems.find(n => n.id === activeTab)?.label} sẽ sớm ra mắt.</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row text-gray-800 relative">
            {/* ================= DESKTOP SIDEBAR ================= */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
                {/* Logo */}
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="font-bold text-xl tracking-wide text-white bg-[#0f6e46] rounded-lg px-3 py-1.5">
                        NBC
                    </div>
                    <span className="font-semibold text-sm text-gray-700">Hệ thống nội bộ</span>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setSelectedPayslipId(null);
                                }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border-none cursor-pointer transition-all ${isActive
                                    ? "bg-[#0f6e46]/10 text-[#0f6e46]"
                                    : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                    }`}
                            >
                                <Icon active={isActive} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border-none bg-transparent text-red-600 hover:bg-red-50 cursor-pointer transition-all"
                    >
                        <IconLogout />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* ================= MAIN CONTENT AREA ================= */}
            <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
                {/* DESKTOP HEADER */}
                <header className="hidden lg:flex justify-between items-center px-8 py-5 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            {selectedPayslipId && activeTab === "payslip"
                                ? "Chi tiết phiếu lương"
                                : navItems.find((n) => n.id === activeTab)?.label}
                        </h2>
                        {activeTab === "requests" && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border-none bg-[#0f6e46] text-white hover:bg-[#0f6e46]/90 cursor-pointer transition-all"
                            >
                                <IconPlus />
                                <span>Tạo đơn mới</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <button className="p-2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer rounded-full hover:bg-gray-50">
                            <IconBell />
                        </button>

                        {/* Profile Summary */}
                        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                            <img
                                src={employee.avatar}
                                alt={employee.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="text-left">
                                <span className="block text-sm font-semibold text-gray-800">{employee.name}</span>
                                <span className="block text-xs text-gray-400">{employee.role}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* MOBILE HEADER */}
                <header className="lg:hidden flex justify-between items-center px-5 py-4 bg-white border-b border-gray-100">
                    <div className="font-bold text-lg tracking-wide text-white bg-[#0f6e46] rounded-lg px-2.5 py-1">
                        NBC
                    </div>
                    <div className="flex items-center gap-2">
                        {activeTab === "requests" && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="p-2 text-white bg-[#0f6e46] rounded-full border-none cursor-pointer flex items-center justify-center shadow-sm"
                            >
                                <IconPlus />
                            </button>
                        )}
                        <button className="p-2 text-gray-500 border-none bg-transparent cursor-pointer rounded-full hover:bg-gray-50">
                            <IconBell />
                        </button>
                    </div>
                </header>

                {/* MOBILE USER BRANDING PANEL (Only visible on Mobile Home tab) */}
                {activeTab === "home" && (
                    <div className="lg:hidden bg-gradient-to-br from-[#0f6e46] to-[#2ba85f] text-white px-5 py-6 rounded-b-[24px] shadow-sm">
                        <div className="flex items-center gap-4">
                            <img
                                src={employee.avatar}
                                alt={employee.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                            />
                            <div className="flex-1">
                                <span className="text-xs text-white/70 block">Xin chào,</span>
                                <h3 className="text-base font-bold m-0">{employee.name}</h3>
                                <span className="text-xs text-white/80 block mt-0.5">{employee.department}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-[#0f6e46] bg-white rounded-full px-3 py-1 self-start">
                                Cùng nhau sản xuất xanh
                            </span>
                        </div>
                    </div>
                )}

                {/* MAIN DISPLAY CONTENT */}
                <main className="flex-1 p-5 lg:p-8 max-w-5xl w-full mx-auto">
                    {renderContent()}
                </main>
            </div>

            {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setSelectedPayslipId(null);
                            }}
                            className={`flex flex-col items-center gap-1 border-none bg-transparent cursor-pointer py-1 px-3 transition-all ${isActive ? "text-[#0f6e46]" : "text-gray-400"
                                }`}
                        >
                            <Icon active={isActive} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* ================= CREATE REQUEST MODAL ================= */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 flex flex-col gap-5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-bold text-gray-800">Tạo đơn mới</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1.5 rounded-full border border-gray-100 hover:bg-gray-50 cursor-pointer bg-transparent text-gray-400 hover:text-gray-600"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" x2="6" y1="6" y2="18" />
                                    <line x1="6" x2="18" y1="6" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequest} className="flex flex-col gap-4">
                            {/* Request Type */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500">Loại đơn</label>
                                <select
                                    value={requestType}
                                    onChange={(e) => setRequestType(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#0f6e46] bg-white"
                                >
                                    <option value="Nghỉ phép năm">Nghỉ phép năm</option>
                                    <option value="Làm thêm giờ">Làm thêm giờ</option>
                                    <option value="Nghỉ ốm">Nghỉ ốm</option>
                                </select>
                            </div>

                            {/* Time Details */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500">Thời gian chi tiết</label>
                                <input
                                    type="text"
                                    value={requestDetails}
                                    onChange={(e) => setRequestDetails(e.target.value)}
                                    placeholder={
                                        requestType === "Làm thêm giờ"
                                            ? "Ví dụ: Ngày 18/05/2025, Thời gian: 2.0 giờ"
                                            : "Ví dụ: Từ 26/05/2025 đến 28/05/2025"
                                    }
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#0f6e46]"
                                />
                            </div>

                            {/* Reason */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500">Lý do</label>
                                <textarea
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    placeholder="Nhập lý do chi tiết..."
                                    rows="3"
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#0f6e46] resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 border-t border-gray-50 pt-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 bg-transparent text-gray-500 hover:bg-gray-50 cursor-pointer transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingRequest}
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold border-none bg-[#0f6e46] text-white hover:bg-[#0f6e46]/90 cursor-pointer transition-all disabled:opacity-50"
                                >
                                    {submittingRequest ? "Đang gửi..." : "Gửi đơn"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
