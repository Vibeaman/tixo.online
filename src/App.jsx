import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Hero from './components/Hero'
import TrendingEvents from './components/TrendingEvents'
import RoleCards from './components/RoleCards'
import HowItWorks from './components/HowItWorks'
import Categories from './components/Categories'
import HostBanner from './components/HostBanner'

import BrowseEvents from './pages/BrowseEvents'
import EventDetail from './pages/EventDetail'
import CreateEvent from './pages/CreateEvent'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import CategoryView from './pages/CategoryView'

function Landing() {
  return (
    <>
      <Hero />
      <TrendingEvents />
      <RoleCards />
      <HowItWorks />
      <Categories />
      <HostBanner />
    </>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  React.useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout() {
  const { pathname } = useLocation()
  const hideNavFooter = ['/signup', '/login', '/forgot-password', '/reset-password'].includes(pathname)

  return (
    <div style={{ minHeight: '100vh', background: '#08080f' }}>
      {!hideNavFooter && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/events" element={<BrowseEvents />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/category/:name" element={<CategoryView />} />
      </Routes>
      {!hideNavFooter && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1440',
              color: 'white',
              border: '1px solid rgba(123,78,247,0.3)',
              fontWeight: 600,
              fontSize: '0.88rem',
            },
          }}
        />
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  )
}
