import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminNavbar from "../../components/adminPanel/AdminNavbar";
import { FaBookmark, FaComments, FaClipboard, FaFileAlt, FaChartBar, FaUsers, FaArrowRight } from "react-icons/fa";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const dashboardCards = [
    {
      title: "Lesson Plans",
      description: "Manage yearly plans and learning levels",
      icon: <FaBookmark />,
      path: "/admin/lesson-plans",
      color: "#00FFD4",
      count: "4 Levels",
    },
    {
      title: "Members Feedback",
      description: "View and manage customer feedback",
      icon: <FaComments />,
      path: "/admin/feedback",
      color: "#FF6B9D",
      count: "12 Reviews",
    },
    {
      title: "Weekly Worksheets",
      description: "Track progress and assignments",
      icon: <FaClipboard />,
      path: "/admin/worksheets",
      color: "#9664FF",
      count: "8 Active",
    },
    {
      title: "Posts & Updates",
      description: "Create and manage announcements",
      icon: <FaFileAlt />,
      path: "/admin/posts",
      color: "#FFB6C1",
      count: "15 Posts",
    },
  ];

  const stats = [
    { label: "Total Students", value: "156", icon: <FaUsers />, color: "#00FFD4" },
    { label: "Active Programs", value: "8", icon: <FaChartBar />, color: "#0099FF" },
    { label: "Feedback Received", value: "42", icon: <FaComments />, color: "#FF6B9D" },
    { label: "Published Posts", value: "15", icon: <FaFileAlt />, color: "#FFD700" },
  ];

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
        {/* Welcome Section */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              color: "#00FFD4",
              fontSize: "2.5rem",
              fontWeight: 900,
              marginBottom: "10px",
            }}
          >
            Welcome to Admin Dashboard
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "1.1rem" }}>
            Manage all aspects of Bluefins Aquatic Solutions
          </p>
        </div>

        {/* Stats Section */}
        {/* <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{
                background: "rgba(15, 25, 50, 0.7)",
                border: `1px solid ${stat.color}`,
                borderRadius: "12px",
                padding: "25px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = `0 10px 30px rgba(${hexToRgb(stat.color)}, 0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                <div
                  style={{
                    fontSize: "2rem",
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>
                <div>
                  <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: 0, fontSize: "0.9rem" }}>
                    {stat.label}
                  </p>
                  <h2 style={{ color: stat.color, margin: "5px 0 0 0", fontSize: "2rem", fontWeight: 900 }}>
                    {stat.value}
                  </h2>
                </div>
              </div>
            </div>
          ))}
        </div> */}

        {/* Main Dashboard Cards */}
        <h2 style={{ color: "#00FFD4", marginBottom: "20px", fontSize: "1.8rem" }}>Quick Access</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "25px",
          }}
        >
          {dashboardCards.map((card, index) => (
            <Link
              key={index}
              to={card.path}
              style={{
                textDecoration: "none",
                background: "rgba(15, 25, 50, 0.7)",
                border: `1px solid ${card.color}`,
                borderRadius: "16px",
                padding: "30px",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = `0 15px 40px rgba(${hexToRgb(card.color)}, 0.4)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Background Gradient */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "150px",
                  height: "150px",
                  background: `radial-gradient(circle, ${card.color}20 0%, transparent 70%)`,
                  borderRadius: "50%",
                  transform: "translate(30%, -30%)",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    fontSize: "2.5rem",
                    color: card.color,
                    marginBottom: "15px",
                  }}
                >
                  {card.icon}
                </div>

                <h3
                  style={{
                    color: card.color,
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    marginBottom: "10px",
                  }}
                >
                  {card.title}
                </h3>

                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    marginBottom: "20px",
                    lineHeight: "1.6",
                  }}
                >
                  {card.description}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: card.color,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    {card.count}
                  </span>
                  <FaArrowRight style={{ color: card.color }} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity Section */}
        {/* <div style={{ marginTop: "50px" }}>
          <h2 style={{ color: "#00FFD4", marginBottom: "20px", fontSize: "1.8rem" }}>Recent Activity</h2>
          <div
            style={{
              background: "rgba(15, 25, 50, 0.7)",
              border: "1px solid rgba(0, 255, 212, 0.3)",
              borderRadius: "12px",
              padding: "30px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {[
                { text: "New feedback received from Raj Kumar", time: "2 hours ago", color: "#FF6B9D" },
                { text: "Lesson plan updated for Intermediate level", time: "5 hours ago", color: "#00FFD4" },
                { text: "New post published: Achievement Recognition", time: "1 day ago", color: "#FFB6C1" },
                { text: "Weekly worksheet completed by 12 students", time: "2 days ago", color: "#9664FF" },
              ].map((activity, index) => (
                <div
                  key={index}
                  style={{
                    padding: "15px",
                    background: "rgba(0, 255, 212, 0.05)",
                    borderLeft: `3px solid ${activity.color}`,
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ color: "rgba(255, 255, 255, 0.9)", margin: 0, marginBottom: "5px" }}>
                    {activity.text}
                  </p>
                  <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.85rem" }}>
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

// Helper function
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0";
};

export default AdminDashboard;
