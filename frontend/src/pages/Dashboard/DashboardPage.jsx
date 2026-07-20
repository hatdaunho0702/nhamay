import React, { useState } from "react";
import HomePage from "./HomePage";
import TimekeepingPage from "./TimekeepingPage";
import PayslipPage from "./PayslipPage";
import RequestsPage from "./RequestsPage";
import ProfilePage from "./ProfilePage";
import {
    IconHome,
    IconCalendar,
    IconPayslip,
    IconRequest,
    IconUser,
    IconBell,
    IconLogout,
    IconPlus
} from "./components/Icons";

export default function DashboardPage({ data, user = {}, onLogout }) {
    // ================= STATE MANAGEMENT =================
    const [activeTab, setActiveTab] = useState("home"); // Current active tab: "home" | "timekeeping" | "payslip" | "requests" | "profile"
    const [selectedPayslipId, setSelectedPayslipId] = useState(null); // ID of selected payslip for detailed view
    const [showCreateModal, setShowCreateModal] = useState(false); // Toggle for "Create Request" modal

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

    // ================= COMPONENT RENDERING HELPERS =================

    /**
     * renderContent
     * Switches content based on the active tab.
     */
    const renderContent = () => {
        switch (activeTab) {
            case "home":
                return (
                    <HomePage
                        todayOverview={todayOverview}
                        announcements={announcements}
                        setActiveTab={setActiveTab}
                    />
                );
            case "timekeeping":
                return (
                    <TimekeepingPage
                        user={user}
                        onLogout={onLogout}
                    />
                );
            case "payslip":
                return (
                    <PayslipPage
                        user={user}
                        onLogout={onLogout}
                        selectedPayslipId={selectedPayslipId}
                        setSelectedPayslipId={setSelectedPayslipId}
                    />
                );
            case "requests":
                return (
                    <RequestsPage
                        user={user}
                        onLogout={onLogout}
                        showCreateModal={showCreateModal}
                        setShowCreateModal={setShowCreateModal}
                    />
                );
            case "profile":
                return (
                    <ProfilePage
                        employee={employee}
                        user={user}
                        onLogout={onLogout}
                    />
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
                                selectTab(item.id);
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
        </div>
    );

    function selectTab(tabId) {
        setActiveTab(tabId);
        setSelectedPayslipId(null);
    }
}
