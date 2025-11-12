import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaDownload,
  FaSignOutAlt,
  FaEnvelope,
  FaTrash,
  FaEye,
  FaChartBar,
  FaUsers,
  FaFileAlt,
  FaShieldAlt,
  FaRocket,
  FaUpload,
  FaFileArchive,
  FaTimes,
} from "react-icons/fa";

const OwnerPanel = () => {
  // State Management
  const [accessKey, setAccessKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessAttempted, setAccessAttempted] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [readMessages, setReadMessages] = useState(new Set());

  // PDF Management State
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  // Check for existing authorization on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("isOwner");
    if (savedAuth === "true") {
      setIsAuthorized(true);
    }
  }, []);

  // Load PDFs from localStorage on mount
  useEffect(() => {
    const savedPdfs = localStorage.getItem("uploadedPdfs");
    if (savedPdfs) {
      try {
        setPdfs(JSON.parse(savedPdfs));
      } catch (error) {
        console.error("Error loading PDFs:", error);
      }
    }
  }, []);





  // Handle access key submission
  const handleAccessSubmit = (e) => {
    e.preventDefault();
    setAccessAttempted(true);
    setVerifyLoading(true);

    setTimeout(() => {
      if (accessKey === "bluefins2025") {
        setIsAuthorized(true);
        localStorage.setItem("isOwner", "true");
        setAccessKey("");
      }
      setVerifyLoading(false);
    }, 600);
  };



  // Handle PDF deletion
  const handleDeletePdf = (pdfId) => {
    const updatedPdfs = pdfs.filter((pdf) => pdf.id !== pdfId);
    setPdfs(updatedPdfs);
    localStorage.setItem("uploadedPdfs", JSON.stringify(updatedPdfs));

    if (selectedPdf?.id === pdfId) {
      setSelectedPdf(null);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("isOwner");
    setIsAuthorized(false);
    setMessages([]);
    setReadMessages(new Set());
  };

  // Delete a message
  const handleDeleteMessage = (messageId) => {
    setMessages(messages.filter((msg) => msg._id !== messageId));
  };

  // Mark message as read
  const handleMarkAsRead = (messageId) => {
    setReadMessages(new Set([...readMessages, messageId]));
  };

  // Login Screen - if not authorized
  if (!isAuthorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, system-ui",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background grid */}
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
            padding: "60px 50px",
            maxWidth: "500px",
            width: "100%",
            animation: "floatCard 3s ease-in-out infinite",
          }}
        >
          {/* Header Section */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div
              style={{
                fontSize: "3rem",
                marginBottom: "1rem",
                display: "inline-block",
                background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <FaShieldAlt />
            </div>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 900,
                background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: "0 0 10px",
              }}
            >
              BLUEFINS
            </h1>
            <p
              style={{
                color: "#00FFD4",
                fontSize: "0.85rem",
                letterSpacing: "3px",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Private Owner Portal
            </p>
          </div>

          {/* Description */}
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "30px",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Exclusive dashboard for managing training plan.
          </p>

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
              }}
            />

            {/* Error Message */}
            {accessAttempted && !isAuthorized && (
              <div
                style={{
                  background: "rgba(255, 50, 50, 0.15)",
                  color: "#FF6B9D",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                Invalid access code
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={verifyLoading || !accessKey.trim()}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                color: "#000",
                border: "none",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {verifyLoading ? "Verifying..." : "Access Training Plan"}
            </button>
          </form>
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
        `}</style>
      </div>
    );
  }
  // Main Dashboard - if authorized
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)",
        fontFamily: "Poppins, system-ui",
        paddingBottom: "10px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(15, 25, 50, 0.8)",
          border: "1px solid rgba(0, 255, 200, 0.2)",
          padding: "10px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          top: 0,
          zIndex: 100,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 900,
            background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FaRocket /> Bluefins
        </h1>

        <button
          onClick={handleLogout}
          style={{
            background: "rgba(255, 50, 100, 0.2)",
            color: "#FF6B9D",
            border: "1px solid rgba(255, 50, 100, 0.4)",
            padding: "5px 10px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaSignOutAlt size={14} /> Logout
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: "10px", maxWidth: "", margin: "0 auto" }}>

        {/* Training Tab */}
        <div
          style={{
            background: "rgba(15, 25, 50, 0.6)",
            border: "1px solid rgba(0, 255, 200, 0.3)",
            borderRadius: "16px",
            padding: "10px",
          }}
        >
          <h2 style={{ color: "#00FFD4", marginBottom: "20px" }}>
            Training Plan
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "30px",
            }}
          >
            Download our training plan
          </p>
          <iframe
            src="/src/assets/A5 lesson plan.pdf"
            width="100%"
            height="600px"
            style={{ borderRadius: "8px", marginBottom: "20px" }}
          />
          <a
            href="/src/assets/A5 lesson plan.pdf"
            download="Bluefins_Training_Plan.pdf"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
              color: "#000",
              padding: "14px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            <FaDownload size={16} /> Download PDF
          </a>
        </div>




      </div>
    </div>
  );
};

export default OwnerPanel;
