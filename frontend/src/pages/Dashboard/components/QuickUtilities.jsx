import React from "react";
import { IconCalendar, IconPayslip, IconRequest, IconBell } from "./Icons";

export default function QuickUtilities({ setActiveTab }) {
    return (
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
    );
}
