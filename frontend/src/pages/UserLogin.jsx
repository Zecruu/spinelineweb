import { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import './UserLogin.css';
import SpineLineLogo from '../assets/SpineLineLogo.jpg';

const UserLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    clinicCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Call parent login handler
        onLogin(data.token, data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-login">
      {/* Left Side - Logo, Welcome, Login Form, Admin Link */}
      <div className="welcome-section">
        <div className="welcome-content">
          <div className="logo-container">
            <img src={SpineLineLogo} alt="SpineLine Logo" className="logo" />
          </div>
          <h1 className="welcome-title">Welcome to SpineLine</h1>
          <p className="welcome-subtitle">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="login-form left-form">
            {error && <div className="error-message">{error}</div>}
            <div className="form-group with-icon">
              <span className="input-icon"><i className="fa fa-user"></i></span>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Username"
                className="form-input"
                autoComplete="username"
              />
            </div>
            <div className="form-group with-icon">
              <span className="input-icon"><i className="fa fa-lock"></i></span>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password"
                className="form-input"
                autoComplete="current-password"
              />
              <span className="input-icon right"><i className="fa fa-eye"></i></span>
            </div>
            <div className="form-group with-icon">
              <span className="input-icon"><i className="fa fa-hospital-o"></i></span>
              <input
                type="text"
                id="clinicCode"
                name="clinicCode"
                value={formData.clinicCode}
                onChange={handleChange}
                required
                placeholder="Clinic Code (e.g., TMC001, DRAAM)"
                className="form-input"
                style={{ textTransform: 'uppercase' }}
                autoComplete="off"
              />
            </div>
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div className="login-footer">
            <a href="#" className="admin-link">Admin Portal →</a>
          </div>
        </div>
      </div>

      {/* Right Side - Info/Features */}
      <div className="info-section">
        <div className="info-content">
          <h2 className="spine-title">SpineLine</h2>
          <p className="platform-subtitle">Medical Platform</p>
          <h3 className="info-main">Comprehensive Healthcare Management</h3>
          <p className="description">
            Streamline your medical practice with our integrated platform for patient management, appointments, and clinical workflows.
          </p>
          <div className="version-badge">
            <span className="version-icon"><i className="fa fa-medkit"></i></span>
            <span>Medical v1.0.0</span>
          </div>
          <div className="feature-list">
            <button className="feature-btn"><span className="feature-btn-icon"><i className="fa fa-user-md"></i></span> Patient Management</button>
            <button className="feature-btn"><span className="feature-btn-icon"><i className="fa fa-calendar"></i></span> Appointment Scheduling</button>
            <button className="feature-btn"><span className="feature-btn-icon"><i className="fa fa-file-medical"></i></span> Clinical Records</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
