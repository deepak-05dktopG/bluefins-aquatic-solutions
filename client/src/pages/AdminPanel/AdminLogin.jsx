/**
 * What it is: Admin panel page (Login screen).
 * Non-tech note: This is the admin sign-in page.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { isAdminAuthenticated, setAdminToken } from "../../utils/adminAuth";
import Navbar from "../../components/Navbar";
import { FaLock, FaRocket } from "react-icons/fa";

// Admin login page — authenticates admin/owner credentials via JWT before granting panel access
const AdminLogin = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const navigate = useNavigate();

  // Check for existing authorization on component mount
  useEffect(
  // Skip login screen and go straight to dashboard if admin is already authenticated
  () => {
    if (isAdminAuthenticated()) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  // Submit admin ID/email + password to server, store JWT token on success, show error on failure
  const handleAccessSubmit = async e => {
    e.preventDefault();
    setVerifyLoading(true);
    setError("");

    try {
      const res = await api.post("/admin/login", { identifier, password });
      const token = res?.data?.data?.token;
      if (!token) throw new Error("Login failed");
      setAdminToken(token);
      navigate("/admin/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      setError(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)",
        fontFamily: "Poppins, system-ui",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Navbar />
      {/* Animated Background Orbs */}
      <div
        style={{
          position: "absolute",
          width: "clamp(240px, 60vw, 400px)",
          height: "clamp(240px, 60vw, 400px)",
          background: "radial-gradient(circle, rgba(0, 255, 200, 0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          top: "-10%",
          right: "-5%",
          filter: "blur(60px)",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "clamp(280px, 70vw, 500px)",
          height: "clamp(280px, 70vw, 500px)",
          background: "radial-gradient(circle, rgba(0, 153, 255, 0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          bottom: "-15%",
          left: "-10%",
          filter: "blur(60px)",
          animation: "float 10s ease-in-out infinite",
        }}
      />
      {/* Grid Pattern */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle, rgba(0, 255, 200, 0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          animation: "moveGrid 20s linear infinite",
        }}
      />
      {/* Login Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(15, 25, 50, 0.8)",
          border: "1px solid rgba(0, 255, 200, 0.3)",
          borderRadius: "24px",
          padding: "clamp(28px, 6vw, 50px) clamp(18px, 4.5vw, 40px)",
          maxWidth: "450px",
          width: "100%",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          animation: "floatCard 6s ease-in-out infinite",
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, rgba(0, 255, 212, 0.2), rgba(0, 153, 255, 0.2))",
              borderRadius: "50%",
              border: "2px solid rgba(0, 255, 200, 0.3)",
              marginBottom: "20px",
            }}
          >
            <FaLock style={{ fontSize: "2rem", color: "#00FFD4" }} />
          </div>

          <h1
            style={{
              margin: "0 0 10px 0",
              fontSize: "2rem",
              fontWeight: 900,
              background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <FaRocket /> Admin Portal
          </h1>

          {/* Description */}
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "30px",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Secure access to Bluefins administration
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAccessSubmit}>
          <input
            type="text"
            placeholder="Admin ID or email"
            value={identifier}
            onChange={// Update admin ID / email input value as user types
            e => {
              return setIdentifier(e.target.value);
            }}
            disabled={verifyLoading}
            autoComplete="username"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "2px solid rgba(0, 255, 200, 0.3)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              boxSizing: "border-box",
              marginBottom: "14px",
              fontFamily: "Poppins, system-ui",
              fontSize: "1rem",
              transition: "all 0.3s ease",
            }}
            onFocus={// Highlight identifier input border with teal glow on focus
            e => {
              e.currentTarget.style.border = "2px solid #00FFD4";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 212, 0.2)";
            }}
            onBlur={// Reset identifier input border to default when unfocused
            e => {
              e.currentTarget.style.border = "2px solid rgba(0, 255, 200, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={// Update password input value as user types
            e => {
              return setPassword(e.target.value);
            }}
            disabled={verifyLoading}
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "2px solid rgba(0, 255, 200, 0.3)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              boxSizing: "border-box",
              marginBottom: "20px",
              fontFamily: "Poppins, system-ui",
              fontSize: "1rem",
              transition: "all 0.3s ease",
            }}
            onFocus={// Highlight password input border with teal glow on focus
            e => {
              e.currentTarget.style.border = "2px solid #00FFD4";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 212, 0.2)";
            }}
            onBlur={// Reset password input border to default when unfocused
            e => {
              e.currentTarget.style.border = "2px solid rgba(0, 255, 200, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          {/* Error Message */}
          {error && !verifyLoading ? (
            <div
              style={{
                background: "rgba(255, 50, 50, 0.15)",
                color: "#FF6B9D",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                textAlign: "center",
                border: "1px solid rgba(255, 50, 50, 0.3)",
              }}
            >
              ⚠️ {error}
            </div>
          ) : null}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={verifyLoading || !identifier.trim() || !password.trim()}
            style={{
              width: "100%",
              padding: "16px",
              background:
                verifyLoading || !identifier.trim() || !password.trim()
                  ? "rgba(0, 255, 212, 0.3)"
                  : "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
              color:
                verifyLoading || !identifier.trim() || !password.trim() ? "rgba(0, 0, 0, 0.5)" : "#000",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor:
                verifyLoading || !identifier.trim() || !password.trim() ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              fontFamily: "Poppins, system-ui",
            }}
            onMouseEnter={// Lift login button and add glow when form is filled and not loading
            e => {
              if (!verifyLoading && identifier.trim() && password.trim()) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 255, 212, 0.4)";
              }
            }}
            onMouseLeave={// Reset login button position when mouse leaves
            e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {verifyLoading ? "Verifying..." : "Access Admin Panel"}
          </button>
        </form>

        {/* Footer Info */}
        <p
          style={{
            marginTop: "30px",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "0.85rem",
          }}
        >
          🔒 Secure authentication required
        </p>
      </div>
      {/* CSS Animations */}
      <style>{`
        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes moveGrid {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
