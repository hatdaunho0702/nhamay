import React, { useState, useEffect } from "react";

export default function PayslipPage({ user = {}, onLogout, selectedPayslipId, setSelectedPayslipId }) {
    const [payslips, setPayslips] = useState(null);
    const [payslipDetail, setPayslipDetail] = useState(null);
    const [loadingPayslips, setLoadingPayslips] = useState(false);
    const [loadingPayslipDetail, setLoadingPayslipDetail] = useState(false);

    // Fetch Payslips List
    useEffect(() => {
        if (user.employeeId && !payslips) {
            setLoadingPayslips(true);
            const token = localStorage.getItem("sessionToken");
            fetch("/api/payslips", {
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
                        setPayslips(data.payslips);
                    }
                })
                .catch((err) => console.error("Error fetching payslips:", err))
                .finally(() => setLoadingPayslips(false));
        }
    }, [user.employeeId, onLogout, payslips]);

    // Fetch Payslip Detail
    useEffect(() => {
        if (selectedPayslipId && user.employeeId) {
            setLoadingPayslipDetail(true);
            const token = localStorage.getItem("sessionToken");
            fetch(`/api/payslips/${selectedPayslipId}`, {
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
                        setPayslipDetail(data.payslip);
                    }
                })
                .catch((err) => console.error("Error fetching payslip detail:", err))
                .finally(() => setLoadingPayslipDetail(false));
        } else {
            setPayslipDetail(null);
        }
    }, [selectedPayslipId, user.employeeId, onLogout]);

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

    return selectedPayslipId ? renderPayslipDetail() : renderPayslipsList();
}
