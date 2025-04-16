import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { generateGlobalPdf } from "../functions/pdfGenerator";
import "./GlobalSteps.css";

const StepComponent = ({ step, stepData, onChange, onNext, isLastStep }) => {
  const getValidDateValue = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? dateStr : "";
  };

  return (
    <div className="step-container">
      <h2 className="step-title">{stepData.label}</h2>
      <div className="form-group">
        <label>Content:</label>
        <textarea
          value={step.contenu || ""}
          onChange={(e) => onChange({ ...step, contenu: e.target.value })}
          className="form-control"
          rows="4"
        />
      </div>
      <div className="form-group">
        <label>Status:</label>
        <select
          value={step.statut || "en attente"}
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
      {stepData.extraFields?.map((field) => (
        <div key={field.key} className="form-group">
          <label>{field.label}:</label>
          {field.type === "textarea" ? (
            <textarea
              value={step[field.key] || ""}
              onChange={(e) => onChange({ ...step, [field.key]: e.target.value })}
              className="form-control"
              rows="3"
            />
          ) : field.type === "datetime-local" ? (
            <input
              type={field.type}
              value={getValidDateValue(step[field.key])}
              onChange={(e) => onChange({ ...step, [field.key]: e.target.value })}
              className="form-control"
            />
          ) : (
            <input
              type={field.type}
              value={step[field.key] || ""}
              onChange={(e) => onChange({ ...step, [field.key]: e.target.value })}
              className="form-control"
            />
          )}
        </div>
      ))}
      <button
        onClick={onNext}
        disabled={step.statut !== "terminé" && step.statut !== "accepté"}
        className={`next-button ${
          step.statut === "terminé" || step.statut === "accepté" ? "enabled" : "disabled"
        }`}
      >
        {isLastStep ? "Finish" : "Next Step"}
      </button>
    </div>
  );
};

const GlobalSteps = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [steps, setSteps] = useState(() => {
    // Load from localStorage on initial render
    const savedData = localStorage.getItem(`globalSteps_${projectId}`);
    return savedData ? JSON.parse(savedData) : {
      idee: { contenu: "", statut: "en attente" },
      problematique: { contenu: "", statut: "en attente" },
      mots_cles: { contenu: "", statut: "en attente" },
      revue_litterature: { contenu: "", statut: "en attente", sources: "" },
      research_gap: { contenu: "", statut: "en attente" },
      solution: { contenu: "", statut: "en attente" },
      evaluation: { contenu: "", statut: "en attente" },
      redaction: { contenu: "", statut: "en attente", lien_docs: "" },
      soumission: { contenu: "", statut: "en attente", date: "", journal: "", commentaires: "" }
    };
  });

  const [currentStep, setCurrentStep] = useState("idee");
  const [projectTitle, setProjectTitle] = useState("");

  const stepOrder = [
    "idee", "problematique", "mots_cles", "revue_litterature", 
    "research_gap", "solution", "evaluation", "redaction", "soumission"
  ];

  const stepConfig = {
    idee: { label: "Idea", statusOptions: ["en attente", "en cours", "terminé"] },
    problematique: { label: "Problem Statement", statusOptions: ["en attente", "en cours", "terminé"] },
    mots_cles: { label: "Keywords", statusOptions: ["en attente", "en cours", "terminé"] },
    revue_litterature: {
      label: "Literature Review",
      statusOptions: ["en attente", "en cours", "terminé"],
      extraFields: [{ key: "sources", label: "Sources Used", type: "textarea" }]
    },
    research_gap: { label: "Research Gap", statusOptions: ["en attente", "en cours", "terminé"] },
    solution: { label: "Proposed Solution", statusOptions: ["en attente", "en cours", "terminé"] },
    evaluation: { label: "Evaluation", statusOptions: ["en attente", "en cours", "terminé"] },
    redaction: {
      label: "Paper Writing",
      statusOptions: ["en attente", "en cours", "terminé"],
      extraFields: [{ key: "lien_docs", label: "Google Docs Link", type: "text" }]
    },
    soumission: {
      label: "Journal Submission",
      statusOptions: ["en attente", "accepté", "rejeté", "modifications requises"],
      extraFields: [
        { key: "date", label: "Submission Date", type: "datetime-local" },
        { key: "journal", label: "Journal Name", type: "text" },
        { key: "commentaires", label: "Review Comments", type: "textarea" }
      ]
    }
  };

  // Save to localStorage whenever steps change
  useEffect(() => {
    localStorage.setItem(`globalSteps_${projectId}`, JSON.stringify(steps));
  }, [steps, projectId]);

  // Load project title on mount
  useEffect(() => {
    const fetchProjectTitle = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data?.titre) {
          setProjectTitle(response.data.titre);
        }
      } catch (error) {
        console.error("Error fetching project title:", error);
      }
    };
    
    fetchProjectTitle();
  }, [projectId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification("Please login to save changes", "error");
        navigate('/login');
        return;
      }

      const saveData = {
        idee_contenu: steps.idee.contenu || "",
        statut_idee: steps.idee.statut || "en attente",
        
        problematique_contenu: steps.problematique.contenu || "",
        statut_problematique: steps.problematique.statut || "en attente",
        
        mots_cles_contenu: steps.mots_cles.contenu || "",
        statut_mots_cles: steps.mots_cles.statut || "en attente",
        
        revue_litterature_contenu: steps.revue_litterature.contenu || "",
        statut_revue: steps.revue_litterature.statut || "en attente",
        sources_utilisees: steps.revue_litterature.sources ? 
          `{${steps.revue_litterature.sources}}` : "{}",
        
        research_gap_contenu: steps.research_gap.contenu || "",
        statut_gap: steps.research_gap.statut || "en attente",
        
        solution_proposee: steps.solution.contenu || "",
        statut_solution: steps.solution.statut || "en attente",
        
        evaluation_solution: steps.evaluation.contenu || "",
        statut_evaluation: steps.evaluation.statut || "en attente",
        
        redaction_papier: steps.redaction.contenu || "",
        statut_redaction: steps.redaction.statut || "en attente",
        lien_google_docs: steps.redaction.lien_docs || "",
        
        soumission_journal: steps.soumission.contenu || "",
        statut_soumission: steps.soumission.statut || "en attente",
        date_soumission: steps.soumission.date || "",
        nom_journal: steps.soumission.journal || "",
        commentaires_revision: steps.soumission.commentaires || ""
      };

      // Debug: log the data being sent
      console.log("Sending data to server:", saveData);

      const response = await axios.put(
        `http://localhost:5000/api/global/${projectId}`,
        saveData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        showNotification("Changes saved successfully!");
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving data:", error);
      let errorMessage = "Error saving changes";
      
      if (error.response) {
        // Server responded with error status
        if (error.response.data?.message) {
          errorMessage += `: ${error.response.data.message}`;
        } else {
          errorMessage += ` (Status ${error.response.status})`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Server did not respond";
      } else {
        // Something happened in setting up the request
        errorMessage = `Request setup error: ${error.message}`;
      }

      showNotification(errorMessage, "error");
    }
  };

  const handleGeneratePDF = async () => {
    try {
      await generateGlobalPdf(projectId, steps, projectTitle);
      showNotification("PDF generated and saved to Documents!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("Failed to generate PDF", "error");
    }
  };

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => document.body.removeChild(notification), 300);
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
        ...updatedStep
      }
    }));
  };

  const currentStepData = stepConfig[currentStep];
  const isLastStep = currentStep === stepOrder[stepOrder.length - 1];
  const completedSteps = stepOrder.filter(key => steps[key].statut === "terminé").length;
  const completionPercentage = Math.round((completedSteps / stepOrder.length) * 100);

  return (
    <div className="global-steps-container">
      <div className="header-section">
        <h1>Global Workflow <span className="project-id"></span></h1>
        {projectTitle && <h2 className="project-title">{projectTitle}</h2>}
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${completionPercentage}%` }}>
            <span className="progress-text">{completionPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="timeline-container">
        {stepOrder.map((step, index) => {
          const stepStatus = steps[step].statut;
          const isActive = currentStep === step;
          const isCompleted = stepStatus === "terminé";
          const stepDate = steps[step].date_completion
            ? new Date(steps[step].date_completion).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })
            : "";

          return (
            <React.Fragment key={step}>
              <div
                className={`timeline-node ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                onClick={() => setCurrentStep(step)}
              >
                <div className="node-date">{stepDate}</div>
                <div className="node-icon">{isCompleted ? "✓" : index + 1}</div>
                <div className="node-label">{stepConfig[step].label}</div>
                <div className="node-status">{stepStatus}</div>
              </div>
              {index < stepOrder.length - 1 && (
                <div className={`timeline-connector ${isCompleted ? "completed" : ""}`}></div>
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
          <span className="icon">💾</span>
          Save Changes
        </button>
        
        <button onClick={handleGeneratePDF} className="download-button">
          <span className="icon">📄</span>
          Export PDF
        </button>
      </div>
    </div>
  );
};

export default GlobalSteps;