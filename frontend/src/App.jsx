import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('checking...')
  const [dbStatus, setDbStatus] = useState('checking...')

  useEffect(() => {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏥 SpineLine</h1>
        <p>Chiropractic Practice Management System</p>
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

        <div className="next-steps">
          <h2>Next Steps</h2>
          <ol>
            <li>Deploy to Railway.app</li>
            <li>Configure environment variables</li>
            <li>Test production endpoints</li>
            <li>Begin feature development</li>
          </ol>
        </div>
      </main>
    </div>
  )
}

export default App
