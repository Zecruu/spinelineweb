import { useState, useEffect } from 'react';
import './ChangeCalculator.css';

const ChangeCalculator = ({ totalAmount, paymentData, setPaymentData }) => {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [changeDue, setChangeDue] = useState(0);

  useEffect(() => {
    const paid = parseFloat(amountPaid) || 0;
    const change = paid - totalAmount;
    setChangeDue(change > 0 ? change : 0);
    
    setPaymentData({
      method: paymentMethod,
      amount: paid,
      change: change > 0 ? change : 0,
      totalDue: totalAmount
    });
  }, [amountPaid, paymentMethod, totalAmount, setPaymentData]);

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'check', label: 'Check', icon: '📝' },
    { value: 'insurance', label: 'Insurance', icon: '🏥' },
    { value: 'mixed', label: 'Mixed Payment', icon: '🔄' }
  ];

  const quickAmounts = [
    { label: 'Exact', amount: totalAmount },
    { label: '$20', amount: 20 },
    { label: '$50', amount: 50 },
    { label: '$100', amount: 100 },
    { label: '$200', amount: 200 }
  ];

  const handleQuickAmount = (amount) => {
    setAmountPaid(amount.toString());
  };

  const calculateBillBreakdown = () => {
    const change = changeDue;
    const breakdown = {
      twenties: Math.floor(change / 20),
      tens: Math.floor((change % 20) / 10),
      fives: Math.floor((change % 10) / 5),
      ones: Math.floor(change % 5),
      quarters: Math.floor((change % 1) / 0.25),
      dimes: Math.floor(((change % 1) % 0.25) / 0.10),
      nickels: Math.floor((((change % 1) % 0.25) % 0.10) / 0.05),
      pennies: Math.round((((change % 1) % 0.25) % 0.10) % 0.05 / 0.01)
    };
    return breakdown;
  };

  const billBreakdown = calculateBillBreakdown();

  const isPaymentComplete = () => {
    const paid = parseFloat(amountPaid) || 0;
    return paid >= totalAmount;
  };

  const getPaymentStatus = () => {
    const paid = parseFloat(amountPaid) || 0;
    if (paid === 0) return { status: 'pending', message: 'Enter payment amount', color: '#6b7280' };
    if (paid < totalAmount) return { status: 'insufficient', message: `Short $${(totalAmount - paid).toFixed(2)}`, color: '#ef4444' };
    if (paid === totalAmount) return { status: 'exact', message: 'Exact payment', color: '#10b981' };
    return { status: 'overpaid', message: `Change due: $${changeDue.toFixed(2)}`, color: '#f59e0b' };
  };

  const paymentStatus = getPaymentStatus();

  return (
    <div className="checkout-section">
      <h3>💵 Payment & Change Calculator</h3>
      
      <div className="payment-summary">
        <div className="amount-due">
          <span className="label">Total Due:</span>
          <span className="amount">${totalAmount.toFixed(2)}</span>
        </div>
        
        <div className="payment-method-selection">
          <label className="form-label">Payment Method:</label>
          <div className="payment-methods">
            {paymentMethods.map(method => (
              <button
                key={method.value}
                className={`payment-method-btn ${paymentMethod === method.value ? 'active' : ''}`}
                onClick={() => setPaymentMethod(method.value)}
              >
                <span className="method-icon">{method.icon}</span>
                <span className="method-label">{method.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {paymentMethod === 'cash' && (
        <div className="cash-calculator">
          <div className="calculator-header">
            <h4>💰 Cash Payment Calculator</h4>
            <button 
              className="btn-toggle"
              onClick={() => setCalculatorOpen(!calculatorOpen)}
            >
              {calculatorOpen ? 'Hide Calculator' : 'Show Calculator'}
            </button>
          </div>

          <div className="payment-input-section">
            <div className="amount-input-group">
              <label className="form-label">Amount Received:</label>
              <div className="input-with-currency">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  className="amount-input"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="quick-amounts">
              <span className="quick-label">Quick amounts:</span>
              <div className="quick-buttons">
                {quickAmounts.map((quick, index) => (
                  <button
                    key={index}
                    className="quick-amount-btn"
                    onClick={() => handleQuickAmount(quick.amount)}
                  >
                    {quick.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="payment-status-display">
            <div 
              className="status-indicator"
              style={{ backgroundColor: paymentStatus.color }}
            >
              {paymentStatus.message}
            </div>
          </div>

          {changeDue > 0 && calculatorOpen && (
            <div className="change-breakdown">
              <h5>💸 Change Breakdown</h5>
              <div className="change-total">
                <span>Total Change Due: </span>
                <span className="change-amount">${changeDue.toFixed(2)}</span>
              </div>
              
              <div className="bill-breakdown">
                {billBreakdown.twenties > 0 && (
                  <div className="bill-item">
                    <span className="bill-type">$20 bills:</span>
                    <span className="bill-count">{billBreakdown.twenties}</span>
                    <span className="bill-total">${(billBreakdown.twenties * 20).toFixed(2)}</span>
                  </div>
                )}
                {billBreakdown.tens > 0 && (
                  <div className="bill-item">
                    <span className="bill-type">$10 bills:</span>
                    <span className="bill-count">{billBreakdown.tens}</span>
                    <span className="bill-total">${(billBreakdown.tens * 10).toFixed(2)}</span>
                  </div>
                )}
                {billBreakdown.fives > 0 && (
                  <div className="bill-item">
                    <span className="bill-type">$5 bills:</span>
                    <span className="bill-count">{billBreakdown.fives}</span>
                    <span className="bill-total">${(billBreakdown.fives * 5).toFixed(2)}</span>
                  </div>
                )}
                {billBreakdown.ones > 0 && (
                  <div className="bill-item">
                    <span className="bill-type">$1 bills:</span>
                    <span className="bill-count">{billBreakdown.ones}</span>
                    <span className="bill-total">${billBreakdown.ones.toFixed(2)}</span>
                  </div>
                )}
                {billBreakdown.quarters > 0 && (
                  <div className="bill-item">
                    <span className="bill-type">Quarters:</span>
                    <span className="bill-count">{billBreakdown.quarters}</span>
                    <span className="bill-total">${(billBreakdown.quarters * 0.25).toFixed(2)}</span>
                  </div>
                )}
                {billBreakdown.dimes > 0 && (
                  <div className="bill-item">
                    <span className="bill-type">Dimes:</span>
                    <span className="bill-count">{billBreakdown.dimes}</span>
                    <span className="bill-total">${(billBreakdown.dimes * 0.10).toFixed(2)}</span>
                  </div>
                )}
                {billBreakdown.nickels > 0 && (
                  <div className="bill-item">
                    <span className="bill-type">Nickels:</span>
                    <span className="bill-count">{billBreakdown.nickels}</span>
                    <span className="bill-total">${(billBreakdown.nickels * 0.05).toFixed(2)}</span>
                  </div>
                )}
                {billBreakdown.pennies > 0 && (
                  <div className="bill-item">
                    <span className="bill-type">Pennies:</span>
                    <span className="bill-count">{billBreakdown.pennies}</span>
                    <span className="bill-total">${(billBreakdown.pennies * 0.01).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {paymentMethod !== 'cash' && (
        <div className="non-cash-payment">
          <div className="payment-info">
            <p>
              {paymentMethod === 'card' && '💳 Card payment - no change calculation needed'}
              {paymentMethod === 'check' && '📝 Check payment - verify amount matches total due'}
              {paymentMethod === 'insurance' && '🏥 Insurance payment - verify coverage and copay'}
              {paymentMethod === 'mixed' && '🔄 Mixed payment - specify breakdown in notes'}
            </p>
          </div>
          
          <div className="payment-confirmation">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPaymentComplete()}
                onChange={(e) => setAmountPaid(e.target.checked ? totalAmount.toString() : '0')}
              />
              Payment of ${totalAmount.toFixed(2)} confirmed
            </label>
          </div>
        </div>
      )}

      <div className="payment-summary-footer">
        <div className="summary-row">
          <span>Payment Method:</span>
          <span>{paymentMethods.find(m => m.value === paymentMethod)?.label}</span>
        </div>
        <div className="summary-row">
          <span>Amount Received:</span>
          <span>${(parseFloat(amountPaid) || 0).toFixed(2)}</span>
        </div>
        {changeDue > 0 && (
          <div className="summary-row highlight">
            <span>Change Due:</span>
            <span>${changeDue.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeCalculator;
