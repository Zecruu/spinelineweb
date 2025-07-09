import { useState, useEffect } from 'react'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import UserLogin from './pages/UserLogin'
import SecretaryDashboard from './pages/SecretaryDashboard'
import PatientCheckout from './pages/PatientCheckout'
import Checkout from './pages/Checkout'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('user-login') // 'user-login', 'admin-login', 'secretary-dashboard', 'admin-dashboard', 'patient-checkout', 'checkout'
  const [userToken, setUserToken] = useState(null)
  const [userData, setUserData] = useState(null)
  const [adminToken, setAdminToken] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutAppointmentId, setCheckoutAppointmentId] = useState(null)

  // Check for existing sessions on app load
  useEffect(() => {
    const checkSessions = () => {
      // Check for user session
      const userTokenStored = localStorage.getItem('userToken')
      const userDataStored = localStorage.getItem('userData')

      // Check for admin session
      const adminTokenStored = localStorage.getItem('adminToken')
      const adminUserStored = localStorage.getItem('adminUser')

      if (userTokenStored && userDataStored) {
        try {
          setUserToken(userTokenStored)
          setUserData(JSON.parse(userDataStored))

          // Route based on user role
          const user = JSON.parse(userDataStored)
          if (user.role === 'secretary' || user.role === 'doctor') {
            setCurrentView('secretary-dashboard')
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          localStorage.removeItem('userToken')
          localStorage.removeItem('userData')
        }
      } else if (adminTokenStored && adminUserStored) {
        try {
          setAdminToken(adminTokenStored)
          setAdminUser(JSON.parse(adminUserStored))
          setCurrentView('admin-dashboard')
        } catch (error) {
          console.error('Error parsing stored admin data:', error)
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
        }
      } else {
        // Check URL for different routes
        const path = window.location.pathname;
        if (path === '/admin') {
          setCurrentView('admin-login')
        } else if (path.startsWith('/secretary/checkout/')) {
          const appointmentId = path.split('/').pop();
          setCheckoutAppointmentId(appointmentId);
          setCurrentView('patient-checkout');
        } else {
          setCurrentView('user-login')
        }
      }

      setLoading(false)
    }

    checkSessions()
  }, [])

  const handleUserLogin = (token, user) => {
    setUserToken(token)
    setUserData(user)
    localStorage.setItem('userToken', token)
    localStorage.setItem('userData', JSON.stringify(user))

    // Route based on user role
    if (user.role === 'secretary' || user.role === 'doctor') {
      setCurrentView('secretary-dashboard')
    }
  }

  const handleUserLogout = () => {
    setUserToken(null)
    setUserData(null)
    localStorage.removeItem('userToken')
    localStorage.removeItem('userData')
    setCurrentView('user-login')
  }

  const handleAdminLogin = (token, user) => {
    setAdminToken(token)
    setAdminUser(user)
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminUser', JSON.stringify(user))
    setCurrentView('admin-dashboard')
  }

  const handleAdminLogout = () => {
    setAdminToken(null)
    setAdminUser(null)
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setCurrentView('admin-login')
  }

  const handleCheckout = (appointmentId) => {
    setCheckoutAppointmentId(appointmentId)
    setCurrentView('checkout')
  }

  const handleBackToPatients = () => {
    setCheckoutAppointmentId(null)
    setCurrentView('secretary-dashboard')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading SpineLine...</p>
      </div>
    )
  }

  return (
    <div className="App">
      {currentView === 'user-login' && (
        <UserLogin onLogin={handleUserLogin} />
      )}

      {currentView === 'admin-login' && (
        <AdminLogin onLogin={handleAdminLogin} />
      )}

      {currentView === 'secretary-dashboard' && (
        <SecretaryDashboard
          token={userToken}
          user={userData}
          onLogout={handleUserLogout}
          onCheckout={handleCheckout}
        />
      )}

      {currentView === 'admin-dashboard' && (
        <AdminDashboard
          token={adminToken}
          user={adminUser}
          onLogout={handleAdminLogout}
        />
      )}

      {currentView === 'patient-checkout' && (
        <PatientCheckout
          token={userToken}
          user={userData}
          appointmentId={checkoutAppointmentId}
        />
      )}

      {currentView === 'checkout' && (
        <Checkout
          token={userToken}
          user={userData}
          appointmentId={checkoutAppointmentId}
          onBack={handleBackToPatients}
        />
      )}
    </div>
  )
}

export default App
