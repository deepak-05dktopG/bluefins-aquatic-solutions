import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaSwimmer, FaTrophy, FaUsers, FaToolbox, FaChartLine, FaAward, FaShieldAlt, FaClock } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import Navbar from "../components/Navbar";
const Service = () => {
  useEffect(() => {
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
          0%   { transform: translateY(0); opacity: .7; }
          50%  { transform: translateY(-15px); opacity: 1; }
          100% { transform: translateY(0); opacity: .7; }
        }
        @keyframes slideInRight {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .service-card-modern {
          position: relative;
          border-radius: 24px;
          padding: 40px;
          background: white;
          box-shadow: 0 10px 50px rgba(0,0,0,0.1);
          transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          cursor: pointer;
        }
        .service-card-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, var(--color-1), var(--color-2));
        }
        .service-card-modern::after {
          content: '';
          position: absolute;
          right: -50px;
          top: -50px;
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, var(--color-1), var(--color-2));
          opacity: 0.1;
          border-radius: 50%;
          transition: all 0.45s ease;
        }
        .service-card-modern:hover {
          transform: translateY(-15px) scale(1.02);
          box-shadow: 0 25px 80px rgba(0,0,0,0.2);
        }
        .service-card-modern:hover::after {
          right: -20px;
          top: -20px;
        }
      `}</style>
      {/* ===================== HERO SECTION ===================== */}
      <Navbar />
      <section
        style={{
          position: "relative",
          color: "white",
          padding: "clamp(84px, 12vw, 120px) 0 clamp(24px, 5vw, 40px)",
          background: "linear-gradient(135deg, #0F3460, #16213E, #533483, #16213E)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 15s ease infinite",
          minHeight: "auto",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container pb-lg-5 pb-0 ">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right" data-aos-delay="100">
              <div style={{ position: "relative", zIndex: 2 }}>
                <span style={{ color: "#FFE66D", fontWeight: "700", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px" }}>
                  🎯 Our Services
                </span>
                <h1
                  className="fw-bold"
                  style={{
                    fontSize: "clamp(2.2rem, 6vw, 3.5rem)",
                    lineHeight: 1.1,
                    marginBottom: "1.5rem",
                    marginTop: "0.8rem",
                    color: "#fff",
                    textShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  }}
                >
                  Transform Your <span style={{ background: "linear-gradient(90deg, #FFE66D, #FF9FF3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Aquatic Program</span>
                </h1>
                <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: "2rem", lineHeight: 1.8, fontWeight: "500" }}>
                  From elite competitive training to institutional excellence, we deliver world-class aquatic services tailored to your institution's unique needs.
                </p>
                <div className="d-flex gap-3 flex-wrap container pb-lg-5 pb-0 ">
                  <NavLink to="/contact">
                    <button
                      style={{
                        background: "linear-gradient(135deg, #FF6B6B, #FF9FF3)",
                        color: "#fff",
                        border: "none",
                        padding: "14px 32px",
                        borderRadius: "50px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 8px 25px rgba(255,107,107,0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                      }}
                    >
                      � Get In Touch
                    </button>
                  </NavLink>
                  <NavLink to="/programs">
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      📋 View All Services
                    </button>
                  </NavLink>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mt-5 mt-lg-0 container " data-aos="fade-left" data-aos-delay="200">
              <div
                style={{
                  position: "relative",
                  height: "350px",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,230,109,0.1))",
                  borderRadius: "24px",
                  border: "2px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1584860783460-85716b68765a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170"
                  alt="Swimming training"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "22px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
          <svg
            className="wave-divider"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            style={{ position: "absolute", bottom: -1, left: 0, width: "100%"}}
          >
            <path
              fill="#f5f3ff"
              d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,74.7C672,75,768,85,864,90.7C960,96,1056,96,1152,85.3C1248,75,1344,53,1392,42.7L1440,32V120H0Z"
            ></path>
          </svg>
      </section>

      {/* ===================== SERVICE CARDS - HORIZONTAL SCROLL STYLE ===================== */}
      <section className="py-5" style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #fff5f0 100%)", position: "relative", overflow: "hidden" }}>
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <span style={{ color: "#FF6B6B", fontWeight: "700", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "2px" }}>
              ✨ Core Services
            </span>
            <h2 className="fw-bold" style={{ fontSize: "clamp(2rem, 5.5vw, 3.2rem)", marginBottom: "1rem", marginTop: "0.5rem", color: "#0F3460" }}>
              What We <span style={{ background: "linear-gradient(90deg, #FF6B6B, #4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Deliver</span>
            </h2>
          </div>

          <div className="row g-4">
            {[
              {
                num: "01",
                title: "School Programs",
                desc: "Structured lesson plans for K-12 institutions with qualified male & female coaches, certified lifeguards, and comprehensive student assessment.",
                icon: "🏫",
                c1: "#FF6B6B",
                c2: "#FFE66D",
              },
              {
                num: "02",
                title: "Competitive Training",
                desc: "Elite coaching pathways for talented swimmers targeting national competitions with specialized training techniques and performance analytics.",
                icon: "🏆",
                c1: "#4ECDC4",
                c2: "#44A08D",
              },
              {
                num: "03",
                title: "Pool Management",
                desc: "Complete facility operations including daily maintenance, certified lifeguard services, equipment management, and compliance protocols.",
                icon: "🔧",
                c1: "#667eea",
                c2: "#764ba2",
              },
              {
                num: "04",
                title: "Swimming Kits & Accessories",
                desc: "Customized swimming kits and accessories for schools and academies including professional-grade equipment and training materials.",
                icon: "🎽",
                c1: "#FFD93D",
                c2: "#FF9FF3",
              },
            ].map((svc, i) => (
              <div className="col-lg-6 col-xl-3" key={i} data-aos="zoom-in" data-aos-delay={i * 150}>
                <div
                  className="service-card-modern"
                  style={{
                    "--color-1": svc.c1,
                    "--color-2": svc.c2,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "clamp(2.4rem, 6vw, 3.5rem)", fontWeight: "900", color: svc.c1, opacity: 0.15 }}>
                      {svc.num}
                    </span>
                    <div style={{ fontSize: "2.5rem" }}>{svc.icon}</div>
                  </div>
                  <h4 style={{ color: "#0F3460", fontWeight: "700", marginBottom: "0.8rem", fontSize: "1.3rem" }}>
                    {svc.title}
                  </h4>
                  <p style={{ color: "#555", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                    {svc.desc}
                  </p>
                  <NavLink to="/contact" style={{ textDecoration: "none" }}>
                    <button
                      style={{
                        background: `linear-gradient(135deg, ${svc.c1}, ${svc.c2})`,
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "20px",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(5px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      Learn More →
                    </button>
                  </NavLink>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative SVG background */}
        <svg
          style={{ position: "absolute", top: "-100px", right: "-100px", opacity: 0.1, zIndex: 0 }}
          width="500"
          height="500"
          viewBox="0 0 500 500"
        >
          <circle cx="250" cy="250" r="200" fill="#FF6B6B" />
          <circle cx="250" cy="250" r="150" fill="none" stroke="#4ECDC4" strokeWidth="20" />
        </svg>
      </section>

      {/* ===================== FEATURES SECTION - 3 COLUMN ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #FF6B6B, #FFD93D, #4ECDC4, #667eea)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 15s ease infinite",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up" style={{ color: "white" }}>
            <h2 className="fw-bold" style={{ fontSize: "2.8rem", marginBottom: "1rem" }}>
              Why Choose Bluefins Services
            </h2>
          </div>

          <div className="row g-4">
            {[
              { icon: FaChartLine, title: "Data-Driven", desc: "Performance analytics and detailed progress tracking" },
              { icon: FaAward, title: "Certified Excellence", desc: "International certifications and proven methodologies" },
              { icon: FaShieldAlt, title: "Safety First", desc: "Comprehensive safety protocols and lifeguard coverage" },
              { icon: FaClock, title: "Flexible Scheduling", desc: "Custom programs that fit your institutional calendar" },
              { icon: FaUsers, title: "Expert Team", desc: "25+ certified coaches with national experience" },
              { icon: FaTrophy, title: "Proven Results", desc: "45+ national medals and 65+ trained swimmers" },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div className="col-md-6 col-lg-4" key={i} data-aos="fade-up" data-aos-delay={i * 100}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      padding: "30px",
                      borderRadius: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      transition: "all 0.45s ease",
                      cursor: "pointer",
                      backdropFilter: "blur(10px)",
                      textAlign: "center",
                      color: "white",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                      e.currentTarget.style.transform = "translateY(-12px) scale(1.03)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                    }}
                  >
                    <div style={{ fontSize: "2.8rem", marginBottom: "1rem", animation: "pulse 2.5s ease-in-out infinite" }}>
                      <Icon />
                    </div>
                    <h5 style={{ fontWeight: "700", marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                      {feature.title}
                    </h5>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.6, margin: "0", opacity: 0.9 }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wave divider */}
        <svg
          viewBox="0 0 1440 150"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -2, left: 0, width: "100%" }}
        >
          <path fill="#f5f3ff" d="M0,75 Q360,25 720,75 T1440,75 L1440,150 L0,150 Z"></path>
        </svg>
      </section>

      {/* ===================== PRICING TIERS - UNIQUE LAYOUT ===================== */}
      {/* <section className="py-5" style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #fff5f0 100%)" }}>
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <span style={{ color: "#FF6B6B", fontWeight: "700", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "2px" }}>
              💰 Transparent Pricing
            </span>
            <h2 className="fw-bold" style={{ fontSize: "3rem", marginBottom: "1rem", marginTop: "0.5rem", color: "#0F3460" }}>
              Flexible Service Plans
            </h2>
          </div>

          <div className="row g-4 align-items-center">
            {[
              {
                title: "Starter",
                price: "₹50K",
                period: "/month",
                desc: "Perfect for small groups and recreational programs",
                features: ["2 Coaches", "Batch Groups", "Basic Equipment", "Monthly Reports"],
                color: "#FF6B6B",
              },
              {
                title: "Professional",
                price: "₹150K",
                period: "/month",
                desc: "Ideal for competitive training and academies",
                features: ["5+ Coaches", "Specialized Training", "Advanced Analytics", "Weekly Updates", "Competition Prep"],
                color: "#4ECDC4",
                featured: true,
              },
              {
                title: "Enterprise",
                price: "Custom",
                period: "/project",
                desc: "Complete customized solutions for institutions",
                features: ["Full Team", "24/7 Support", "Custom Programs", "Advanced Tech", "Certification"],
                color: "#667eea",
              },
            ].map((plan, i) => (
              <div
                className="col-lg-4"
                key={i}
                data-aos="zoom-in"
                data-aos-delay={i * 150}
                style={{
                  transform: plan.featured ? "scale(1.05)" : "scale(1)",
                }}
              >
                <div
                  style={{
                    background: plan.featured ? `linear-gradient(135deg, ${plan.color}15, ${plan.color}05)` : "#ffffff",
                    border: `2px solid ${plan.color}`,
                    borderRadius: "24px",
                    padding: "40px 30px",
                    position: "relative",
                    transition: "all 0.45s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-10px)";
                    e.currentTarget.style.boxShadow = `0 20px 60px ${plan.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
                  }}
                >
                  {plan.featured && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-15px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
                        color: "white",
                        padding: "6px 20px",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                      }}
                    >
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  <h4 style={{ color: plan.color, fontWeight: "700", marginBottom: "0.5rem", fontSize: "1.4rem" }}>
                    {plan.title}
                  </h4>
                  <p style={{ color: "#555", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    {plan.desc}
                  </p>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: "800", color: plan.color }}>
                      {plan.price}
                    </span>
                    <span style={{ color: "#999", marginLeft: "0.5rem" }}>
                      {plan.period}
                    </span>
                  </div>
                  <ul style={{ marginBottom: "2rem", listStyle: "none", padding: "0" }}>
                    {plan.features.map((feat, fi) => (
                      <li key={fi} style={{ color: "#555", marginBottom: "0.8rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                        <span style={{ color: plan.color, fontWeight: "700" }}>✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                  <a href="/contact">
                    <button
                      style={{
                        width: "100%",
                        background: `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
                        color: "white",
                        border: "none",
                        padding: "12px",
                        borderRadius: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      Get Started
                    </button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ===================== FINAL CTA ===================== */}
      <section
        style={{
          background: "linear-gradient(135deg, #0F3460, #533483, #0F3460)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 15s ease infinite",
          color: "white",
          padding: "100px 0",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div className="container" data-aos="zoom-in">
          <h2 className="fw-bold mb-3" style={{ fontSize: "2.8rem" }}>
            Ready to Transform Your Aquatic Program?
          </h2>
          <p style={{ fontSize: "1.1rem", marginBottom: "2.5rem", opacity: 0.9, maxWidth: "700px", margin: "0 auto 2.5rem" }}>
            Join 50+ institutions already delivering excellence with Bluefins services.
          </p>
          <NavLink to="/contact">
            <button
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #FFE66D)",
                color: "#fff",
                border: "none",
                padding: "16px 48px",
                borderRadius: "50px",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 8px 25px rgba(255,107,107,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
              }}
            >
              📞 Schedule a Consultation
            </button>
          </NavLink>
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

export default Service;