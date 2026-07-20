import React, { useState, useEffect } from "react";
import { checkBiometricSupport } from "../Login/LoginPage";
import { IconLogout } from "./components/Icons";

export default function ProfilePage({ employee = {}, user = {}, onLogout }) {
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
        if (employee.employeeId || user.employeeId) {
            checkBiometricSupport().then(setBiometricSupported);
            checkBiometricStatus();
        }
    }, [employee.employeeId, user.employeeId]);

    const handleRegisterBiometric = async () => {
        setBiometricLoading(true);
        setBiometricError("");
        try {
            const token = localStorage.getItem("sessionToken");
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

            publicKey.challenge = base64urlToBuffer(publicKey.challenge);
            publicKey.user.id = base64urlToBuffer(publicKey.user.id);

            const credential = await navigator.credentials.create({ publicKey });
            if (!credential) {
                throw new Error("Đăng ký sinh trắc học bị hủy hoặc thất bại");
            }

            const credentialJSON = {
                id: credential.id,
                rawId: bufferToBase64url(credential.rawId),
                type: credential.type,
                response: {
                    clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
                    attestationObject: bufferToBase64url(credential.response.attestationObject),
                }
            };

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
}
