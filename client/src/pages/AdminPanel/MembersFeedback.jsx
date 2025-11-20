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

    </div>
  );
};

export default MembersFeedback;
