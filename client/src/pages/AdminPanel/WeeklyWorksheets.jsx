import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/adminPanel/AdminNavbar.jsx";
import { FaTrash, FaPlusCircle, FaLink, FaExternalLinkAlt, FaGoogle, FaGoogleDrive, FaEye } from "react-icons/fa";
import Swal from 'sweetalert2';
import { adminFetch, isAdminAuthenticated } from "../../utils/adminAuth";

const WeeklyWorksheets = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin");
    }
  }, [navigate]);

  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    message: "",
    link: "",
    linkType: "google-form",
    createdBy: "Admin"
  });

  // Fetch worksheets from backend
  useEffect(() => {
    fetchWorksheets();
  }, []);

  const fetchWorksheets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/worksheets`);
      const data = await response.json();
      
      if (data.success) {
        setWorksheets(data.data);
      } else {
        setError("Failed to fetch worksheets");
      }
    } catch (err) {
      console.error("Error fetching worksheets:", err);
      setError("Failed to load worksheets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.link) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please provide at least title and link',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'linear-gradient(135deg, #FFD93D, #FF9FF3)',
        color: '#fff',
        iconColor: '#fff'
      });
      return;
    }

    try {
      const response = await adminFetch(`${import.meta.env.VITE_API_BASE_URL}/worksheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Success!',
          text: 'Link shared successfully',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: 'linear-gradient(135deg, #4ECDC4, #54A0FF)',
          color: '#fff',
          iconColor: '#fff'
        });
        fetchWorksheets();
        resetForm();
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed',
          text: data.message || 'Failed to share link',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
          color: '#fff',
          iconColor: '#fff'
        });
      }
    } catch (error) {
      console.error('Error creating worksheet:', error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Error',
        text: 'Failed to share link. Please try again.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
        color: '#fff',
        iconColor: '#fff'
      });
    }
  };

  const deleteWorksheet = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Link?',
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
        const response = await adminFetch(`${import.meta.env.VITE_API_BASE_URL}/worksheets/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (data.success) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Deleted!',
            text: 'Link deleted successfully',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: 'linear-gradient(135deg, #4ECDC4, #54A0FF)',
            color: '#fff',
            iconColor: '#fff'
          });
          fetchWorksheets();
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Failed',
            text: 'Failed to delete link',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
            color: '#fff',
            iconColor: '#fff'
          });
        }
      } catch (err) {
        console.error("Error deleting worksheet:", err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete link. Please try again.',
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

  const handleLinkClick = async (id, link) => {
    // Track click
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/worksheets/${id}/click`, {
        method: 'PATCH',
      });
    } catch (err) {
      console.error("Error tracking click:", err);
    }
    
    // Open link
    window.open(link, '_blank');
  };

  const resetForm = () => {
    setFormData({
      title: "",
      caption: "",
      message: "",
      link: "",
      linkType: "google-form",
      createdBy: "Admin"
    });
    setShowForm(false);
  };

  // Filter worksheets
  const filteredWorksheets = worksheets.filter((ws) => {
    if (filterType === "all") return true;
    return ws.linkType === filterType;
  });

  // Statistics
  const totalWorksheets = worksheets.length;
  const googleForms = worksheets.filter((ws) => ws.linkType === "google-form").length;
  const googleDrive = worksheets.filter((ws) => ws.linkType === "google-drive").length;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: "700", marginBottom: "10px" }}>
             🔗 Team Resources & Links
            </h1>
            <p style={{ color: "#b0b0b0", fontSize: "1rem" }}>
              Share Google Forms, Drive links, and other resources with team members
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "linear-gradient(135deg, #4ECDC4, #54A0FF)",
              border: "none",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(78, 205, 196, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FaPlusCircle /> {showForm ? 'Cancel' : 'Share New Link'}
          </button>
        </div>

        {/* Statistics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "rgba(78, 205, 196, 0.1)", border: "2px solid #4ECDC4", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#4ECDC4", marginBottom: "5px" }}>{totalWorksheets}</div>
            <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Total Links</div>
          </div>
          <div style={{ background: "rgba(102, 126, 234, 0.1)", border: "2px solid #667eea", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#667eea", marginBottom: "5px" }}>{googleForms}</div>
            <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Google Forms</div>
          </div>
          <div style={{ background: "rgba(255, 215, 0, 0.1)", border: "2px solid #FFD700", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#FFD700", marginBottom: "5px" }}>{googleDrive}</div>
            <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Google Drive</div>
          </div>
        </div>

        {/* Share Link Form */}
        {showForm && (
          <div style={{ background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(15px)", border: "2px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "30px", marginBottom: "30px" }}>
            <h3 style={{ color: "#4ECDC4", fontSize: "1.5rem", fontWeight: "700", marginBottom: "20px" }}>Share New Link</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Title <span style={{ color: "#FF6B6B" }}>*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Weekly Training Form, Attendance Sheet"
                  required
                  maxLength="100"
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Caption (Optional)</label>
                <input
                  type="text"
                  name="caption"
                  value={formData.caption}
                  onChange={handleChange}
                  placeholder="Short description"
                  maxLength="200"
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Message (Optional)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Additional information or instructions for team members"
                  rows="4"
                  maxLength="1000"
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Link <span style={{ color: "#FF6B6B" }}>*</span></label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://forms.google.com/... or https://drive.google.com/..."
                  required
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Link Type</label>
                <select
                  name="linkType"
                  value={formData.linkType}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="google-form" style={{ background: "#1a1f3a", color: "#fff" }}>Google Form</option>
                  <option value="google-drive" style={{ background: "#1a1f3a", color: "#fff" }}>Google Drive</option>
                  <option value="other" style={{ background: "#1a1f3a", color: "#fff" }}>Other</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Shared By</label>
                <input
                  type="text"
                  name="createdBy"
                  value={formData.createdBy}
                  onChange={handleChange}
                  placeholder="Your name"
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(135deg, #4ECDC4, #54A0FF)",
                    border: "none",
                    color: "#fff",
                    padding: "12px 30px",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaLink /> Share Link
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    padding: "12px 30px",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "15px", padding: "20px", marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <label style={{ color: "#fff", fontSize: "0.95rem" }}>Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
            <option value="google-form" style={{ background: "#1a1f3a", color: "#fff" }}>Google Forms</option>
            <option value="google-drive" style={{ background: "#1a1f3a", color: "#fff" }}>Google Drive</option>
            <option value="other" style={{ background: "#1a1f3a", color: "#fff" }}>Other</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "50px", color: "#fff", fontSize: "1.2rem" }}>
            Loading links...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ background: "rgba(255, 107, 107, 0.2)", border: "2px solid #FF6B6B", borderRadius: "15px", padding: "20px", textAlign: "center", color: "#FF6B6B", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredWorksheets.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px", color: "#b0b0b0", fontSize: "1.1rem" }}>
            No links shared yet. Be the first to share a resource!
          </div>
        )}

        {/* Links List */}
        <div style={{ display: "grid", gap: "20px" }}>
          {filteredWorksheets.map((worksheet) => (
            <div
              key={worksheet._id}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "15px",
                padding: "25px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    {worksheet.linkType === 'google-form' && <FaGoogle style={{ color: "#4285F4", fontSize: "1.5rem" }} />}
                    {worksheet.linkType === 'google-drive' && <FaGoogleDrive style={{ color: "#FFD700", fontSize: "1.5rem" }} />}
                    {worksheet.linkType === 'other' && <FaLink style={{ color: "#4ECDC4", fontSize: "1.5rem" }} />}
                    <h3 style={{ color: "#4ECDC4", fontSize: "1.3rem", fontWeight: "700", margin: 0 }}>
                      {worksheet.title}
                    </h3>
                  </div>
                  
                  {worksheet.caption && (
                    <p style={{ color: "#FFD93D", fontSize: "1rem", fontWeight: "600", marginBottom: "10px" }}>
                      {worksheet.caption}
                    </p>
                  )}
                  
                  {worksheet.message && (
                    <p style={{ color: "#e0e0e0", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "15px" }}>
                      {worksheet.message}
                    </p>
                  )}
                  
                  <div style={{ display: "flex", gap: "20px", fontSize: "0.85rem", color: "#b0b0b0", marginBottom: "15px" }}>
                    <span>👤 Shared by: <strong style={{ color: "#fff" }}>{worksheet.createdBy}</strong></span>
                    <span>📅 {new Date(worksheet.createdAt).toLocaleDateString()}</span>
                    <span><FaEye style={{ marginRight: "5px" }} />{worksheet.clicks} views</span>
                  </div>
                </div>
                
                <button
                  onClick={() => deleteWorksheet(worksheet._id)}
                  style={{
                    background: "linear-gradient(135deg, #FF6B6B, #FF9FF3)",
                    border: "none",
                    color: "#fff",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 107, 107, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
              
              <button
                onClick={() => handleLinkClick(worksheet._id, worksheet.link)}
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  border: "none",
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <FaExternalLinkAlt /> Open Link
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyWorksheets;
