import { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import './CarePackageDisplay.css';

const CarePackageDisplay = ({ 
  carePackages, 
  setCarePackages, 
  patientId, 
  billingCodes, 
  token 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    totalSessions: '',
    remainingSessions: '',
    packageType: 'decompression',
    price: '',
    linkedBillingCodes: []
  });
  const [loading, setLoading] = useState(false);

  const packageTypes = {
    decompression: { name: 'Decompression Package', color: '#3b82f6' },
    chiropractic: { name: 'Chiropractic Package', color: '#10b981' },
    therapy: { name: 'Physical Therapy Package', color: '#f59e0b' },
    wellness: { name: 'Wellness Package', color: '#8b5cf6' }
  };

  const commonPackages = [
    { name: 'Decompression 10-Pack', totalSessions: 10, packageType: 'decompression', price: 450.00 },
    { name: 'Decompression 20-Pack', totalSessions: 20, packageType: 'decompression', price: 800.00 },
    { name: 'Chiropractic 12-Pack', totalSessions: 12, packageType: 'chiropractic', price: 600.00 },
    { name: 'Therapy 8-Pack', totalSessions: 8, packageType: 'therapy', price: 400.00 },
    { name: 'Wellness 6-Pack', totalSessions: 6, packageType: 'wellness', price: 300.00 }
  ];

  const handleAddPackage = async () => {
    try {
      setLoading(true);
      
      const packageData = {
        patientId,
        name: newPackage.name,
        totalSessions: parseInt(newPackage.totalSessions),
        remainingSessions: parseInt(newPackage.remainingSessions || newPackage.totalSessions),
        packageType: newPackage.packageType,
        price: parseFloat(newPackage.price),
        linkedBillingCodes: newPackage.linkedBillingCodes,
        purchaseDate: new Date(),
        addedBy: 'current-user' // Should be actual user ID
      };

      const response = await fetch(`${API_BASE_URL}/api/care-packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        const data = await response.json();
        setCarePackages([...carePackages, data.data.carePackage]);
        
        setShowAddModal(false);
        setNewPackage({
          name: '',
          totalSessions: '',
          remainingSessions: '',
          packageType: 'decompression',
          price: '',
          linkedBillingCodes: []
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to add care package: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Add care package error:', error);
      alert('Failed to add care package');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePackage = async (packageId) => {
    if (!confirm('Are you sure you want to remove this care package?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/care-packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCarePackages(carePackages.filter(pkg => pkg._id !== packageId));
      } else {
        alert('Failed to remove care package');
      }
    } catch (error) {
      console.error('Remove care package error:', error);
      alert('Failed to remove care package');
    }
  };

  const handleUseSession = async (packageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/care-packages/${packageId}/use-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usedBy: 'current-user',
          usageDate: new Date(),
          billingCodes: billingCodes.map(code => code.code)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCarePackages(carePackages.map(pkg => 
          pkg._id === packageId ? data.data.carePackage : pkg
        ));
        alert('Session deducted from care package');
      } else {
        const errorData = await response.json();
        alert(`Failed to use session: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Use session error:', error);
      alert('Failed to use session');
    }
  };

  const handleQuickAdd = (commonPackage) => {
    setNewPackage({
      name: commonPackage.name,
      totalSessions: commonPackage.totalSessions.toString(),
      remainingSessions: commonPackage.totalSessions.toString(),
      packageType: commonPackage.packageType,
      price: commonPackage.price.toString(),
      linkedBillingCodes: []
    });
  };

  const getPackageStatus = (pkg) => {
    const percentage = (pkg.remainingSessions / pkg.totalSessions) * 100;
    if (percentage > 50) return 'active';
    if (percentage > 20) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="checkout-section">
      <h3>🧾 Care Packages</h3>
      
      <div className="care-packages-header">
        <p>Active care packages for this patient</p>
        <button 
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          Add Package
        </button>
      </div>

      <div className="care-packages-list">
        {carePackages.length === 0 ? (
          <div className="no-packages">
            No active care packages
          </div>
        ) : (
          carePackages.map((pkg, index) => {
            const status = getPackageStatus(pkg);
            const statusColor = getStatusColor(status);
            
            return (
              <div key={index} className="care-package-item">
                <div className="package-info">
                  <div className="package-header">
                    <span className="package-name">{pkg.name}</span>
                    <span 
                      className="package-type"
                      style={{ backgroundColor: packageTypes[pkg.packageType]?.color }}
                    >
                      {packageTypes[pkg.packageType]?.name}
                    </span>
                  </div>
                  
                  <div className="package-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${(pkg.remainingSessions / pkg.totalSessions) * 100}%`,
                          backgroundColor: statusColor
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {pkg.remainingSessions} of {pkg.totalSessions} sessions remaining
                    </span>
                  </div>
                  
                  <div className="package-details">
                    <span>Price: ${pkg.price?.toFixed(2) || 'N/A'}</span>
                    <span>Purchased: {new Date(pkg.purchaseDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="package-actions">
                  <button 
                    className="btn-primary btn-use"
                    onClick={() => handleUseSession(pkg._id)}
                    disabled={pkg.remainingSessions <= 0}
                  >
                    Use Session
                  </button>
                  <button 
                    className="btn-danger btn-remove"
                    onClick={() => handleRemovePackage(pkg._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="package-modal">
            <div className="modal-header">
              <h3>Add Care Package</h3>
              <button 
                className="btn-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Quick Add Common Packages */}
              <div className="quick-add-section">
                <h4>Common Packages:</h4>
                <div className="common-packages-grid">
                  {commonPackages.map((commonPkg, index) => (
                    <button
                      key={index}
                      className="common-package-btn"
                      onClick={() => handleQuickAdd(commonPkg)}
                    >
                      <div className="common-package-name">{commonPkg.name}</div>
                      <div className="common-package-sessions">{commonPkg.totalSessions} sessions</div>
                      <div className="common-package-price">${commonPkg.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Entry */}
              <div className="manual-entry-section">
                <h4>Manual Entry:</h4>
                
                <div className="form-group">
                  <label className="form-label">Package Name:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                    placeholder="e.g., Decompression 10-Pack"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Sessions:</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newPackage.totalSessions}
                      onChange={(e) => setNewPackage({...newPackage, totalSessions: e.target.value})}
                      min="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Price:</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newPackage.price}
                      onChange={(e) => setNewPackage({...newPackage, price: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Package Type:</label>
                  <select
                    className="form-select"
                    value={newPackage.packageType}
                    onChange={(e) => setNewPackage({...newPackage, packageType: e.target.value})}
                  >
                    {Object.entries(packageTypes).map(([key, type]) => (
                      <option key={key} value={key}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-success"
                onClick={handleAddPackage}
                disabled={!newPackage.name || !newPackage.totalSessions || !newPackage.price || loading}
              >
                {loading ? 'Adding...' : 'Add Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarePackageDisplay;
