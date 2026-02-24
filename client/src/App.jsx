import { Routes, Route, useNavigate } from 'react-router-dom'
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
import Membership from './pages/Membership.jsx'
import AdminLogin from './pages/AdminPanel/AdminLogin.jsx'
import AdminDashboard from './pages/AdminPanel/AdminDashboard.jsx'
import LessonPlans from './pages/AdminPanel/LessonPlans.jsx'
import MembersFeedback from './pages/AdminPanel/MembersFeedback.jsx'
import WeeklyWorksheets from './pages/AdminPanel/WeeklyWorksheets.jsx'
import Posts from './pages/AdminPanel/Posts.jsx'
import Members from './pages/AdminPanel/Members.jsx'
import AttendanceScan from './pages/AdminPanel/AttendanceScan.jsx'
import AttendanceRecords from './pages/AdminPanel/AttendanceRecords.jsx'
import OfflineMembership from './pages/AdminPanel/OfflineMembership.jsx'
import Marketing from './pages/AdminPanel/Marketing.jsx'
import { useLocation } from 'react-router-dom'
import React from 'react'
import AOS from 'aos'
import { clearAdminToken } from './utils/adminAuth'


function App() {
  function FooterMaybe() {
    const location = useLocation()
    if (location.pathname.startsWith('/admin')) return null
    return <Footer />
  }

  function ScannerExitRedirect() {
    const navigate = useNavigate()
    const location = useLocation()
    const lastPathRef = React.useRef(location.pathname)

    React.useEffect(() => {
      const last = lastPathRef.current
      const current = location.pathname
      // If anyone tries to leave the scanner page, force admin logout and send them to the public homepage.
      if (last === '/admin/attendance/scan' && current !== '/admin/attendance/scan' && current !== '/') {
  		clearAdminToken()
        navigate('/', { replace: true })
      }
      lastPathRef.current = current
    }, [location.pathname, navigate])

    return null
  }

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
	  <ScannerExitRedirect />
      <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/contact" element={<Contact />} />
          {/* <Route path="/admin" element={<Admin />} /> */}
          <Route path="/team" element={<Team />} />
          <Route path="/shop" element={<Shop />} />
          
          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/members" element={<Members />} />
          <Route path="/admin/lesson-plans" element={<LessonPlans />} />
          <Route path="/admin/feedback" element={<MembersFeedback />} />
          <Route path="/admin/worksheets" element={<WeeklyWorksheets />} />
          <Route path="/admin/posts" element={<Posts />} />
		  <Route path="/admin/attendance" element={<AttendanceRecords />} />
		  <Route path="/admin/attendance/scan" element={<AttendanceScan />} />
		  <Route path="/admin/offline-membership" element={<OfflineMembership />} />
      <Route path="/admin/marketing" element={<Marketing />} />
        </Routes>
      </main> 
	  <FooterMaybe />
    </div>
  )
}

export default App