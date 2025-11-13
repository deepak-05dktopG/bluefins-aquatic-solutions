import React, { useEffect, useState } from "react"
import AOS from "aos"
import "aos/dist/aos.css"
import { FaBolt, FaRibbon, FaHeadset, FaTrophy, FaFire, FaStar, FaAward } from "react-icons/fa"
import { NavLink } from "react-router-dom"
import Navbar from "../components/Navbar"
const Team = () => {
  useEffect(() => {
    AOS.init({ 
      duration: 1000, 
      easing: "ease-in-out-cubic",
      once: false,
      offset: 80,
      disable: false
    });
    AOS.refresh();
  }, [])

  const [hoveredTeam, setHoveredTeam] = useState(null)
  const [activeCategory, setActiveCategory] = useState("leadership")

  const teamCategories = {
    leadership: {
      title: "Leadership",
      icon: "👔",
      color: "#FF6B6B",
      bgColor: "#FFE5E5",
      members: [
        { name: "Mr. V. Vijeesh", position: "CEO & Chairman", experience: "FINA Masters", specialization: "Strategic Leadership", image: "👨‍💼", color: "#FF6B6B", certification: "NIS, ASCA Level 3" },
        { name: "Mr. Manikandan", position: "Director", experience: "15+ years", specialization: "Academy Management", image: "👨‍💼", color: "#FF6B6B", certification: "NIS, ASCA Level 3" }
      ]
    },
    coaching: {
      title: "Coaching Team",
      icon: "🏊‍♂️",
      color: "#667eea",
      bgColor: "#E8E8FF",
      members: [
        { name: "Mr. Lalith Kumar", position: "Head Coach", experience: "15+ years", specialization: "Competitive Training", image: "👨‍🏫", color: "#667eea", certification: "NIS, ASCA Certified" },
        { name: "Mr. Suresh", position: "Coach", experience: "15+ years", specialization: "Technical Excellence", image: "👨‍🏫", color: "#667eea", certification: "NIS, ASCA Certified" }
      ]
    },
    safety: {
      title: "Safety & Support",
      icon: "🚨",
      color: "#FF9FF3",
      bgColor: "#FFE5F8",
      members: [
        { name: "Mr. Udaya Kumar", position: "Senior Lifeguard", experience: "10+ years", specialization: "Water Safety", image: "🏊", color: "#FF9FF3", certification: "Level 2 Certified" }
      ]
    },
    administration: {
      title: "Administration & Promotion",
      icon: "📊",
      color: "#54A0FF",
      bgColor: "#E5F3FF",
      members: [
        { name: "Ms. Priya", position: "Reception & Promotion", experience: "7+ years", specialization: "Communications", image: "👩‍💼", color: "#54A0FF", certification: "M.Sc. Computer Science" }
      ]
    }
  }

  return (
    <div style={{ fontFamily: "Poppins, system-ui, -apple-system, sans-serif", overflowX: "hidden", background: "#fff" }}>
      <style>{`
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes floatUp { 0% { transform: translateY(0); opacity: 0.7; } 50% { transform: translateY(-15px); opacity: 1; } 100% { transform: translateY(0); opacity: 0.7; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        .team-card { border-radius: 20px; overflow: hidden; background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85)); box-shadow: 0 10px 40px rgba(0,0,0,0.15); transition: all 0.45s ease; cursor: pointer; position: relative; border: 2px solid transparent; padding: 30px; }
        .team-card:hover { transform: translateY(-15px) scale(1.03); box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
        .team-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, var(--color), var(--color-light)); }
      `}</style>
      <Navbar />

      <section style={{ position: "relative", color: "white", padding: "100px 0 40px", background: "linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4, #667eea)", backgroundSize: "200% 200%", animation: "gradientShift 12s ease infinite", minHeight: "auto", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)", borderRadius: "50%", top: "20%", right: "-10%" }} />
        <div style={{ position: "absolute", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(78,205,196,0.15) 0%, transparent 70%)", borderRadius: "50%", bottom: "10%", left: "-5%" }} />
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 2, width: "100%" }}>
          <div style={{ textAlign: "center" }} data-aos="fade-up" data-aos-delay="100">
            <h1 style={{ fontSize: "4rem", fontWeight: "900", lineHeight: 1.05, marginBottom: "1rem", color: "#fff", textShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>Meet Our Expert <span style={{ color: "#FFE66D" }}>Team</span></h1>
            <p style={{ fontSize: "1.2rem", opacity: 0.95, marginBottom: "2rem", lineHeight: 1.9, maxWidth: "700px", margin: "0 auto" }}>Our team of 25+ certified coaches brings decades of combined experience in competitive swimming, coaching, and institutional management.</p>
            <NavLink to="/contact" style={{ textDecoration: "none" }}><button style={{ background: "#fff", color: "#FF6B6B", border: "none", padding: "14px 32px", borderRadius: "50px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 8px 25px rgba(255,255,255,0.4)" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px) scale(1.05)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0) scale(1)"}>Connect With Us</button></NavLink>
          </div>
        </div>
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ position: "absolute", bottom: -2, left: 0, width: "100%" }}><defs><linearGradient id="teamHeroWave" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{ stopColor: "rgba(102,126,234,0.2)", stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: "#f5f3ff", stopOpacity: 1 }} /></linearGradient></defs><path fill="url(#teamHeroWave)" d="M0,100 Q180,50 360,100 T720,100 T1080,100 T1440,100 L1440,200 L0,200 Z" /></svg>
      </section>

      <section style={{ background: "linear-gradient(135deg, #FFE66D, #FF9FF3, #667eea, #54A0FF)", backgroundSize: "200% 200%", animation: "gradientShift 15s ease infinite", position: "relative", padding: "80px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "30px" }}>
            {[{ icon: "👥", number: "25+", label: "Expert Coaches", color: "#FF6B6B" }, { icon: "🏊", number: "65+", label: "National Swimmers", color: "#FFD93D" }, { icon: "🏆", number: "45+", label: "National Medals", color: "#4ECDC4" }, { icon: "🏛️", number: "50+", label: "Institutions", color: "#667eea" }].map((a, i) => <div key={i} data-aos="zoom-in" data-aos-delay={i * 100} style={{ background: "#fff", borderRadius: "20px", padding: "30px 20px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", transition: "all 0.45s ease", cursor: "pointer", border: `3px solid ${a.color}`, textAlign: "center" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-15px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.15)"; }}><div style={{ fontSize: "3.5rem", marginBottom: "1rem", animation: "pulse 2.5s ease-in-out infinite" }}>{a.icon}</div><div style={{ fontSize: "2.8rem", fontWeight: "800", color: a.color, marginBottom: "0.5rem" }}>{a.number}</div><p style={{ color: a.color, fontWeight: "700", margin: "0", fontSize: "1rem" }}>{a.label}</p></div>)}
          </div>
        </div>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ position: "absolute", bottom: -2, left: 0, width: "100%" }}><path fill="#f5f3ff" d="M0,40 Q360,80 720,40 T1440,40 L1440,120 L0,120 Z" /></svg>
      </section>

      <section style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #fff5f0 50%, #f0f9ff 100%)", position: "relative", padding: "100px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "60px" }} data-aos="fade-up">
            <h2 style={{ fontSize: "2.8rem", marginBottom: "1rem", color: "#001f3f", fontWeight: "bold" }}>Our Experienced <span style={{ background: "linear-gradient(90deg, #FF6B6B, #667eea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Professionals</span></h2>
            <p style={{ fontSize: "1.1rem", color: "#555", maxWidth: "700px", margin: "0 auto", fontWeight: "500" }}>Certified experts dedicated to your success</p>
          </div>

          {/* Category Filter Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "15px", marginBottom: "60px" }} data-aos="fade-up" data-aos-delay="100">
            {Object.entries(teamCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  padding: "12px 28px",
                  borderRadius: "50px",
                  border: "2px solid",
                  background: activeCategory === key ? category.color : "#fff",
                  color: activeCategory === key ? "#fff" : category.color,
                  borderColor: category.color,
                  fontWeight: "700",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: activeCategory === key ? `0 8px 25px ${category.color}40` : "0 4px 15px rgba(0,0,0,0.1)"
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== key) {
                    e.currentTarget.style.background = category.bgColor;
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== key) {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>

          {/* Team Members by Category */}
          <div data-aos="fade-up" data-aos-delay="200">
            <div style={{ background: teamCategories[activeCategory].bgColor, borderRadius: "30px", padding: "50px 40px", border: `3px solid ${teamCategories[activeCategory].color}40` }}>
              <h3 style={{ textAlign: "center", fontSize: "2rem", color: teamCategories[activeCategory].color, fontWeight: "bold", marginBottom: "50px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                <span style={{ fontSize: "2.5rem" }}>{teamCategories[activeCategory].icon}</span>
                {teamCategories[activeCategory].title}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
                {teamCategories[activeCategory].members.map((m, i) => (
                  <div
                    key={i}
                    data-aos="zoom-in"
                    data-aos-delay={i * 100}
                    className="team-card"
                    style={{
                      "--color": m.color,
                      "--color-light": m.color + "dd",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
                      border: `3px solid ${m.color}30`,
                      borderLeft: `6px solid ${m.color}`
                    }}
                    onMouseEnter={() => setHoveredTeam(i)}
                    onMouseLeave={() => setHoveredTeam(null)}
                  >
                    {/* Avatar Background Circle */}
                    <div style={{ position: "relative", marginBottom: "1.5rem", textAlign: "center" }}>
                      <div style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${m.color}20, ${m.color}10)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        fontSize: "4rem",
                        animation: "pulse 2.5s ease-in-out infinite",
                        border: `3px solid ${m.color}40`
                      }}>
                        {m.image}
                      </div>
                    </div>

                    {/* Name */}
                    <h4 style={{
                      color: m.color,
                      fontWeight: "800",
                      marginBottom: "0.5rem",
                      textAlign: "center",
                      fontSize: "1.4rem",
                      letterSpacing: "-0.5px"
                    }}>
                      {m.name}
                    </h4>

                    {/* Position */}
                    <p style={{
                      color: m.color,
                      fontWeight: "700",
                      textAlign: "center",
                      marginBottom: "1.5rem",
                      fontSize: "1rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px"
                    }}>
                      {m.position}
                    </p>

                    {/* Details */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      textAlign: "center",
                      borderTop: `2px solid ${m.color}20`,
                      paddingTop: "1.5rem"
                    }}>
                      <div style={{
                        color: "#555",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}>
                        <span style={{ fontSize: "1.2rem", color: m.color }}>⚡</span>
                        {m.experience}
                      </div>

                      <div style={{
                        color: "#555",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}>
                        <span style={{ fontSize: "1.2rem", color: m.color }}>🎯</span>
                        {m.specialization}
                      </div>

                      <div style={{
                        color: m.color,
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        background: `${m.color}15`,
                        padding: "10px 15px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}>
                        <span style={{ fontSize: "1.1rem" }}>🏆</span>
                        {m.certification}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c)", backgroundSize: "200% 200%", animation: "gradientShift 15s ease infinite", color: "white", position: "relative", padding: "100px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }} data-aos="fade-up">
            <h2 style={{ fontSize: "2.8rem", marginBottom: "1rem", color: "#fff", fontWeight: "bold" }}>Why Our Team Stands Out</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
            {[{ title: "Certified Excellence", desc: "International certifications and continuous training" }, { title: "Proven Success", desc: "Track record of developing national-level swimmers" }, { title: "Passion & Dedication", desc: "Committed to every student's personal growth" }, { title: "Modern Methods", desc: "Latest coaching techniques and training methodologies" }, { title: "Safety First", desc: "Professional lifeguards and safety protocols" }, { title: "Personalized Attention", desc: "Small batch training for individual development" }].map((r, i) => <div key={i} data-aos="fade-up" data-aos-delay={i * 100} style={{ background: "rgba(255,255,255,0.15)", padding: "30px", borderRadius: "18px", border: "2px solid rgba(255,255,255,0.3)", transition: "all 0.4s ease", cursor: "pointer", backdropFilter: "blur(10px)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)"; e.currentTarget.style.transform = "translateY(-10px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}><h5 style={{ color: "#FFE66D", fontWeight: "700", marginBottom: "0.8rem", fontSize: "1.1rem" }}> {r.title}</h5><p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", lineHeight: 1.6, margin: "0", fontWeight: "500" }}>{r.desc}</p></div>)}
          </div>
        </div>
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ position: "absolute", bottom: -2, left: 0, width: "100%" }}><path fill="#fff5f0" d="M0,100 Q360,50 720,100 T1440,100 L1440,200 L0,200 Z" /></svg>
      </section>

      <section style={{ background: "linear-gradient(180deg, #fff5f0 0%, #f0f9ff 100%)", position: "relative", padding: "100px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", textAlign: "center" }} data-aos="zoom-in">
          <h2 style={{ fontSize: "2.5rem", color: "#001f3f", fontWeight: "bold", marginBottom: "1.5rem" }}>Join Our Community Today</h2>
          <p style={{ fontSize: "1.05rem", marginBottom: "2.5rem", maxWidth: "700px", margin: "0 auto 2.5rem", fontWeight: "500", lineHeight: 1.8, color: "#555" }}>Experience world-class coaching and be part of our growing family.</p>
          <NavLink to="/contact" style={{ textDecoration: "none" }}><button style={{ background: "linear-gradient(135deg, #FF6B6B, #FFE66D)", color: "#fff", border: "none", padding: "14px 32px", borderRadius: "50px", fontWeight: "700", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 8px 25px rgba(255,107,107,0.3)", fontSize: "0.95rem" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px) scale(1.05)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0) scale(1)"}> Get Started Now</button></NavLink>
        </div>
      </section>
    </div>
  )
}

export default Team;

