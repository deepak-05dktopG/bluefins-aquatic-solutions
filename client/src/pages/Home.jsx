import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { NavLink } from "react-router-dom";
import Navbar from "../components/Navbar";
const Home = () => {
  useEffect(() => {
    AOS.init({
      duration: 500,
      easing: "ease-in-out-cubic",
      once: false,
      offset: 80,
      disable: false
    });
    AOS.refresh();
  }, []);


  return (
    <div style={{ fontFamily: "Poppins, system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
      {/* === Inline keyframes + uility styles (no external CSS needed) === */}
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
        @keyframes bubbleRise {
          0%   { transform: translateY(0) scale(1); opacity: 0.1; }
          60%  { opacity: .5; }
          100% { transform: translateY(-120vh) scale(1.2); opacity: 0; }
        }
        .glass {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 8px 30px rgba(0, 180, 216, .2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .glow-hover:hover { box-shadow: 0 0 24px rgba(0, 180, 216, .45); transform: translateY(-6px); }
        .soft { transition: all .35s ease; }
        .wave-divider {
          display:block; width:100%; height:auto;
        }
        .badge-dot {
          display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; background: #48CAE4;
        }
        .bubble {
          position:absolute; bottom:-10vh; background:rgba(255,255,255,.15);
          border-radius:50%; filter: blur(.5px); animation: bubbleRise 12s linear infinite;
        }
      `}</style>
      <Navbar />

      {/* ===================== HERO ===================== */}
      <section
        style={{
          position: "relative",
          color: "white",
          padding: "120px 0 40px",
          background: "linear-gradient(135deg, #001f3f, #0077B6, #00B4D8)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 12s ease infinite",
          minHeight: "auto",
        }}
      >
        {/* Floating bubbles */}
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="bubble"
            style={{
              left: `${(i + 1) * 10}%`,
              width: `${10 + i * 4}px`,
              height: `${10 + i * 4}px`,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}

        <div className="container">
          <div className="row align-items-center">
            {/* Copy */}
            <div
              className="col-lg-6"
              style={{ zIndex: 2 }}
              data-aos="fade-right"
              data-aos-delay="100"
            >
              <div
                className="soft"
                style={{ animation: "floatUp 6s ease-in-out infinite" }}
              >
                <span
                  className="badge rounded-pill text-dark"
                  style={{ background: "#90E0EF", fontWeight: 600 }}
                >
                  <span className="badge-dot" /> Bluefins Aquatic Solutions
                </span>
              </div>
              <h1
                className="fw-bold mt-3"
                style={{ fontSize: "3rem", lineHeight: 1.1 }}
                data-aos="fade-up"
                data-aos-delay="200"
              >
                Swimming Programs & <span style={{ color: "#90E0EF" }}>Pool Management</span> Solutions
              </h1>
              <p
                className="mt-3"
                style={{ fontSize: "1.1rem", opacity: 0.95 }}
                data-aos="fade-up"
                data-aos-delay="300"
              >
                Partner with Bluefins for comprehensive training programs, professional coaching, 
                and complete pool management services for schools, sports academies, and resorts.
              </p>
              <div
                className="mt-4 d-flex gap-3"
                data-aos="zoom-in-up"
                data-aos-delay="400"
              >
                <NavLink
                  to="/programs"
                  className="btn btn-light fw-semibold px-4 py-2 rounded-pill soft glow-hover"
                >
                  Explore Our Services
                </NavLink>
                <NavLink
                  to="/contact"
                  className="btn btn-outline-light fw-semibold px-4 py-2 rounded-pill soft"
                >
                  Get a Quote
                </NavLink>
              </div>
            </div>

            {/* Visual */}
            <div
              className="col-lg-6 mt-5 mt-lg-0"
              data-aos="fade-left"
              data-aos-delay="200"
            >
              <div
                className="glass soft glow-hover"
                style={{
                  borderRadius: "24px",
                  padding: "12px",
                  transform: "rotate(-2deg)",
                }}
              >
                <img
                  className="img-fluid rounded-4"
                  alt="Underwater swimmer"
                  src="https://images.unsplash.com/photo-1562571758-400e09ba69a5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1172"
                  style={{ objectFit: "cover", width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider bottom */}
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


      {/* ===================== ABOUT (Glass Panel) ===================== */}
      <section
        className="py-5"
        style={{ background: "#ffffff" }}
        data-aos="fade-up"
        data-aos-duration="1000"
        data-aos-offset="100"
      >
        <div className="container">
          <div className="row g-4 align-items-center">
            <div
              className="col-md-6"
              data-aos="fade-right"
              data-aos-delay="100"
              data-aos-duration="1000"
            >
              <div className="glass p-4 rounded-4 soft">
                <h2 className="fw-semibold" style={{ color: "#0077B6" }}>
                  Trusted Partner for Aquatic Excellence
                </h2>
                <p className="mb-3" style={{ color: "#333" }}>
                  Bluefins Aquatic Solutions delivers professional swimming training and complete pool management services tailored for educational institutions, sports academies, and hospitality businesses seeking to enhance their aquatic offerings.
                </p>
                <ul className="list-unstyled mb-0" data-aos="fade-up" data-aos-delay="200">
                  <li className="mb-2">
                    <span className="badge-dot" /> Certified professional coaches with industry expertise
                  </li>
                  <li className="mb-2">
                    <span className="badge-dot" /> Comprehensive pool management & maintenance solutions
                  </li>
                  <li className="mb-2">
                    <span className="badge-dot" /> Customized training programs for institutional clients
                  </li>
                </ul>
                <NavLink
                  to="/about"
                  className="btn btn-primary rounded-pill mt-3 px-4 py-2 soft glow-hover"
                  style={{ background: "#0077B6", borderColor: "#0077B6" }}
                  data-aos="zoom-in-up"
                  data-aos-delay="300"
                >
                  View Our Credentials
                </NavLink>
              </div>
            </div>

            <div
              className="col-md-6"
              data-aos="fade-left"
              data-aos-delay="200"
              data-aos-duration="1000"
            >
              <img
                className="img-fluid rounded-4 soft glow-hover"
                alt="Coaching session"
                src="https://images.unsplash.com/photo-1726800892503-6c440d2a0010?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1167"
                style={{ objectFit: "cover", width: "100%" }}
              />
            </div>
          </div>
        </div>
      </section>


      {/* ===================== PROGRAMS ===================== */}
      {/* <section
        id="programs"
        style={{
          background:
            "linear-gradient(180deg,#EAFBFF 0%,#E8F9FF 60%,#F8FDFF 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "100px 0",
        }}
        data-aos="fade-up"
        data-aos-duration="1000"
        data-aos-offset="120"
      >
        <style>{`
    .program-card {
      border: none;
      border-radius: 24px;
      overflow: hidden;
      background: rgba(255,255,255,0.6);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 30px rgba(0,180,216,0.15);
      transition: all 0.45s ease;
      position: relative;
    }

    .program-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 12px 40px rgba(0,180,216,0.25);
    }

    .program-image {
      position: relative;
      height: 220px;
      overflow: hidden;
    }

    .program-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }

    .program-card:hover img {
      transform: scale(1.1);
    }

    .program-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        180deg,
        rgba(0,119,182,0.1) 0%,
        rgba(0,180,216,0.5) 100%
      );
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    .program-card:hover .program-overlay {
      opacity: 1;
    }

    .btn-futuristic {
      background: linear-gradient(90deg,#00B4D8,#48CAE4,#80ED99);
      background-size: 200% 200%;
      color: #fff;
      border: none;
      border-radius: 50px;
      font-weight: 600;
      transition: all 0.4s ease;
    }

    .btn-futuristic:hover {
      background-position: 100% 0%;
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(72,202,228,0.4);
    }
  `}</style>

        <div className="container text-center">
          <h2
            className="fw-bold"
            style={{
              color: "#0077B6",
              fontSize: "2.4rem",
              textShadow: "0 0 10px rgba(0,180,216,0.2)",
            }}
            data-aos="fade-down"
            data-aos-delay="100"
          >
            Our Programs
          </h2>
          <p className="text-muted mb-5" data-aos="fade-up" data-aos-delay="200">
            Designed for your goals, built for your rhythm.
          </p>

          <div className="row g-4 justify-content-center">
            {[
              {
                title: "One Hour Session",
                price: "₹150",
                img: "https://plus.unsplash.com/premium_photo-1664303953438-a07c44d0a8fe?auto=format&fit=crop&q=80&w=1170",
              },
              {
                title: "Monthly Program",
                price: "₹4000",
                img: "https://plus.unsplash.com/premium_photo-1719501574608-0cf632f7c0f3?auto=format&fit=crop&q=80&w=1170",
              },
              {
                title: "Beginners & Intermediate",
                price: "₹3000",
                img: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=1200&auto=format&fit=crop",
              },
              {
                title: "Family Yearly Pack",
                price: "₹15000",
                img: "https://plus.unsplash.com/premium_photo-1663040082818-b25debfd997f?auto=format&fit=crop&q=80&w=1170",
              },
            ].map((p, i) => (
              <div
                className="col-md-6 col-lg-3"
                key={i}
                data-aos="zoom-in"
                data-aos-delay={i * 150}
                data-aos-duration="1000"
              >
                <div className="program-card h-100">
                  <div className="program-image">
                    <img src={p.img} alt={p.title} />
                    <div className="program-overlay"></div>
                  </div>
                  <div className="card-body py-4">
                    <h5 className="fw-bold" style={{ color: "#0077B6" }}>
                      {p.title}
                    </h5>
                    <p style={{ color: "#475569" }}>{p.price}</p>
                    <a
                      href="#contact"
                      className="btn btn-futuristic px-4 py-2 mt-2"
                      data-aos="fade-up"
                      data-aos-delay={i * 200 + 300}
                    >
                      Know More
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}


      {/* ===================== WHY CHOOSE US (Bootstrap 5 Futuristic) ===================== */}
      {/* ===================== WHY CHOOSE US (Bootstrap 5 Futuristic) ===================== */}
      <section
        id="why-us"
        className="py-5 text-center"
        style={{
          background: "linear-gradient(180deg, #F9FDFF 0%, #E8F9FF 100%)",
        }}
        data-aos="fade-up"
        data-aos-duration="1000"
        data-aos-offset="100"
      >
        <div className="container">
          {/* Heading */}
          <h2
            className="fw-bold mb-3"
            style={{ color: "#0077B6" }}
            data-aos="fade-down"
            data-aos-delay="100"
          >
            Why Partner With <span style={{ color: "#00B4D8" }}>Bluefins?</span>
          </h2>
          <p
            className="text-muted mb-5"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Proven expertise in delivering institutional-grade aquatic programs and services.
          </p>

          {/* Cards */}
          <div className="row g-4 justify-content-center">
            {[
              {
                icon: "📋",
                title: "Customized Programs",
                desc: "Tailored training curricula designed specifically for your institution's needs.",
              },
              {
                icon: "🏢",
                title: "Institutional Expertise",
                desc: "Experience managing programs for schools, academies, and resort facilities.",
              },
              {
                icon: "👥",
                title: "Professional Coaches",
                desc: "Certified trainers with backgrounds in competitive and recreational instruction.",
              },
              {
                icon: "📊",
                title: "Performance Tracking",
                desc: "Comprehensive reporting and progress documentation for institutional clients.",
              },
            ].map((item, idx) => (
              <div
                className="col-10 col-sm-6 col-lg-3"
                key={idx}
                data-aos="zoom-in-up"
                data-aos-delay={idx * 150}
                data-aos-duration="1000"
              >
                <div
                  className="card h-100 border-0 shadow-sm p-4 rounded-4 bg-white"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(230,250,255,0.9) 100%)",
                    boxShadow: "0 8px 24px rgba(0,180,216,0.15)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 30px rgba(0,180,216,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(0,180,216,0.15)";
                  }}
                >
                  {/* Icon */}
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{
                      width: "70px",
                      height: "70px",
                      background:
                        "linear-gradient(135deg, #00B4D8, #48CAE4, #90E0EF)",
                      boxShadow: "0 0 18px rgba(0,180,216,0.4)",
                      color: "white",
                      fontSize: "30px",
                    }}
                    data-aos="zoom-in"
                    data-aos-delay={idx * 200 + 200}
                  >
                    {item.icon}
                  </div>

                  {/* Text */}
                  <h5
                    className="fw-semibold"
                    style={{ color: "#0077B6" }}
                    data-aos="fade-up"
                    data-aos-delay={idx * 200 + 250}
                  >
                    {item.title}
                  </h5>
                  <p
                    className="text-muted small mb-0"
                    data-aos="fade-up"
                    data-aos-delay={idx * 200 + 300}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>




      {/* ===================== GALLERY ===================== */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{
          display: "block",
          width: "100%",
          height: "80px",
          backgroundColor: '#daf2f592',
        }}
      >
        <path
          fill="#afdffae0"
          d="M0,64L60,58.7C120,53,240,43,360,53.3C480,64,600,96,720,106.7C840,117,960,107,1080,90.7C1200,75,1320,53,1380,42.7L1440,32V120H0Z"
        ></path>
      </svg>
      <section
        className="py-5"
        style={{ background: "#bae2fdff" }}
      >
        <div className="container text-center">
          <h2
            className="fw-semibold"
            style={{ color: "#0077B6" }}
            data-aos="fade-down"
            data-aos-delay="100"
          >
            Gallery
          </h2>
          <p
            className="text-muted"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Every splash tells a story.
          </p>

          <div className="row g-3 mt-2">
            {[
              "https://plus.unsplash.com/premium_photo-1719501573802-8f2ae92cd7ee?auto=format&fit=crop&q=80&w=1333",
              "https://images.unsplash.com/photo-1701602346238-41222bfb4896?auto=format&fit=crop&q=80&w=880",
              "https://images.unsplash.com/photo-1633430480411-9b0e11d8202e?auto=format&fit=crop&q=80&w=1332",
              "https://images.unsplash.com/photo-1657673461323-206b06c9d386?auto=format&fit=crop&q=80&w=1170",
              "https://images.unsplash.com/photo-1592010411469-30da799fafa3?auto=format&fit=crop&q=80&w=1170",
              "https://images.unsplash.com/photo-1730244548329-4ae2f4fcaa7c?auto=format&fit=crop&q=80&w=1332",
            ].map((src, i) => (
              <div
                className="col-6 col-md-4"
                key={i}
                data-aos="zoom-in"
                data-aos-delay={i * 150}
                data-aos-duration="900"
              >
                <div
                  className="soft"
                  style={{
                    overflow: "hidden",
                    borderRadius: 16,
                    boxShadow: "0 8px 25px rgba(0, 180, 216, 0.1)",
                    transition: "transform .35s ease",
                  }}
                >
                  <img
                    src={src}
                    alt={`Gallery ${i + 1}`}
                    className="img-fluid"
                    style={{
                      transform: "scale(1.02)",
                      transition: "transform .35s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1.02)")
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <NavLink
            to="/about"
            className="btn btn-primary rounded-pill mt-4 px-4 py-2 soft glow-hover"
            style={{
              background: "#0077B6",
              borderColor: "#0077B6",
            }}
            data-aos="zoom-in-up"
            data-aos-delay="500"
          >
            View More
          </NavLink>
        </div>
      </section>


      {/* ===================== TESTIMONIALS (Futuristic Gen-Z) ===================== */}
      <svg
        data-name="Layer 1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        style={{
          position: 'relative',
          display: 'block',
          width: 'calc(100% + 1.3px)',
          height: '50px',
          color: 'red',
          transform: 'rotateY(180deg)',

        }}
      >
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          style={{ fill: '#bae2fdff' }}
        ></path>
      </svg>
      <section
        id="testimonials"
        className="py-5 text-center"
        style={{
          background: "linear-gradient(180deg, #F9FDFF 0%, #E8F9FF 100%)",
        }}
        data-aos="fade-up"
        data-aos-duration="1000"
        data-aos-offset="100"
      >
        <div className="container">
          <h2
            className="fw-bold mb-3"
            style={{
              color: "#0077B6",
              textShadow: "0 0 8px rgba(0,180,216,0.2)",
            }}
            data-aos="fade-down"
            data-aos-delay="100"
          >
            What Our Partners Say 💬
          </h2>

          <p
            className="text-muted mb-5"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Trusted by leading schools, academies, and resorts across the region.
          </p>

          <div className="row g-4">
            {[
              {
                name: "Director, Metro Sports Academy",
                text: "Bluefins transformed our aquatic program with professional training and excellent management. Our students' performance improved significantly.",
                emoji: "🏫",
              },
              {
                name: "Manager, Luxury Resort",
                text: "Outstanding pool management and guest training services. The team is professional, responsive, and maintains impeccable facility standards.",
                emoji: "�️",
              },
              {
                name: "Principal, Valley International School",
                text: "Excellent coaching programs and detailed performance reports. Highly recommended for institutional partnerships.",
                emoji: "🎓",
              },
            ].map((t, i) => (
              <div
                className="col-md-4"
                key={i}
                data-aos="zoom-in-up"
                data-aos-delay={i * 200}
                data-aos-duration="1000"
              >
                <div
                  className="card h-100 border-0 shadow-sm p-4 rounded-4"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(230,250,255,0.95))",
                    boxShadow: "0 8px 30px rgba(0,180,216,0.15)",
                    transition: "all 0.4s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 40px rgba(0,180,216,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(0,180,216,0.15)";
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "70px",
                      height: "70px",
                      background:
                        "linear-gradient(135deg, #00B4D8, #48CAE4, #80ED99)",
                      color: "white",
                      fontSize: "2rem",
                      boxShadow: "0 0 18px rgba(0,180,216,0.4)",
                    }}
                    data-aos="zoom-in"
                    data-aos-delay={i * 250 + 100}
                  >
                    {t.emoji}
                  </div>

                  {/* Rating */}
                  <div
                    className="mb-2"
                    style={{
                      color: "#FFD166",
                      fontSize: "1.1rem",
                      letterSpacing: "2px",
                    }}
                    data-aos="fade-up"
                    data-aos-delay={i * 250 + 150}
                  >
                    ★★★★★
                  </div>

                  {/* Text */}
                  <p
                    className="mb-3"
                    style={{ color: "#475569", fontSize: "0.95rem" }}
                    data-aos="fade-up"
                    data-aos-delay={i * 250 + 200}
                  >
                    “{t.text}”
                  </p>

                  {/* Name */}
                  <div
                    className="fw-semibold"
                    style={{ color: "#0077B6" }}
                    data-aos="fade-up"
                    data-aos-delay={i * 250 + 250}
                  >
                    {t.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            className="mt-5"
            data-aos="zoom-in-up"
            data-aos-delay="700"
            data-aos-duration="1000"
          >
            <NavLink
              to="/contact"
              className="btn fw-semibold rounded-pill px-4 py-2 text-white"
              style={{
                background: "linear-gradient(90deg, #00B4D8, #48CAE4, #80ED99)",
                border: "none",
                boxShadow: "0 0 20px rgba(0,180,216,0.25)",
                transition: "all 0.4s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 0 30px rgba(72,202,228,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(0,180,216,0.25)";
              }}
            >
              Share Your Experience
            </NavLink>
          </div>
        </div>
      </section>



      {/* ===================== CTA ===================== */}
      {/* ===================== FUTURISTIC CTA ===================== */}
      <section
        id="contact"
        className="text-center position-relative overflow-hidden py-5"
        style={{
          background: "linear-gradient(135deg, #00B4D8, #48CAE4, #90E0EF)",
          color: "#ffffff",
        }}
     
      >
        {/* Floating Glow Orbs */}
        <div
          className="position-absolute rounded-circle"
          style={{
            width: "220px",
            height: "220px",
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.25), transparent)",
            top: "-60px",
            left: "-40px",
            filter: "blur(40px)",
          }}
          data-aos="fade-right"
          data-aos-delay="200"
        ></div>

        <div
          className="position-absolute rounded-circle"
          style={{
            width: "300px",
            height: "300px",
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.25), transparent)",
            bottom: "-100px",
            right: "-80px",
            filter: "blur(50px)",
          }}
          data-aos="fade-left"
          data-aos-delay="300"
        ></div>

        {/* CTA Content */}
        <div
          className="container position-relative py-5"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h2
            className="fw-bold mb-3"
            style={{
              fontSize: "2rem",
              textShadow: "0 0 15px rgba(255,255,255,0.4)",
            }}
            data-aos="zoom-in"
            data-aos-delay="300"
          >
            🚀 Ready to Elevate Your Aquatic Program?
          </h2>

          <p
            className="lead mb-4"
            style={{
              opacity: 0.95,
              fontWeight: "400",
            }}
            data-aos="fade-up"
            data-aos-delay="400"
          >
            Let's partner to deliver professional swimming training and pool management solutions 
            that exceed expectations. Contact us for a consultation and proposal.
          </p>

          {/* Call-to-Action Button */}
          <NavLink
            to="/contact"
            className="btn fw-semibold rounded-pill px-5 py-3 text-white"
            style={{
              background:
                "linear-gradient(90deg, #0077B6, #00B4D8, #48CAE4)",
              backgroundSize: "200% 200%",
              border: "none",
              boxShadow: "0 0 25px rgba(255,255,255,0.25)",
              transition: "all 0.4s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundPosition = "100% 0%";
              e.currentTarget.style.boxShadow =
                "0 0 40px rgba(255,255,255,0.45)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundPosition = "0% 0%";
              e.currentTarget.style.boxShadow =
                "0 0 25px rgba(255,255,255,0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            data-aos="zoom-in-up"
            data-aos-delay="600"
          >
            � Request a Proposal
          </NavLink>
        </div>

        {/* Bottom Wave Divider */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="position-absolute bottom-0 start-0 w-100"
          data-aos="fade-up"
          data-aos-delay="700"
        >
          <path
            fill="#ffffff"
            d="M0,64L60,69.3C120,75,240,85,360,85.3C480,85,600,75,720,74.7C840,75,960,85,1080,90.7C1200,96,1320,96,1380,85.3L1440,75V120H0Z"
          ></path>
        </svg>
      </section>


    </div>
  );
};

export default Home;



{/* <svg
  data-name="Layer 1"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 1200 120"
  preserveAspectRatio="none"
  style={{
    position: 'relative',
    display: 'block',
    width: 'calc(100% + 1.3px)',
    height: '50px',
    color: 'red',
    transform: 'rotateY(180deg)'
  }}
>
  <path
    d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
    style={{ fill: 'rgba(113, 162, 241, 0.05)' }}
  ></path>
</svg> */}