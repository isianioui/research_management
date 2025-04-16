
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import './PrismaSteps.css';

const PrismaSteps = () => {
  const { projectId } = useParams();
  const [steps, setSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState('identification');
  const [loading, setLoading] = useState(true);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [dataSource, setDataSource] = useState('initializing'); // Track where data came from

  const stepOrder = [
    'identification',
    'elimination_doublons',
    'selection',
    'evaluation_qualite',
    'extraction_donnees',
    'synthese_resultats',
    'discussion',
    'redaction'
  ];

  const stepConfig = {
    identification: {
      label: 'Identification',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      extraFields: [
        { key: 'sources', label: 'Sources', type: 'textarea' },
        { key: 'resultats', label: 'Résultats', type: 'textarea' },
      ],
    },
    elimination_doublons: {
      label: 'Élimination des Doublons',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      extraFields: [
        { key: 'nombre', label: 'Nombre', type: 'number' },
        { key: 'outils', label: 'Outils', type: 'textarea' },
      ],
    },
    selection: {
      label: 'Sélection',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      extraFields: [
        { key: 'criteres', label: 'Critères', type: 'textarea' },
        { key: 'exclusions_titres_resumes', label: 'Exclusions (Titres/Résumés)', type: 'textarea' },
        { key: 'exclusions_texte_integral', label: 'Exclusions (Texte Intégral)', type: 'textarea' },
      ],
    },
    evaluation_qualite: {
      label: 'Évaluation de la Qualité',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      extraFields: [
        { key: 'outils', label: 'Outils', type: 'textarea' },
        { key: 'scores', label: 'Scores', type: 'textarea' },
        { key: 'limites', label: 'Limites', type: 'textarea' },
      ],
    },
    extraction_donnees: {
      label: 'Extraction des Données',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      extraFields: [
        { key: 'descriptives', label: 'Descriptives', type: 'textarea' },
        { key: 'methodologiques', label: 'Méthodologiques', type: 'textarea' },
        { key: 'resultats', label: 'Résultats', type: 'textarea' },
      ],
    },
    synthese_resultats: {
      label: 'Synthèse des Résultats',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      extraFields: [
        { key: 'qualitatifs', label: 'Qualitatifs', type: 'textarea' },
        { key: 'quantitatifs', label: 'Quantitatifs', type: 'textarea' },
        { key: 'tableaux_graphiques', label: 'Tableaux/Graphiques', type: 'textarea' },
      ],
    },
    discussion: {
      label: 'Discussion',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      extraFields: [
        { key: 'interpretation', label: 'Interprétation', type: 'textarea' },
        { key: 'comparaison', label: 'Comparaison', type: 'textarea' },
        { key: 'limites', label: 'Limites', type: 'textarea' },
        { key: 'recommandations', label: 'Recommandations', type: 'textarea' },
      ],
    },
    redaction: {
      label: 'Rédaction',
      statusOptions: ['en attente', 'en cours', 'terminé'],
      extraFields: [
        { key: 'diagramme_prisma', label: 'Diagramme PRISMA', type: 'textarea' },
        { key: 'tableaux_resumes', label: 'Tableaux Résumés', type: 'textarea' },
        { key: 'rapport_final', label: 'Rapport Final', type: 'textarea' },
      ],
    },
  };

  // Initialize with empty steps structure
  const createEmptySteps = () => {
    return stepOrder.reduce((acc, step) => {
      acc[step] = {
        statut: 'en attente',
        ...stepConfig[step].extraFields?.reduce((fields, field) => {
          fields[field.key] = '';
          return fields;
        }, {})
      };
      return acc;
    }, {});
  };

  // Restructure flattened data from server into our hierarchical format
  const restructureServerData = (flatData) => {
    const restructured = createEmptySteps();
    
    // Map server data keys to our structure
    Object.keys(flatData).forEach(key => {
      // Extract step and field from flattened key
      if (key.startsWith('statut_')) {
        const stepKey = key.replace('statut_', '');
        if (restructured[stepKey]) {
          restructured[stepKey].statut = flatData[key];
        }
      } else {
        for (const step of stepOrder) {
          if (key.startsWith(`${step}_`)) {
            const fieldKey = key.replace(`${step}_`, '');
            if (restructured[step] && stepConfig[step].extraFields.some(f => f.key === fieldKey)) {
              restructured[step][fieldKey] = flatData[key];
            }
          }
        }
      }
    });
    
    return restructured;
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check for active session state first (during the user's session)
        const sessionState = sessionStorage.getItem(`prismaSteps_${projectId}_session`);
        if (sessionState) {
          const parsedData = JSON.parse(sessionState);
          setSteps(parsedData);
          setDataSource('session');
          setLoading(false);
          return;
        }
        
        // Then try to load from localStorage (persisted across sessions)
        const savedData = localStorage.getItem(`prismaSteps_${projectId}`);
        let initialData = savedData ? JSON.parse(savedData) : createEmptySteps();
        
        // Finally, try to fetch from server and merge with local data
        try {
          const response = await axios.get(`http://127.0.0.1:5000/api/prisma/${projectId}`);
          if (response.data && Object.keys(response.data).length > 0) {
            // We have server data - restructure it and merge with local
            const serverData = restructureServerData(response.data);
            
            // If localStorage has newer edits, prefer those over server data
            const mergedData = savedData ? {
              ...serverData,
              ...initialData
            } : serverData;
            
            initialData = mergedData;
            setDataSource('server+local');
          } else {
            setDataSource('local');
          }
        } catch (error) {
          console.log('Server unavailable, using local data');
          setDataSource('local');
        }
        
        setSteps(initialData);
        
        // Store in both storage types to ensure persistence
        localStorage.setItem(`prismaSteps_${projectId}`, JSON.stringify(initialData));
        sessionStorage.setItem(`prismaSteps_${projectId}_session`, JSON.stringify(initialData));
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty structure if everything fails
        const emptyData = createEmptySteps();
        setSteps(emptyData);
        setDataSource('empty');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Check if there's any saved "current step" in sessionStorage
    const savedStep = sessionStorage.getItem(`prismaSteps_${projectId}_currentStep`);
    if (savedStep && stepOrder.includes(savedStep)) {
      setCurrentStep(savedStep);
    }
    
  }, [projectId]);

  // Save to both localStorage and sessionStorage whenever steps change
  useEffect(() => {
    if (steps) {
      localStorage.setItem(`prismaSteps_${projectId}`, JSON.stringify(steps));
      sessionStorage.setItem(`prismaSteps_${projectId}_session`, JSON.stringify(steps));
      
      // Also save current step to sessionStorage
      sessionStorage.setItem(`prismaSteps_${projectId}_currentStep`, currentStep);
    }
  }, [steps, projectId, currentStep]);

  const handleSave = async () => {
    try {
      const flattenedData = {
        identification_sources: steps.identification.sources,
        identification_resultats: steps.identification.resultats,
        statut_identification: steps.identification.statut,
        elimination_doublons_nombre: steps.elimination_doublons.nombre,
        elimination_doublons_outils: steps.elimination_doublons.outils,
        statut_elimination_doublons: steps.elimination_doublons.statut,
        selection_criteres: steps.selection.criteres,
        selection_exclusions_titres_resumes: steps.selection.exclusions_titres_resumes,
        selection_exclusions_texte_integral: steps.selection.exclusions_texte_integral,
        statut_selection: steps.selection.statut,
        evaluation_qualite_outils: steps.evaluation_qualite.outils,
        evaluation_qualite_scores: steps.evaluation_qualite.scores,
        evaluation_qualite_limites: steps.evaluation_qualite.limites,
        statut_evaluation_qualite: steps.evaluation_qualite.statut,
        extraction_donnees_descriptives: steps.extraction_donnees.descriptives,
        extraction_donnees_methodologiques: steps.extraction_donnees.methodologiques,
        extraction_donnees_resultats: steps.extraction_donnees.resultats,
        statut_extraction_donnees: steps.extraction_donnees.statut,
        synthese_resultats_qualitatifs: steps.synthese_resultats.qualitatifs,
        synthese_resultats_quantitatifs: steps.synthese_resultats.quantitatifs,
        synthese_resultats_tableaux_graphiques: steps.synthese_resultats.tableaux_graphiques,
        statut_synthese_resultats: steps.synthese_resultats.statut,
        discussion_interpretation: steps.discussion.interpretation,
        discussion_comparaison: steps.discussion.comparaison,
        discussion_limites: steps.discussion.limites,
        discussion_recommandations: steps.discussion.recommandations,
        statut_discussion: steps.discussion.statut,
        redaction_diagramme_prisma: steps.redaction.diagramme_prisma,
        redaction_tableaux_resumes: steps.redaction.tableaux_resumes,
        redaction_rapport_final: steps.redaction.rapport_final,
        statut_redaction: steps.redaction.statut,
      };

      await axios.put(`http://127.0.0.1:5000/api/prisma/${projectId}`, flattenedData);
      setShowDownloadButton(true);
      setDataSource('server');
      showNotification('Changes saved successfully to server!');
    } catch (error) {
      console.error('Error saving to server:', error);
      showNotification('Server save failed. Data stored locally.', 'warning');
    }
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      let y = 20;
      
      // Add title and project info
      doc.setFontSize(22);
      doc.setTextColor(0, 51, 102); // Dark blue color for headings
      doc.setFont("helvetica", "bold");
      doc.text(`PRISMA Review Protocol`, 105, y, { align: "center" });
      y += 15;
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Project ID: ${projectId}`, 105, y, { align: "center" });
      y += 10;
      
      // Add date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString();
      doc.text(`Generated: ${currentDate}`, 105, y, { align: "center" });
      y += 15;
      
      // Add a line separator
      doc.setDrawColor(0, 128, 255); // Blue line
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 15;
      
      // Add completion summary
      const completedSteps = Object.keys(steps).filter(key => steps[key].statut === 'terminé').length;
      const completionPercentage = Math.round((completedSteps / stepOrder.length) * 100);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Overall Completion: ${completionPercentage}%`, 20, y);
      y += 15;
      
      // For each step, add content
      stepOrder.forEach(stepKey => {
        // Check page space and add new page if needed
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        const step = steps[stepKey];
        const configForStep = stepConfig[stepKey]; // Changed variable name to avoid conflict
        
        // Add step title with status
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 102, 204); // Blue color for step titles
        doc.text(`${configForStep.label} - ${step.statut}`, 20, y);
        y += 10;
        
        // Add step details
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        
        // Process each field in the step
        if (configForStep.extraFields) {
          configForStep.extraFields.forEach(field => {
            const value = step[field.key];
            if (value) {
              // Check if content will overflow page
              if (y > 270) {
                doc.addPage();
                y = 20;
              }
              
              doc.setFont("helvetica", "bold");
              doc.text(`${field.label}:`, 25, y);
              doc.setFont("helvetica", "normal");
              
              // Handle multiline text
              const splitText = doc.splitTextToSize(value.toString(), 150);
              doc.text(splitText, 40, y);
              
              // Adjust y position based on text height
              y += 5 + (splitText.length * 5);
            }
          });
        }
        
        // Add space between steps
        y += 10;
        
        // Add a thin line separator between steps
        doc.setDrawColor(200, 200, 200); // light gray line
        doc.setLineWidth(0.1);
        doc.line(20, y, 190, y);
        y += 10;
      });
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      }
      
      // Save the PDF
      doc.save(`PRISMA_Protocol_${projectId}.pdf`);
      showNotification("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("Failed to generate PDF. Please try again.", "error");
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
    setSteps(prev => ({ ...prev, [currentStep]: updatedStep }));
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
  const completedSteps = Object.keys(steps).filter(key => steps[key].statut === 'terminé').length;
  const completionPercentage = Math.round((completedSteps / stepOrder.length) * 100);

  return (
    <div className="global-steps-container">
      <div className="header-section">
        <h1>PRISMA Workflow <span className="project-id"></span></h1>
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
          const stepStatus = steps[step].statut;
          const isActive = currentStep === step;
          const isCompleted = stepStatus === 'terminé';

          return (
            <React.Fragment key={step}>
              <div
                className={`timeline-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => setCurrentStep(step)}
              >
                <div className="node-icon">{isCompleted ? '✓' : index + 1}</div>
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
          step={steps[currentStep]}
          stepData={currentStepData}
          onChange={handleStepChange}
          onNext={handleNextStep}
          isLastStep={isLastStep}
        />
      </div>

      <div className="actions-section">
        <button onClick={handleSave} className="save-button">
          <span className="icon">💾</span> Save Changes to Server
        </button>
        <button onClick={generatePDF} className="download-button">
          <span className="icon">📄</span> Export PDF
        </button>
      </div>
    </div>
  );
};

const StepComponent = ({ step, stepData, onChange, onNext, isLastStep }) => {
  return (
    <div className="step-container">
      <h2 className="step-title">{stepData.label}</h2>
      {stepData.extraFields?.map((field) => (
        <div key={field.key} className="form-group">
          <label>{field.label}:</label>
          {field.type === 'textarea' ? (
            <textarea
              value={step[field.key] || ''}
              onChange={(e) => onChange({ ...step, [field.key]: e.target.value })}
              className="form-control"
              rows="3"
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
        <label>Statut:</label>
        <select
          value={step.statut || 'en attente'}
          onChange={(e) => onChange({ ...step, statut: e.target.value })}
          className="form-control"
        >
          {stepData.statusOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
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

export default PrismaSteps;