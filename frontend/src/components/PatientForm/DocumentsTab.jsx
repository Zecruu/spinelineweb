import { useState, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';

const DocumentsTab = ({ formData, updateFormData, token, patientId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const allowedFileTypes = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'text/csv': '.csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-excel': '.xls'
  };

  const documentCategories = [
    'Insurance Card',
    'ID Document',
    'Intake Form',
    'X-ray',
    'Medical Records',
    'Referral',
    'Other'
  ];

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      if (!allowedFileTypes[file.type]) {
        alert(`File type ${file.type} is not supported. Please upload PDF, JPG, PNG, CSV, or Excel files.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    const newAttachments = [];

    for (const file of files) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // For now, we'll simulate file upload and store file info
        // In production, you'd upload to a cloud storage service
        const fileInfo = {
          filename: `${Date.now()}_${file.name}`,
          originalName: file.name,
          mimetype: file.type,
          size: file.size,
          uploadDate: new Date().toISOString(),
          category: 'Other',
          description: '',
          // For demo purposes, we'll create a data URL for images
          url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        };

        newAttachments.push(fileInfo);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    // Update form data with new attachments
    updateFormData({
      attachments: [...formData.attachments, ...newAttachments]
    });

    setUploading(false);
    setUploadProgress({});
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const removeAttachment = (index) => {
    const updatedAttachments = formData.attachments.filter((_, i) => i !== index);
    updateFormData({ attachments: updatedAttachments });
  };

  const updateAttachmentInfo = (index, field, value) => {
    const updatedAttachments = [...formData.attachments];
    updatedAttachments[index] = {
      ...updatedAttachments[index],
      [field]: value
    };
    updateFormData({ attachments: updatedAttachments });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
    if (mimetype === 'text/csv') return '📋';
    return '📎';
  };

  return (
    <div className="documents-tab">
      <div className="section-header">📄 Document Management</div>
      
      <div className="upload-section">
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            <p><strong>Click to upload</strong> or drag and drop files here</p>
            <p className="upload-hint">
              Supported formats: PDF, JPG, PNG, CSV, Excel (Max 10MB each)
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>

        {uploading && (
          <div className="upload-progress">
            <h4>Uploading files...</h4>
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="progress-item">
                <span>{filename}</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span>{progress}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="documents-list">
        <h4>Uploaded Documents ({formData.attachments.length})</h4>
        
        {formData.attachments.length === 0 ? (
          <div className="no-documents">
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="documents-grid">
            {formData.attachments.map((attachment, index) => (
              <div key={index} className="document-item">
                <div className="document-header">
                  <div className="file-info">
                    <span className="file-icon">{getFileIcon(attachment.mimetype)}</span>
                    <div className="file-details">
                      <div className="file-name">{attachment.originalName}</div>
                      <div className="file-meta">
                        {formatFileSize(attachment.size)} • {new Date(attachment.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    className="remove-document-btn"
                    onClick={() => removeAttachment(index)}
                  >
                    ✕
                  </button>
                </div>

                <div className="document-fields">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-select"
                      value={attachment.category || 'Other'}
                      onChange={(e) => updateAttachmentInfo(index, 'category', e.target.value)}
                    >
                      {documentCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      className="form-input"
                      value={attachment.description || ''}
                      onChange={(e) => updateAttachmentInfo(index, 'description', e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                </div>

                {attachment.url && attachment.mimetype.startsWith('image/') && (
                  <div className="image-preview">
                    <img 
                      src={attachment.url} 
                      alt={attachment.originalName}
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .upload-zone {
          border: 2px dashed rgba(148, 163, 184, 0.3);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(51, 65, 85, 0.3);
        }
        
        .upload-zone:hover, .upload-zone.drag-over {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        
        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .upload-text p {
          color: #f1f5f9;
          margin: 0.5rem 0;
        }
        
        .upload-hint {
          color: rgba(241, 245, 249, 0.7);
          font-size: 0.9rem;
        }
        
        .upload-progress {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(51, 65, 85, 0.5);
          border-radius: 6px;
        }
        
        .progress-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          transition: width 0.3s ease;
        }
        
        .documents-grid {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .document-item {
          background: rgba(51, 65, 85, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 6px;
          padding: 1rem;
        }
        
        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        
        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .file-icon {
          font-size: 1.5rem;
        }
        
        .file-name {
          color: #f1f5f9;
          font-weight: 500;
        }
        
        .file-meta {
          color: rgba(241, 245, 249, 0.7);
          font-size: 0.8rem;
        }
        
        .remove-document-btn {
          background: rgba(239, 68, 68, 0.8);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .document-fields {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .image-preview {
          text-align: center;
          padding: 1rem;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 4px;
        }
        
        .no-documents {
          text-align: center;
          padding: 2rem;
          color: rgba(241, 245, 249, 0.7);
        }
      `}</style>
    </div>
  );
};

export default DocumentsTab;
