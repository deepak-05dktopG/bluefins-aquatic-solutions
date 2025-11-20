import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRocket, FaLock } from "react-icons/fa";

const AdminLogin = () => {
  const [accessKey, setAccessKey] = useState("");
  const [accessAttempted, setAccessAttempted] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const navigate = useNavigate();

  // Check for existing authorization on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("isAdmin");
    if (savedAuth === "true") {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  // Handle access key submission
  const handleAccessSubmit = (e) => {
    e.preventDefault();
    setAccessAttempted(true);
    setVerifyLoading(true);

    setTimeout(() => {
      if (accessKey === "bluefins2025") {
        localStorage.setItem("isAdmin", "true");
        navigate("/admin/dashboard");
      }
      setVerifyLoading(false);
    }, 600);
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
      {/* Animated Background Orbs */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
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
          width: "500px",
          height: "500px",
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
          padding: "50px 40px",
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
            type="password"
            placeholder="Enter access code"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            disabled={verifyLoading}
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
            onFocus={(e) => {
              e.currentTarget.style.border = "2px solid #00FFD4";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 255, 212, 0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "2px solid rgba(0, 255, 200, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          {/* Error Message */}
          {accessAttempted && !verifyLoading && accessKey !== "bluefins2025" && accessKey !== "" && (
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
              ⚠️ Invalid access code
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={verifyLoading || !accessKey.trim()}
            style={{
              width: "100%",
              padding: "16px",
              background:
                verifyLoading || !accessKey.trim()
                  ? "rgba(0, 255, 212, 0.3)"
                  : "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
              color: verifyLoading || !accessKey.trim() ? "rgba(0, 0, 0, 0.5)" : "#000",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: verifyLoading || !accessKey.trim() ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              fontFamily: "Poppins, system-ui",
            }}
            onMouseEnter={(e) => {
              if (!verifyLoading && accessKey.trim()) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 255, 212, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
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
