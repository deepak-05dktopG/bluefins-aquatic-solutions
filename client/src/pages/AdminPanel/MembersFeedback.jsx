/**
 * What it is: Admin panel page (Members feedback screen).
 * Non-tech note: Admins can read and manage feedback submitted by users.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { adminFetch, isAdminAuthenticated } from "../../utils/adminAuth";
import { formatDateTime } from "../../utils/dateTime";
import { FaFilter, FaUser, FaEnvelope, FaPhone, FaClock, FaTrash } from "react-icons/fa";
import AdminNavbar from "../../components/adminPanel/AdminNavbar";

const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * Purpose: Do Members Feedback
 * Plain English: What this function is used for.
 */
const MembersFeedback = () => {
  const navigate = useNavigate();

  useEffect(/**
   * Purpose: React effect callback (runs after render based on dependencies)
   * Plain English: What this function is used for.
   */
  () => {
    if (!isAdminAuthenticated()) {
      navigate("/admin");
    }
  }, [navigate]);

  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState(null);

  // Fetch feedbacks from backend
  useEffect(/**
   * Purpose: React effect callback (runs after render based on dependencies)
   * Plain English: What this function is used for.
   */
  () => {
    fetchFeedbacks();
  }, []);

  /**
   * Purpose: Fetch Feedbacks from server
   * Plain English: What this function is used for.
   */
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await adminFetch(`${apiBase}/feedback`);
      const data = await response.json();
      
      if (data.success) {
        setFeedback(data.data);
      } else {
        setError("Failed to fetch feedbacks");
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setError("Failed to load feedbacks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Purpose: Do Delete Feedback
   * Plain English: What this function is used for.
   */
  const deleteFeedback = async id => {
    const result = await Swal.fire({
      title: 'Delete Feedback?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF6B6B',
      cancelButtonColor: '#667eea',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: 'linear-gradient(135deg, #1a1f3a, #0f1629)',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
          const response = await adminFetch(`${apiBase}/feedback/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (data.success) {
          setFeedback(feedback.filter(/**
           * Purpose: Array filter callback (keeps items that match a condition)
           * Plain English: What this function is used for.
           */
          fb => {
            return fb._id !== id;
          }));
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Deleted!',
            text: 'Feedback deleted successfully',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: 'linear-gradient(135deg, #4ECDC4, #54A0FF)',
            color: '#fff',
            iconColor: '#fff'
          });
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Failed',
            text: 'Failed to delete feedback',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
            color: '#fff',
            iconColor: '#fff'
          });
        }
      } catch (err) {
        console.error("Error deleting feedback:", err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete feedback. Please try again.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
          color: '#fff',
          iconColor: '#fff'
        });
      }
    }
  };

  /**
   * Purpose: Do Mark As Read
   * Plain English: What this function is used for.
   */
  const markAsRead = async id => {
    try {
        const response = await adminFetch(`${apiBase}/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'read' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setFeedback(
          feedback.map(/**
           * Purpose: Array mapping callback (converts each item to a new value)
           * Plain English: What this function is used for.
           */
          fb => {
            return (fb._id === id ? { ...fb, status: "read" } : fb);
          })
        );
      }
    } catch (err) {
      console.error("Error updating feedback:", err);
    }
  };

  // Filter feedback
  const filteredFeedback = feedback.filter(/**
   * Purpose: Array filter callback (keeps items that match a condition)
   * Plain English: What this function is used for.
   */
  fb => {
    const statusMatch = filterStatus === "all" || fb.status === filterStatus;
    return statusMatch;
  });

  // Statistics
  const totalCount = feedback.length;
  const unreadCount = feedback.filter(/**
   * Purpose: Array filter callback (keeps items that match a condition)
   * Plain English: What this function is used for.
   */
  fb => {
    return fb.status === "unread";
  }).length;
  const readCount = feedback.filter(/**
   * Purpose: Array filter callback (keeps items that match a condition)
   * Plain English: What this function is used for.
   */
  fb => {
    return fb.status === "read";
  }).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <AdminNavbar />
      <div style={{ padding: "50px 20px 40px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: "700", marginBottom: "10px" }}>
           💬 Members Feedback
          </h1>
          <p style={{ color: "#b0b0b0", fontSize: "1rem" }}>
            View and manage all feedback from your members
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "rgba(78, 205, 196, 0.1)", border: "2px solid #4ECDC4", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#4ECDC4", marginBottom: "5px" }}>{totalCount}</div>
            <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Total Feedback</div>
          </div>
          <div style={{ background: "rgba(255, 107, 107, 0.1)", border: "2px solid #FF6B6B", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#FF6B6B", marginBottom: "5px" }}>{unreadCount}</div>
            <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Unread</div>
          </div>
          <div style={{ background: "rgba(102, 126, 234, 0.1)", border: "2px solid #667eea", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#667eea", marginBottom: "5px" }}>{readCount}</div>
            <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Read</div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "15px", padding: "20px", marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <FaFilter style={{ color: "#4ECDC4", fontSize: "1.2rem" }} />
          <label style={{ color: "#fff", fontSize: "0.95rem" }}>Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={/**
             * Purpose: Helper callback used inside a larger operation
             * Plain English: What this function is used for.
             */
            e => {
              return setFilterStatus(e.target.value);
            }}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "8px 15px",
              color: "#fff",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            <option value="all" style={{ background: "#1a1f3a", color: "#fff" }}>All</option>
            <option value="unread" style={{ background: "#1a1f3a", color: "#fff" }}>Unread</option>
            <option value="read" style={{ background: "#1a1f3a", color: "#fff" }}>Read</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "50px", color: "#fff", fontSize: "1.2rem" }}>
            Loading feedbacks...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ background: "rgba(255, 107, 107, 0.2)", border: "2px solid #FF6B6B", borderRadius: "15px", padding: "20px", textAlign: "center", color: "#FF6B6B", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Feedback List */}
        {!loading && !error && filteredFeedback.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px", color: "#b0b0b0", fontSize: "1.1rem" }}>
            No feedback found.
          </div>
        )}

        <div style={{ display: "grid", gap: "20px" }}>
          {filteredFeedback.map(/**
           * Purpose: Array mapping callback (converts each item to a new value)
           * Plain English: What this function is used for.
           */
          fb => {
            return (
              <div
                key={fb._id}
                style={{
                  background: fb.status === "unread" ? "rgba(255, 107, 107, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  border: `2px solid ${fb.status === "unread" ? "#FF6B6B" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "15px",
                  padding: "25px",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
                onMouseEnter={/**
                 * Purpose: Helper callback used inside a larger operation
                 * Plain English: What this function is used for.
                 */
                e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={/**
                 * Purpose: Helper callback used inside a larger operation
                 * Plain English: What this function is used for.
                 */
                e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Status Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "15px",
                    right: "15px",
                    background: fb.status === "unread" ? "#FF6B6B" : fb.status === "read" ? "#4ECDC4" : "#667eea",
                    color: "#fff",
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {fb.status}
                </div>
                {/* User Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #4ECDC4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.3rem", fontWeight: "700" }}>
                    {fb.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaUser style={{ color: "#4ECDC4", fontSize: "0.9rem" }} />
                      {fb.name}
                    </div>
                    <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                      <FaEnvelope style={{ color: "#FFD93D" }} />
                      <a href={`mailto:${fb.email}`} style={{ color: "#b0b0b0", textDecoration: "none", transition: "color 0.3s ease" }} onMouseEnter={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      e => {
                        return e.currentTarget.style.color = "#FFD93D";
                      }} onMouseLeave={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      e => {
                        return e.currentTarget.style.color = "#b0b0b0";
                      }}>
                        {fb.email}
                      </a>
                    </div>
                    <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                      <FaPhone style={{ color: "#FF6B6B" }} />
                      <a href={`tel:${fb.phone}`} style={{ color: "#b0b0b0", textDecoration: "none", transition: "color 0.3s ease" }} onMouseEnter={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      e => {
                        return e.currentTarget.style.color = "#FF6B6B";
                      }} onMouseLeave={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      e => {
                        return e.currentTarget.style.color = "#b0b0b0";
                      }}>
                        {fb.phone}
                      </a>
                    </div>
                  </div>
                </div>
                {/* Message */}
                <div style={{ background: "rgba(0, 0, 0, 0.2)", borderRadius: "10px", padding: "15px", marginBottom: "15px" }}>
                  <p style={{ color: "#e0e0e0", fontSize: "0.95rem", lineHeight: "1.6", margin: 0 }}>
                    {fb.message}
                  </p>
                </div>
                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b0b0b0", fontSize: "0.85rem" }}>
                    <FaClock />
                          {formatDateTime(fb.createdAt)}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {fb.status === "unread" && (
                      <button
                        onClick={/**
                         * Purpose: Helper callback used inside a larger operation
                         * Plain English: What this function is used for.
                         */
                        () => {
                          return markAsRead(fb._id);
                        }}
                        style={{
                          background: "linear-gradient(135deg, #4ECDC4, #54A0FF)",
                          border: "none",
                          color: "#fff",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={/**
                         * Purpose: Helper callback used inside a larger operation
                         * Plain English: What this function is used for.
                         */
                        e => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 15px rgba(78, 205, 196, 0.4)";
                        }}
                        onMouseLeave={/**
                         * Purpose: Helper callback used inside a larger operation
                         * Plain English: What this function is used for.
                         */
                        e => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      () => {
                        return deleteFeedback(fb._id);
                      }}
                      style={{
                        background: "linear-gradient(135deg, #FF6B6B, #FF9FF3)",
                        border: "none",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      e => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 107, 107, 0.4)";
                      }}
                      onMouseLeave={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MembersFeedback;
