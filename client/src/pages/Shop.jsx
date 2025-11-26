import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Navbar from "../components/Navbar";

const Shop = () => {

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

  // Organized products by type - dynamically loaded from folder structure
  const productCategories = {
    uvShieldAdult: {
      title: "UV Shield Goggles - Adult",
      description: "Advanced UV protection swimming goggles for adults",
      color: "#4ECDC4",
      icon: "🥽",
      images: [
        "/assets/accesosaries/uv shield for adult/goggles1.jpg",
        "/assets/accesosaries/uv shield for adult/goggles2.jpg",
        "/assets/accesosaries/uv shield for adult/goggles3.jpg",
      ]
    },
    uvShieldKids: {
      title: "UV Shield Goggles - Kids",
      description: "UV protection swimming goggles specially designed for children",
      color: "#FF6B6B",
      icon: "🧒",
      images: [
        "/assets/accesosaries/uv shield for kids/goggles1.jpg",
        "/assets/accesosaries/uv shield for kids/goggles2.jpg",
        "/assets/accesosaries/uv shield for kids/goggles3.jpg",
        "/assets/accesosaries/uv shield for kids/goggles4.jpg",
        "/assets/accesosaries/uv shield for kids/goggles5.jpg",
        "/assets/accesosaries/uv shield for kids/WhatsApp Image 2025-11-26 at 14.51.27_1265c5f2.jpg",
        "/assets/accesosaries/uv shield for kids/WhatsApp Image 2025-11-26 at 14.51.27_6da8a74f.jpg",
        "/assets/accesosaries/uv shield for kids/WhatsApp Image 2025-11-26 at 14.51.27_7b26a4b4.jpg",
      ]
    },
    airProtectionCap: {
      title: "Air Protection Swimming Caps",
      description: "Breathable air protection caps for comfortable swimming",
      color: "#667eea",
      icon: "🧢",
      images: [
        "/assets/accesosaries/air protection cap/WhatsApp Image 2025-11-26 at 14.53.19_ec5c9a83.jpg",
        "/assets/accesosaries/air protection cap/WhatsApp Image 2025-11-26 at 14.53.20_555befde.jpg",
        "/assets/accesosaries/air protection cap/WhatsApp Image 2025-11-26 at 14.53.20_8d9c0fd0.jpg",
      ]
    },
    armPad: {
      title: "Arm Floats & Pads",
      description: "Safety arm floats and pads for beginners and kids",
      color: "#FFD93D",
      icon: "🏊‍♂️",
      images: [
        "/assets/accesosaries/arm pad/WhatsApp Image 2025-11-26 at 14.52.22_0166343b.jpg",
        "/assets/accesosaries/arm pad/WhatsApp Image 2025-11-26 at 14.52.23_61845fce.jpg",
        "/assets/accesosaries/arm pad/WhatsApp Image 2025-11-26 at 14.52.23_761d01f8.jpg",
      ]
    },
    bubbleCap: {
      title: "Bubble Caps - Kids & Adults",
      description: "Comfortable bubble caps suitable for all ages",
      color: "#FF9FF3",
      icon: "🎈",
      images: [
        "/assets/accesosaries/bubble cap for kids and adults/WhatsApp Image 2025-11-26 at 14.54.23_7fc43a39.jpg",
        "/assets/accesosaries/bubble cap for kids and adults/WhatsApp Image 2025-11-26 at 14.54.24_26163cc7.jpg",
        "/assets/accesosaries/bubble cap for kids and adults/WhatsApp Image 2025-11-26 at 14.54.24_2ac9dfbe.jpg",
        "/assets/accesosaries/bubble cap for kids and adults/WhatsApp Image 2025-11-26 at 14.54.24_8cb21e7d.jpg",
      ]
    },
    capsKids: {
      title: "Swimming Caps - Kids",
      description: "Colorful and comfortable swimming caps for children",
      color: "#4ECDC4",
      icon: "👶",
      images: [
        "/assets/accesosaries/caps for kids/WhatsApp Image 2025-11-26 at 14.51.51_51dc6a94.jpg",
        "/assets/accesosaries/caps for kids/WhatsApp Image 2025-11-26 at 14.51.52_0b30df10.jpg",
        "/assets/accesosaries/caps for kids/WhatsApp Image 2025-11-26 at 14.51.52_1682b1c3.jpg",
        "/assets/accesosaries/caps for kids/WhatsApp Image 2025-11-26 at 14.51.52_e6443b3b.jpg",
      ]
    },
    capsKidsAdult: {
      title: "Swimming Caps - Kids & Adults",
      description: "Versatile swimming caps for all age groups",
      color: "#667eea",
      icon: "👨‍👩‍👧‍👦",
      images: [
        "/assets/accesosaries/caps for kids and adult/WhatsApp Image 2025-11-26 at 14.53.50_4287b254.jpg",
        "/assets/accesosaries/caps for kids and adult/WhatsApp Image 2025-11-26 at 14.53.50_9c6f32b2.jpg",
        "/assets/accesosaries/caps for kids and adult/WhatsApp Image 2025-11-26 at 14.53.51_3b75f113.jpg",
        "/assets/accesosaries/caps for kids and adult/WhatsApp Image 2025-11-26 at 14.53.51_6abdf24c.jpg",
        "/assets/accesosaries/caps for kids and adult/WhatsApp Image 2025-11-26 at 14.53.51_9d7f0947.jpg",
        "/assets/accesosaries/caps for kids and adult/WhatsApp Image 2025-11-26 at 14.53.51_e9feafaf.jpg",
        "/assets/accesosaries/caps for kids and adult/WhatsApp Image 2025-11-26 at 14.53.52_939a373d.jpg",
      ]
    },
    fins: {
      title: "Swimming Fins - Kids & Adults",
      description: "High-quality swimming fins for training and fun",
      color: "#FF6B6B",
      icon: "🦈",
      images: [
        "/assets/accesosaries/fins for kids and adults/WhatsApp Image 2025-11-26 at 14.52.47_2840e466.jpg",
        "/assets/accesosaries/fins for kids and adults/WhatsApp Image 2025-11-26 at 14.52.47_aeeccdbb.jpg",
        "/assets/accesosaries/fins for kids and adults/WhatsApp Image 2025-11-26 at 14.52.48_26341c6f.jpg",
        "/assets/accesosaries/fins for kids and adults/WhatsApp Image 2025-11-26 at 14.52.48_6e174a8c.jpg",
        "/assets/accesosaries/fins for kids and adults/WhatsApp Image 2025-11-26 at 14.52.48_9e74271f.jpg",
      ]
    },
    pullBuoys: {
      title: "Pull Buoys",
      description: "Essential training aids for upper body strength development",
      color: "#764ba2",
      icon: "🏊",
      images: [
        "/assets/accesosaries/pullbuoys/pullbuoy1.jpg",
        "/assets/accesosaries/pullbuoys/pullbuoy2.jpg",
        "/assets/accesosaries/pullbuoys/pullbuoy3.jpg",
        "/assets/accesosaries/pullbuoys/pullbuoy4.jpg",
      ]
    },
    kickboards: {
      title: "Swimming Kickboards",
      description: "Durable kickboards for effective leg strength training",
      color: "#f5576c",
      icon: "🏄",
      images: [
        "/assets/accesosaries/swimmingboard/swimmingboard1.jpg",
        "/assets/accesosaries/swimmingboard/swimmingboard2.jpg",
        "/assets/accesosaries/swimmingboard/swimmingboard3.jpg",
        "/assets/accesosaries/swimmingboard/swimmingboard4.jpg",
      ]
    }
  };

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  return (
    <div style={{ fontFamily: "Poppins, system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
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
        .product-card {
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          transition: all 0.45s ease;
          position: relative;
          border: 2px solid transparent;
        }
        .product-card:hover {
          transform: translateY(-12px) scale(1.03);
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .product-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, var(--color), var(--color-light));
        }
        .product-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          background: linear-gradient(135deg, var(--color), var(--color-light));
          transition: transform 0.4s ease;
          position: relative;
        }
        .product-card:hover .product-image {
          transform: scale(1.08);
        }
        .product-info {
          padding: 24px;
        }
        .category-btn {
          padding: 10px 24px;
          border: 2px solid #667eea;
          background: transparent;
          color: #667eea;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 700;
          margin-right: 12px;
          margin-bottom: 12px;
          fontSize: 0.95rem;
        }
        .category-btn:hover,
        .category-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-color: transparent;
          transform: scale(1.05);
        }
        .slick-prev:before, .slick-next:before {
          color: #667eea !important;
          font-size: 30px !important;
        }
        .slick-dots li button:before {
          color: #667eea !important;
          font-size: 12px !important;
        }
        .slick-dots li.slick-active button:before {
          color: #FF6B6B !important;
        }
        .category-section {
          margin-bottom: 80px;
        }
        .category-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px 20px;
          background: rgba(255,255,255,0.6);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
      `}</style>
      <Navbar />

      {/* ===================== HERO ===================== */}
      <section
        style={{
          position: "relative",
          color: "white",
          padding: "80px 0 40px",
          background: "linear-gradient(135deg, #FFD93D, #FF9FF3, #4ECDC4, #667eea)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 12s ease infinite",
          minHeight: "auto",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container container pb-lg-5 pb-0 ">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right" data-aos-delay="100">
              <h1
                className="fw-bold"
                style={{
                  fontSize: "4rem",
                  lineHeight: 1.05,
                  marginBottom: "1.5rem",
                  color: "#fff",
                  textShadow: "0 4px 15px rgba(0,0,0,0.2)",
                }}
              >
                Bluefins <span style={{ color: "#FFE66D" }}>Shop</span>
              </h1>
              <p style={{ fontSize: "1.2rem", opacity: 0.95, marginBottom: "2rem", lineHeight: 1.9, fontWeight: "500" }}>
                Premium swimming kits, professional gear, and institutional equipment for schools, academies, and resorts. Everything you need for excellence in aquatic training.
              </p>
              <div className="d-flex gap-3  pb-lg-5 pb-0  flex-wrap">
                <NavLink to="/contact">
                  <button
                    style={{
                      background: "#fff",
                      color: "#667eea",
                      border: "none",
                      padding: "14px 32px",
                      borderRadius: "50px",
                      fontWeight: "700",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 8px 25px rgba(255,255,255,0.4)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                    }}
                  >
                    🛒 Shop Now
                  </button>
                </NavLink>
              </div>
            </div>
            <div className="col-lg-6" data-aos="fade-left" data-aos-delay="300">
              <div
                style={{
                  position: "relative",
                  height: "450px",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(102,126,234,0.15))",
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
                    fontSize: "1rem",
                    opacity: 0.25,
                    animation: "floatUp 4s ease-in-out infinite",
                  }}
                >
                 <img src="/assets/accesosaries/bubble cap for kids and adults/WhatsApp Image 2025-11-26 at 14.54.23_7fc43a39.jpg" alt="🏊" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -2, left: 0, width: "100%" }}
        >
          <defs>
            <linearGradient id="shopHeroWave" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: "rgba(102,126,234,0.2)", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#f5f3ff", stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path fill="url(#shopHeroWave)" d="M0,100 Q180,50 360,100 T720,100 T1080,100 T1440,100 L1440,200 L0,200 Z"></path>
        </svg>
      </section>

      {/* ===================== PRODUCTS CAROUSELS BY CATEGORY ===================== */}
      <section className="py-5" style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #fff5f0 50%, #f0f9ff 100%)" }}>
        <div className="container">
          {Object.entries(productCategories).map(([key, category], categoryIndex) => (
            <div key={key} className="category-section" data-aos="fade-up" data-aos-delay={categoryIndex * 200}>
              {/* Category Header */}
              <div className="category-header">
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>{category.icon}</div>
                <h2 style={{ 
                  color: category.color, 
                  fontSize: "2.5rem", 
                  fontWeight: "800", 
                  marginBottom: "10px",
                  textShadow: `2px 2px 4px ${category.color}40`
                }}>
                  {category.title}
                </h2>
                <p style={{ color: "#666", fontSize: "1.1rem", fontWeight: "500", margin: 0 }}>
                  {category.description}
                </p>
              </div>

              {/* Products Carousel */}
              <Slider {...carouselSettings}>
                {category.images.map((imagePath, i) => (
                  <div key={i} style={{ padding: "0 15px" }}>
                    <div 
                      className="product-card h-100"
                      style={{
                        "--color": category.color,
                        "--color-light": category.color + "dd",
                        margin: "10px",
                      }}
                    >
                      <img
                        src={imagePath}
                        alt={`${category.title} - ${i + 1}`}
                        className="product-image"
                        style={{
                          width: "100%",
                          height: "300px",
                          objectFit: "contain",
                          background: "#f8f9fa",
                        }}
                      />
                      <div className="product-info" style={{ textAlign: "center", padding: "20px" }}>
                        <h5 style={{ 
                          color: category.color, 
                          fontWeight: "700", 
                          marginBottom: "0.5rem", 
                          fontSize: "1.1rem",
                        }}>
                          {category.title}
                        </h5>
                        <p style={{ 
                          color: "#666", 
                          fontSize: "0.85rem", 
                          margin: 0,
                          lineHeight: 1.4
                        }}>
                          View {i + 1} of {category.images.length}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== WHY CHOOSE US ===================== */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(135deg, #667eea, #764ba2, #f093fb, #f5576c)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 15s ease infinite",
          position: "relative",
        }}
      >
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="fw-bold" style={{ fontSize: "2.8rem", marginBottom: "1rem", color: "#fff" }}>
              Why Choose Bluefins Shop
            </h2>
          </div>

          <div className="row g-4">
            {[
              { icon: "🚚", title: "Fast Delivery", desc: "Quick shipping across Tamil Nadu & Kerala" },
              { icon: "💯", title: "Quality Assured", desc: "Premium brands and certified products" },
              { icon: "💰", title: "Best Prices", desc: "Competitive pricing for bulk orders" },
              { icon: "🔄", title: "Easy Returns", desc: "7-day return policy on all items" },
            ].map((item, i) => (
              <div className="col-md-6 col-lg-3" key={i} data-aos="zoom-in" data-aos-delay={i * 100}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    padding: "30px",
                    borderRadius: "18px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    transition: "all 0.4s ease",
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                    textAlign: "center",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                    e.currentTarget.style.transform = "translateY(-10px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "1rem", animation: "pulse 2.5s ease-in-out infinite" }}>
                    {item.icon}
                  </div>
                  <h5 style={{ color: "#FFE66D", fontWeight: "700", marginBottom: "0.8rem", fontSize: "1.1rem" }}>
                    {item.title}
                  </h5>
                  <p style={{ fontSize: "0.9rem", lineHeight: 1.6, margin: "0", fontWeight: "500", opacity: 0.9 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -2, left: 0, width: "100%" }}
        >
          <path fill="#fff5f0" d="M0,40 Q360,80 720,40 T1440,40 L1440,120 L0,120 Z"></path>
        </svg>
      </section>

      {/* ===================== CTA ===================== */}
      <section
        className="text-center position-relative overflow-hidden py-5"
        style={{
          background: "linear-gradient(180deg, #fff5f0 0%, #f0f9ff 100%)",
          color: "#001f3f",
        }}
      >
        <div className="container position-relative py-5" data-aos="fade-up" data-aos-delay="200">
          <h2 className="fw-bold mb-3" style={{ fontSize: "2.5rem", color: "#001f3f" }}>
            Looking for Bulk Orders?
          </h2>
          <p className="lead mb-4" style={{ opacity: 0.85, color: "#555", fontSize: "1.1rem", fontWeight: "500" }}>
            Contact us for special pricing and packages on large institutional orders for schools, academies, and resorts.
          </p>
          <NavLink to="/contact">
            <button
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #FFD93D, #667eea)",
                color: "white",
                border: "none",
                padding: "14px 40px",
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
              📞 Contact for Bulk Orders
            </button>
          </NavLink>
        </div>
      </section>
    </div>
  );
};

export default Shop;
