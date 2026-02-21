import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaTwitter,
} from "react-icons/fa";
import { Button } from "react-bootstrap";

const Footer = () => {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  return (
    <footer
      style={{
        background:
          "linear-gradient(135deg, #0077d8ff 0%, #07c6ecff 50%, #8061ddff 100%)",
        color: "white",
        paddingTop: "5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating Light Blobs */}
      <div
        className="position-absolute rounded-circle"
        style={{
          width: "250px",
          height: "250px",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.25), transparent)",
          top: "-60px",
          left: "-60px",
          filter: "blur(50px)",
        }}
      ></div>
      <div
        className="position-absolute rounded-circle"
        style={{
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.2), transparent)",
          bottom: "-80px",
          right: "-80px",
          filter: "blur(60px)",
        }}
      ></div>

      <Container>
        <Row className="g-5">
          {/* Column 1 – Brand Info */}
          <Col md={4}>
            <div 
              onClick={() => {
                navigate("/");
                setClickCount(0);
              }}
              style={{ cursor: "pointer", marginBottom: "15px" }}
            >
              <img 
                src="/assets/Logo.png" 
                alt="Bluefins Logo" 
                style={{ 
                  height: "70px", 
                  width: "auto", 
                  marginBottom: "10px",
                  filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))"
                }} 
              />
            </div>
            <h4
              className="fw-bold mb-3"
              style={{ fontSize: "1.6rem", textShadow: "0 0 10px rgba(255,255,255,0.3)" }}
            >
              Blue Fins Swimming Academy
            </h4>
            <p className="mb-4" style={{ opacity: 0.9, lineHeight: "1.8" }}>
              Dive into excellence with expert coaches, modern facilities,
              and programs crafted for every age & skill level.
            </p>
            <div className="d-flex gap-3">
              {[
                // { icon: <FaFacebookF />, link: "https://facebook.com" },
                { icon: <FaInstagram />, link: "https://www.instagram.com/bluefinsaquaticsolutions?utm_source=qr&igsh=MWNtcTlxaGphYWJiZg==" },
                { icon: <FaWhatsapp />, link: "https://wa.me/918838407511" },
                // { icon: <FaTwitter />, link: "https://twitter.com" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.link}
                  target="_blank"
                  rel="noreferrer"
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    color: "white",
                    fontSize: "1.1rem",
                    boxShadow: "0 0 10px rgba(255,255,255,0.2)",
                    transition: "all 0.4s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(90deg,#ffffff,#d7faff)";
                    e.currentTarget.style.color = "#0077B6";
                    e.currentTarget.style.transform = "scale(1.15)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(255,255,255,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.15)";
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 0 10px rgba(255,255,255,0.2)";
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </Col>

          {/* Column 2 – Quick Links */}
          <Col md={4}>
            <h5 className="fw-semibold mb-3" style={{ fontSize: "1.2rem" }}>
              Quick Links
            </h5>
            <div className="d-flex flex-column gap-2">
              {[
                { text: "Our Programs", link: "/programs" },
                { text: "About Us", link: "/about" },
                { text: "Team", link: "/team" },
                { text: "Shop", link: "/shop" },
                { text: "Contact Us", link: "/contact" },

              ].map((link, i) => (
                <Link
                  key={i}
                  to={link.link}
                  style={{
                    color: "white",
                    opacity: 0.9,
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.paddingLeft = "8px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                    e.currentTarget.style.paddingLeft = "0";
                  }}
                >
                  {link.text}
                </Link>
              ))}
            </div>
          </Col>

          {/* Column 3 – Contact */}
          <Col md={4}>
            <h5 className="fw-semibold mb-3" style={{ fontSize: "1.2rem" }}>
              Contact Information
            </h5>
            <div className="d-flex flex-column gap-3">
              {[
                {
                  icon: <FaMapMarkerAlt />,
                  text: "1/363, Metukadai, Erode, Tamil Nadu - 638 107",
                },
                {
                  icon: <FaPhone />,
                  text: "+91 8838407511",
                  link: "tel:+918838407511",
                },
                {
                  icon: <FaPhone />,
                  text: "+91 9942020838",
                  link: "tel:+919942020838",
                },
                {
                  icon: <FaEnvelope />,
                  text: "bluefinsaquaticsolutions@gmail.com",
                  link: "mailto:bluefinsaquaticsolutions@gmail.com",
                },
              ].map((item, i) => (
                <div key={i} className="d-flex gap-3 align-items-start">
                  <div style={{ fontSize: "1.2rem", marginTop: "2px" }}>
                    {item.icon}
                  </div>
                  {item.link ? (
                    <a
                      href={item.link}
                      style={{
                        color: "white",
                        opacity: 0.9,
                        textDecoration: "none",
                        transition: "opacity 0.3s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.9")
                      }
                    >
                      {item.text}
                    </a>
                  ) : (
                    <p className="mb-0" style={{ opacity: 0.9 }}>
                      {item.text}
                    </p>
                  )}
                </div>
              ))}
              {/* <Link to="#" onClick={(e) => e.preventDefault()}>
                <Button
                  variant="outline-light"
                  onDoubleClick={() => {
                    navigate("/owner-panel");
                    setClickCount(0);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#fff";
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                    e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    borderRadius: "50px",
                    padding: "0.45rem 1rem",
                    fontWeight: 600,
                    border: "2px solid rgba(255,255,255,0.5)",
                    transition: "all 0.3s ease",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  🔑 Owner
                </Button>
              </Link> */}
            </div>
          </Col>
        </Row>

        {/* Divider */}
        <hr
          style={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
          }}
        />

        {/* Bottom Bar */}
        <p
          className="text-center mb-0"
          style={{
            opacity: 0.85,
            fontSize: "0.9rem",
            letterSpacing: "0.3px",
          }}
        >
          © {new Date().getFullYear()} Blue Fins Swimming Academy <br />
           Designed by
          <a href="https://deepakdigitalcraft.works/" className="text-dark">
            &gt;&gt;deepakdigitalcraft.works
          </a>
        </p>
      </Container>

      {/* Top Wave */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="position-absolute top-0 start-0 w-100"
        style={{ transform: "rotate(180deg)" }}
      >
        <path
          fill="#F8FDFF"
          d="M0,64L60,69.3C120,75,240,85,360,85.3C480,85,600,75,720,74.7C840,75,960,85,1080,90.7C1200,96,1320,96,1380,85.3L1440,75V100H0Z"
        ></path>
      </svg>
    </footer>
  );
};

export default Footer;
