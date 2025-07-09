import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import ScheduleNextVisit from '../components/checkout/ScheduleNextVisit';
import ESignatureCapture from '../components/checkout/ESignatureCapture';
import BillingCodesDisplay from '../components/checkout/BillingCodesDisplay';
import CarePackageDisplay from '../components/checkout/CarePackageDisplay';
import DiagnosticCodesDisplay from '../components/checkout/DiagnosticCodesDisplay';
import ChangeCalculator from '../components/checkout/ChangeCalculator';
import CopayLogic from '../components/checkout/CopayLogic';
import './Checkout.css';

const Checkout = ({ token, user, appointmentId, onBack }) => {
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [billingCodes, setBillingCodes] = useState([]);
  const [diagnosticCodes, setDiagnosticCodes] = useState([]);
  const [carePackages, setCarePackages] = useState([]);
  const [signature, setSignature] = useState(null);
  const [paymentData, setPaymentData] = useState({
    method: 'cash',
    amount: 0,
    change: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);



  useEffect(() => {
    if (appointmentId) {
      fetchCheckoutData();
    }
  }, [appointmentId]);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointment details
      const appointmentResponse = await fetch(
        `${API_BASE_URL}/api/appointments/${appointmentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (!appointmentResponse.ok) {
        throw new Error('Failed to fetch appointment');
      }
      
      const appointmentData = await appointmentResponse.json();
      setAppointment(appointmentData.data.appointment);
      
      // Fetch patient details
      const patientResponse = await fetch(
        `${API_BASE_URL}/api/patients/${appointmentData.data.appointment.patientId._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (!patientResponse.ok) {
        throw new Error('Failed to fetch patient');
      }
      
      const patientData = await patientResponse.json();
      setPatient(patientData.data.patient);
      
      // Fetch billing codes for this visit
      await fetchBillingCodes();
      
      // Fetch diagnostic codes for this visit
      await fetchDiagnosticCodes();
      
      // Fetch care packages
      await fetchCarePackages();
      
    } catch (error) {
      console.error('Checkout data fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingCodes = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/billing-codes/appointment/${appointmentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setBillingCodes(data.data.billingCodes || []);
        calculateTotal(data.data.billingCodes || []);
      }
    } catch (error) {
      console.error('Billing codes fetch error:', error);
    }
  };

  const fetchDiagnosticCodes = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/diagnostic-codes/appointment/${appointmentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setDiagnosticCodes(data.data.diagnosticCodes || []);
      }
    } catch (error) {
      console.error('Diagnostic codes fetch error:', error);
    }
  };

  const fetchCarePackages = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/care-packages/patient/${appointment?.patientId._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCarePackages(data.data.carePackages || []);
      }
    } catch (error) {
      console.error('Care packages fetch error:', error);
    }
  };

  const calculateTotal = (codes) => {
    const total = codes.reduce((sum, code) => {
      return sum + (code.price * (code.units || 1));
    }, 0);
    setTotalAmount(total);
  };

  const handleCompleteCheckout = async () => {
    try {
      if (!signature) {
        setError('Patient signature is required');
        return;
      }

      const checkoutData = {
        appointmentId,
        patientId: patient._id,
        billingCodes,
        diagnosticCodes,
        carePackages,
        signature,
        paymentData,
        totalAmount,
        checkoutTime: new Date(),
        processedBy: 'current-user' // Should be actual user ID
      };

      const response = await fetch(`${API_BASE_URL}/api/checkout/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkoutData)
      });

      if (response.ok) {
        alert('Checkout completed successfully!');
        if (onBack) onBack();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout completion error:', error);
      setError('Failed to complete checkout');
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-content">
          <div className="loading">Loading checkout data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-page">
        <div className="checkout-content">
          <div className="error">Error: {error}</div>
          <button onClick={() => onBack && onBack()}>
            Back to Today's Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Top Navigation Header */}
      <div className="checkout-nav">
        <div className="nav-left">
          <button
            className="btn-back"
            onClick={() => onBack && onBack()}
          >
            ← Back to Today's Patients
          </button>
        </div>
        <div className="nav-center">
          <h1>🏥 SpineLine - Patient Checkout</h1>
        </div>
        <div className="nav-right">
          <span className="user-info">{user?.name || user?.username}</span>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-header">
          <h1>Patient Checkout</h1>
          <div className="patient-info">
            <h2>{patient?.firstName} {patient?.lastName}</h2>
            <p>Record #: {patient?.recordNumber}</p>
            <p>Visit Date: {new Date(appointment?.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="checkout-sections">
          {/* Schedule Next Visit */}
          <ScheduleNextVisit 
            patientId={patient?._id}
            token={token}
          />

          {/* Billing Codes */}
          <BillingCodesDisplay
            billingCodes={billingCodes}
            setBillingCodes={setBillingCodes}
            appointmentId={appointmentId}
            patient={patient}
            token={token}
            onCodesChange={calculateTotal}
          />

          {/* Care Packages */}
          <CarePackageDisplay
            carePackages={carePackages}
            setCarePackages={setCarePackages}
            patientId={patient?._id}
            billingCodes={billingCodes}
            token={token}
          />

          {/* Diagnostic Codes */}
          <DiagnosticCodesDisplay
            diagnosticCodes={diagnosticCodes}
            appointmentId={appointmentId}
            token={token}
          />

          {/* Copay Logic */}
          <CopayLogic
            billingCodes={billingCodes}
            patient={patient}
            totalAmount={totalAmount}
            setTotalAmount={setTotalAmount}
          />

          {/* Change Calculator */}
          <ChangeCalculator
            totalAmount={totalAmount}
            paymentData={paymentData}
            setPaymentData={setPaymentData}
          />

          {/* E-Signature */}
          <ESignatureCapture
            signature={signature}
            setSignature={setSignature}
            billingCodes={billingCodes}
            totalAmount={totalAmount}
          />
        </div>

        <div className="checkout-footer">
          <div className="total-display">
            <h3>Total Amount: ${totalAmount.toFixed(2)}</h3>
          </div>
          <div className="checkout-actions">
            <button
              className="btn-cancel"
              onClick={() => onBack && onBack()}
            >
              Cancel
            </button>
            <button 
              className="btn-complete"
              onClick={handleCompleteCheckout}
              disabled={!signature}
            >
              Complete Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
