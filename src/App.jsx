import React, { useState, useEffect } from "react";
import LoginPage from "./pages/Login/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import AdminPage from "./pages/Admin/AdminPage";

function App() {
  // ================= STATE MANAGEMENT =================
  const [user, setUser] = useState(null); // Stores logged-in user info
  const [dashboardData, setDashboardData] = useState(null); // Stores dashboard overview data
  const [loading, setLoading] = useState(true); // App loading state during initial auth check

  /**
   * fetchDashboardData
   * Fetches dashboard overview data (employee profile, stats, announcements) from backend.
   * Uses cache-busting query parameter to prevent stale/cached responses.
   */
  const fetchDashboardData = async (empId) => {
    const id = empId || (user ? user.employeeId : null);
    if (!id) return;
    try {
      const response = await fetch(`/api/dashboard?t=${Date.now()}`, {
        headers: {
          "x-employee-id": id,
        },
      });
      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu bảng điều khiển");
      }
      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      alert("Lỗi tải dữ liệu từ server");
    }
  };

  /**
   * useEffect (Initial Mount)
   * Checks if user credentials are saved in localStorage (Remember Me).
   * If found, logs the user in automatically and fetches dashboard data.
   */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.role !== "Admin") {
          fetchDashboardData(parsedUser.employeeId).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Error parsing saved user:", e);
        localStorage.removeItem("user");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * handleLogin
   * Submits credentials to backend /api/login.
   * On success, fetches dashboard data, updates state, and optionally saves user to localStorage.
   */
  const handleLogin = async ({ employeeId, password, remember }) => {
    console.log("Login attempt:", { employeeId, password, remember });
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Sai tài khoản hoặc mật khẩu");
      }

      // Luôn lưu sessionToken cho phiên làm việc hiện tại
      localStorage.setItem("sessionToken", data.sessionToken);

      setUser(data.user);

      if (data.user.role !== "Admin") {
        // Fetch dashboard data immediately after login with cache-busting
        const dashboardResponse = await fetch(`/api/dashboard?t=${Date.now()}`, {
          headers: {
            "x-employee-id": data.user.employeeId,
          },
        });
        const dashboardJson = await dashboardResponse.json();

        if (!dashboardResponse.ok || !dashboardJson.success) {
          throw new Error("Không thể tải dữ liệu bảng điều khiển");
        }
        setDashboardData(dashboardJson);
      }

      if (remember) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /**
   * handleForgotPassword
   * Sends password reset request to backend /api/forgot-password.
   */
  const handleForgotPassword = async (value) => {
    console.log("Forgot password request for:", value);
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gửi yêu cầu thất bại");
      }

      alert(data.message);
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  };

  /**
   * handleLogout
   * Clears user session from state and localStorage.
   */
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("sessionToken");
    setUser(null);
    setDashboardData(null);
  };

  /**
   * handleBiometricLogin
   * Handles successful WebAuthn verification by setting user session and fetching dashboard data.
   */
  const handleBiometricLogin = async (data) => {
    if (data.success && data.user) {
      try {
        localStorage.setItem("sessionToken", data.sessionToken);
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role !== "Admin") {
          // Fetch dashboard data immediately after login with cache-busting
          const dashboardResponse = await fetch(`/api/dashboard?t=${Date.now()}`, {
            headers: {
              "x-employee-id": data.user.employeeId,
            },
          });
          const dashboardJson = await dashboardResponse.json();

          if (!dashboardResponse.ok || !dashboardJson.success) {
            throw new Error("Không thể tải dữ liệu bảng điều khiển");
          }
          setDashboardData(dashboardJson);
        }
      } catch (error) {
        console.error("Biometric login post-processing error:", error);
        alert("Lỗi tải dữ liệu bảng điều khiển sau khi đăng nhập sinh trắc học");
      }
    }
  };

  // ================= RENDER LOGIC =================

  // Show spinner while checking initial authentication status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0f6e46] border-t-transparent"></div>
      </div>
    );
  }

  // Render AdminPage if user is admin
  if (user && user.role === "Admin") {
    return (
      <AdminPage
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Render Dashboard if user is authenticated and dashboard data is loaded
  if (user && dashboardData) {
    return (
      <DashboardPage
        data={dashboardData}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Otherwise, fallback to Login Page
  return (
    <LoginPage
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
      hasBiometricEnrolled={localStorage.getItem("nbc_biometric_enrolled") === "true"}
      onBiometricLogin={handleBiometricLogin}
    />
  );
}

export default App;
