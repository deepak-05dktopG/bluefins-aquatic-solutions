import { Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Programs from './pages/Service'
import Contact from './pages/Contact'
import Admin from './pages/Admin'
import Team from './pages/Team'
import Shop from './pages/Shop'
import AdminLogin from './pages/adminPanel/AdminLogin'
import AdminDashboard from './pages/adminPanel/AdminDashboard'
import LessonPlans from './pages/adminPanel/LessonPlans'
import MembersFeedback from './pages/adminPanel/MembersFeedback'
import WeeklyWorksheets from './pages/adminPanel/WeeklyWorksheets'
import Posts from './pages/adminPanel/Posts'
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