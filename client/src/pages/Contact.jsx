import React, { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaWhatsapp, FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaCheckCircle, FaClock, FaHeadset } from "react-icons/fa";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import emailjs from "@emailjs/browser";



const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // window.open(`https://wa.me/919025454148?text=Hello!%0AName: ${formData.name}%0AEmail: ${formData.email}%0AMessage: ${formData.message}`);
    emailjs
      .send(
        "service_vvlj738",       // from EmailJS
        "template_7j1rxpo",      // from EmailJS
        {
          from_name: formData.name,
          from_email: formData.email,
          phone: formData.phone,
          message: formData.message,
          time: new Date().toLocaleString(),
        },
        "EJPzfpLez6KIfi9vc"        // from EmailJS
      )
      .then(() => {
        // Send auto-reply to the user
        emailjs.send("service_vvlj738", "template_ep9fzke", {
          from_name: formData.name,
          phone: formData.phone,
        }, "EJPzfpLez6KIfi9vc");
      })
      .then(() => {
        setAlertMessage("Thank you! We received your message. We'll get back to you within 24 hours!");
        setShowAlert(true);
        setLoading(false);
        setFormData({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => setShowAlert(false), 4000);
      })
      .catch(() => {
        setAlertMessage("❌ Failed to send message. Try again later Or Contact via Phone/Email/WhatsApp.");
        setShowAlert(true);
        setLoading(false);
        setFormData({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => setShowAlert(false), 4000);
      });
  };

  const contactMethods = [
    { icon: <FaPhone size={28} />, link: 'tel:+919942020838', title: "Phone", value: "+91 99420-20838", color: "#FF6B6B" },
    { icon: <FaEnvelope size={28} />, link: 'mailto:bluefinsaquaticssolutions@gmail.com', title: "Email", value: "bluefinsaquaticssolutions@gmail.com", color: "#FFD93D" },
    { icon: <FaMapMarkerAlt size={28} />, link: 'https://wa.me/919942020838', title: "Headquarters", value: "Erode, Tamil Nadu, India", color: "#4ECDC4" },
    { icon: <FaWhatsapp size={28} />, link: 'https://wa.me/919942020838', title: "WhatsApp", value: "+91 94440 42424", color: "#667eea" }
  ];

  const officeHours = [
    { day: "Monday - Friday", hours: "6:00 AM - 9:00 PM" },
    { day: "Saturday", hours: "8:00 AM - 6:00 PM" },
    { day: "Sunday", hours: "9:00 AM - 5:00 PM" }
  ];

  const socialMedia = [
    //  { icon: <FaFacebook size={24} />, name: "Facebook", color: "#3B5998" },
    { icon: <FaInstagram size={24} />, name: "Instagram", color: "#E4405F", link: "https://www.instagram.com/bluefinsaquaticsolutions?utm_source=qr&igsh=MWNtcTlxaGphYWJiZg==" },
    //  { icon: <FaTwitter size={24} />, name: "Twitter", color: "#1DA1F2" },
    // { icon: <FaLinkedin size={24} />, name: "LinkedIn", color: "#0A66C2" }
  ];

  const mainStyle = {
    background: "linear-gradient(135deg, #0f3460 0%, #16213e 40%, #533483 100%)",
    minHeight: "auto",
    overflow: "hidden",
    position: "relative"
  };

  const [hoveredCard, setHoveredCard] = useState(null);
  const [submitHovered, setSubmitHovered] = useState(false);
  const [socialHovered, setSocialHovered] = useState(null);

  return (
    <div style={{ ...mainStyle, paddingTop: "80px" }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        input::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
        textarea::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
        textarea {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.2) !important;
          color: #fff !important;
          font-size: 0.95rem !important;
          font-weight: 500 !important;
          border-radius: 10px !important;
          padding: 12px 16px !important;
          resize: vertical;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        textarea:focus {
          background: rgba(255, 255, 255, 0.15) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.4) !important;
          box-shadow: 0 0 20px rgba(255, 107, 107, 0.3) !important;
          outline: none !important;
        }
      `}</style>
      <Navbar />

      <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.15, animation: "float 8s ease-in-out infinite", width: "400px", height: "400px", background: "#FF6B6B", top: "-100px", left: "-100px" }} />
      <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.15, animation: "float 8s ease-in-out infinite", width: "300px", height: "300px", background: "#4ECDC4", bottom: "100px", right: "-50px" }} />
      <div style={{ position: "absolute", borderRadius: "50%", opacity: 0.15, animation: "float 8s ease-in-out infinite", width: "250px", height: "250px", background: "#667eea", top: "50%", left: "10%" }} />

      <div style={{ textAlign: "center", paddingTop: "60px", paddingBottom: "40px", position: "relative", zIndex: 2 }}>
        <h1 style={{ fontSize: "4.5rem", fontWeight: "900", background: "linear-gradient(90deg, #FF6B6B, #FFD93D, #4ECDC4, #667eea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "15px", animation: "gradientShift 15s infinite ease" }}>Get In Touch</h1>
        <p style={{ fontSize: "1.3rem", color: "#E0E0E0", marginBottom: "10px", fontWeight: "500" }}>We're always here to help and answer any question you might have</p>
      </div>

      {showAlert && (
        <div data-aos="slideInDown" style={{ position: "relative", zIndex: 3, maxWidth: "1200px", margin: "0 auto", padding: "0 20px", marginBottom: "30px" }}>
          <div style={{ background: "rgba(76, 205, 196, 0.2)", border: "2px solid #4ECDC4", borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", backdropFilter: "blur(15px)" }}>
            <FaCheckCircle size={20} style={{ color: "#4ECDC4" }} />
            <span style={{ color: "#E0E0E0", fontSize: "0.95rem", fontWeight: "500" }}>{alertMessage}</span>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 2 }}>
        <div className="row" style={{ display: "flex", flexWrap: 'wrap', gap: "25px", marginBottom: "50px", marginTop: "30px", alignItems: 'center', justifyContent: 'center' }}>
          <div className="col-lg-7 col-12" data-aos="fadeInUp" data-aos-delay="0" style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(15px)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "20px", padding: "40px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)", transition: "all 0.3s ease", gridColumn: "span 2", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.4)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)"; }}>
            <h3 style={{ color: "#FFD93D", fontSize: "1.5rem", fontWeight: "700", marginBottom: "25px" }}>Send Us a Message</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required style={{ background: "rgba(255, 255, 255, 0.1)", border: "1.5px solid rgba(255, 255, 255, 0.2)", borderRadius: "10px", padding: "12px 16px", color: "#fff", fontSize: "0.95rem", fontWeight: "500", transition: "all 0.3s ease", marginBottom: "18px", width: "100%", boxSizing: "border-box" }} />
              <input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required style={{ background: "rgba(255, 255, 255, 0.1)", border: "1.5px solid rgba(255, 255, 255, 0.2)", borderRadius: "10px", padding: "12px 16px", color: "#fff", fontSize: "0.95rem", fontWeight: "500", transition: "all 0.3s ease", marginBottom: "18px", width: "100%", boxSizing: "border-box" }} />
              <input type="number"  required pattern="[0-9]{10,14}" minLength="10" maxLength="14" name="phone" placeholder="Phone 10 digit only" value={formData.phone} onChange={handleChange}  style={{ background: "rgba(255, 255, 255, 0.1)", border: "1.5px solid rgba(255, 255, 255, 0.2)", borderRadius: "10px", padding: "12px 16px", color: "#fff", fontSize: "0.95rem", fontWeight: "500", transition: "all 0.3s ease", marginBottom: "18px", width: "100%", boxSizing: "border-box" }} />
              <textarea className="w-100" name="message" placeholder="Your Message" rows="5" value={formData.message} onChange={handleChange} required />
              <button type="submit" style={{ background: "linear-gradient(135deg, #FF6B6B, #FF9FF3)", border: "none", color: "#fff", fontWeight: "700", fontSize: "1rem", padding: "14px 40px", borderRadius: "10px", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 15px rgba(255, 107, 107, 0.4)", width: "100%", marginTop: "10px", ...(submitHovered ? { transform: "translateY(-3px)", boxShadow: "0 6px 25px rgba(255, 107, 107, 0.6)" } : {}) }} onMouseEnter={() => setSubmitHovered(true)} onMouseLeave={() => setSubmitHovered(false)}> {loading ? "Sending..." : "Send Message"}   </button>
            </form>
          </div>
          <div className="col-lg-4 col-12" data-aos="fadeInUp" data-aos-delay="100" style={{ display: "flex", flexDirection: "column", gap: "15px", }}>
            {contactMethods.map((method, idx) => (
              <Link to={method.link} key={idx} style={{ textDecoration: "none", background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(15px)", border: `2px solid ${method.color}30`, borderRadius: "15px", padding: "25px", textAlign: "center", transition: "all 0.3s ease", cursor: "pointer", ...(hoveredCard === idx ? { transform: "translateY(-8px)", background: "rgba(255, 255, 255, 0.12)", boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)" } : {}) }} onMouseEnter={() => setHoveredCard(idx)} onMouseLeave={() => setHoveredCard(null)}>
                <div style={{ color: method.color, marginBottom: "10px", display: "flex", justifyContent: "center" }}>{method.icon}</div>
                <h5 style={{ color: "#fff", fontSize: "1rem", fontWeight: "700", marginBottom: "5px" }}>{method.title}</h5>
                <p style={{ color: "#E0E0E0", fontSize: "0.9rem", margin: "0", fontWeight: "500" }}>{method.value}</p>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px", marginBottom: "50px" }}>
          <div data-aos="fadeInUp" data-aos-delay="200">
            <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(15px)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "15px", padding: "25px" }}>
              <h4 style={{ color: "#4ECDC4", fontSize: "1.3rem", fontWeight: "700", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}><FaClock size={20} /> Hours of Operation</h4>
              {officeHours.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", color: "#E0E0E0" }}>
                  <span style={{ fontWeight: "600" }}>{item.day}</span>
                  <span style={{ color: "#FFD93D", fontWeight: "700" }}>{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-aos="fadeInUp" data-aos-delay="300">
            <div style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(15px)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "15px", padding: "25px" }}>
              <h4 style={{ color: "#FF9FF3", fontSize: "1.3rem", fontWeight: "700", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}><FaHeadset size={20} /> Connect With Us</h4>
              <p style={{ color: "#E0E0E0", marginBottom: "15px", fontSize: "0.9rem" }}>Follow us on social media for updates, tips, and swimming content</p>
              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                {socialMedia.map((social, idx) => (
                  <Link to={social.link} key={idx} style={{ width: "45px", height: "45px", borderRadius: "50%", background: `${social.color}20`, border: `2px solid ${social.color}`, display: "flex", alignItems: "center", justifyContent: "center", color: social.color, cursor: "pointer", transition: "all 0.3s ease", ...(socialHovered === idx ? { background: social.color, color: "#fff", transform: "translateY(-5px)", boxShadow: `0 8px 20px ${social.color}40` } : {}) }} onMouseEnter={() => setSocialHovered(idx)} onMouseLeave={() => setSocialHovered(null)} title={social.name}>{social.icon}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div data-aos="fadeInUp" data-aos-delay="400" style={{ background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(15px)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "15px", padding: "25px", marginTop: "px" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}><span style={{ color: "#FF6B6B" }}></span> Frequently Asked Questions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div><div style={{ fontWeight: "600", color: "#FFD93D", marginBottom: "8px" }}>When can I start classes?</div><p style={{ color: "#B0B0B0", fontSize: "0.9rem", margin: "0" }}>Classes start every Monday. Contact us now to register!</p></div>
            <div><div style={{ fontWeight: "600", color: "#FFD93D", marginBottom: "8px" }}>What age groups do you cater to?</div><p style={{ color: "#B0B0B0", fontSize: "0.9rem", margin: "0" }}>We have programs for ages 3 to 65+, from beginners to advanced athletes.</p></div>
            <div><div style={{ fontWeight: "600", color: "#FFD93D", marginBottom: "8px" }}>Do you offer batch discounts?</div><p style={{ color: "#B0B0B0", fontSize: "0.9rem", margin: "0" }}>Yes! We offer special rates for group bookings and corporate batches.</p></div>
            <div><div style={{ fontWeight: "600", color: "#FFD93D", marginBottom: "8px" }}>What''s your cancellation policy?</div><p style={{ color: "#B0B0B0", fontSize: "0.9rem", margin: "0" }}>30-day notice for full refund. Contact support for details.</p></div>
            <div><div style={{ fontWeight: "600", color: "#FFD93D", marginBottom: "8px" }}>Do you offer online coaching?</div><p style={{ color: "#B0B0B0", fontSize: "0.9rem", margin: "0" }}>Yes, we offer virtual consultations and technique analysis sessions.</p></div>
            <div><div style={{ fontWeight: "600", color: "#FFD93D", marginBottom: "28px" }}>How do I schedule a trial class?</div><p style={{ color: "#B0B0B0", fontSize: "0.9rem", margin: "0" }}>Fill the form above or call us. First class is free for new members!</p></div>
          </div>
        </div>

        {/* <div data-aos="fadeInUp" data-aos-delay="500" style={{ background: "linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(102, 126, 234, 0.15) 100%)", border: "2px solid rgba(255, 255, 255, 0.2)", borderRadius: "20px", padding: "40px", textAlign: "center", marginTop: "50px", marginBottom: "40px", backdropFilter: "blur(15px)" }}>
          <h3 style={{ fontSize: "2rem", fontWeight: "700", background: "linear-gradient(90deg, #FF6B6B, #FFD93D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "15px" }}>Ready to Dive In?</h3>
          <p style={{ color: "#E0E0E0", fontSize: "1.1rem", marginBottom: "20px" }}>Join hundreds of satisfied swimmers and take your aquatic journey to the next level today!</p>
          <button style={{ background: "linear-gradient(135deg, #4ECDC4, #54A0FF)", border: "none", color: "#fff", fontWeight: "700", fontSize: "1rem", padding: "14px 40px", borderRadius: "10px", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 15px rgba(78, 205, 196, 0.4)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 25px rgba(78, 205, 196, 0.6)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(78, 205, 196, 0.4)"; }}>Get Started Now </button>
        </div> */}
      </div>
      <svg
        className="wave-divider"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ position: "absolute", height: "px", bottom: -1, left: 0 }}
      >
        <path
          fill="#fff"
          d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,74.7C672,75,768,85,864,90.7C960,96,1056,96,1152,85.3C1248,75,1344,53,1392,42.7L1440,32V120H0Z"
        ></path>
      </svg>
    </div>
  );
};

export default Contact;
