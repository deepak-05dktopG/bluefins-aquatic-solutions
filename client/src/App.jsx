import { Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Programs from './pages/Service.jsx'
import Contact from './pages/Contact.jsx'
import Admin from './pages/Admin.jsx'
import Team from './pages/Team.jsx'
import Shop from './pages/Shop.jsx'
import AdminLogin from './pages/adminPanel/AdminLogin.jsx'
import AdminDashboard from './pages/adminPanel/AdminDashboard.jsx'
import LessonPlans from './pages/adminPanel/LessonPlans.jsx'
import MembersFeedback from './pages/adminPanel/MembersFeedback.jsx'
import WeeklyWorksheets from './pages/adminPanel/WeeklyWorksheets.jsx'
import Posts from './pages/adminPanel/Posts.jsx'
import { useLocation } from 'react-router-dom'
import React from 'react'
import AOS from 'aos'


function App() {
  function ScrollToTop() {
    const location = useLocation();
    React.useEffect(() => {
      window.scrollTo(0, 0);
      setTimeout(() => {
        AOS.refresh();
      }, 100);
    }, [location]);
    return null;
  }
  
  // Initialize scroll listener for AOS refresh
  React.useEffect(() => {
    const handleScroll = () => {
      AOS.refresh();
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="app">
      
      <main className="main-content">
      <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/contact" element={<Contact />} />
          {/* <Route path="/admin" element={<Admin />} /> */}
          <Route path="/team" element={<Team />} />
          <Route path="/shop" element={<Shop />} />
          
          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/lesson-plans" element={<LessonPlans />} />
          <Route path="/admin/feedback" element={<MembersFeedback />} />
          <Route path="/admin/worksheets" element={<WeeklyWorksheets />} />
          <Route path="/admin/posts" element={<Posts />} />
        </Routes>
      </main> 
      <Footer />
    </div>
  )
}

export default App