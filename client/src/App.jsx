/**
 * What it is: Main React app component (routes/pages are wired here).
 * Non-tech note: This decides which screen shows for each website URL.
 */

import React from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AOS from 'aos'
import { clearAdminToken } from './utils/adminAuth'

import AppErrorBoundary from './components/AppErrorBoundary'

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




/**
 * Purpose: Do App
 * Plain English: What this function is used for.
 */
function App() {
  const appLocation = useLocation()
  /**
   * Purpose: Do Footer Maybe
   * Plain English: What this function is used for.
   */
  function FooterMaybe() {
    const location = useLocation()
    if (location.pathname.startsWith('/admin')) return null
    return <Footer />
  }

  /**
   * Purpose: Do Scanner Exit Redirect
   * Plain English: What this function is used for.
   */
  function ScannerExitRedirect() {
    const navigate = useNavigate()
    const location = useLocation()
    const lastPathRef = React.useRef(location.pathname)

    React.useEffect(/**
     * Purpose: React effect callback (runs after render based on dependencies)
     * Plain English: What this function is used for.
     */
    () => {
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

  /**
   * Purpose: Do Scroll To Top
   * Plain English: What this function is used for.
   */
  function ScrollToTop() {
    const location = useLocation();
    React.useEffect(/**
     * Purpose: React effect callback (runs after render based on dependencies)
     * Plain English: What this function is used for.
     */
    () => {
      window.scrollTo(0, 0);
      setTimeout(/**
       * Purpose: Timer callback (runs once after a delay)
       * Plain English: What this function is used for.
       */
      () => {
        if (typeof AOS.refreshHard === 'function') {
          AOS.refreshHard();
          return;
        }
        AOS.refresh();
      }, 100);
    }, [location.pathname]);
    return null;
  }

  // Initialize AOS globally (prevents pages from appearing blank if AOS-driven elements
  // are still at opacity: 0 after navigation).
  React.useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out-cubic',
      once: false,
      offset: 80,
      disable: false,
    })
    AOS.refresh()
  }, [])

  // Initialize scroll listener for AOS refresh
  React.useEffect(/**
   * Purpose: React effect callback (runs after render based on dependencies)
   * Plain English: What this function is used for.
   */
  () => {
    /**
     * Purpose: Handle Scroll
     * Plain English: What this function is used for.
     */
    const handleScroll = () => {
      AOS.refresh();
    };
    window.addEventListener('scroll', handleScroll);
    return (
      /**
       * Purpose: Helper callback used inside a larger operation
       * Plain English: What this function is used for.
       */
      () => {
        return window.removeEventListener('scroll', handleScroll);
      }
    );
  }, []);

  return (
    <div className="app">
      
      <main className="main-content">
	  <ScannerExitRedirect />
      <ScrollToTop />
        <AppErrorBoundary resetKey={appLocation.pathname}>
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
        </AppErrorBoundary>
      </main> 
	  <FooterMaybe />
    </div>
  )
}

export default App