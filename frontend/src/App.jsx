import { useState, useEffect } from 'react'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('checking...')
  const [dbStatus, setDbStatus] = useState('checking...')
  const [currentView, setCurrentView] = useState('home') // 'home', 'admin-login', 'admin-dashboard'
  const [adminToken, setAdminToken] = useState(null)
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    // Check for existing admin session
    const token = localStorage.getItem('adminToken')
    const user = localStorage.getItem('adminUser')

    if (token && user) {
      setAdminToken(token)
      setAdminUser(JSON.parse(user))
      setCurrentView('admin-dashboard')
    }

    // Test API health
    fetch('http://localhost:5001/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus(`✅ ${data.message} (${data.environment})`)
      })
      .catch(err => {
        setApiStatus(`❌ API connection failed: ${err.message}`)
      })

    // Test database connection
    fetch('http://localhost:5001/api/test-db')
      .then(res => res.json())
      .then(data => {
        setDbStatus(`✅ ${data.message} - Database: ${data.database}`)
      })
      .catch(err => {
        setDbStatus(`❌ Database connection failed: ${err.message}`)
      })
  }, [])

  const handleAdminLogin = (token, user) => {
    setAdminToken(token)
    setAdminUser(user)
    setCurrentView('admin-dashboard')
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setAdminToken(null)
    setAdminUser(null)
    setCurrentView('home')
  }

  // Render admin login
  if (currentView === 'admin-login') {
    return <AdminLogin onLogin={handleAdminLogin} />
  }

  // Render admin dashboard
  if (currentView === 'admin-dashboard' && adminToken && adminUser) {
    return (
      <AdminDashboard
        token={adminToken}
        user={adminUser}
        onLogout={handleAdminLogout}
      />
    )
  }

  // Render main application
  return (
    <div className="app">
      <header className="app-header">
        <h1>🏥 SpineLine</h1>
        <p>Chiropractic Practice Management System</p>
        <div className="header-actions">
          <button
            onClick={() => setCurrentView('admin-login')}
            className="admin-button"
          >
            🔐 Admin Portal
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="status-card">
          <h2>System Status</h2>
          <div className="status-item">
            <strong>API Server:</strong> {apiStatus}
          </div>
          <div className="status-item">
            <strong>Database:</strong> {dbStatus}
          </div>
        </div>

        <div className="info-card">
          <h2>Development Environment</h2>
          <ul>
            <li>Frontend: React + Vite (Port 7890)</li>
            <li>Backend: Express + MongoDB Atlas (Port 5001)</li>
            <li>Database: MongoDB Atlas (spineline)</li>
            <li>Ready for Railway deployment</li>
          </ul>
        </div>

        <div className="admin-info-card">
          <h2>🔐 Admin Portal Features</h2>
          <ul>
            <li>✅ Secure admin authentication with JWT</li>
            <li>✅ Create new clinics with unique codes</li>
            <li>✅ Register users for clinics (doctors & secretaries)</li>
            <li>✅ Dashboard with clinic and user statistics</li>
            <li>✅ Clinic-scoped data isolation</li>
          </ul>
          <p><strong>Task 2 Status:</strong> Admin Portal Implementation Complete!</p>
        </div>

        <div className="next-steps">
          <h2>Next Steps</h2>
          <ol>
            <li>✅ Task 1: Project foundation and MongoDB setup</li>
            <li>✅ Task 2: Admin portal for clinic/user creation</li>
            <li>🔄 Task 3: User authentication and clinic login</li>
            <li>📋 Task 4: Patient management system</li>
            <li>📅 Task 5: Appointment scheduling</li>
          </ol>
        </div>
      </main>
    </div>
  )
}

export default App
