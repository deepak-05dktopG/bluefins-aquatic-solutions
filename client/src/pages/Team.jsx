import React, { useEffect, useState } from "react"
import AOS from "aos"
import "aos/dist/aos.css"
import { Container, Row, Col } from "react-bootstrap"
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

  const teamData = {
    leadership: {
      title: "Leadership",
      color: "#FF6B6B",
      members: [
        { 
          name: "Mr. V. Vijeesh", 
          position: "CEO & Chairman", 
          image: "/assets/vijeesh.jpg", 
          color: "#FF6B6B",
          eligibilities: ["Represented India - FINA Masters World Championships(2015 & 2025)","NIS,ASCA Level 3 Certified"]
        },
        { 
          name: "Mr. Manikandan", 
          position: "Director", 
          image: "/assets/manikandan.jpg", 
          color: "#FF6B6B",
          eligibilities: ["National-Level Swimmer","NIS,ASCA Level 3 Certified"]
        },
        { 
          name: "Mr. Pramod", 
          position: "Director", 
          image: "/assets/pramod.jpg", 
          color: "#FF6B6B",
          eligibilities: ["National Gold Medalist","NIS,ASCA Certified"]
        },
        { 
          name: "Mr. Sunil", 
          position: "Director", 
          image: "/assets/sunil.jpg", 
          color: "#FF6B6B",
          eligibilities: ["State_Level Swimmer","15 years coaching & Management Experience"]
        }
      ]
    },
    coaching: {
      title: "Coaching Team",
      color: "#667eea",
      members: [
        { name: "Ms. Vijitha", position: "Head Coach", image: "/assets/vijitha.jpg", color: "#667eea", eligibilities: ["National Swimmer","NIS,ASCA Certified"] },
        { name: "Mr. Lalith Kumar", position: "Head Coach", image:"/assets/lalithkumar.jpg", color: "#667eea", eligibilities: ["National Swimmer","NIS,ASCA Certified"] },
        { name: "Mr. Sathish", position: "Head Coach", image:"/assets/sathish.jpg", color: "#667eea", eligibilities: ["National Swimmer","NIS,ASCA Certified"] },
        { name: "Mr. S. Ajayan", position: "Head Coach", image:"/assets/ajayan.jpg", color: "#667eea", eligibilities: ["National Swimmer","NIS,ASCA Certified"] },
        { name: "Mr. Vishnu Das S", position: "Coach", image:"/assets/vishnudas.jpg", color: "#667eea", eligibilities: ["National Swimmer","NIS,ASCA Certified"] },
        { name: "Mr. Lokeshwaran", position: "Coach", image:"/assets/ajeesh.jpg", color: "#667eea", eligibilities: ["National Swimmer","ASCA Certified"] },
        { name: "Mr. Ajeesh", position: "Coach", image:"/assets/lokeshwaran.jpg", color: "#667eea", eligibilities: ["National Swimmer","ASCA Certified"]},
        { name: "Mr. Kururaj", position: "Coach", image:"/assets/gururaj.jpg", color: "#667eea", eligibilities: ["National Swimmer","NIS,ASCA Certified"] },
        { name: "Mr. Naveen Kumar", position: "Coach", image:"/assets/naveenkumar.jpg", color: "#667eea", eligibilities: ["State Swimmer","ASCA Certified"] },
        { name: "Ms. Reena Augustine", position: "Coach", image:"/assets/reenaagustine.jpg", color: "#667eea", eligibilities: ["State Swimmer","ASCA Certified"]},
        { name: "Mr. Nishant", position: "Assistant Coach", image:"/assets/nishant.jpg", color: "#667eea", eligibilities: ["State Swimmer","ASCA Certified"] },
        { name: "Mr. Sreerag", position: "Assistant Coach", image:"/assets/sreerag.jpg", color: "#667eea", eligibilities: ["State Swimmer","ASCA Certified"] },
        { name: "Mr. Aneesh", position: "Assistant Coach", image:"/assets/aneesh.jpg", color: "#667eea", eligibilities: ["State Swimmer","ASCA Certified"] }
      ]
    },
    safety: {
      title: "Safety & Support",
      color: "#FF9FF3",
      members: [
        { name: "Mr. Udaya Kumar", position: "Lifeguard", image:"/assets/udayakumar.jpg", color: "#FF9FF3", eligibilities: ["Lifeguard Course - Level 2 Certified"] },
        { name: "Mr. Hariharan", position: "Lifeguard", image:"/assets/hariharan.jpg", color: "#FF9FF3", eligibilities: ["Lifeguard Course - Level 2 Certified"] }
      ]
    },
    administration: {
      title: "Administration & Promotion",
      color: "#54A0FF",
      members: [
        { name: "Ms. Elakiya", position: "Reception & Promotion", image:"/assets/ilakiya.jpg", color: "#54A0FF", eligibilities: ["M.Sc. in Computer Science"] },
        { name: "Ms. Priya", position: "Reception & Social Media Promotion", image:"/assets/priya.jpg", color: "#54A0FF", eligibilities: ["M.Sc. in Computer Science"] }
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.8; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
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

      

      <section style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #fff5f0 50%, #f0f9ff 100%)", position: "relative", padding: "80px 0", overflow: "hidden" }}>
        {/* Futuristic Background Elements */}
        <div style={{
          position: "absolute",
          top: "-50%",
          left: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(255, 107, 107, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          top: "20%",
          right: "-15%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          bottom: "-40%",
          left: "30%",
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, rgba(255, 159, 243, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
          pointerEvents: "none"
        }} />
        
        {/* Animated Grid Lines */}
        <svg style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.05,
          pointerEvents: "none"
        }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#667eea" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating Accent Elements */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "3px",
          height: "3px",
          background: "#FF6B6B",
          borderRadius: "50%",
          boxShadow: "0 0 10px #FF6B6B",
          animation: "float 6s ease-in-out infinite",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          bottom: "15%",
          right: "8%",
          width: "2px",
          height: "2px",
          background: "#667eea",
          borderRadius: "50%",
          boxShadow: "0 0 8px #667eea",
          animation: "float 8s ease-in-out infinite 1s",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          top: "50%",
          right: "5%",
          width: "2px",
          height: "2px",
          background: "#FF9FF3",
          borderRadius: "50%",
          boxShadow: "0 0 8px #FF9FF3",
          animation: "float 7s ease-in-out infinite 2s",
          pointerEvents: "none"
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
        <Container>
          {/* Header */}
          <Row className="mb-5" data-aos="fade-up">
            <Col lg={12} className="text-center">
              <h2 style={{ fontSize: "2.8rem", marginBottom: "1rem", color: "#001f3f", fontWeight: "bold" }}>Our <span style={{ background: "linear-gradient(90deg, #FF6B6B, #667eea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Expert Team</span></h2>
              <p style={{ fontSize: "1.1rem", color: "#555", maxWidth: "700px", margin: "0 auto", fontWeight: "500" }}>Certified professionals dedicated to your success</p>
            </Col>
          </Row>

          {/* Leadership Section */}
          <div className="mb-5" data-aos="fade-up">
            <h3 style={{ fontSize: "1.8rem", color: "#FF6B6B", fontWeight: "bold", marginBottom: "40px", paddingBottom: "15px", borderBottom: "3px solid #FF6B6B" }}>Leadership</h3>
            
            {/* CEO */}
            <Row className="mb-5 justify-content-center">
              <Col xs={12} sm={10} md={6} lg={4} className="d-flex justify-content-center">
                <div style={{ width: "100%", maxWidth: "250px", background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 10px 40px rgba(255,107,107,0.2)", transition: "all 0.3s ease", cursor: "pointer", border: "3px solid #FF6B6B30" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-10px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(255,107,107,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(255,107,107,0.2)"; }}>
                  <div style={{ aspectRatio: "4/5", overflow: "hidden", background: "#f0f0f0" }}>
                    <img src={teamData.leadership.members[0].image} alt={teamData.leadership.members[0].name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "15px", textAlign: "center" }}>
                    <h4 style={{ color: "#FF6B6B", fontWeight: "800", fontSize: "0.95rem", margin: "0 0 3px 0" }}>{teamData.leadership.members[0].name}</h4>
                    <p style={{ color: "#FF6B6B", fontWeight: "600", fontSize: "0.75rem", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{teamData.leadership.members[0].position}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                      {teamData.leadership.members[0].eligibilities.slice(0, 2).map((elig, idx) => (
                        <span key={idx} style={{ background: "#FF6B6B20", color: "#FF6B6B", padding: "3px 6px", borderRadius: "10px", fontSize: "0.6rem", fontWeight: "600", whiteSpace: "wrap" }}>{elig}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Directors */}
            <Row className="g-4" data-aos="fade-up">
              {teamData.leadership.members.slice(1).map((member, i) => (
                <Col xs={12} sm={6} md={4} key={i} className="d-flex justify-content-center" data-aos="zoom-in" data-aos-delay={i * 50}>
                  <div style={{ width: "100%", maxWidth: "250px", background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 10px 40px rgba(255,107,107,0.2)", transition: "all 0.3s ease", cursor: "pointer", border: "3px solid #FF6B6B30" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-10px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(255,107,107,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(255,107,107,0.2)"; }}>
                    <div style={{ aspectRatio: "4/5", overflow: "hidden", background: "#f0f0f0" }}>
                      <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "15px", textAlign: "center" }}>
                      <h4 style={{ color: "#FF6B6B", fontWeight: "800", fontSize: "0.95rem", margin: "0 0 3px 0" }}>{member.name}</h4>
                      <p style={{ color: "#FF6B6B", fontWeight: "600", fontSize: "0.75rem", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{member.position}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                        {member.eligibilities.slice(0, 2).map((elig, idx) => (
                          <span key={idx} style={{ background: "#FF6B6B20", color: "#FF6B6B", padding: "3px 6px", borderRadius: "10px", fontSize: "0.6rem", fontWeight: "600", whiteSpace: "nowrap" }}>{elig}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* Coaching Team Section */}
          <div className="mb-5" data-aos="fade-up">
            <h3 style={{ fontSize: "1.8rem", color: "#667eea", fontWeight: "bold", marginBottom: "40px", paddingBottom: "15px", borderBottom: "3px solid #667eea" }}>Coaching Team</h3>
            <Row className="g-4">
              {teamData.coaching.members.map((member, i) => (
                <Col xs={12} sm={6} md={4} lg={3} key={i} className="d-flex justify-content-center" data-aos="zoom-in" data-aos-delay={i * 30}>
                  <div style={{ width: "100%", maxWidth: "250px", background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 10px 40px rgba(102,126,234,0.2)", transition: "all 0.3s ease", cursor: "pointer", border: "3px solid #667eea30" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-10px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(102,126,234,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(102,126,234,0.2)"; }}>
                    <div style={{ aspectRatio: "4/5", overflow: "hidden", background: "#f0f0f0" }}>
                      <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "15px", textAlign: "center" }}>
                      <h4 style={{ color: "#667eea", fontWeight: "800", fontSize: "0.9rem", margin: "0 0 3px 0" }}>{member.name}</h4>
                      <p style={{ color: "#667eea", fontWeight: "600", fontSize: "0.7rem", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.3px" }}>{member.position}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", justifyContent: "center" }}>
                        {member.eligibilities.slice(0, 2).map((elig, idx) => (
                          <span key={idx} style={{ background: "#667eea20", color: "#667eea", padding: "2px 5px", borderRadius: "8px", fontSize: "0.6rem", fontWeight: "600", whiteSpace: "nowrap" }}>{elig}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* Safety & Support Section */}
          <div className="mb-5" data-aos="fade-up">
            <h3 style={{ fontSize: "1.8rem", color: "#FF9FF3", fontWeight: "bold", marginBottom: "40px", paddingBottom: "15px", borderBottom: "3px solid #FF9FF3" }}>Safety & Support</h3>
            <Row className="g-4 justify-content-center">
              {teamData.safety.members.map((member, i) => (
                <Col xs={12} sm={6} md={4} lg={4} key={i} className="d-flex justify-content-center" data-aos="zoom-in" data-aos-delay={i * 50}>
                  <div style={{ width: "100%", maxWidth: "250px", background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 10px 40px rgba(255,159,243,0.2)", transition: "all 0.3s ease", cursor: "pointer", border: "3px solid #FF9FF330" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-10px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(255,159,243,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(255,159,243,0.2)"; }}>
                    <div style={{ aspectRatio: "4/5", overflow: "hidden", background: "#f0f0f0" }}>
                      <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "15px", textAlign: "center" }}>
                      <h4 style={{ color: "#FF9FF3", fontWeight: "800", fontSize: "0.95rem", margin: "0 0 3px 0" }}>{member.name}</h4>
                      <p style={{ color: "#FF9FF3", fontWeight: "600", fontSize: "0.75rem", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{member.position}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                        {member.eligibilities.slice(0, 2).map((elig, idx) => (
                          <span key={idx} style={{ background: "#FF9FF320", color: "#FF9FF3", padding: "3px 6px", borderRadius: "10px", fontSize: "0.6rem", fontWeight: "600", whiteSpace: "nowrap" }}>{elig}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* Administration & Promotion Section */}
          <div data-aos="fade-up">
            <h3 style={{ fontSize: "1.8rem", color: "#54A0FF", fontWeight: "bold", marginBottom: "40px", paddingBottom: "15px", borderBottom: "3px solid #54A0FF" }}>Administration & Promotion</h3>
            <Row className="g-4 justify-content-center">
              {teamData.administration.members.map((member, i) => (
                <Col xs={12} sm={6} md={4} lg={4} key={i} className="d-flex justify-content-center" data-aos="zoom-in" data-aos-delay={i * 50}>
                  <div style={{ width: "100%", maxWidth: "250px", background: "#fff", borderRadius: "15px", overflow: "hidden", boxShadow: "0 10px 40px rgba(84,160,255,0.2)", transition: "all 0.3s ease", cursor: "pointer", border: "3px solid #54A0FF30" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-10px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(84,160,255,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(84,160,255,0.2)"; }}>
                    <div style={{ aspectRatio: "4/5", overflow: "hidden", background: "#f0f0f0" }}>
                      <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "15px", textAlign: "center" }}>
                      <h4 style={{ color: "#54A0FF", fontWeight: "800", fontSize: "0.95rem", margin: "0 0 3px 0" }}>{member.name}</h4>
                      <p style={{ color: "#54A0FF", fontWeight: "600", fontSize: "0.75rem", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{member.position}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                        {member.eligibilities.slice(0, 2).map((elig, idx) => (
                          <span key={idx} style={{ background: "#54A0FF20", color: "#54A0FF", padding: "3px 6px", borderRadius: "10px", fontSize: "0.6rem", fontWeight: "600", whiteSpace: "nowrap" }}>{elig}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </Container>
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

