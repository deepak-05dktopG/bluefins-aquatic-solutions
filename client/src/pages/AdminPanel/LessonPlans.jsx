/**
 * What it is: Admin panel page (Lesson plans screen).
 * Non-tech note: Admins can view/download lesson plan documents here.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import AdminNavbar from "../../components/adminPanel/AdminNavbar";
import { FaDownload, FaEye, FaTimes } from "react-icons/fa";

// Lesson plans page — lets admins view and download yearly swimming curriculum PDFs
const LessonPlans = () => {
  const navigate = useNavigate();

  useEffect(
  // Guard: redirect unauthenticated users back to admin login
  () => {
    if (!isAdminAuthenticated()) {
      navigate("/admin");
    }
  }, [navigate]);

  // Yearly Plans State
  const [yearlyPlans] = useState([
    { id: 1, year: "2025-2026", title: "Annual Swimming Curriculum", pdfUrl: "/assets/lessonPlan/yearly plan.pdf", uploadDate: "2025-01-15" },
    { id: 2, year: "2025-2026", title: "Level of Learning", pdfUrl: "/assets/lessonPlan/level of learning.pdf", uploadDate: "2025-06-20" },
  ]);
  const [selectedYearlyPlan, setSelectedYearlyPlan] = useState(null);

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
          <h1 style={{ color: "#00FFD4", fontSize: "2.2rem", fontWeight: 900, marginBottom: "10px" }}>
            📚 Lesson Plans Management
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "1rem" }}>
            Manage yearly curriculum and learning level documentation
          </p>
        </div>

        {/* Section 1: Yearly Plans */}
        <div style={{ marginBottom: "60px" }}>
          <div style={{ marginBottom: "25px" }}>
            <h2 style={{ color: "#00FFD4", fontSize: "1.8rem", margin: 0 }}>📅 Yearly Curriculum Plans</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            {yearlyPlans.map(
            // Render a card for each curriculum plan (annual plan, level of learning, etc.)
            plan => {
              return (
                <div
                  key={plan.id}
                  style={{
                    background: selectedYearlyPlan?.id === plan.id ? "rgba(0, 255, 212, 0.15)" : "rgba(0, 255, 212, 0.08)",
                    border: selectedYearlyPlan?.id === plan.id ? "2px solid #00FFD4" : "1px solid rgba(0, 255, 212, 0.3)",
                    borderRadius: "12px",
                    padding: "25px",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={// Lift plan card and add teal shadow on hover
                  e => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 255, 212, 0.2)";
                  }}
                  onMouseLeave={// Reset plan card position when mouse leaves
                  e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ marginBottom: "15px" }}>
                    <h3 style={{ color: "#00FFD4", margin: "0 0 10px 0", fontSize: "1.5rem", fontWeight: 700 }}>
                      Year {plan.year}
                    </h3>
                    <p style={{ color: "rgba(255, 255, 255, 0.7)", margin: "5px 0", fontSize: "0.95rem" }}>
                      {plan.title}
                    </p>
                    <p style={{ color: "rgba(255, 255, 255, 0.5)", margin: "10px 0 0 0", fontSize: "0.85rem" }}>
                      📅 Uploaded: {plan.uploadDate}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button
                      onClick={// Toggle PDF viewer for this plan (show/hide)
                      () => {
                        return setSelectedYearlyPlan(selectedYearlyPlan?.id === plan.id ? null : plan);
                      }}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "10px",
                        background: "rgba(0, 255, 212, 0.2)",
                        color: "#00FFD4",
                        border: "1px solid rgba(0, 255, 212, 0.4)",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={// Brighten view button background on hover
                      e => {
                        return e.currentTarget.style.background = "rgba(0, 255, 212, 0.3)";
                      }}
                      onMouseLeave={// Reset view button background when mouse leaves
                      e => {
                        return e.currentTarget.style.background = "rgba(0, 255, 212, 0.2)";
                      }}
                    >
                      <FaEye /> {selectedYearlyPlan?.id === plan.id ? "Hide" : "View"}
                    </button>
                    <a
                      href={plan.pdfUrl}
                      download={`Bluefins_${plan.year}_Plan.pdf`}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "10px",
                        background: "rgba(0, 153, 255, 0.2)",
                        color: "#0099FF",
                        border: "1px solid rgba(0, 153, 255, 0.4)",
                        borderRadius: "8px",
                        fontWeight: 600,
                        textDecoration: "none",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={// Brighten download link background on hover
                      e => {
                        return e.currentTarget.style.background = "rgba(0, 153, 255, 0.3)";
                      }}
                      onMouseLeave={// Reset download link background when mouse leaves
                      e => {
                        return e.currentTarget.style.background = "rgba(0, 153, 255, 0.2)";
                      }}
                    >
                      <FaDownload /> Download
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PDF Viewer Modal */}
          {selectedYearlyPlan && (
            <div
              style={{
                background: "rgba(0, 255, 212, 0.08)",
                border: "2px solid rgba(0, 255, 212, 0.3)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "30px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ color: "#00FFD4", margin: 0 }}>📄 {selectedYearlyPlan.title}</h3>
                <button
                  onClick={// Close the PDF viewer modal
                  () => {
                    return setSelectedYearlyPlan(null);
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
                  }}
                >
                  <FaTimes /> Close
                </button>
              </div>

              <div className="pdf-viewer-container">
                <iframe
                  src={selectedYearlyPlan.pdfUrl}
                  width="100%"
                  height="600px"
                  style={{ borderRadius: "8px", border: "1px solid rgba(0, 255, 212, 0.2)" }}
                  className="pdf-viewer-iframe"
                  title="PDF Viewer"
                />
                <div className="tablet-pdf-message">
                  <p style={{ color: "#00FFD4", marginBottom: "15px", fontSize: "1rem" }}>
                    📱 For better viewing experience, please open the PDF in a new tab
                  </p>
                  <a
                    href={selectedYearlyPlan.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      background: "rgba(0, 255, 212, 0.2)",
                      color: "#00FFD4",
                      border: "1px solid rgba(0, 255, 212, 0.4)",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}
                  >
                    <FaEye /> Open PDF in New Tab
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        
      </div>
      {/* Responsive Styles */}
      <style>{`
        .pdf-viewer-container {
          width: 100%;
          position: relative;
        }

        .pdf-viewer-iframe {
          display: none !important;
        }

        .tablet-pdf-message {
          display: block !important;
          text-align: center;
          padding: 40px 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          border: 1px solid rgba(0, 255, 212, 0.2);
        }

        @media (max-width: 768px) {
          .tablet-pdf-message {
            padding: 30px 15px;
          }

          .tablet-pdf-message p {
            font-size: 0.9rem !important;
          }

          .tablet-pdf-message a {
            font-size: 0.85rem !important;
            padding: 10px 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LessonPlans;
