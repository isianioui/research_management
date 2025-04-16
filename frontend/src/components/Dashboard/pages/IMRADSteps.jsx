import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { generateIMRADPdf } from '../functions/pdfGenerator';
import './IMRADSteps.css';

const StepComponent = ({ step, stepData, onChange, onNext, isLastStep }) => {
  return (
    <div className="step-container">
      <h2 className="step-title">{stepData.label}</h2>
      {stepData.fields.map((field) => (
        <div key={field.key} className="form-group">
          <label>{field.label}:</label>
          {field.type === 'textarea' ? (
            <textarea
              onChange={(e) => onChange({ ...step, [field.key]: e.target.value })}
              className="form-control"
              rows="4"
            />
          ) : (
            <input
              type={field.type}
              value={step[field.key] || ''}
              onChange={(e) => onChange({ ...step, [field.key]: e.target.value })}
              className="form-control"
            />
          )}
        </div>
      ))}
      <div className="form-group">
        <label>Status:</label>
        <select
          value={step.statut || 'en attente'}
          onChange={(e) => onChange({ ...step, statut: e.target.value })}
          className="form-control"
        >
          {stepData.statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={onNext}
        disabled={step.statut !== 'terminé'}
        className={`next-button ${step.statut === 'terminé' ? 'enabled' : 'disabled'}`}
      >
        {isLastStep ? 'Finish' : 'Next Step'}
      </button>
    </div>
  );
};

const IMRADSteps = () => {
  const { projectId } = useParams();
  const [steps, setSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState('introduction');
  const [loading, setLoading] = useState(true);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [dataSource, setDataSource] = useState('initializing'); // Track where data came from

  const stepOrder = ['introduction', 'methodes', 'resultats', 'discussion'];

  const stepConfig = {
    introduction: {
      label: 'Introduction',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      fields: [
        { key: 'context', label: 'Context', type: 'textarea' },
        { key: 'objectives', label: 'Objectives', type: 'textarea' },
      ],
    },
    methodes: {
      label: 'Methods',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      fields: [
        { key: 'protocole', label: 'Protocol', type: 'textarea' },
        { key: 'outils', label: 'Tools', type: 'textarea' },
        { key: 'echantillonnage', label: 'Sampling', type: 'textarea' },
        { key: 'analyse', label: 'Analysis', type: 'textarea' },
      ],
    },
    resultats: {
      label: 'Results',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      fields: [
        { key: 'bruts', label: 'Raw Data', type: 'textarea' },
        { key: 'statistiques', label: 'Statistics', type: 'textarea' },
        { key: 'observations', label: 'Observations', type: 'textarea' },
      ],
    },
    discussion: {
      label: 'Discussion',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      fields: [
        { key: 'interpretation', label: 'Interpretation', type: 'textarea' },
        { key: 'comparaison', label: 'Comparison', type: 'textarea' },
        { key: 'limites', label: 'Limitations', type: 'textarea' },
        { key: 'perspectives', label: 'Perspectives', type: 'textarea' },
      ],
    },
  };

  // Create empty steps structure with default values
  const createEmptySteps = () => {
    return {
      introduction: { context: '', objectives: '', statut: 'en attente' },
      methodes: { protocole: '', outils: '', echantillonnage: '', analyse: '', statut: 'en attente' },
      resultats: { bruts: '', statistiques: '', observations: '', statut: 'en attente' },
      discussion: { interpretation: '', comparaison: '', limites: '', perspectives: '', statut: 'en attente' }
    };
  };

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        setLoading(true);

        // First try to get project title regardless of where step data comes from
        try {
          const token = localStorage.getItem('token');
          const projectResponse = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (projectResponse.data?.titre) {
            setProjectTitle(projectResponse.data.titre);
            // Save project title to sessionStorage for page reloads
            sessionStorage.setItem(`imrad_project_title_${projectId}`, projectResponse.data.titre);
          }
        } catch (error) {
          console.error('Error fetching project details:', error);
          // Try to get project title from sessionStorage if API fails
          const savedTitle = sessionStorage.getItem(`imrad_project_title_${projectId}`);
          if (savedTitle) {
            setProjectTitle(savedTitle);
          }
        }
        
        // Check for active session state first (during the user's session)
        const sessionState = sessionStorage.getItem(`imrad_steps_${projectId}_session`);
        if (sessionState) {
          const parsedData = JSON.parse(sessionState);
          setSteps(parsedData);
          
          // Check if all steps are completed
          const allStepsComplete = stepOrder.every(
            key => parsedData[key]?.statut === 'terminé'
          );
          setShowDownloadButton(allStepsComplete);
          
          setDataSource('session');
          setLoading(false);
          
          // Restore current step position
          const savedStep = sessionStorage.getItem(`imrad_currentStep_${projectId}`);
          if (savedStep && stepOrder.includes(savedStep)) {
            setCurrentStep(savedStep);
          }
          
          return;
        }
        
        // Then try to load from localStorage (persisted across sessions)
        const localData = localStorage.getItem(`imrad_steps_${projectId}`);
        let initialData = localData ? JSON.parse(localData) : createEmptySteps();
        
        // Then try to fetch from server and merge with local data if needed
        try {
          const response = await axios.get(`http://localhost:5000/api/imrad/${projectId}`);
          if (response.data && Object.keys(response.data).length > 0) {
            // If localStorage has newer edits, we need to merge intelligently
            if (localData) {
              // Start with server data
              const mergedData = { ...response.data };
              
              // Merge in each step from local data, preferring local if content exists
              stepOrder.forEach(stepKey => {
                if (initialData[stepKey]) {
                  // For each field in the step configuration
                  stepConfig[stepKey].fields.forEach(field => {
                    // If local data has content for this field but server doesn't, use local
                    if (initialData[stepKey][field.key] && 
                        (!mergedData[stepKey] || !mergedData[stepKey][field.key])) {
                      if (!mergedData[stepKey]) mergedData[stepKey] = {};
                      mergedData[stepKey][field.key] = initialData[stepKey][field.key];
                    }
                  });
                  
                  // Keep local completion status if further along
                  const localStatus = initialData[stepKey].statut;
                  const serverStatus = mergedData[stepKey]?.statut || 'en attente';
                  
                  if (!mergedData[stepKey]) mergedData[stepKey] = {};
                  
                  if (localStatus === 'terminé' && serverStatus !== 'terminé') {
                    mergedData[stepKey].statut = localStatus;
                  } else if (localStatus === 'en cours' && serverStatus === 'en attente') {
                    mergedData[stepKey].statut = localStatus;
                  }
                }
              });
              
              initialData = mergedData;
              setDataSource('server+local');
            } else {
              initialData = response.data;
              setDataSource('server');
            }
          } else {
            setDataSource('local');
          }
        } catch (error) {
          console.error('Error fetching from server, using local data:', error);
          setDataSource('local');
        }
        
        setSteps(initialData);
        
        // Check if all steps are completed
        const allStepsComplete = stepOrder.every(
          key => initialData[key]?.statut === 'terminé'
        );
        setShowDownloadButton(allStepsComplete);
        
        // Store in both storage types to ensure persistence
        localStorage.setItem(`imrad_steps_${projectId}`, JSON.stringify(initialData));
        sessionStorage.setItem(`imrad_steps_${projectId}_session`, JSON.stringify(initialData));
        
        // Check if there's any saved "current step" in sessionStorage
        const savedStep = sessionStorage.getItem(`imrad_currentStep_${projectId}`);
        if (savedStep && stepOrder.includes(savedStep)) {
          setCurrentStep(savedStep);
        }
        
      } catch (error) {
        console.error('Error loading IMRAD steps:', error);
        // Fall back to empty structure if everything fails
        const emptyData = createEmptySteps();
        setSteps(emptyData);
        setDataSource('empty');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSteps();
  }, [projectId]);

  // Save to both localStorage and sessionStorage whenever steps change
  useEffect(() => {
    if (steps) {
      localStorage.setItem(`imrad_steps_${projectId}`, JSON.stringify(steps));
      sessionStorage.setItem(`imrad_steps_${projectId}_session`, JSON.stringify(steps));
      
      // Also save current step to sessionStorage
      sessionStorage.setItem(`imrad_currentStep_${projectId}`, currentStep);
      
      // Check if all steps are completed to show download button
      const allStepsComplete = stepOrder.every(
        key => steps[key]?.statut === 'terminé'
      );
      setShowDownloadButton(allStepsComplete);
    }
  }, [steps, projectId, currentStep, stepOrder]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // First, save to localStorage and sessionStorage as backup
      localStorage.setItem(`imrad_steps_${projectId}`, JSON.stringify(steps));
      sessionStorage.setItem(`imrad_steps_${projectId}_session`, JSON.stringify(steps));
      
      // Then try to save to server
      try {
        const response = await axios.put(
          `http://localhost:5000/api/imrad/${projectId}`,
          { ...steps },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.status === 200) {
          showNotification('IMRAD steps updated successfully!');
          setDataSource('server');
        }
      } catch (error) {
        console.error('Error saving to server:', error);
        showNotification('Server save failed. Data stored locally.', 'warning');
      }
    } catch (error) {
      console.error('Error in save process:', error);
      showNotification('An error occurred while saving. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const result = await generateIMRADPdf(projectId, steps, projectTitle);
      
      if (result.success) {
        // Save the PDF directly (will trigger browser download)
        result.pdf.save(result.fileName);
        
        showNotification(`PDF generated successfully: ${result.fileName}`);
        
        // For debugging - verify the title is correct
        console.log('Generated PDF with title:', result.projectTitle);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      showNotification(`Failed to generate PDF: ${error.message}`, "error");
    }
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

  const handleNextStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleStepChange = (updatedStep) => {
    setSteps(prev => ({
      ...prev,
      [currentStep]: {
        ...prev[currentStep],
        ...updatedStep,
        // Add completion date if status is 'terminé'
        ...(updatedStep.statut === 'terminé' && !prev[currentStep].date_completion 
          ? { date_completion: new Date().toISOString() }
          : {})
      }
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading project data...</p>
      </div>
    );
  }

  if (!steps) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <p>Unable to load project data. Please try again later.</p>
      </div>
    );
  }

  const currentStepData = stepConfig[currentStep];
  const isLastStep = currentStep === stepOrder[stepOrder.length - 1];

  // Calculate completion percentage
  const completedSteps = stepOrder.filter(key => steps[key]?.statut === 'terminé').length;
  const completionPercentage = Math.round((completedSteps / stepOrder.length) * 100);

  return (
    <div className="imrad-steps-container">
      <div className="header-section">
        <h1>IMRAD Workflow <span className="project-id"></span></h1>
        {projectTitle && <h2 className="project-title">{projectTitle}</h2>}
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${completionPercentage}%` }}>
            <span className="progress-text">{completionPercentage}%</span>
          </div>
        </div>
        {dataSource !== 'server' && (
          <div className="data-source-indicator">
            {dataSource === 'local' && <span className="local-data"></span>}
            {dataSource === 'session' && <span className="session-data"></span>}
            {dataSource === 'server+local' && <span className="mixed-data"></span>}
            {dataSource === 'empty' && <span className="empty-data"></span>}
          </div>
        )}
      </div>

      <div className="timeline-container">
        {stepOrder.map((step, index) => {
          const stepStatus = steps[step]?.statut || 'en attente';
          const isActive = currentStep === step;
          const isCompleted = stepStatus === 'terminé';
          const stepDate = steps[step]?.date_completion ?
            new Date(steps[step].date_completion).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
            }) : '';

          return (
            <React.Fragment key={step}>
              <div
                className={`timeline-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => setCurrentStep(step)}
              >
                <div className="node-date">{stepDate}</div>
                <div className="node-icon">
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="node-label">{stepConfig[step].label}</div>
                <div className="node-status">{stepStatus}</div>
              </div>
              {index < stepOrder.length - 1 && (
                <div className={`timeline-connector ${isCompleted ? 'completed' : ''}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="content-section">
        <StepComponent
          step={steps[currentStep] || { statut: 'en attente' }}
          stepData={currentStepData}
          onChange={handleStepChange}
          onNext={handleNextStep}
          isLastStep={isLastStep}
        />
      </div>

      <div className="actions-section">
        <button 
          onClick={handleSave} 
          className="save-button"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner"></span>
              Saving...
            </>
          ) : (
            <>
              <span className="icon">💾</span>
              Save Changes to Server
            </>
          )}
        </button>
        
        <button 
          onClick={handleGeneratePDF} 
          className="download-button"
        >
          <span className="icon">📄</span>
          Export PDF
        </button>
      </div>
    </div>
  );
};

export default IMRADSteps;