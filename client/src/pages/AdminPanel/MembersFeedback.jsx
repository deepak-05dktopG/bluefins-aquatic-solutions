import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/adminPanel/AdminNavbar.jsx";
import { FaTrash, FaStar, FaEnvelope, FaUser, FaFilter } from "react-icons/fa";

const MembersFeedback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const [feedback, setFeedback] = useState([
    { id: 1, name: "Raj Kumar", email: "raj@example.com", message: "Great training sessions! My son has improved a lot in just 2 months.", rating: 5, date: "2025-11-12", status: "unread" },
    { id: 2, name: "Priya Singh", email: "priya@example.com", message: "Please improve timing flexibility for weekend classes.", rating: 4, date: "2025-11-11", status: "read" },
    { id: 3, name: "Amit Sharma", email: "amit@example.com", message: "Excellent coaching staff and facilities. Highly recommend!", rating: 5, date: "2025-11-10", status: "read" },
    { id: 4, name: "Sneha Reddy", email: "sneha@example.com", message: "Good progress but need more focus on individual attention.", rating: 3, date: "2025-11-09", status: "read" },
    { id: 5, name: "Vikram Patel", email: "vikram@example.com", message: "My daughter loves the classes. Coach Vijeesh is amazing!", rating: 5, date: "2025-11-08", status: "unread" },
    { id: 6, name: "Anita Desai", email: "anita@example.com", message: "Need better parking facilities and waiting area for parents.", rating: 3, date: "2025-11-07", status: "read" },
  ]);

  const [filterRating, setFilterRating] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const deleteFeedback = (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      setFeedback(feedback.filter((fb) => fb.id !== id));
    }
  };

  const markAsRead = (id) => {
    setFeedback(
      feedback.map((fb) => (fb.id === id ? { ...fb, status: "read" } : fb))
    );
  };

  // Filter feedback
  const filteredFeedback = feedback.filter((fb) => {
    const ratingMatch = filterRating === "all" || fb.rating === parseInt(filterRating);
    const statusMatch = filterStatus === "all" || fb.status === filterStatus;
    return ratingMatch && statusMatch;
  });

  // Statistics
  const avgRating = (
    feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length
  ).toFixed(1);
  const unreadCount = feedback.filter((fb) => fb.status === "unread").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <AdminNavbar />

      <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ color: "#FF6B9D", fontSize: "2.2rem", fontWeight: 900, marginBottom: "10px" }}>
            💬 Members Feedback
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "1rem" }}>
            Review and manage customer feedback from contact form
          </p>
        </div>

        {/* Stats Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 107, 157, 0.1)",
              border: "1px solid #FF6B9D",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Total Feedback
            </p>
            <h2 style={{ color: "#FF6B9D", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {feedback.length}
            </h2>
          </div>
          <div
            style={{
              background: "rgba(255, 215, 0, 0.1)",
              border: "1px solid #FFD700",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Average Rating
            </p>
            <h2 style={{ color: "#FFD700", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {avgRating} ⭐
            </h2>
          </div>
          <div
            style={{
              background: "rgba(0, 255, 212, 0.1)",
              border: "1px solid #00FFD4",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Unread
            </p>
            <h2 style={{ color: "#00FFD4", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {unreadCount}
            </h2>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "30px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaFilter style={{ color: "#FF6B9D" }} />
            <span style={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 600 }}>Filters:</span>
          </div>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            style={{
              padding: "10px 15px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 107, 157, 0.3)",
              background: "rgba(255, 107, 157, 0.1)",
              color: "#FF6B9D",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "10px 15px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 107, 157, 0.3)",
              background: "rgba(255, 107, 157, 0.1)",
              color: "#FF6B9D",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        {/* Feedback List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredFeedback.length === 0 ? (
            <div
              style={{
                background: "rgba(255, 107, 157, 0.1)",
                border: "1px solid rgba(255, 107, 157, 0.3)",
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "1.1rem" }}>
                No feedback matches the selected filters
              </p>
            </div>
          ) : (
            filteredFeedback.map((fb) => (
              <div
                key={fb.id}
                style={{
                  background: fb.status === "unread" ? "rgba(255, 107, 157, 0.15)" : "rgba(255, 107, 157, 0.08)",
                  border: `1px solid ${fb.status === "unread" ? "#FF6B9D" : "rgba(255, 107, 157, 0.3)"}`,
                  borderLeft: `4px solid ${fb.status === "unread" ? "#FF6B9D" : "rgba(255, 107, 157, 0.5)"}`,
                  borderRadius: "12px",
                  padding: "25px",
                  transition: "all 0.3s ease",
                  cursor: fb.status === "unread" ? "pointer" : "default",
                }}
                onClick={() => fb.status === "unread" && markAsRead(fb.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 107, 157, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <FaUser style={{ color: "#FF6B9D" }} />
                      <h3 style={{ color: "#FF6B9D", margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                        {fb.name}
                      </h3>
                      {fb.status === "unread" && (
                        <span
                          style={{
                            background: "#FF6B9D",
                            color: "#000",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255, 255, 255, 0.5)", fontSize: "0.9rem" }}>
                      <FaEnvelope size={12} />
                      <span>{fb.email}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFeedback(fb.id);
                    }}
                    style={{
                      background: "rgba(255, 50, 100, 0.2)",
                      color: "#FF6B9D",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 50, 100, 0.4)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 50, 100, 0.2)"}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>

                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    marginBottom: "15px",
                    lineHeight: "1.6",
                    fontSize: "1rem",
                  }}
                >
                  {fb.message}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "5px", fontSize: "1.2rem" }}>
                    {[...Array(5)].map((_, index) => (
                      <FaStar
                        key={index}
                        style={{
                          color: index < fb.rating ? "#FFD700" : "rgba(255, 255, 255, 0.2)",
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>
                    📅 {fb.date}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersFeedback;
