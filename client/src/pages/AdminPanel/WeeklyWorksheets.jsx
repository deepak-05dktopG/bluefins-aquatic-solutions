import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/adminPanel/AdminNavbar";
import { FaTrash, FaPlusCircle, FaEdit, FaCheckCircle } from "react-icons/fa";

const WeeklyWorksheets = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const [worksheets, setWorksheets] = useState([
    { id: 1, week: "Week 1", title: "Breathing Techniques", tasks: 5, completed: 3, date: "2025-11-13", level: "Beginner", coach: "Mr. Vijeesh" },
    { id: 2, week: "Week 2", title: "Flip Turn Practice", tasks: 4, completed: 2, date: "2025-11-20", level: "Intermediate", coach: "Mr. Manikandan" },
    { id: 3, week: "Week 3", title: "Freestyle Speed Training", tasks: 6, completed: 6, date: "2025-11-27", level: "Advanced", coach: "Mr. Vijeesh" },
    { id: 4, week: "Week 4", title: "Backstroke Fundamentals", tasks: 5, completed: 1, date: "2025-12-04", level: "Beginner", coach: "Mr. Manikandan" },
  ]);

  const [showWorksheetForm, setShowWorksheetForm] = useState(false);
  const [newWorksheet, setNewWorksheet] = useState({
    week: "",
    title: "",
    tasks: 5,
    level: "Beginner",
    coach: "",
  });

  const addWorksheet = () => {
    if (newWorksheet.week && newWorksheet.title && newWorksheet.coach) {
      setWorksheets([
        ...worksheets,
        {
          ...newWorksheet,
          id: Date.now(),
          completed: 0,
          date: new Date().toISOString().split("T")[0],
        },
      ]);
      setNewWorksheet({ week: "", title: "", tasks: 5, level: "Beginner", coach: "" });
      setShowWorksheetForm(false);
    }
  };

  const deleteWorksheet = (id) => {
    if (window.confirm("Are you sure you want to delete this worksheet?")) {
      setWorksheets(worksheets.filter((ws) => ws.id !== id));
    }
  };

  const updateProgress = (id, completed) => {
    setWorksheets(
      worksheets.map((ws) => (ws.id === id ? { ...ws, completed: Math.min(completed, ws.tasks) } : ws))
    );
  };

  // Statistics
  const totalWorksheets = worksheets.length;
  const completedWorksheets = worksheets.filter((ws) => ws.completed === ws.tasks).length;
  const inProgress = worksheets.filter((ws) => ws.completed > 0 && ws.completed < ws.tasks).length;
  const notStarted = worksheets.filter((ws) => ws.completed === 0).length;

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
          <h1 style={{ color: "#9664FF", fontSize: "2.2rem", fontWeight: 900, marginBottom: "10px" }}>
            📋 Weekly Worksheets
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "1rem" }}>
            Track student progress and weekly assignments
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
              background: "rgba(150, 100, 255, 0.1)",
              border: "1px solid #9664FF",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Total Worksheets
            </p>
            <h2 style={{ color: "#9664FF", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {totalWorksheets}
            </h2>
          </div>
          <div
            style={{
              background: "rgba(0, 255, 100, 0.1)",
              border: "1px solid #00FF64",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Completed
            </p>
            <h2 style={{ color: "#00FF64", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {completedWorksheets}
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
              In Progress
            </p>
            <h2 style={{ color: "#FFD700", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {inProgress}
            </h2>
          </div>
          <div
            style={{
              background: "rgba(255, 107, 157, 0.1)",
              border: "1px solid #FF6B9D",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Not Started
            </p>
            <h2 style={{ color: "#FF6B9D", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {notStarted}
            </h2>
          </div>
        </div>

        {/* Add Worksheet Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "25px" }}>
          <button
            onClick={() => setShowWorksheetForm(!showWorksheetForm)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #9664FF 0%, #6B46C1 100%)",
              color: "#fff",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <FaPlusCircle /> Add Worksheet
          </button>
        </div>

        {/* Add Worksheet Form */}
        {showWorksheetForm && (
          <div
            style={{
              background: "rgba(150, 100, 255, 0.1)",
              border: "1px solid rgba(150, 100, 255, 0.3)",
              padding: "25px",
              borderRadius: "12px",
              marginBottom: "30px",
            }}
          >
            <h3 style={{ color: "#9664FF", marginBottom: "20px" }}>Create New Worksheet</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="Week (e.g., Week 5)"
                value={newWorksheet.week}
                onChange={(e) => setNewWorksheet({ ...newWorksheet, week: e.target.value })}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(150, 100, 255, 0.3)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "Poppins, system-ui",
                }}
              />
              <input
                type="text"
                placeholder="Worksheet Title"
                value={newWorksheet.title}
                onChange={(e) => setNewWorksheet({ ...newWorksheet, title: e.target.value })}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(150, 100, 255, 0.3)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "Poppins, system-ui",
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <input
                type="number"
                placeholder="Number of Tasks"
                min="1"
                value={newWorksheet.tasks}
                onChange={(e) => setNewWorksheet({ ...newWorksheet, tasks: parseInt(e.target.value) || 1 })}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(150, 100, 255, 0.3)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "Poppins, system-ui",
                }}
              />
              <select
                value={newWorksheet.level}
                onChange={(e) => setNewWorksheet({ ...newWorksheet, level: e.target.value })}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(150, 100, 255, 0.3)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "Poppins, system-ui",
                  cursor: "pointer",
                }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Professional">Professional</option>
              </select>
              <input
                type="text"
                placeholder="Coach Name"
                value={newWorksheet.coach}
                onChange={(e) => setNewWorksheet({ ...newWorksheet, coach: e.target.value })}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(150, 100, 255, 0.3)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "Poppins, system-ui",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={addWorksheet}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "linear-gradient(135deg, #9664FF 0%, #6B46C1 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Create Worksheet
              </button>
              <button
                onClick={() => setShowWorksheetForm(false)}
                style={{
                  padding: "12px 20px",
                  background: "rgba(255, 50, 100, 0.2)",
                  color: "#FF6B9D",
                  border: "1px solid rgba(255, 50, 100, 0.4)",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Worksheets Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "25px" }}>
          {worksheets.map((ws) => {
            const progress = (ws.completed / ws.tasks) * 100;
            const statusColor =
              ws.completed === ws.tasks ? "#00FF64" : ws.completed > 0 ? "#FFD700" : "#FF6B9D";

            return (
              <div
                key={ws.id}
                style={{
                  background: "rgba(150, 100, 255, 0.08)",
                  border: `1px solid ${statusColor}`,
                  borderRadius: "12px",
                  padding: "25px",
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
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h3 style={{ color: "#9664FF", margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                        {ws.title}
                      </h3>
                      {ws.completed === ws.tasks && <FaCheckCircle style={{ color: "#00FF64" }} />}
                    </div>
                    <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "5px 0", fontSize: "0.9rem" }}>
                      {ws.week} • {ws.level}
                    </p>
                    <p style={{ color: "rgba(255, 255, 255, 0.5)", margin: "5px 0", fontSize: "0.85rem" }}>
                      Coach: {ws.coach}
                    </p>
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

                {/* Progress Section */}
                <div style={{ marginBottom: "15px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    <span>Progress</span>
                    <span style={{ fontWeight: 700, color: statusColor }}>
                      {ws.completed}/{ws.tasks} tasks
                    </span>
                  </div>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      height: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background: `linear-gradient(90deg, ${statusColor}, ${statusColor}dd)`,
                        height: "100%",
                        width: `${progress}%`,
                        transition: "all 0.5s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Update Progress */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" }}>
                  <label style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.9rem", fontWeight: 600 }}>
                    Update:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={ws.tasks}
                    value={ws.completed}
                    onChange={(e) => updateProgress(ws.id, parseInt(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: "#9664FF",
                    }}
                  />
                  <span style={{ color: "#9664FF", fontWeight: 700, fontSize: "0.9rem" }}>
                    {Math.round(progress)}%
                  </span>
                </div>

                <div style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>
                  📅 {ws.date}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyWorksheets;
