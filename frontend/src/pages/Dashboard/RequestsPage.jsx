import React, { useState, useEffect } from "react";
import { IconCalendar, IconRequest } from "./components/Icons";

export default function RequestsPage({ user = {}, onLogout, showCreateModal, setShowCreateModal }) {
    const [requests, setRequests] = useState(null);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [activeRequestFilter, setActiveRequestFilter] = useState("Tất cả");

    // Form state for new request
    const [requestType, setRequestType] = useState("Nghỉ phép năm");
    const [requestDetails, setRequestDetails] = useState("");
    const [requestReason, setRequestReason] = useState("");
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // Fetch Requests List
    useEffect(() => {
        if (user.employeeId && !requests) {
            setLoadingRequests(true);
            const token = localStorage.getItem("sessionToken");
            fetch("/api/requests", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            })
                .then((res) => {
                    if (res.status === 401) {
                        onLogout();
                        throw new Error("Session expired");
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data.success) {
                        setRequests(data.requests);
                    }
                })
                .catch((err) => console.error("Error fetching requests:", err))
                .finally(() => setLoadingRequests(false));
        }
    }, [user.employeeId, onLogout, requests]);

    const handleCreateRequest = (e) => {
        e.preventDefault();
        if (!requestDetails.trim() || !requestReason.trim()) {
            alert("Vui lòng điền đầy đủ thông tin");
            return;
        }
        setSubmittingRequest(true);
        const token = localStorage.getItem("sessionToken");
        fetch("/api/requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                type: requestType,
                details: requestDetails,
                reason: requestReason,
            }),
        })
            .then((res) => {
                if (res.status === 401) {
                    onLogout();
                    throw new Error("Session expired");
                }
                return res.json();
            })
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
