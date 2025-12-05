import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaRocket, FaSignOutAlt, FaBookmark, FaComments, FaClipboard, FaFileAlt, FaBars, FaTimes } from "react-icons/fa";

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/admin");
  };

  const navLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <FaRocket /> },
    { path: "/admin/lesson-plans", label: "Lesson Plans", icon: <FaBookmark /> },
    { path: "/admin/feedback", label: "Feedback/Messages", icon: <FaComments /> },
    { path: "/admin/worksheets", label: "Worksheets", icon: <FaClipboard /> },
    { path: "/admin/posts", label: "Posts", icon: <FaFileAlt /> },
  ];

  return (
    <nav
      style={{
        background: "rgba(15, 25, 50, 0.95)",
        border: "1px solid rgba(0, 255, 200, 0.2)",
        borderLeft: "none",
        borderRight: "none",
        padding: "15px 40px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Logo */}
        <Link
          to="/admin/dashboard"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <img 
            src="/assets/Logo.png" 
            alt="Bluefins Logo" 
            style={{ 
              height: "40px", 
              width: "auto",
              filter: "drop-shadow(0 0 8px rgba(0, 255, 212, 0.3))"
            }} 
          />
          <h1
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 900,
              background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Bluefins Admin
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background:
                  location.pathname === link.path
                    ? "rgba(0, 255, 212, 0.15)"
                    : "transparent",
                color:
                  location.pathname === link.path
                    ? "#00FFD4"
                    : "rgba(255, 255, 255, 0.7)",
                border:
                  location.pathname === link.path
                    ? "1px solid #00FFD4"
                    : "1px solid transparent",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.background = "rgba(0, 255, 212, 0.1)";
                  e.currentTarget.style.color = "#00FFD4";
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }
              }}
            >
              {link.icon} {link.label}
            </Link>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "rgba(255, 50, 100, 0.2)",
              color: "#FF6B9D",
              border: "1px solid rgba(255, 50, 100, 0.4)",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 50, 100, 0.4)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 50, 100, 0.2)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: "none",
            background: "rgba(0, 255, 212, 0.1)",
            border: "1px solid rgba(0, 255, 212, 0.3)",
            color: "#00FFD4",
            padding: "10px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1.2rem",
          }}
          className="mobile-menu-toggle"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          style={{
            display: "none",
            flexDirection: "column",
            gap: "10px",
            marginTop: "20px",
            padding: "20px",
            background: "rgba(10, 14, 39, 0.95)",
            borderRadius: "12px",
            border: "1px solid rgba(0, 255, 212, 0.2)",
          }}
          className="mobile-nav"
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                background:
                  location.pathname === link.path
                    ? "rgba(0, 255, 212, 0.15)"
                    : "transparent",
                color:
                  location.pathname === link.path
                    ? "#00FFD4"
                    : "rgba(255, 255, 255, 0.7)",
                border:
                  location.pathname === link.path
                    ? "1px solid #00FFD4"
                    : "1px solid transparent",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px",
              background: "rgba(255, 50, 100, 0.2)",
              color: "#FF6B9D",
              border: "1px solid rgba(255, 50, 100, 0.4)",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      )}

      {/* Responsive Styles */}
      <style>{`
        /* Large Tablet Responsive Styles (1025px - 1200px) */
        @media (max-width: 1200px) and (min-width: 1025px) {
          .desktop-nav {
            gap: 8px !important;
          }
          .desktop-nav a,
          .desktop-nav button {
            padding: 9px 14px !important;
            font-size: 0.85rem !important;
          }
          nav h1 {
            font-size: 1.3rem !important;
          }
        }

        /* Tablet Responsive Styles - Switch to mobile menu */
        @media (max-width: 1024px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
          .mobile-nav {
            display: flex !important;
          }
          nav > div:first-child {
            padding: 15px 20px !important;
          }
          nav h1 {
            font-size: 1.2rem !important;
          }
          nav img {
            height: 35px !important;
          }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          nav > div:first-child {
            padding: 12px 15px !important;
          }
          nav h1 {
            font-size: 1.1rem !important;
          }
          nav img {
            height: 32px !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default AdminNavbar;
