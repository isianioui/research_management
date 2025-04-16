import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { File, Download, Eye, Trash } from 'lucide-react';
import { useSession } from '../../../context/SessionContext';

const DocumentsViewer = () => {
  const { session } = useSession();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('http://localhost:5000/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });

      setDocuments(response.data.documents || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents. Please try again later.');
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
  };

  const handleDownloadDocument = (document) => {
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = document.fileUrl || document.file_url;
    link.download = document.fileName || document.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://localhost:5000/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });

      // Update the documents list
      setDocuments(documents.filter(doc => doc.id !== documentId));
      
      // Clear selected document if it was deleted
      if (selectedDocument && selectedDocument.id === documentId) {
        setSelectedDocument(null);
      }
      
      showNotification('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      showNotification('Failed to delete document', 'error');
    }
  };

  const closePreview = () => {
    setSelectedDocument(null);
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }, 100);
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <File />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <File color="#FF5733" />;
      case 'doc':
      case 'docx':
        return <File color="#2B579A" />;
      case 'xls':
      case 'xlsx':
        return <File color="#217346" />;
      case 'ppt':
      case 'pptx':
        return <File color="#D24726" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <File color="#0078D7" />;
      default:
        return <File />;
    }
  };

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1>My Documents</h1>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading documents...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <File size={48} />
          <p>No documents found. Documents generated from your projects will appear here.</p>
        </div>
      ) : (
        <div className="documents-grid">
          {documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">
                {getFileIcon(doc.fileName || doc.file_name)}
              </div>
              <div className="document-info">
                <h3>{doc.fileName || doc.file_name || 'Untitled Document'}</h3>
                <p>{new Date(doc.createdAt || doc.created_at).toLocaleDateString()}</p>
                {doc.projectName && <p>Project: {doc.projectName}</p>}
                {doc.methodology && <p>Methodology: {doc.methodology}</p>}
              </div>
              <div className="document-actions">
                <button 
                  className="action-button view"
                  onClick={() => handleViewDocument(doc)}
                  title="View document"
                >
                  <Eye size={18} />
                </button>
                <button 
                  className="action-button download"
                  onClick={() => handleDownloadDocument(doc)}
                  title="Download document"
                >
                  <Download size={18} />
                </button>
                <button 
                  className="action-button delete"
                  onClick={() => handleDeleteDocument(doc.id)}
                  title="Delete document"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDocument && (
        <div className="document-preview-overlay">
          <div className="document-preview-container">
            <div className="preview-header">
              <h2>{selectedDocument.fileName || selectedDocument.file_name || 'Document Preview'}</h2>
              <button className="close-button" onClick={closePreview}>×</button>
            </div>
            <div className="preview-content">
              {selectedDocument.fileType === 'pdf' || (selectedDocument.fileName || selectedDocument.file_name || '').endsWith('.pdf') ? (
                <iframe 
                  src={`${selectedDocument.fileUrl || selectedDocument.file_url}#toolbar=0`} 
                  width="100%" 
                  height="100%" 
                  title="PDF Preview"
                ></iframe>
              ) : (
                <div className="preview-not-available">
                  <p>Preview not available for this file type.</p>
                  <button 
                    className="download-button"
                    onClick={() => handleDownloadDocument(selectedDocument)}
                  >
                    <Download size={18} />
                    Download to view
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .documents-container {
          padding: 2rem;
          background-color: #1F2937;
          min-height: 100vh;
          color: #F3F4F6;
        }

        .documents-header {
          margin-bottom: 2rem;
        }

        .documents-header h1 {
          font-size: 1.875rem;
          font-weight: 600;
          color: #F3F4F6;
        }

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .document-card {
          background-color: #374151;
          border-radius: 0.75rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #4B5563;
          transition: all 0.2s ease;
        }

        .document-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .document-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 2rem;
        }

        .document-info {
          flex: 1;
        }

        .document-info h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #F3F4F6;
          word-break: break-word;
        }

        .document-info p {
          font-size: 0.875rem;
          color: #D1D5DB;
          margin-bottom: 0.25rem;
        }

        .document-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #4B5563;
        }

        .action-button {
          padding: 0.5rem;
          border-radius: 0.375rem;
          background-color: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #D1D5DB;
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .action-button.view:hover {
          color: #3B82F6;
        }

        .action-button.download:hover {
          color: #10B981;
        }

        .action-button.delete:hover {
          color: #EF4444;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
        }

        .loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid #3B82F6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background-color: rgba(239, 68, 68, 0.2);
          color: #EF4444;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background-color: #374151;
          border-radius: 0.75rem;
          color: #9CA3AF;
          text-align: center;
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .document-preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .document-preview-container {
          background-color: #1F2937;
          border-radius: 0.75rem;
          width: 90%;
          height: 90%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #4B5563;
        }

        .preview-header h2 {
          font-size: 1.25rem;
          margin: 0;
          color: #F3F4F6;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #D1D5DB;
          cursor: pointer;
        }

        .close-button:hover {
          color: #F3F4F6;
        }

        .preview-content {
          flex: 1;
          overflow: auto;
          padding: 1.5rem;
          background-color: #111827;
        }

        .preview-not-available {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #9CA3AF;
        }

        .download-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background-color: #3B82F6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .download-button:hover {
          background-color: #2563EB;
        }

        .notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 10px 20px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
          z-index: 1100;
        }

        .notification.success {
          background-color: #10B981;
        }

        .notification.error {
          background-color: #EF4444;
        }

        .notification.show {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .documents-container {
            padding: 1rem;
          }
          
          .documents-grid {
            grid-template-columns: 1fr;
          }
          
          .document-preview-container {
            width: 95%;
            height: 95%;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentsViewer;