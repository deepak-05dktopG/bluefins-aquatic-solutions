import React from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AOS from 'aos'
import { clearAdminToken } from './utils/adminAuth'

import Footer from './components/Footer'

import About from './pages/About'
import Contact from './pages/Contact'
import Home from './pages/Home'
import Membership from './pages/Membership'
import Service from './pages/Service'
import Shop from './pages/Shop'
import Team from './pages/Team'

import AdminDashboard from './pages/AdminPanel/AdminDashboard'
import AdminLogin from './pages/AdminPanel/AdminLogin'
import AttendanceRecords from './pages/AdminPanel/AttendanceRecords'
import AttendanceScan from './pages/AdminPanel/AttendanceScan'
import LessonPlans from './pages/AdminPanel/LessonPlans'
import Members from './pages/AdminPanel/Members'
import MembersFeedback from './pages/AdminPanel/MembersFeedback'
import OfflineMembership from './pages/AdminPanel/OfflineMembership'
import Posts from './pages/AdminPanel/Posts'
import WeeklyWorksheets from './pages/AdminPanel/WeeklyWorksheets'




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
          <Route path="/programs" element={<Service />} />
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

      {/* Fallbacks to avoid blank pages on removed/unknown routes */}
      <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main> 
	  <FooterMaybe />
    </div>
  )
}

export default App