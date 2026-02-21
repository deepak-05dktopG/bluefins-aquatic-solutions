import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar as BsNavbar, Nav, Container, Button } from "react-bootstrap";
import { FaWater } from "react-icons/fa";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/programs", label: "Services" },
    { path: "/membership", label: "Membership" },
    { path: "/team", label: "Team" },
    { path: "/shop", label: "Shop" },
    { path: "/contact", label: "Contact" },
  ];

  // Navbar background logic
  const navbarStyle = {
    background: isScrolled
      ? "linear-gradient(135deg, rgba(0,180,216,0.9), rgba(0,119,182,0.9))"
      : "linear-gradient(135deg, rgba(0, 180, 216, 0), rgba(0, 118, 182, 0))",
    backdropFilter: "blur(12px)",
    boxShadow: isScrolled
      ? "0 4px 16px rgba(0,0,0,0.15)"
      : "0 2px 8px rgba(215, 182, 182, 0)",
    transition: "all 0.4s ease",
  };

  const linkStyle = (path) => ({
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.95rem",
    margin: "0.4rem 0.6rem",
    padding: "0.4rem 0.9rem",
    borderRadius: "12px",
    textTransform: "uppercase",
    background:
      location.pathname === path
        ? "linear-gradient(90deg, #48CAE4, #00B4D8)"
        : "transparent",
    transition: "all 0.3s ease",
  });

  const buttonStyle = {
    borderRadius: "50px",
    padding: "0.45rem 1.3rem",
    background: "linear-gradient(90deg,#00B4D8,#48CAE4,#90E0EF)",
    backgroundSize: "200% 200%",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    boxShadow: "0 0 12px rgba(255,255,255,0.3)",
    transition: "all 0.4s ease",
  };

  const handleHover = (e, enter) => {
    e.currentTarget.style.backgroundPosition = enter ? "100% 0%" : "0% 0%";
    e.currentTarget.style.transform = enter ? "scale(1.05)" : "scale(1)";
    e.currentTarget.style.boxShadow = enter
      ? "0 0 20px rgba(255,255,255,0.5)"
      : "0 0 12px rgba(255,255,255,0.3)";
  };

  return (
    <>
      <BsNavbar
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        expand="lg"
        fixed="top"
        style={navbarStyle}
        className={`py-1 main-navbar ${expanded ? 'main-navbar--expanded' : ''} ${isScrolled ? 'main-navbar--scrolled' : ''}`}
      >
        <Container>
          {/* Brand */}
          <BsNavbar.Brand
            as={Link}
            to="/"
            className="d-flex align-items-center"
            onClick={() => setExpanded(false)}
            onDoubleClick={() => {
              setClickCount(clickCount + 1);
              if (clickCount + 1 === 3) {
                navigate("/admin");
                setClickCount(0);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <img 
              src="/assets/Logo.png" 
              alt="Bluefins Logo" 
              style={{ 
                height: "45px", 
                width: "auto", 
                marginRight: "10px",
                filter: isScrolled ? "none" : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))"
              }} 
            />
            <span
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "clamp(1.15rem, 3.2vw, 1.3rem)",
                letterSpacing: "0.5px",
              }}
            >
              Bluefins
            </span>
          </BsNavbar.Brand>

          {/* Mobile Toggle */}
          <BsNavbar.Toggle
            aria-controls="main-nav"
            className="main-navbar__toggle"
            style={{
              border: "none",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "10px",
              padding: "6px 10px",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: "1.3rem",
                fontWeight: 700,
              }}
            >
              ☰
            </span>
          </BsNavbar.Toggle>

          {/* Nav Links */}
          <BsNavbar.Collapse id="main-nav" className="mt-3 mt-lg-0">
            <Nav className="mx-auto text-center text-lg-start main-navbar__links">
              {links.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={item.path}
                  onClick={() => setExpanded(false)}
                  className="main-navbar__link"
                  style={linkStyle(item.path)}
                  onMouseEnter={(e) => {
                    if (location.pathname !== item.path)
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== item.path)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>

            {/* CTA Button */}
            <div className="d-flex justify-content-center justify-content-lg-end gap-2 mt-3 mt-lg-0 main-navbar__cta">
              
              <Link to="/admin" onClick={() => setExpanded(false)}>
                <Button
                  style={{
                    borderRadius: "50px",
                    padding: "0.45rem 1.3rem",
                    background: "linear-gradient(90deg, #FF6B6B, #FFE66D)",
                    backgroundSize: "200% 200%",
                    border: "none",
                    color: "#fff",
                    fontWeight: 600,
                    boxShadow: "0 0 12px rgba(255, 107, 107, 0.3)",
                    transition: "all 0.4s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundPosition = "100% 0%";
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 107, 107, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundPosition = "0% 0%";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(255, 107, 107, 0.3)";
                  }}
                >
                  Login
                </Button>
              </Link>
              
              <Link to="/contact" onClick={() => setExpanded(false)}>
                <Button
                  style={buttonStyle}
                  onMouseEnter={(e) => handleHover(e, true)}
                  onMouseLeave={(e) => handleHover(e, false)}
                >
                  Get Quote
                </Button>
              </Link>
            </div>
          </BsNavbar.Collapse>
        </Container>
      </BsNavbar>
    </>
  );
};

export default Navbar;
