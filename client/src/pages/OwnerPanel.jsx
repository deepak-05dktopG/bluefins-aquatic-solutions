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
  FaBookmark,
  FaComments,
  FaCalendar,
  FaClipboard,
  FaPlusCircle,
  FaEdit,
  FaStar,
  FaArrowRight,
} from "react-icons/fa";
import Navbar from "../components/Navbar";

const OwnerPanel = () => {
  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0";
  };

  // State Management
  const [accessKey, setAccessKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessAttempted, setAccessAttempted] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("lessonplan");
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [readMessages, setReadMessages] = useState(new Set());

  // Lesson Plan State
  const [lessonPlans, setLessonPlans] = useState([
    { id: 1, title: "Freestyle Training Week 1", date: "2025-11-13", coach: "Mr. Vijeesh", level: "Beginner" },
    { id: 2, title: "Backstroke Drills", date: "2025-11-14", coach: "Mr. Manikandan", level: "Intermediate" },
  ]);
  const [newLessonPlan, setNewLessonPlan] = useState({ title: "", date: "", coach: "", level: "Beginner" });
  const [showLessonForm, setShowLessonForm] = useState(false);
  
  // Yearly Plans State
  const [yearlyPlans, setYearlyPlans] = useState([
    { id: 1, year: 2025, title: "Annual Swimming Curriculum 2025", pdfUrl: "A5 lesson plan.pdf", uploadDate: "2025-01-15" },
    { id: 2, year: 2026, title: "Annual Swimming Curriculum 2026", pdfUrl: "A5 lesson plan.pdf", uploadDate: "2025-06-20" },
  ]);
  const [selectedYearlyPlan, setSelectedYearlyPlan] = useState(null);
  
  // Learning Levels State
  const [learningLevels, setLearningLevels] = useState([
    { id: 1, name: "Beginner", description: "Kids aged 4-6 years. Basic water familiarization and floating techniques.", color: "#00FFD4", duration: "3-4 months" },
    { id: 2, name: "Intermediate", description: "Kids aged 7-10 years. Stroke development and endurance building.", color: "#0099FF", duration: "4-6 months" },
    { id: 3, name: "Advanced", description: "Kids aged 11+ years. Competitive swimming and advanced techniques.", color: "#FF6B9D", duration: "6-12 months" },
    { id: 4, name: "Professional", description: "Selected swimmers for state-level competitions.", color: "#FFD700", duration: "Ongoing" },
  ]);

  // Members Feedback State
  const [feedback, setFeedback] = useState([
    { id: 1, name: "Raj Kumar", email: "raj@example.com", message: "Great training sessions!", rating: 5, date: "2025-11-12" },
    { id: 2, name: "Priya Singh", email: "priya@example.com", message: "Please improve timing", rating: 4, date: "2025-11-11" },
  ]);

  // Meetings State
  const [meetings, setMeetings] = useState([
    { id: 1, title: "Team Review Meeting", date: "2025-11-15", time: "3:00 PM", attendees: "All Coaches", link: "#" },
    { id: 2, title: "Parent Discussion", date: "2025-11-20", time: "5:00 PM", attendees: "10 Parents", link: "#" },
  ]);
  const [newMeeting, setNewMeeting] = useState({ title: "", date: "", time: "", attendees: "" });
  const [showMeetingForm, setShowMeetingForm] = useState(false);

  // Weekly Worksheet State
  const [worksheets, setWorksheets] = useState([
    { id: 1, week: "Week 1", title: "Breathing Techniques", tasks: 5, completed: 3, date: "2025-11-13" },
    { id: 2, week: "Week 2", title: "Flip Turn Practice", tasks: 4, completed: 2, date: "2025-11-20" },
  ]);
  const [newWorksheet, setNewWorksheet] = useState({ week: "", title: "", tasks: 5 });
  const [showWorksheetForm, setShowWorksheetForm] = useState(false);

  // Post Page State
  const [posts, setPosts] = useState([
    { id: 1, title: "Achievement: National Record!", author: "Mr. Vijeesh", date: "2025-11-12", views: 245, content: "Our student broke the state record in 100m freestyle!" },
    { id: 2, title: "New Coaching Method", author: "Mr. Manikandan", date: "2025-11-10", views: 189, content: "Introducing the latest coaching methodology..." },
  ]);
  const [newPost, setNewPost] = useState({ title: "", content: "", author: "Owner" });
  const [showPostForm, setShowPostForm] = useState(false);

  // Check for existing authorization on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("isOwner");
    if (savedAuth === "true") {
      setIsAuthorized(true);
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("isOwner");
    setIsAuthorized(false);
    setMessages([]);
    setReadMessages(new Set());
  };

  // Lesson Plan Functions
  const addLessonPlan = () => {
    if (newLessonPlan.title && newLessonPlan.date) {
      setLessonPlans([...lessonPlans, { ...newLessonPlan, id: Date.now() }]);
      setNewLessonPlan({ title: "", date: "", coach: "", level: "Beginner" });
      setShowLessonForm(false);
    }
  };

  const deleteLessonPlan = (id) => {
    setLessonPlans(lessonPlans.filter(plan => plan.id !== id));
  };

  // Meeting Functions
  const addMeeting = () => {
    if (newMeeting.title && newMeeting.date) {
      setMeetings([...meetings, { ...newMeeting, id: Date.now() }]);
      setNewMeeting({ title: "", date: "", time: "", attendees: "" });
      setShowMeetingForm(false);
    }
  };

  const deleteMeeting = (id) => {
    setMeetings(meetings.filter(meeting => meeting.id !== id));
  };

  // Worksheet Functions
  const addWorksheet = () => {
    if (newWorksheet.week && newWorksheet.title) {
      setWorksheets([...worksheets, { ...newWorksheet, id: Date.now(), completed: 0, date: new Date().toISOString().split('T')[0] }]);
      setNewWorksheet({ week: "", title: "", tasks: 5 });
      setShowWorksheetForm(false);
    }
  };

  const deleteWorksheet = (id) => {
    setWorksheets(worksheets.filter(ws => ws.id !== id));
  };

  // Post Functions
  const addPost = () => {
    if (newPost.title && newPost.content) {
      setPosts([...posts, { ...newPost, id: Date.now(), date: new Date().toISOString().split('T')[0], views: 0 }]);
      setNewPost({ title: "", content: "", author: "Owner" });
      setShowPostForm(false);
    }
  };

  const deletePost = (id) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  // Delete Feedback
  const deleteFeedback = (id) => {
    setFeedback(feedback.filter(fb => fb.id !== id));
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
        <Navbar />
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
        paddingBottom: "50px",
      }}
    >

      {/* Header */}
      <div
        style={{
          background: "rgba(15, 25, 50, 0.9)",
          border: "1px solid rgba(0, 255, 200, 0.2)",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "1.8rem",
            fontWeight: 900,
            background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FaRocket /> Bluefins Owner Portal
        </h1>

        <button
          onClick={handleLogout}
          style={{
            background: "rgba(255, 50, 100, 0.2)",
            color: "#FF6B9D",
            border: "1px solid rgba(255, 50, 100, 0.4)",
            padding: "8px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
          <FaSignOutAlt size={14} /> Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          background: "rgba(15, 25, 50, 0.7)",
          borderBottom: "1px solid rgba(0, 255, 200, 0.2)",
          padding: "0 40px",
          gap: "10px",
        }}
      >
        {[
          { key: "lessonplan", label: "Lesson Plans", icon: <FaBookmark /> },
          { key: "feedback", label: "Members Feedback", icon: <FaComments /> },
          { key: "meetings", label: "Meetings", icon: <FaCalendar /> },
          { key: "worksheet", label: "Weekly Worksheet", icon: <FaClipboard /> },
          { key: "posts", label: "Posts", icon: <FaFileAlt /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "15px 20px",
              background: activeTab === tab.key ? "rgba(0, 255, 212, 0.1)" : "transparent",
              color: activeTab === tab.key ? "#00FFD4" : "rgba(255, 255, 255, 0.6)",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #00FFD4" : "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
              }
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* LESSON PLAN TAB */}
        {activeTab === "lessonplan" && (
          <div>
            {/* Section 1: Yearly Plans with PDF Viewer */}
            <div style={{ marginBottom: "50px" }}>
              <h2 style={{ color: "#00FFD4", marginBottom: "20px", fontSize: "1.8rem" }}>📅 Yearly Plans</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px", marginBottom: "30px" }}>
                {yearlyPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedYearlyPlan(selectedYearlyPlan?.id === plan.id ? null : plan)}
                    style={{
                      background: selectedYearlyPlan?.id === plan.id ? "linear-gradient(135deg, rgba(0, 255, 212, 0.3), rgba(0, 153, 255, 0.3))" : "rgba(0, 255, 212, 0.1)",
                      border: selectedYearlyPlan?.id === plan.id ? "2px solid #00FFD4" : "1px solid rgba(0, 255, 212, 0.3)",
                      padding: "20px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedYearlyPlan?.id !== plan.id) {
                        e.currentTarget.style.background = "rgba(0, 255, 212, 0.15)";
                        e.currentTarget.style.transform = "translateY(-5px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedYearlyPlan?.id !== plan.id) {
                        e.currentTarget.style.background = "rgba(0, 255, 212, 0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    <h3 style={{ color: "#00FFD4", margin: "0 0 10px 0" }}>Year {plan.year}</h3>
                    <p style={{ color: "rgba(255, 255, 255, 0.7)", margin: "5px 0", fontSize: "0.9rem" }}>{plan.title}</p>
                    <p style={{ color: "rgba(255, 255, 255, 0.5)", margin: "5px 0", fontSize: "0.8rem" }}>Uploaded: {plan.uploadDate}</p>
                  </button>
                ))}
              </div>

              {/* PDF Viewer Section */}
              {selectedYearlyPlan && (
                <div style={{
                  background: "rgba(0, 255, 212, 0.08)",
                  border: "2px solid rgba(0, 255, 212, 0.3)",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "30px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3 style={{ color: "#00FFD4", margin: 0 }}>📄 {selectedYearlyPlan.title}</h3>
                    <button
                      onClick={() => setSelectedYearlyPlan(null)}
                      style={{
                        background: "rgba(255, 50, 100, 0.2)",
                        color: "#FF6B9D",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ✕ Close
                    </button>
                  </div>
                  
                  <iframe
                    src={selectedYearlyPlan.pdfUrl}
                    width="100%"
                    height="600px"
                    style={{ borderRadius: "8px", marginBottom: "15px", border: "1px solid rgba(0, 255, 212, 0.2)" }}
                  />
                  
                  <a
                    href={selectedYearlyPlan.pdfUrl}
                    download={`Bluefins_${selectedYearlyPlan.year}_Plan.pdf`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                      color: "#000",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    📥 Download PDF
                  </a>
                </div>
              )}
            </div>

            {/* Section 2: Learning Levels */}
            <div style={{ marginBottom: "50px" }}>
              <h2 style={{ color: "#00FFD4", marginBottom: "20px", fontSize: "1.8rem" }}>🎓 Learning Levels</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                {learningLevels.map((level) => (
                  <div
                    key={level.id}
                    style={{
                      background: `rgba(${hexToRgb(level.color)}, 0.1)`,
                      border: `2px solid ${level.color}`,
                      borderRadius: "12px",
                      padding: "20px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `rgba(${hexToRgb(level.color)}, 0.15)`;
                      e.currentTarget.style.transform = "translateY(-8px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `rgba(${hexToRgb(level.color)}, 0.1)`;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <h3 style={{ color: level.color, margin: "0 0 10px 0", fontSize: "1.3rem" }}>
                      {level.name}
                    </h3>
                    <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "10px 0", lineHeight: "1.6" }}>
                      {level.description}
                    </p>
                    <div style={{ marginTop: "15px", borderTop: `1px solid ${level.color}`, paddingTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.9rem" }}>
                      <div style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        <span style={{ color: level.color, fontWeight: 700 }}>Duration:</span>
                        <br />
                        {level.duration}
                      </div>
                      <div style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        <span style={{ color: level.color, fontWeight: 700 }}>Status:</span>
                        <br />
                        {level.id <= 3 ? "✅ Active" : "⭐ Premium"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Weekly Lesson Plans */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#00FFD4", margin: 0, fontSize: "1.8rem" }}>📚 Weekly Lesson Plans</h2>
                <button
                  onClick={() => setShowLessonForm(!showLessonForm)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                    color: "#000",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <FaPlusCircle /> Add Plan
                </button>
              </div>

              {showLessonForm && (
                <div style={{
                  background: "rgba(0, 255, 212, 0.1)",
                  border: "1px solid rgba(0, 255, 212, 0.3)",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}>
                  <input
                    type="text"
                    placeholder="Lesson Title"
                    value={newLessonPlan.title}
                    onChange={(e) => setNewLessonPlan({ ...newLessonPlan, title: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                  />
                  <input
                    type="date"
                    value={newLessonPlan.date}
                    onChange={(e) => setNewLessonPlan({ ...newLessonPlan, date: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                  />
                  <input
                    type="text"
                    placeholder="Coach Name"
                    value={newLessonPlan.coach}
                    onChange={(e) => setNewLessonPlan({ ...newLessonPlan, coach: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                  />
                  <select
                    value={newLessonPlan.level}
                    onChange={(e) => setNewLessonPlan({ ...newLessonPlan, level: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Professional</option>
                  </select>
                  <button
                    onClick={addLessonPlan}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                      color: "#000",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Add Lesson Plan
                  </button>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
                {lessonPlans.map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      background: "rgba(0, 255, 212, 0.08)",
                      border: "1px solid rgba(0, 255, 212, 0.3)",
                      padding: "20px",
                      borderRadius: "12px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0, 255, 212, 0.15)";
                      e.currentTarget.style.transform = "translateY(-5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(0, 255, 212, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                      <div>
                        <h3 style={{ color: "#00FFD4", margin: "0 0 5px 0", fontSize: "1.1rem" }}>{plan.title}</h3>
                        <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "5px 0", fontSize: "0.9rem" }}>Coach: {plan.coach}</p>
                      </div>
                      <button
                        onClick={() => deleteLessonPlan(plan.id)}
                        style={{
                          background: "rgba(255, 50, 100, 0.2)",
                          color: "#FF6B9D",
                          border: "none",
                          padding: "8px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>
                        <span style={{ background: "rgba(0, 255, 212, 0.2)", color: "#00FFD4", padding: "4px 8px", borderRadius: "4px", marginRight: "10px" }}>{plan.level}</span>
                        <span>{plan.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === "feedback" && (
          <div>
            <h2 style={{ color: "#00FFD4", marginBottom: "30px", fontSize: "1.8rem" }}>Members Feedback</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
              {feedback.map((fb) => (
                <div
                  key={fb.id}
                  style={{
                    background: "rgba(255, 107, 107, 0.08)",
                    border: "1px solid rgba(255, 107, 107, 0.3)",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 107, 107, 0.15)";
                    e.currentTarget.style.transform = "translateY(-5px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 107, 107, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                    <div>
                      <h3 style={{ color: "#FF6B9D", margin: "0 0 5px 0", fontSize: "1.1rem" }}>{fb.name}</h3>
                      <p style={{ color: "rgba(255, 255, 255, 0.5)", margin: "5px 0", fontSize: "0.85rem" }}>{fb.email}</p>
                    </div>
                    <button
                      onClick={() => deleteFeedback(fb.id)}
                      style={{
                        background: "rgba(255, 50, 100, 0.2)",
                        color: "#FF6B9D",
                        border: "none",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <p style={{ color: "rgba(255, 255, 255, 0.8)", marginBottom: "15px", lineHeight: "1.5" }}>{fb.message}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: "#FFD700", fontSize: "1.1rem" }}>
                      {"⭐".repeat(fb.rating)}
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>{fb.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === "meetings" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ color: "#00FFD4", margin: 0, fontSize: "1.8rem" }}>Meetings & Events</h2>
              <button
                onClick={() => setShowMeetingForm(!showMeetingForm)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                  color: "#000",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <FaPlusCircle /> Schedule Meeting
              </button>
            </div>

            {showMeetingForm && (
              <div style={{
                background: "rgba(0, 255, 212, 0.1)",
                border: "1px solid rgba(0, 255, 212, 0.3)",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}>
                <input
                  type="text"
                  placeholder="Meeting Title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                  />
                  <input
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Attendees (e.g., All Coaches, 10 Parents)"
                  value={newMeeting.attendees}
                  onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                />
                <button
                  onClick={addMeeting}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Schedule Meeting
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  style={{
                    background: "rgba(100, 150, 255, 0.08)",
                    border: "1px solid rgba(100, 150, 255, 0.3)",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(100, 150, 255, 0.15)";
                    e.currentTarget.style.transform = "translateY(-5px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(100, 150, 255, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                    <div>
                      <h3 style={{ color: "#6496FF", margin: "0 0 5px 0", fontSize: "1.1rem" }}>{meeting.title}</h3>
                      <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "5px 0", fontSize: "0.9rem" }}>Attendees: {meeting.attendees}</p>
                    </div>
                    <button
                      onClick={() => deleteMeeting(meeting.id)}
                      style={{
                        background: "rgba(255, 50, 100, 0.2)",
                        color: "#FF6B9D",
                        border: "none",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>
                    <FaCalendar style={{ marginRight: "5px" }} /> {meeting.date} at {meeting.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORKSHEET TAB */}
        {activeTab === "worksheet" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ color: "#00FFD4", margin: 0, fontSize: "1.8rem" }}>Weekly Worksheets</h2>
              <button
                onClick={() => setShowWorksheetForm(!showWorksheetForm)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                  color: "#000",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <FaPlusCircle /> Add Worksheet
              </button>
            </div>

            {showWorksheetForm && (
              <div style={{
                background: "rgba(0, 255, 212, 0.1)",
                border: "1px solid rgba(0, 255, 212, 0.3)",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}>
                <input
                  type="text"
                  placeholder="Week (e.g., Week 1)"
                  value={newWorksheet.week}
                  onChange={(e) => setNewWorksheet({ ...newWorksheet, week: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                />
                <input
                  type="text"
                  placeholder="Worksheet Title"
                  value={newWorksheet.title}
                  onChange={(e) => setNewWorksheet({ ...newWorksheet, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                />
                <input
                  type="number"
                  placeholder="Number of Tasks"
                  value={newWorksheet.tasks}
                  onChange={(e) => setNewWorksheet({ ...newWorksheet, tasks: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                />
                <button
                  onClick={addWorksheet}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Add Worksheet
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
              {worksheets.map((ws) => (
                <div
                  key={ws.id}
                  style={{
                    background: "rgba(150, 100, 255, 0.08)",
                    border: "1px solid rgba(150, 100, 255, 0.3)",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(150, 100, 255, 0.15)";
                    e.currentTarget.style.transform = "translateY(-5px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(150, 100, 255, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                    <div>
                      <h3 style={{ color: "#9664FF", margin: "0 0 5px 0", fontSize: "1.1rem" }}>{ws.title}</h3>
                      <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "5px 0", fontSize: "0.9rem" }}>{ws.week}</p>
                    </div>
                    <button
                      onClick={() => deleteWorksheet(ws.id)}
                      style={{
                        background: "rgba(255, 50, 100, 0.2)",
                        color: "#FF6B9D",
                        border: "none",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.6)" }}>
                      <span>Progress</span>
                      <span>{ws.completed}/{ws.tasks}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", height: "8px", overflow: "hidden" }}>
                      <div style={{ background: "linear-gradient(90deg, #9664FF, #00FFD4)", height: "100%", width: `${(ws.completed/ws.tasks)*100}%`, transition: "all 0.3s ease" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>{ws.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === "posts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <h2 style={{ color: "#00FFD4", margin: 0, fontSize: "1.8rem" }}>Posts & Updates</h2>
              <button
                onClick={() => setShowPostForm(!showPostForm)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                  color: "#000",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <FaPlusCircle /> Create Post
              </button>
            </div>

            {showPostForm && (
              <div style={{
                background: "rgba(0, 255, 212, 0.1)",
                border: "1px solid rgba(0, 255, 212, 0.3)",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}>
                <input
                  type="text"
                  placeholder="Post Title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                />
                <textarea
                  placeholder="Post Content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(0, 255, 212, 0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", minHeight: "120px", fontFamily: "Poppins, system-ui" }}
                />
                <button
                  onClick={addPost}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                    color: "#000",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Publish Post
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
              {posts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: "rgba(255, 182, 193, 0.08)",
                    border: "1px solid rgba(255, 182, 193, 0.3)",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 182, 193, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 182, 193, 0.08)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: "#FFB6C1", margin: "0 0 5px 0", fontSize: "1.2rem" }}>{post.title}</h3>
                      <div style={{ display: "flex", gap: "15px", fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>
                        <span>By {post.author}</span>
                        <span>{post.date}</span>
                        <span><FaEye size={12} style={{ marginRight: "4px" }} /> {post.views} views</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePost(post.id)}
                      style={{
                        background: "rgba(255, 50, 100, 0.2)",
                        color: "#FF6B9D",
                        border: "none",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <p style={{ color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.6", marginBottom: "0" }}>{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OwnerPanel;
