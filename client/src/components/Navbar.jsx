/**
 * What it is: Website top navigation bar component.
 * Non-tech note: This controls the menu links at the top of the site.
 */

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Container, Nav, Navbar as BsNavbar } from "react-bootstrap";

/**
 * Purpose: Do Navbar
 * Plain English: What this function is used for.
 */
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  useEffect(/**
   * Purpose: React effect callback (runs after render based on dependencies)
   * Plain English: What this function is used for.
   */
  () => {
    /**
     * Purpose: Handle Scroll
     * Plain English: What this function is used for.
     */
    const handleScroll = () => {
      return setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return (
      /**
       * Purpose: Helper callback used inside a larger operation
       * Plain English: What this function is used for.
       */
      () => {
        return window.removeEventListener("scroll", handleScroll);
      }
    );
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

  /**
   * Purpose: Do Link Style
   * Plain English: What this function is used for.
   */
  const linkStyle = path => {
    return ({
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

      transition: "all 0.3s ease"
    });
  };

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

  /**
   * Purpose: Handle Hover
   * Plain English: What this function is used for.
   */
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
        onToggle={/**
         * Purpose: Helper callback used inside a larger operation
         * Plain English: What this function is used for.
         */
        () => {
          return setExpanded(!expanded);
        }}
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
            onClick={/**
             * Purpose: Helper callback used inside a larger operation
             * Plain English: What this function is used for.
             */
            () => {
              return setExpanded(false);
            }}
            onDoubleClick={/**
             * Purpose: Helper callback used inside a larger operation
             * Plain English: What this function is used for.
             */
            () => {
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
              className="main-navbar__brand-title"
              style={{
                margin: 0,
                fontSize: "clamp(1.05rem, 3.2vw, 1.5rem)",
                fontWeight: 800,
                letterSpacing: "0.6px",
                background: "linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: isScrolled ? "none" : "0 2px 10px rgba(0, 0, 0, 0.25)",
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
              {links.map(/**
               * Purpose: Array mapping callback (converts each item to a new value)
               * Plain English: What this function is used for.
               */
              item => {
                return (
                  <Nav.Link
                    key={item.path}
                    as={Link}
                    to={item.path}
                    onClick={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    () => {
                      return setExpanded(false);
                    }}
                    className="main-navbar__link"
                    style={linkStyle(item.path)}
                    onMouseEnter={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      if (location.pathname !== item.path)
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.15)";
                    }}
                    onMouseLeave={/**
                     * Purpose: Helper callback used inside a larger operation
                     * Plain English: What this function is used for.
                     */
                    e => {
                      if (location.pathname !== item.path)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item.label}
                  </Nav.Link>
                );
              })}
            </Nav>

            {/* CTA Button */}
            <div className="d-flex justify-content-center justify-content-lg-end gap-2 mt-3 mt-lg-0 main-navbar__cta">
              
              <Link to="/admin" onClick={/**
               * Purpose: Helper callback used inside a larger operation
               * Plain English: What this function is used for.
               */
              () => {
                return setExpanded(false);
              }}>
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
                  onMouseEnter={/**
                   * Purpose: Helper callback used inside a larger operation
                   * Plain English: What this function is used for.
                   */
                  e => {
                    e.currentTarget.style.backgroundPosition = "100% 0%";
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 107, 107, 0.6)";
                  }}
                  onMouseLeave={/**
                   * Purpose: Helper callback used inside a larger operation
                   * Plain English: What this function is used for.
                   */
                  e => {
                    e.currentTarget.style.backgroundPosition = "0% 0%";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(255, 107, 107, 0.3)";
                  }}
                >
                  Login
                </Button>
              </Link>
              
              <Link to="/contact" onClick={/**
               * Purpose: Helper callback used inside a larger operation
               * Plain English: What this function is used for.
               */
              () => {
                return setExpanded(false);
              }}>
                <Button
                  style={buttonStyle}
                  onMouseEnter={/**
                   * Purpose: Helper callback used inside a larger operation
                   * Plain English: What this function is used for.
                   */
                  e => {
                    return handleHover(e, true);
                  }}
                  onMouseLeave={/**
                   * Purpose: Helper callback used inside a larger operation
                   * Plain English: What this function is used for.
                   */
                  e => {
                    return handleHover(e, false);
                  }}
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
