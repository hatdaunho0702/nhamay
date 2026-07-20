import React from "react";

export default function TodayOverview({ todayOverview = {} }) {
    return (
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
    );
}
