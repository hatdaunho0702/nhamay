import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import "./LoginPage.css"; // CSS mới thêm cho sinh trắc học

/* ---------- WebAuthn Helper Functions ---------- */
// Chuyển đổi base64url sang ArrayBuffer
function base64urlToBuffer(base64url) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const binStr = window.atob(base64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes.buffer;
}

// Chuyển đổi ArrayBuffer sang base64url
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binStr = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binStr += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binStr);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Kiểm tra thiết bị có hỗ trợ WebAuthn sinh trắc học không
export async function checkBiometricSupport() {
  const platformAuthenticator = !!(window.PublicKeyCredential &&
    await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  const conditionalUI = !!(window.PublicKeyCredential &&
    PublicKeyCredential.isConditionalMediationAvailable &&
    await PublicKeyCredential.isConditionalMediationAvailable());
  return { platformAuthenticator, conditionalUI };
}

const IconFingerprint = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a10 10 0 0 0-10 10c0 5.5 4.5 10 10 10s10-4.5 10-10A10 10 0 0 0 12 1zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
    <path d="M12 6a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0v-2a4 4 0 0 0-4-4z" />
    <path d="M12 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
  </svg>
);

/* ---------- Inline icons (no external icon library required) ---------- */

const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18" />
    <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a13.3 13.3 0 0 1-3.1 4.1M6.5 6.6C3.4 8.5 1.5 12 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.6-1" />
    <path d="M9.5 9.9a3.2 3.2 0 0 0 4.5 4.5" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
    <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="M4.5 7l7.5 6 7.5-6" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M8 12.5l2.6 2.6L16 9.6" />
  </svg>
);

/* ---------- Main component ---------- */

export default function LoginPage({ onLogin, onForgotPassword, hasBiometricEnrolled = false, onBiometricLogin }) {
  const [method, setMethod] = useState("password"); // "password" | "qr"
  const [view, setView] = useState("login"); // "login" | "forgot" | "forgot-sent"

  /* ---------- Biometric Login State & Logic ---------- */
  const [biometricSupport, setBiometricSupport] = useState({ platformAuthenticator: false, conditionalUI: false });

  useEffect(() => {
    checkBiometricSupport().then(setBiometricSupport);
  }, []);

  useEffect(() => {
    if (!biometricSupport.conditionalUI || !hasBiometricEnrolled) {
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    let retryCount = 0;
    let isActive = true;

    const runConditionalUI = async () => {
      while (isActive && retryCount < 3) {
        try {
          const apiUrl = import.meta.env?.VITE_API_URL || "";
          // 1. Lấy challenge từ server với mode: "conditional"
          const challengeRes = await fetch(`${apiUrl}/api/auth/webauthn/challenge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "conditional" }),
            signal,
          });
          const challengeData = await challengeRes.json();
          if (!challengeData.success) {
            throw new Error(challengeData.message || "Không thể lấy challenge từ server");
          }

          const { publicKey, sessionId } = challengeData;

          // Chuyển đổi challenge từ base64url sang ArrayBuffer
          publicKey.challenge = base64urlToBuffer(publicKey.challenge);

          // 2. Gọi navigator.credentials.get với mediation: "conditional"
          const assertion = await navigator.credentials.get({
            publicKey,
            mediation: "conditional",
            signal,
          });

          if (!assertion) {
            throw new Error("Xác thực sinh trắc học bị hủy hoặc thất bại");
          }

          // Chuyển đổi assertion sang định dạng JSON để gửi lên server
          const credentialJSON = {
            id: assertion.id,
            rawId: bufferToBase64url(assertion.rawId),
            type: assertion.type,
            response: {
              clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON),
              authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
              signature: bufferToBase64url(assertion.response.signature),
              userHandle: assertion.response.userHandle ? bufferToBase64url(assertion.response.userHandle) : null,
            }
          };

          // 3. Xác minh credential với server
          const verifyRes = await fetch(`${apiUrl}/api/auth/webauthn/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: credentialJSON, sessionId }),
            signal,
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.message || "Xác thực sinh trắc học thất bại");
          }

          // 4. Gọi callback để xử lý session và chuyển hướng
          if (onBiometricLogin) {
            await onBiometricLogin(verifyData);
          }
          break; // Thành công, thoát khỏi vòng lặp
        } catch (err) {
          if (err.name === "AbortError") {
            console.log("Conditional UI aborted.");
            break;
          }
          console.error("Conditional UI error:", err);
          if (err.message && err.message.includes("hết hạn")) {
            retryCount++;
            console.log(`Challenge expired, retrying (${retryCount}/3)...`);
            continue;
          }
          break;
        }
      }
    };

    runConditionalUI();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [biometricSupport.conditionalUI, hasBiometricEnrolled, onBiometricLogin]);
  /* ---------------------------------------------------- */

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [forgotValue, setForgotValue] = useState("");

  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Không thể truy cập camera. Vui lòng cấp quyền truy cập camera hoặc kiểm tra thiết bị."
      );
    }
  };

  useEffect(() => {
    if (method === "qr" && view === "login") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [method, view]);

  useEffect(() => {
    let animationFrameId;
    let canvas = null;
    let ctx = null;

    const scan = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (!canvas) {
          canvas = document.createElement("canvas");
        }
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        if (!ctx) {
          ctx = canvas.getContext("2d");
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          let scannedId = code.data.trim();
          try {
            const parsed = JSON.parse(scannedId);
            if (parsed && parsed.employeeId) {
              scannedId = parsed.employeeId.trim();
            }
          } catch (e) {
            // Not JSON, use raw string
          }

          if (/^NBC\d+$/.test(scannedId)) {
            alert(`Quét thành công mã nhân viên: ${scannedId}`);
            setEmployeeId(scannedId);
            setMethod("password");
            // Focus on password input
            setTimeout(() => {
              const pwdInput = document.querySelector('input[type="password"]');
              if (pwdInput) pwdInput.focus();
            }, 100);
            return; // Stop scanning
          }
        }
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    if (method === "qr" && view === "login" && !cameraError) {
      animationFrameId = requestAnimationFrame(scan);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [method, view, cameraError]);

  useEffect(() => {
    setError("");
  }, [view, method]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!employeeId.trim() || !password) {
      setError("Vui lòng nhập đầy đủ mã nhân viên và mật khẩu.");
      return;
    }
    setSubmitting(true);
    Promise.resolve(onLogin ? onLogin({ employeeId, password, remember }) : null)
      .catch((err) => setError(err.message || "Mã nhân viên hoặc mật khẩu không đúng."))
      .finally(() => setSubmitting(false));
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!forgotValue.trim()) {
      setError("Vui lòng nhập mã nhân viên hoặc email.");
      return;
    }
    setSubmitting(true);
    Promise.resolve(onForgotPassword ? onForgotPassword(forgotValue) : null)
      .then(() => setView("forgot-sent"))
      .catch((err) => setError(err.message || "Gửi yêu cầu thất bại."))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans text-[#16241c] bg-white lg:flex-row">
      {/* Left / top brand panel — becomes the desktop "dashboard" side */}
      <aside className="relative p-7 pb-9 bg-gradient-to-br from-[#0f6e46] to-[#2ba85f] text-white overflow-hidden lg:flex-[0_0_44%] lg:max-w-[560px] lg:flex lg:flex-col lg:p-12 lg:pb-10 max-lg:rounded-b-[28px] max-lg:pb-9">
        <div className="absolute -right-[60px] -bottom-[80px] w-[240px] h-[240px] rounded-full bg-white/8 pointer-events-none"></div>

        <div className="flex justify-between items-center">
          <div className="inline-flex items-center justify-center font-bold text-xl tracking-wide text-[#0f6e46] bg-white rounded-[10px] px-3.5 py-2 lg:text-2xl">
            <span>NBC</span>
          </div>
        </div>

        <div className="mt-5.5 max-w-[420px] lg:mt-14">
          <h1 className="text-2xl font-semibold leading-snug mb-2 lg:text-3.5xl">Hệ thống nhân sự nội bộ NBC</h1>
          <p className="text-sm text-white/85 lg:text-base">Chấm công, phiếu lương và đơn từ — tất cả ở một nơi.</p>
        </div>

        <p className="hidden lg:block mt-auto text-xs text-white/65">© {new Date().getFullYear()} Nhà máy NBC — KCN VSIP II</p>
      </aside>

      {/* Right / bottom panel — the actual form, full-screen "app" on mobile */}
      <main className="flex-1 flex justify-center p-7 pb-10 lg:items-center lg:p-10 max-lg:-mt-5">
        <div className="w-full max-w-[420px] lg:max-w-[380px] max-lg:bg-white max-lg:rounded-t-[20px] max-lg:p-6 max-lg:pb-2 max-lg:-mt-1 max-lg:shadow-[-8px_24px_rgba(15,46,32,0.06)]">
          <div className="inline-flex items-center justify-center font-bold text-xl tracking-wide text-[#0f6e46] bg-white rounded-[10px] px-3.5 py-2 lg:text-2xl hidden max-lg:inline-flex mb-6">
            <span>NBC</span>
          </div>

          {view === "login" && (
            <>
              <div className="my-1 mb-5">
                <h2 className="text-2xl font-semibold mb-1.5">Đăng nhập</h2>
                <p className="text-[13.5px] text-[#5b6b62] leading-relaxed">Sử dụng tài khoản nội bộ được cấp bởi phòng nhân sự.</p>
              </div>

              <div className="flex bg-[#f1f5f2] rounded-full p-1 mb-5.5" role="tablist" aria-label="Phương thức đăng nhập">
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === "password"}
                  className={`flex-1 border-none py-2.5 px-2.5 text-xs font-medium rounded-full cursor-pointer transition-all duration-150 ${method === "password"
                    ? "bg-white text-[#0f6e46] shadow-[0_1px_3px_rgba(15,110,70,0.18)]"
                    : "bg-transparent text-[#5b6b62]"
                    }`}
                  onClick={() => setMethod("password")}
                >
                  Tài khoản &amp; mật khẩu
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === "qr"}
                  className={`flex-1 border-none py-2.5 px-2.5 text-xs font-medium rounded-full cursor-pointer transition-all duration-150 ${method === "qr"
                    ? "bg-white text-[#0f6e46] shadow-[0_1px_3px_rgba(15,110,70,0.18)]"
                    : "bg-transparent text-[#5b6b62]"
                    }`}
                  onClick={() => setMethod("qr")}
                >
                  Quét mã QR
                </button>
              </div>

              {method === "password" ? (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-[#16241c]">Mã nhân viên</span>
                    <span className="flex items-center gap-2 border-1.5 border-[#e2e8e2] rounded-xl px-3 bg-[#fbfdfb] transition-all duration-150 focus-within:border-[#2ba85f] focus-within:ring-3 focus-within:ring-[#e8f6ee]">
                      <span className="flex text-[#5b6b62] shrink-0" aria-hidden="true">
                        <IconUser />
                      </span>
                      <input
                        type="text"
                        inputMode="text"
                        autoComplete="username webauthn"
                        placeholder="VD: NBC012345"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="flex-1 border-none bg-transparent outline-none text-sm text-[#16241c] py-2.5 min-w-0 placeholder-[#a6b3ac]"
                      />
                    </span>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-[#16241c]">Mật khẩu</span>
                    <span className="flex items-center gap-2 border-1.5 border-[#e2e8e2] rounded-xl px-3 bg-[#fbfdfb] transition-all duration-150 focus-within:border-[#2ba85f] focus-within:ring-3 focus-within:ring-[#e8f6ee]">
                      <span className="flex text-[#5b6b62] shrink-0" aria-hidden="true">
                        <IconLock />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password webauthn"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 border-none bg-transparent outline-none text-sm text-[#16241c] py-2.5 min-w-0 placeholder-[#a6b3ac]"
                      />
                      <button
                        type="button"
                        className="border-none bg-transparent text-[#5b6b62] flex items-center cursor-pointer p-1 shrink-0 hover:text-[#0f6e46] outline-none"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </span>
                  </label>

                  <div className="flex items-center justify-between -mt-1">
                    <label className="flex items-center gap-1.5 text-xs text-[#5b6b62] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#0f6e46]"
                      />
                      <span>Ghi nhớ đăng nhập</span>
                    </label>
                    <button
                      type="button"
                      className="border-none bg-transparent text-xs font-medium text-blue-600 cursor-pointer p-0 hover:underline outline-none"
                      onClick={() => setView("forgot")}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {error && <p className="-mt-1.5 text-xs text-red-500">{error}</p>}

                  <button
                    type="submit"
                    className="border-none rounded-xl font-semibold px-4.5 py-3.5 cursor-pointer inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99] bg-gradient-to-r from-[#0f6e46] to-[#2ba85f] text-white mt-0.5 disabled:opacity-65 disabled:cursor-not-allowed hover:not-disabled:opacity-92"
                    disabled={submitting}
                  >
                    {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-[280px] h-[280px] rounded-[20px] overflow-hidden bg-black border-2 border-[#0f6e46] shadow-[0_8px_24px_rgba(15,110,70,0.15)]">
                    {cameraError ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-[#16241c] gap-3">
                        <span className="text-4xl" aria-hidden="true">⚠️</span>
                        <p className="text-xs m-0 leading-relaxed text-white/80">{cameraError}</p>
                        <button
                          type="button"
                          className="border-none rounded-xl font-semibold px-4 py-2 cursor-pointer inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99] bg-gradient-to-r from-[#0f6e46] to-[#2ba85f] text-white text-xs"
                          onClick={startCamera}
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : (
                      <>
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative w-[200px] h-[200px]">
                            <span className="absolute w-5 h-5 border-3 border-[#2ba85f] top-0 left-0 border-r-0 border-b-0 rounded-tl-lg"></span>
                            <span className="absolute w-5 h-5 border-3 border-[#2ba85f] top-0 right-0 border-l-0 border-b-0 rounded-tr-lg"></span>
                            <span className="absolute w-5 h-5 border-3 border-[#2ba85f] bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg"></span>
                            <span className="absolute w-5 h-5 border-3 border-[#2ba85f] bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg"></span>
                            <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#2ba85f] to-transparent shadow-[0_0_8px_#2ba85f] animate-scan"></div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-[13.5px] text-[#5b6b62] text-center leading-relaxed m-0 max-w-[320px]">
                    Đưa mã QR trên thẻ nhân viên của bạn vào trước camera để quét và đăng nhập.
                  </p>
                </div>
              )}

              {/* Demo Accounts Panel */}
              <div className="mt-6 border-t border-gray-100 pt-4">
                <details className="group">
                  <summary className="flex justify-between items-center font-medium text-xs text-[#0f6e46] cursor-pointer list-none">
                    <span>Tài khoản Demo &amp; Mã QR</span>
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="mt-3 flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { id: "NBC001", name: "Nguyễn Văn Một", role: "Kỹ thuật" },
                      { id: "NBC002", name: "Trần Thị Hai", role: "QC" },
                      { id: "NBC003", name: "Lê Văn Ba", role: "Sản xuất" },
                      { id: "NBC004", name: "Phạm Thị Bốn", role: "Đóng gói" },
                      { id: "NBC005", name: "Hoàng Văn Năm", role: "Trưởng nhóm" },
                    ].map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                        <div>
                          <span className="font-bold text-gray-700 block">{emp.id} - {emp.name}</span>
                          <span className="text-gray-400 text-[10px]">{emp.role} (Mật khẩu: 12345)</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEmployeeId(emp.id);
                              setMethod("password");
                              setTimeout(() => {
                                const pwdInput = document.querySelector('input[type="password"]');
                                if (pwdInput) pwdInput.focus();
                              }, 100);
                            }}
                            className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                          >
                            Điền nhanh
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Giả lập quét mã QR thành công cho: ${emp.id}`);
                              setEmployeeId(emp.id);
                              setMethod("password");
                              setTimeout(() => {
                                const pwdInput = document.querySelector('input[type="password"]');
                                if (pwdInput) pwdInput.focus();
                              }, 100);
                            }}
                            className="px-2 py-1 bg-[#0f6e46] text-white rounded text-[10px] font-semibold hover:bg-[#0f6e46]/90 cursor-pointer border-none"
                          >
                            Quét QR
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${emp.id}`;
                              const w = window.open("", "_blank", "width=250,height=250");
                              w.document.write(`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-family:sans-serif;">
                                <img src="${qrUrl}" alt="QR Code" style="width:180px;height:180px;" />
                                <p style="margin-top:10px;font-size:14px;font-weight:bold;color:#0f6e46;">Mã QR: ${emp.id}</p>
                              </div>`);
                            }}
                            className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[10px] font-semibold hover:bg-blue-100 cursor-pointer"
                          >
                            Xem QR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              <p className="mt-6 text-xs leading-relaxed text-[#5b6b62] text-center">
                Đây là hệ thống nội bộ, chỉ cấp tài khoản bởi phòng nhân sự — không hỗ trợ tự đăng ký.
                Cần trợ giúp? Liên hệ <a href="mailto:hr@nbc.com.vn" className="text-blue-600 hover:underline">hr@nbc.com.vn</a>.
              </p>
            </>
          )}

          {view === "forgot" && (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 border-none bg-transparent text-xs font-medium text-[#5b6b62] cursor-pointer p-0 mb-4.5 hover:text-[#0f6e46] outline-none"
                onClick={() => setView("login")}
              >
                <IconArrowLeft />
                Quay lại đăng nhập
              </button>

              <div className="my-1 mb-5">
                <h2 className="text-2xl font-semibold mb-1.5">Quên mật khẩu</h2>
                <p className="text-[13.5px] text-[#5b6b62] leading-relaxed">Nhập mã nhân viên hoặc email nội bộ, bộ phận nhân sự sẽ gửi hướng dẫn đặt lại mật khẩu.</p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleForgotSubmit} noValidate>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-[#16241c]">Mã nhân viên hoặc email</span>
                  <span className="flex items-center gap-2 border-1.5 border-[#e2e8e2] rounded-xl px-3 bg-[#fbfdfb] transition-all duration-150 focus-within:border-[#2ba85f] focus-within:ring-3 focus-within:ring-[#e8f6ee]">
                    <span className="flex text-[#5b6b62] shrink-0" aria-hidden="true">
                      <IconMail />
                    </span>
                    <input
                      type="text"
                      placeholder="NBC012345 hoặc email@nbc.com.vn"
                      value={forgotValue}
                      onChange={(e) => setForgotValue(e.target.value)}
                      className="flex-1 border-none bg-transparent outline-none text-sm text-[#16241c] py-2.5 min-w-0 placeholder-[#a6b3ac]"
                    />
                  </span>
                </label>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  type="submit"
                  className="border-none rounded-xl font-semibold px-4.5 py-3.5 cursor-pointer inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99] bg-gradient-to-r from-[#0f6e46] to-[#2ba85f] text-white mt-0.5 disabled:opacity-65 disabled:cursor-not-allowed hover:not-disabled:opacity-92"
                  disabled={submitting}
                >
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </form>
            </>
          )}

          {view === "forgot-sent" && (
            <div className="text-center pt-5">
              <div className="text-[#0f6e46] flex justify-center mb-3.5">
                <IconCheckCircle />
              </div>
              <h2 className="text-xl font-semibold mb-2.5">Yêu cầu đã được gửi</h2>
              <p className="text-[13.5px] text-[#5b6b62] leading-relaxed mb-6">
                Hướng dẫn đặt lại mật khẩu đã được gửi tới bộ phận nhân sự xử lý.
                Vui lòng kiểm tra email nội bộ hoặc chờ liên hệ trong ít phút.
              </p>
              <button
                type="button"
                className="border-none rounded-xl font-semibold px-4.5 py-3.5 cursor-pointer inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99] bg-gradient-to-r from-[#0f6e46] to-[#2ba85f] text-white mt-0.5 disabled:opacity-65 disabled:cursor-not-allowed hover:not-disabled:opacity-92 w-full"
                onClick={() => setView("login")}
              >
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
