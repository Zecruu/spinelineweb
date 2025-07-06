import { useState, useEffect } from 'react';
import './PatientCheckout.css';

const PatientCheckout = ({ token, user, appointmentId }) => {
  // Simple navigation function since we're not using React Router
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.location.reload();
  };
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [billingCodes, setBillingCodes] = useState([
    { code: '99213', description: 'Office Visit - Established Patient', units: 1, unitPrice: 150.00 }
  ]);
  const [signature, setSignature] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('insurance');
  const [amountPaid, setAmountPaid] = useState(0);
  const [visitNotes, setVisitNotes] = useState('');
  const [followUp, setFollowUp] = useState({
    required: false,
    recommendedDate: '',
    notes: ''
  });
  const [alerts, setAlerts] = useState([]);

  // Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/appointments/${appointmentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAppointment(data.data.appointment);
          
          // Set default amount paid based on payment method
          if (data.data.appointment.paymentMethod === 'insurance') {
            setAmountPaid(data.data.appointment.copayAmount || 0);
          }
        } else {
          setError('Failed to fetch appointment details');
        }
      } catch (error) {
        console.error('Fetch appointment error:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId && token) {
      fetchAppointment();
    }
  }, [appointmentId, token]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = billingCodes.reduce((total, code) => {
      return total + (code.units * code.unitPrice);
    }, 0);
    
    const totalAmount = subtotal;
    const balance = totalAmount - amountPaid;
    const change = amountPaid > totalAmount ? amountPaid - totalAmount : 0;
    
    return { subtotal, totalAmount, balance, change };
  };

  // Add billing code
  const addBillingCode = () => {
    setBillingCodes([...billingCodes, {
      code: '',
      description: '',
      units: 1,
      unitPrice: 0
    }]);
  };

  // Update billing code
  const updateBillingCode = (index, field, value) => {
    const updated = [...billingCodes];
    updated[index][field] = value;
    setBillingCodes(updated);
  };

  // Remove billing code
  const removeBillingCode = (index) => {
    setBillingCodes(billingCodes.filter((_, i) => i !== index));
  };

  // Handle checkout submission
  const handleCheckout = async () => {
    try {
      if (!signature.trim()) {
        setError('Digital signature is required');
        return;
      }

      setLoading(true);
      setError('');

      const checkoutData = {
        appointmentId,
        billingCodes: billingCodes.map(code => ({
          ...code,
          totalPrice: code.units * code.unitPrice
        })),
        signature: {
          data: signature,
          timestamp: new Date().toISOString()
        },
        paymentMethod,
        amountPaid: parseFloat(amountPaid),
        visitNotes,
        followUp,
        alerts
      };

      const response = await fetch('http://localhost:5001/api/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkoutData)
      });

      if (response.ok) {
        // Redirect back to Today's Patients
        navigate('/secretary/todays-patients');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to checkout patient');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Failed to checkout patient');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, totalAmount, balance, change } = calculateTotals();

  if (loading && !appointment) {
    return (
      <div className="checkout-loading">
        <div className="loading-spinner"></div>
        <p>Loading appointment details...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="checkout-error">
        <h2>Appointment Not Found</h2>
        <p>The requested appointment could not be found.</p>
        <button onClick={() => navigate('/secretary/todays-patients')}>
          Back to Today's Patients
        </button>
      </div>
    );
  }

  return (
    <div className="patient-checkout">
      <div className="checkout-header">
        <button 
          className="back-button"
          onClick={() => navigate('/secretary/todays-patients')}
        >
          ← Back to Today's Patients
        </button>
        <h1>Patient Checkout</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="checkout-content">
        {/* Patient Overview */}
        <div className="patient-overview">
          <div className="patient-avatar">
            <div className="avatar-placeholder">
              {appointment.patientId?.firstName?.charAt(0) || 'P'}
            </div>
          </div>
          <div className="patient-info">
            <h2>{appointment.patientId?.firstName} {appointment.patientId?.lastName}</h2>
            <p className="record-number">#{appointment.patientId?.recordNumber}</p>
            <p className="visit-info">{appointment.visitType} - {appointment.time}</p>
            <p className="phone">{appointment.patientId?.phone}</p>
          </div>
        </div>

        {/* Billing Codes Section */}
        <div className="checkout-section">
          <h3>Billing Codes Used Today</h3>
          <div className="billing-codes">
            {billingCodes.map((code, index) => (
              <div key={index} className="billing-code-row">
                <input
                  type="text"
                  placeholder="Code"
                  value={code.code}
                  onChange={(e) => updateBillingCode(index, 'code', e.target.value)}
                  className="code-input"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={code.description}
                  onChange={(e) => updateBillingCode(index, 'description', e.target.value)}
                  className="description-input"
                />
                <input
                  type="number"
                  placeholder="Units"
                  value={code.units}
                  onChange={(e) => updateBillingCode(index, 'units', parseInt(e.target.value) || 1)}
                  className="units-input"
                  min="1"
                />
                <input
                  type="number"
                  placeholder="Unit Price"
                  value={code.unitPrice}
                  onChange={(e) => updateBillingCode(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="price-input"
                  step="0.01"
                  min="0"
                />
                <div className="total-price">
                  ${(code.units * code.unitPrice).toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => removeBillingCode(index)}
                  className="remove-code-btn"
                  disabled={billingCodes.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addBillingCode} className="add-code-btn">
              + Add Billing Code
            </button>
          </div>
        </div>

        {/* Payment Information */}
        <div className="checkout-section">
          <h3>Payment Information</h3>
          <div className="payment-grid">
            <div className="payment-method">
              <label>Payment Method:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="insurance">Insurance</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="check">Check</option>
                <option value="package">Care Package</option>
              </select>
            </div>
            <div className="amount-paid">
              <label>Amount Paid:</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
              />
            </div>
          </div>
          
          <div className="payment-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Amount Paid:</span>
              <span>${amountPaid.toFixed(2)}</span>
            </div>
            <div className={`summary-row ${balance > 0 ? 'balance-due' : 'balance-paid'}`}>
              <span>{balance > 0 ? 'Balance Due:' : 'Change:'}</span>
              <span>${Math.abs(balance).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="checkout-section">
          <h3>Digital Signature</h3>
          <div className="signature-panel">
            <textarea
              placeholder="Patient signature (type patient name to confirm)"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows="3"
            />
            <p className="signature-note">
              Patient confirms receipt of services and agrees to payment terms.
            </p>
          </div>
        </div>

        {/* Visit Notes */}
        <div className="checkout-section">
          <h3>Visit Notes (Optional)</h3>
          <textarea
            placeholder="Additional notes about the visit..."
            value={visitNotes}
            onChange={(e) => setVisitNotes(e.target.value)}
            rows="4"
          />
        </div>

        {/* Follow-up */}
        <div className="checkout-section">
          <h3>Follow-up Appointment</h3>
          <div className="followup-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={followUp.required}
                onChange={(e) => setFollowUp({...followUp, required: e.target.checked})}
              />
              Schedule follow-up appointment
            </label>
            {followUp.required && (
              <div className="followup-details">
                <input
                  type="date"
                  value={followUp.recommendedDate}
                  onChange={(e) => setFollowUp({...followUp, recommendedDate: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Follow-up notes"
                  value={followUp.notes}
                  onChange={(e) => setFollowUp({...followUp, notes: e.target.value})}
                />
              </div>
            )}
          </div>
        </div>

        {/* Checkout Actions */}
        <div className="checkout-actions">
          <button
            type="button"
            onClick={() => navigate('/secretary/todays-patients')}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            className="checkout-btn"
            disabled={loading || !signature.trim()}
          >
            {loading ? 'Processing...' : 'Complete Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientCheckout;
