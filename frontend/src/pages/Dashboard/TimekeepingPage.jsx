import React, { useState, useEffect } from "react";

export default function TimekeepingPage({ user = {}, onLogout }) {
    const [timekeepingData, setTimekeepingData] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [loadingTimekeeping, setLoadingTimekeeping] = useState(false);

    useEffect(() => {
        if (user.employeeId) {
            setLoadingTimekeeping(true);
            const token = localStorage.getItem("sessionToken");
            fetch("/api/timekeeping", {
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
                        setTimekeepingData(data);
                        const day20 = data.days.find((d) => d.day === 20);
                        setSelectedDay(day20 || data.days[0]);
                    }
                })
                .catch((err) => console.error("Error fetching timekeeping:", err))
                .finally(() => setLoadingTimekeeping(false));
        }
    }, [user.employeeId, onLogout]);

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
}
