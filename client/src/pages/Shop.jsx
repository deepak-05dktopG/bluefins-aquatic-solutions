import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import Navbar from "../components/Navbar";
const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  // Swimming accessories products
  const products = [
    {
      id: 1,
      name: "Professional Swimming Goggles",
      category: "accessories",
      price: "₹899",
      description: "Anti-fog swimming goggles with UV protection",
      image: "/assets/accesosaries/goggles1.jpg",
      color: "#4ECDC4",
    },
    {
      id: 2,
      name: "Mirrored Racing Goggles",
      category: "accessories",
      price: "₹1,199",
      description: "Competitive racing goggles with mirrored lens",
      image: "/assets/accesosaries/goggles2.jpg",
      color: "#4ECDC4",
    },
    {
      id: 3,
      name: "Junior Swimming Goggles",
      category: "accessories",
      price: "₹699",
      description: "Comfortable goggles designed for kids",
      image: "/assets/accesosaries/goggles3.jpg",
      color: "#4ECDC4",
    },
    {
      id: 4,
      name: "Premium Anti-Fog Goggles",
      category: "accessories",
      price: "₹1,499",
      description: "Premium goggles with advanced anti-fog technology",
      image: "/assets/accesosaries/goggles4.jpg",
      color: "#4ECDC4",
    },
    {
      id: 5,
      name: "Classic Swimming Goggles",
      category: "accessories",
      price: "₹799",
      description: "Classic design with comfortable silicone seal",
      image: "/assets/accesosaries/goggles5.jpg",
      color: "#4ECDC4",
    },
    {
      id: 6,
      name: "Pull Buoy - Standard",
      category: "accessories",
      price: "₹599",
      description: "Essential training aid for upper body strength",
      image: "/assets/accesosaries/pullbuoy1.jpg",
      color: "#667eea",
    },
    {
      id: 7,
      name: "Pull Buoy - Professional",
      category: "accessories",
      price: "₹799",
      description: "Professional-grade pull buoy for advanced training",
      image: "/assets/accesosaries/pullbuoy2.jpg",
      color: "#667eea",
    },
    {
      id: 8,
      name: "Pull Buoy - Ergonomic",
      category: "accessories",
      price: "₹899",
      description: "Ergonomic design for maximum comfort during training",
      image: "/assets/accesosaries/pullbuoy3.jpg",
      color: "#667eea",
    },
    {
      id: 9,
      name: "Pull Buoy - Competition",
      category: "accessories",
      price: "₹1,099",
      description: "Competition-grade pull buoy for serious swimmers",
      image: "/assets/accesosaries/pullbuoy4.jpg",
      color: "#667eea",
    },
    {
      id: 10,
      name: "Swimming Kickboard - Basic",
      category: "accessories",
      price: "₹499",
      description: "Durable kickboard for leg strength training",
      image: "/assets/accesosaries/swimmingboard1.jpg",
      color: "#FF6B6B",
    },
    {
      id: 11,
      name: "Swimming Kickboard - Pro",
      category: "accessories",
      price: "₹699",
      description: "Professional kickboard with ergonomic grip",
      image: "/assets/accesosaries/swimmingboard2.jpg",
      color: "#FF6B6B",
    },
    {
      id: 12,
      name: "Swimming Kickboard - Junior",
      category: "accessories",
      price: "₹449",
      description: "Lightweight kickboard perfect for kids",
      image: "/assets/accesosaries/swimmingboard3.jpg",
      color: "#FF6B6B",
    },
    {
      id: 13,
      name: "Swimming Kickboard - Advanced",
      category: "accessories",
      price: "₹799",
      description: "Advanced kickboard with hydrodynamic design",
      image: "/assets/accesosaries/swimmingboard4.jpg",
      color: "#FF6B6B",
    },
  ];

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

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
                 <img src="/public/assets/accesosaries/swimmingboard4.jpg" alt="🏊" />
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

      {/* ===================== CATEGORY FILTERS ===================== */}
      <section className="py-5" style={{ background: "#f5f3ff" }}>
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h3 style={{ color: "#001f3f", marginBottom: "1.5rem", fontSize: "2rem", fontWeight: "700" }}>
              Browse Our <span style={{ background: "linear-gradient(90deg, #FF6B6B, #667eea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Collections</span>
            </h3>
          </div>
          {/* <div className="d-flex justify-content-center flex-wrap" data-aos="fade-up" data-aos-delay="200">
            <button
              className={`category-btn ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All Products
            </button>
            <button
              className={`category-btn ${selectedCategory === "kits" ? "active" : ""}`}
              onClick={() => setSelectedCategory("kits")}
            >
              Swimming Kits
            </button>
            <button
              className={`category-btn ${selectedCategory === "swimwear" ? "active" : ""}`}
              onClick={() => setSelectedCategory("swimwear")}
            >
              Swimwear
            </button>
            <button
              className={`category-btn ${selectedCategory === "accessories" ? "active" : ""}`}
              onClick={() => setSelectedCategory("accessories")}
            >
              Accessories
            </button>
          </div> */}
        </div>
      </section>

      {/* ===================== PRODUCTS GRID ===================== */}
      <section className="py-5" style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #fff5f0 50%, #f0f9ff 100%)" }}>
        <div className="container">
          <div className="row g-4">
            {filteredProducts.map((product, i) => (
              <div
                className="col-md-6 col-lg-4"
                key={product.id}
                data-aos="zoom-in"
                data-aos-delay={i * 150}
              >
                <div 
                  className="product-card h-100"
                  style={{
                    "--color": product.color,
                    "--color-light": product.color + "dd",
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                  />
                  <div className="product-info">
                    <h5 style={{ color: product.color, fontWeight: "700", marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                      {product.name}
                    </h5>
                    <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem", lineHeight: 1.6 }}>
                      {product.description}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {/* <span style={{ color: product.color, fontSize: "1.3rem", fontWeight: "800" }}>
                        {product.price}
                      </span> */}
                      {/* <button
                        style={{
                          background: `linear-gradient(135deg, ${product.color}, ${product.color}dd)`,
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: `0 4px 15px ${product.color}40`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = `0 8px 25px ${product.color}60`;
                          e.currentTarget.style.transform = "scale(1.08) translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = `0 4px 15px ${product.color}40`;
                          e.currentTarget.style.transform = "scale(1) translateY(0)";
                        }}
                      >
                        Buy
                      </button> */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-5">
              <p style={{ color: "#666", fontSize: "1.1rem" }}>
                No products found in this category.
              </p>
            </div>
          )}
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
