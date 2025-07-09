import { useRef, useEffect, useState } from 'react';
import './ESignatureCapture.css';

const ESignatureCapture = ({ signature, setSignature, billingCodes, totalAmount }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Set canvas background to white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      captureSignature();
    }
  };

  const captureSignature = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    setSignature(signatureData);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas and set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
    setSignature(null);
  };

  // Touch events for mobile devices
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvasRef.current.dispatchEvent(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvasRef.current.dispatchEvent(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvasRef.current.dispatchEvent(mouseEvent);
  };

  return (
    <div className="checkout-section full-width">
      <h3>✍️ Patient Signature</h3>
      
      <div className="signature-agreement">
        <h4>Patient Agreement</h4>
        <p>By signing below, I confirm that:</p>
        <ul>
          <li>I have received the care and treatment described</li>
          <li>The billing codes listed below are accurate for services rendered</li>
          <li>I approve the charges totaling <strong>${totalAmount.toFixed(2)}</strong></li>
        </ul>
        
        {billingCodes.length > 0 && (
          <div className="billing-codes-summary">
            <h5>Services Rendered:</h5>
            <ul>
              {billingCodes.map((code, index) => (
                <li key={index}>
                  {code.code} - {code.description} (${code.price.toFixed(2)})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="signature-section">
        <div className="signature-canvas-container">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="signature-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          
          {!hasSignature && (
            <div className="signature-placeholder">
              Sign here with your mouse or finger
            </div>
          )}
        </div>
        
        <div className="signature-controls">
          <button 
            className="btn-danger"
            onClick={clearSignature}
            disabled={!hasSignature}
          >
            Clear Signature
          </button>
          
          <div className="signature-status">
            {hasSignature ? (
              <span className="signature-valid">✓ Signature Captured</span>
            ) : (
              <span className="signature-required">Signature Required</span>
            )}
          </div>
        </div>
      </div>

      <div className="signature-footer">
        <p className="signature-note">
          <strong>Note:</strong> This digital signature has the same legal effect as a handwritten signature.
          By signing, you acknowledge that you have read and agree to the terms above.
        </p>
        
        <div className="signature-metadata">
          <p>Date: {new Date().toLocaleDateString()}</p>
          <p>Time: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ESignatureCapture;
