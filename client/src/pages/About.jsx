/**
 * What it is: Website page (About screen).
 * Non-tech note: This file controls what users see on the About page.
 */

import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import Navbar from "../components/Navbar";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaFire, FaUsers, FaTrophy, FaLightbulb } from "react-icons/fa";
/**
 * Purpose: Do About
 * Plain English: What this function is used for.
 */
const About = () => {
  useEffect(/**
   * Purpose: React effect callback (runs after render based on dependencies)
   * Plain English: What this function is used for.
   */
  () => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out-cubic",
      once: false,
      offset: 80,
      disable: false
    });
    AOS.refresh();
  }, []);

  return (
    <div style={{ fontFamily: "Poppins, system-ui, -apple-system, sans-serif", overflowX: "hidden", overflowY: "auto" }}>
      <style>{`
      
        @keyframes gradientShift {
          0% {background-position: 0% 50%;}
          50% {background-position: 100% 50%;}
          100% {background-position: 0% 50%;}
        }
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: .7; }
          50%  { transform: translateY(-15px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: .7; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .colorful-card {
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,248,255,0.9));
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 40px rgba(0,180,216,0.2);
          transition: all 0.45s ease;
          padding: 30px;
          border: 2px solid transparent;
          position: relative;
        }
        .colorful-card:hover {
          transform: translateY(-12px) scale(1.02) rotateY(2deg);
          box-shadow: 0 15px 50px rgba(0,180,216,0.3);
        }
        .gradient-1 { background: linear-gradient(135deg, #FF6B6B, #FFE66D); }
        .gradient-2 { background: linear-gradient(135deg, #4ECDC4, #44A08D); }
        .gradient-3 { background: linear-gradient(135deg, #A8EDEA, #FED6E3); }
        .gradient-4 { background: linear-gradient(135deg, #667eea, #764ba2); }
        .gradient-5 { background: linear-gradient(135deg, #F093FB, #F5576C); }
        .gradient-6 { background: linear-gradient(135deg, #4158D0, #C850C0); }
      `}</style>
      <Navbar />
      {/* ===================== HERO ===================== */}
      <section
        style={{
          position: "relative",
          color: "white",
          padding: "clamp(84px, 12vw, 100px) 0 clamp(24px, 5vw, 40px)",
          background: "linear-gradient(135deg, #001f3f, #0077B6, #00B4D8, #48CAE4)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 12s ease infinite",
          minHeight: "auto",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right" data-aos-delay="100">
              <h1
                className="fw-bold"
                style={{
                  fontSize: "clamp(2.2rem, 6vw, 4rem)",
                  lineHeight: 1.05,
                  marginBottom: "1.5rem",
                  color: "#fff",
                  textShadow: "0 4px 15px rgba(0,0,0,0.2)",
                }}
              >
                About <span style={{ color: "#FFE66D" }}>Bluefins</span> Aquatic Solutions
              </h1>
              <p style={{ fontSize: "1.2rem", opacity: 0.95, marginBottom: "2rem", lineHeight: 1.9 }}>
                Founded in 2014, Bluefins Aquatic Solutions is a professional swimming training organization with a team of qualified and experienced coaches. We've produced 65+ national-level swimmers and 45+ national medallists while serving 8,000+ students across Tamil Nadu and Kerala.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <NavLink to="/programs">
                  <button
                    style={{
                      background: "#FFE66D",
                      color: "#001f3f",
                      border: "none",
                      padding: "14px 32px",
                      borderRadius: "50px",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 8px 25px rgba(255,230,109,0.4)",
                    }}
                    onMouseEnter={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 12px 35px rgba(255,230,109,0.6)";
                    }}
                    onMouseLeave={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "0 8px 25px rgba(255,230,109,0.4)";
                    }}
                  >
                    📋 Our Services
                  </button>
                </NavLink>
                <NavLink to="/contact">
                  <button
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      border: "2px solid #fff",
                      padding: "12px 30px",
                      borderRadius: "50px",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      backdropFilter: "blur(10px)",
                    }}
                    onMouseEnter={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    📞 Contact Us
                  </button>
                </NavLink>
              </div>
            </div>
            <div className="col-lg-6" data-aos="fade-left" data-aos-delay="300">
              <div
                style={{
                  position: "relative",
                  height: "450px",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,230,109,0.15))",
                  borderRadius: "24px",
                  border: "3px solid rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  style={{
                    fontSize: "15rem",
                    opacity: 0.25,
                    animation: "floatUp 4s ease-in-out infinite",
                  }}
                >
                  <img src="https://images.unsplash.com/photo-1560089000-7433a4ebbd64?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=735" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        {/* <svg
          className="wave-divider"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -1, left: 0,backgroundColor:'' }}
        >
          <path
            fill="#fefdfd"
            d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,74.7C672,75,768,85,864,90.7C960,96,1056,96,1152,85.3C1248,75,1344,53,1392,42.7L1440,32V120H0Z"
          ></path>
        </svg> */}
      </section>
      {/* ===================== OUR STORY ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(180deg, #f0f9ff 0%, #f5f3ff 50%, #fff5f0 100%)",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-6" data-aos="fade-right" data-aos-delay="100">
              <div
                className="colorful-card"
                style={{
                  borderLeft: "6px solid #FF6B6B",
                  background: "linear-gradient(135deg, rgba(255,107,107,0.08), rgba(255,230,109,0.08))",
                }}
              >
                <h3 style={{ color: "#FF6B6B", marginBottom: "1.5rem", fontWeight: "700", fontSize: "1.8rem" }}>
                  🌱 Our Journey
                </h3>
                <p style={{ color: "#333", lineHeight: 1.9, marginBottom: "1.2rem", fontWeight: "500", fontSize: "0.95rem" }}>
                  Founded in 2014, Bluefins Aquatic Solutions began with a vision to revolutionize aquatic training in South India. Over the past decade, we've grown from a single coaching center to a comprehensive institutional solutions provider.
                </p>
                <p style={{ color: "#333", lineHeight: 1.9, fontWeight: "500", fontSize: "0.95rem", margin: "0" }}>
                  Today, we operate across Tamil Nadu and Kerala with 50+ institutional partnerships, serving 8,000+ students and managing world-class aquatic facilities at premier schools and resorts.
                </p>
              </div>
            </div>

            <div className="col-lg-6" data-aos="fade-left" data-aos-delay="200">
              <div
                className="colorful-card"
                style={{
                  borderLeft: "6px solid #4ECDC4",
                  background: "linear-gradient(135deg, rgba(78,205,196,0.08), rgba(68,160,141,0.08))",
                }}
              >
                <h3 style={{ color: "#4ECDC4", marginBottom: "1.5rem", fontWeight: "700", fontSize: "1.8rem" }}>
                  🎯 Our Mission
                </h3>
                <p style={{ color: "#333", lineHeight: 1.9, marginBottom: "1.2rem", fontWeight: "500", fontSize: "0.95rem" }}>
                  To ensure every student learns swimming the proper way, while identifying and nurturing the best talent to achieve success at competitive levels.
                </p>
                <p style={{ color: "#333", lineHeight: 1.9, fontWeight: "500", fontSize: "0.95rem", margin: "0" }}>
                  We provide qualified male & female coaches, certified lifeguards, pool maintenance support, and customized swimming solutions for schools and academies across South India.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ===================== STATS SECTION ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #FFE66D, #FF9FF3, #4ECDC4, #667eea)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 15s ease infinite",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="row g-4 text-center">
            {[
              { icon: "🏊", number: "65+", label: "National Swimmers Trained", color: "#FF6B6B" },
              { icon: "🏆", number: "45+", label: "National Medals Won", color: "#FFD93D" },
              { icon: "👥", number: "25+", label: "Expert Coaches", color: "#4ECDC4" },
              { icon: "🏛️", number: "50+", label: "Institutions Served", color: "#667eea" },
            ].map(/**
             * Purpose: Array mapping callback (converts each item to a new value)
             * Plain English: What this function is used for.
             */
            (stat, i) => {
              return (
                <div className="col-md-6 col-lg-3" key={i} data-aos="zoom-in" data-aos-delay={i * 100}>
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "20px",
                      padding: "30px 20px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                      transition: "all 0.45s ease",
                      cursor: "pointer",
                      border: `3px solid ${stat.color}`,
                    }}
                    onMouseEnter={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.transform = "translateY(-15px) rotateY(3deg) scale(1.03)";
                      e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.2)";
                    }}
                    onMouseLeave={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.transform = "translateY(0) rotateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.15)";
                    }}
                  >
                    <div style={{ fontSize: "clamp(2.25rem, 6vw, 3.5rem)", marginBottom: "1rem", animation: "pulse 3s ease-in-out infinite" }}>
                      {stat.icon}
                    </div>
                    <div
                      style={{
                        fontSize: "2.8rem",
                        fontWeight: "800",
                        color: stat.color,
                        marginBottom: "0.5rem",
                        letterSpacing: "-1px",
                      }}
                    >
                      {stat.number}
                    </div>
                    <p style={{ color: stat.color, fontWeight: "700", margin: "0", fontSize: "1rem" }}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wave divider */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -2, left: 0, width: "100%" }}
        >
          <path fill="#f5f3ff" d="M0,40 Q360,80 720,40 T1440,40 L1440,120 L0,120 Z"></path>
        </svg>
      </section>
      {/* ===================== CORE VALUES ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(180deg, #f5f3ff 0%, #fff5f0 100%)",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="fw-bold" style={{ fontSize: "clamp(1.8rem, 4.5vw, 2.8rem)", marginBottom: "1rem", color: "#001f3f" }}>
              Our Core <span style={{ background: "linear-gradient(90deg, #FF6B6B, #667eea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Values</span>
            </h2>
            <p style={{ fontSize: "1rem", color: "#555", maxWidth: "700px", margin: "0 auto", fontWeight: "500" }}>
              Principles that guide every decision and partnership
            </p>
          </div>

          <div className="row g-4">
            {[
              { icon: <FaFire />, title: "Excellence", desc: "We pursue excellence in every program, coaching session, and management decision.", color: "#FF6B6B" },
              { icon: <FaUsers />, title: "Partnership", desc: "Your success is our success. We build long-term relationships based on trust.", color: "#4ECDC4" },
              { icon: <FaTrophy />, title: "Integrity", desc: "Transparent practices and honest communication in all institutional partnerships.", color: "#667eea" },
              { icon: <FaLightbulb />, title: "Innovation", desc: "Continuously evolving our solutions to meet emerging institutional needs.", color: "#FFD93D" },
            ].map(/**
             * Purpose: Array mapping callback (converts each item to a new value)
             * Plain English: What this function is used for.
             */
            (value, i) => {
              return (
                <div className="col-md-6 col-lg-3" key={i} data-aos="fade-up" data-aos-delay={i * 150}>
                  <div
                    className="colorful-card"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))`,
                      borderTop: `5px solid ${value.color}`,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "clamp(2rem, 5vw, 3rem)",
                        marginBottom: "1rem",
                        color: value.color,
                        animation: "pulse 2.5s ease-in-out infinite",
                      }}
                    >
                      {value.icon}
                    </div>
                    <h5 style={{ color: value.color, fontWeight: "700", marginBottom: "0.8rem", fontSize: "1.15rem" }}>
                      {value.title}
                    </h5>
                    <p style={{ color: "#555", fontSize: "0.9rem", lineHeight: 1.6, margin: "0", fontWeight: "500" }}>
                      {value.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* ===================== EXPERTISE & EXPERIENCE ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #fff5f0, #f0f9ff, #f5f3ff)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 15s ease infinite",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="fw-bold" style={{ fontSize: "clamp(1.8rem, 4.5vw, 2.8rem)", marginBottom: "1rem", color: "#001f3f" }}>
              Our <span style={{ background: "linear-gradient(90deg, #4ECDC4, #FFD93D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Expertise</span>
            </h2>
            <p style={{ fontSize: "1rem", color: "#555", maxWidth: "700px", margin: "0 auto", fontWeight: "500" }}>
              Comprehensive services tailored to institutional success
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                title: "School Swimming Programs",
                desc: "Comprehensive curricula for K-12 institutions with certified coaching and safety protocols.",
                highlights: ["Structured curriculum", "Competitive training", "Water safety"],
                color: "#FF6B6B",
              },
              {
                title: "Sports Academy Training",
                desc: "Elite training programs for competitive swimmers and developing future champions.",
                highlights: ["Performance coaching", "Athlete development", "Competition prep"],
                color: "#FFD93D",
              },
              {
                title: "Resort Guest Programs",
                desc: "Professional aquatic experiences for resort guests with recreational and professional offerings.",
                highlights: ["Guest lessons", "Family programs", "Professional coaching"],
                color: "#4ECDC4",
              },
              {
                title: "Pool Management",
                desc: "Complete pool maintenance, lifeguard services, and operational management.",
                highlights: ["Daily maintenance", "Lifeguard services", "Equipment management"],
                color: "#667eea",
              },
            ].map(/**
             * Purpose: Array mapping callback (converts each item to a new value)
             * Plain English: What this function is used for.
             */
            (exp, i) => {
              return (
                <div className="col-lg-6" key={i} data-aos="zoom-in" data-aos-delay={i * 100}>
                  <div
                    style={{
                      position: "relative",
                      padding: "30px",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))",
                      borderLeft: `6px solid ${exp.color}`,
                      borderRadius: "16px",
                      boxShadow: `0 8px 30px ${exp.color}30`,
                      transition: "all 0.4s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.transform = "translateX(8px) translateY(-4px)";
                      e.currentTarget.style.boxShadow = `0 12px 40px ${exp.color}50`;
                    }}
                    onMouseLeave={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.transform = "translateX(0) translateY(0)";
                      e.currentTarget.style.boxShadow = `0 8px 30px ${exp.color}30`;
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          background: `linear-gradient(135deg, ${exp.color}, ${exp.color}dd)`,
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "1.5rem",
                          marginRight: "1rem",
                          fontWeight: "700",
                        }}
                      >
                        {i + 1}
                      </div>
                      <h4 style={{ color: exp.color, fontWeight: "700", margin: "0" }}>
                        {exp.title}
                      </h4>
                    </div>
                    <p style={{ color: "#555", marginBottom: "1rem", fontSize: "0.95rem", lineHeight: 1.7 }}>
                      {exp.desc}
                    </p>
                    <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                      {exp.highlights.map(/**
                       * Purpose: Array mapping callback (converts each item to a new value)
                       * Plain English: What this function is used for.
                       */
                      (h, j) => {
                        return (
                          <span
                            key={j}
                            style={{
                              background: `${exp.color}15`,
                              padding: "6px 14px",
                              borderRadius: "20px",
                              fontSize: "0.8rem",
                              color: exp.color,
                              fontWeight: "700",
                              border: `1px solid ${exp.color}30`,
                            }}
                          >✓ {h}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* ===================== WHY PARTNER WITH US ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 15s ease infinite",
          color: "white",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="fw-bold" style={{ fontSize: "2.8rem", marginBottom: "1rem", color: "#fff" }}>
              Why Partner With Bluefins
            </h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.95)", maxWidth: "700px", margin: "0 auto", fontWeight: "500" }}>
              Six compelling reasons to choose us as your aquatic solutions partner
            </p>
          </div>

          <div className="row g-4">
            {[
              { number: "01", title: "Proven Track Record", desc: "65+ national swimmers, 45+ medals, 50+ institutions served." },
              { number: "02", title: "Expert Team", desc: "25+ certified coaches with proven competitive experience." },
              { number: "03", title: "Customized Solutions", desc: "Tailored programs for your institution's unique needs." },
              { number: "04", title: "Complete Accountability", desc: "Transparent reporting and measurable outcomes." },
              { number: "05", title: "Safety First", desc: "Professional protocols and certified staff." },
              { number: "06", title: "Long-term Partnership", desc: "We invest in your sustained growth." },
            ].map(/**
             * Purpose: Array mapping callback (converts each item to a new value)
             * Plain English: What this function is used for.
             */
            (reason, i) => {
              return (
                <div className="col-md-6 col-lg-4" key={i} data-aos="fade-up" data-aos-delay={i * 100}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      padding: "30px",
                      borderRadius: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      transition: "all 0.4s ease",
                      cursor: "pointer",
                      backdropFilter: "blur(10px)",
                    }}
                    onMouseEnter={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                      e.currentTarget.style.transform = "translateY(-10px)";
                      e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.2)";
                    }}
                    onMouseLeave={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2.5rem",
                        fontWeight: "800",
                        marginBottom: "1rem",
                        color: "#FFE66D",
                        letterSpacing: "-1px",
                      }}
                    >
                      {reason.number}
                    </div>
                    <h5 style={{ color: "#fff", fontWeight: "700", marginBottom: "0.7rem", fontSize: "1.1rem" }}>
                      {reason.title}
                    </h5>
                    <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", lineHeight: 1.6, margin: "0", fontWeight: "500" }}>
                      {reason.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wave divider */}
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -2, left: 0, width: "100%" }}
        >
          <path fill="#fff5f0" d="M0,100 Q360,50 720,100 T1440,100 L1440,200 L0,200 Z"></path>
        </svg>
      </section>
      {/* ===================== BRANCHES & REACH ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(180deg, #fff5f0 0%, #f0f9ff 100%)",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6" data-aos="fade-right" data-aos-delay="100">
              <h2 className="fw-bold mb-3" style={{ fontSize: "2.8rem", color: "#001f3f" }}>
                Our <span style={{ background: "linear-gradient(90deg, #FF6B6B, #4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Reach</span>
              </h2>
              <p style={{ fontSize: "1rem", color: "#555", marginBottom: "2rem", lineHeight: 1.9, fontWeight: "500" }}>
                Operating across multiple locations with regional expertise and institutional partnerships.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {[
                  {
                    location: "Tamil Nadu",
                    branches: [
                      { name: "Erode", centers: ["Kuberalaxmi Sports Academy", "Bharathi International School", "Rockmount Classic", "Sagar International School (Swimming Kit Program)"] },
                      { name: "Salem", centers: ["Login Sports Academy"] },
                      { name: "Arachalur", centers: ["Agastya International School"] },
                      { name: "Tirupur", centers: ["Saikripa Special School"] },
                      { name: "Arur", centers: ["Adiyaman International School", "Arur Sports Club"] },
                      { name: "Avinashi", centers: ["Avinashi Swimming Pool"] },
                    ],
                    color: "#FF6B6B"
                  },
                  { location: "Kerala", centers: "12+ centers", color: "#4ECDC4" },
                  { location: "Expansion Plans", centers: "South India focus", color: "#667eea" },
                ].map(/**
                 * Purpose: Array mapping callback (converts each item to a new value)
                 * Plain English: What this function is used for.
                 */
                (branch, i) => {
                  return (
                    <div key={i}>
                      {branch.branches ? (
                        <div style={{ background: "#ffffff", borderRadius: "16px", border: `2px solid ${branch.color}30`, padding: "1.5rem", boxShadow: `0 4px 15px ${branch.color}15`, transition: "all 0.3s ease" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                            <div style={{ fontSize: "2rem" }}>📍</div>
                            <h5 style={{ margin: "0", color: branch.color, fontWeight: "700", fontSize: "1.3rem" }}>{branch.location}</h5>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {branch.branches.map(/**
                             * Purpose: Array mapping callback (converts each item to a new value)
                             * Plain English: What this function is used for.
                             */
                            (city, cityIdx) => {
                              return (
                                <div key={cityIdx} style={{ marginLeft: "0.5rem", borderLeft: `3px solid ${branch.color}40`, paddingLeft: "1rem" }}>
                                  <h6 style={{ margin: "0 0 0.5rem", color: branch.color, fontWeight: "700", fontSize: "0.95rem" }}>
                                    📌 {city.name}
                                  </h6>
                                  <ul style={{ margin: "0", paddingLeft: "1.2rem", fontSize: "0.85rem", color: "#555" }}>
                                    {city.centers.map(/**
                                     * Purpose: Array mapping callback (converts each item to a new value)
                                     * Plain English: What this function is used for.
                                     */
                                    (center, centerIdx) => {
                                      return (
                                        <li key={centerIdx} style={{ marginBottom: "0.3rem", fontWeight: "500" }}>
                                          {center}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1.5rem",
                            padding: "1.2rem",
                            background: "#ffffff",
                            borderRadius: "16px",
                            border: `2px solid ${branch.color}30`,
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                            boxShadow: `0 4px 15px ${branch.color}15`,
                          }}
                          onMouseEnter={/**
                           * Purpose: Helper callback used inside a larger operation
                           * Plain English: What this function is used for.
                           */
                          e => {
                            e.currentTarget.style.borderColor = branch.color;
                            e.currentTarget.style.transform = "translateX(8px)";
                          }}
                          onMouseLeave={/**
                           * Purpose: Helper callback used inside a larger operation
                           * Plain English: What this function is used for.
                           */
                          e => {
                            e.currentTarget.style.borderColor = `${branch.color}30`;
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          <div
                            style={{
                              width: "60px",
                              height: "60px",
                              background: `linear-gradient(135deg, ${branch.color}, ${branch.color}dd)`,
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.8rem",
                              fontWeight: "700",
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            📍
                          </div>
                          <div>
                            <h5 style={{ margin: "0 0 0.3rem", color: branch.color, fontWeight: "700", fontSize: "1.1rem" }}>
                              {branch.location}
                            </h5>
                            <p style={{ margin: "0", fontSize: "0.95rem", color: "#666", fontWeight: "500" }}>
                              {branch.centers}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-lg-6" data-aos="fade-left" data-aos-delay="200">
              <div
                style={{
                  borderRadius: "24px",
                  padding: "50px 40px",
                  border: "3px solid transparent",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,251,255,0.9))",
                  boxShadow: "0 20px 60px rgba(102,126,234,0.15)",
                  transition: "all 0.4s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={/**
                 * Purpose: Helper callback used inside a larger operation
                 * Plain English: What this function is used for.
                 */
                e => {
                  e.currentTarget.style.border = "3px solid #667eea";
                  e.currentTarget.style.transform = "translateY(-8px)";
                }}
                onMouseLeave={/**
                 * Purpose: Helper callback used inside a larger operation
                 * Plain English: What this function is used for.
                 */
                e => {
                  e.currentTarget.style.border = "3px solid transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ fontSize: "5rem", marginBottom: "1.5rem", textAlign: "center" }}>🗺️</div>
                <h3 style={{ color: "#667eea", marginBottom: "1rem", fontWeight: "700", fontSize: "1.8rem", textAlign: "center" }}>
                  Expanding Our Footprint
                </h3>
                <p style={{ color: "#555", marginBottom: "2rem", lineHeight: 1.8, fontWeight: "500", textAlign: "center" }}>
                  With 27+ operational centers and strategic partnerships, we're positioned to serve your aquatic needs across South India.
                </p>
                <div style={{ textAlign: "center" }}>
                  <NavLink to="/contact">
                    <button
                      style={{
                        background: "linear-gradient(135deg, #667eea, #764ba2)",
                        color: "#fff",
                        border: "none",
                        padding: "12px 30px",
                        borderRadius: "50px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 8px 20px rgba(102,126,234,0.3)",
                      }}
                      onMouseEnter={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      e => {
                        e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                      }}
                      onMouseLeave={/**
                       * Purpose: Helper callback used inside a larger operation
                       * Plain English: What this function is used for.
                       */
                      e => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                      }}
                    >
                      📍 Find Nearest Center
                    </button>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ===================== CTA SECTION ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #FFE66D, #FF9FF3, #667eea)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 15s ease infinite",
          color: "white",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="text-center" data-aos="zoom-in">
            <h2 className="fw-bold mb-3" style={{ fontSize: "2.5rem" }}>
              Ready to Elevate Your Aquatic Program?
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                marginBottom: "2.5rem",
                maxWidth: "700px",
                margin: "0 auto 2.5rem",
                fontWeight: "500",
                lineHeight: 1.8,
                opacity: 0.95,
              }}
            >
              Partner with Bluefins for comprehensive, professional aquatic solutions tailored to your institution's unique vision.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <NavLink to="/contact">
                <button
                  style={{
                    background: "#ffffff",
                    color: "#667eea",
                    border: "none",
                    padding: "14px 32px",
                    borderRadius: "50px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 8px 25px rgba(255,255,255,0.3)",
                    fontSize: "0.95rem",
                  }}
                  onMouseEnter={/**
                   * Purpose: Helper callback used inside a larger operation
                   * Plain English: What this function is used for.
                   */
                  e => {
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                  }}
                  onMouseLeave={/**
                   * Purpose: Helper callback used inside a larger operation
                   * Plain English: What this function is used for.
                   */
                  e => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                  }}
                >
                  📋 Request Proposal
                </button>
              </NavLink>
              <NavLink to="/programs">
                <button
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    border: "2px solid #fff",
                    padding: "12px 30px",
                    borderRadius: "50px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontSize: "0.95rem",
                    backdropFilter: "blur(10px)",
                  }}
                  onMouseEnter={/**
                   * Purpose: Helper callback used inside a larger operation
                   * Plain English: What this function is used for.
                   */
                  e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={/**
                   * Purpose: Helper callback used inside a larger operation
                   * Plain English: What this function is used for.
                   */
                  e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  📚 Explore Services
                </button>
              </NavLink>
            </div>
          </div>
        </div>
        <svg
          className="wave-divider"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -1, left: 0 }}
        >
          <path
            fill="#fff"
            d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,74.7C672,75,768,85,864,90.7C960,96,1056,96,1152,85.3C1248,75,1344,53,1392,42.7L1440,32V120H0Z"
          ></path>
        </svg>
      </section>
    </div>
  );
};

export default About;
