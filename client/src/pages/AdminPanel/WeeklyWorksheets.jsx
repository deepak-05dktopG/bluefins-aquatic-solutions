import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/adminPanel/AdminNavbar.jsx";
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

    </div>
  );
};

export default WeeklyWorksheets;
