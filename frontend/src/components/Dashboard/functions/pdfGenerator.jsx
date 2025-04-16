import jsPDF from 'jspdf';
import axios from 'axios';

// Utility function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Helper function to add a horizontal line
const addHorizontalLine = (doc, y) => {
  doc.setDrawColor(200, 200, 200); // Light gray color
  doc.line(20, y, 190, y);
};

// Helper function to add a section to the PDF
const addSection = (doc, title, fields, startY) => {
  // Check if we need to add a new page
  if (startY > 250) {
    doc.addPage();
    startY = 20;
  }
  
  // Add section title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 150, 243); // Blue color for section titles
  doc.text(title, 20, startY);
  startY += 8;
  
  // Add horizontal line under the title
  doc.setDrawColor(33, 150, 243);
  doc.setLineWidth(0.5);
  doc.line(20, startY, 190, startY);
  startY += 10;
  
  // Add section content
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(33, 37, 41); // Dark gray for content
  
  for (const field of fields) {
    // Skip empty fields
    if (!field.value) continue;
    
    // Check if we need to add a new page
    if (startY > 270) {
      doc.addPage();
      startY = 20;
    }
    
    // Add field label
    doc.setFont('helvetica', 'bold');
    doc.text(`${field.label}:`, 20, startY);
    doc.setFont('helvetica', 'normal');
    
    // Handle multiline text for content
    if (field.value && typeof field.value === 'string') {
      const textLines = doc.splitTextToSize(field.value, 160); // Split text to fit page width
      
      // Check if we need a new page for the content
      if (startY + (textLines.length * 7) > 270) {
        doc.addPage();
        startY = 20;
      }
      
      // Add the content with proper line breaks
      doc.text(textLines, 30, startY + 7);
      startY += (textLines.length * 7) + 10; // Adjust Y position based on content height
    } else {
      doc.text(String(field.value), 30, startY + 7);
      startY += 15;
    }
  }
  
  return startY + 10; // Return the new Y position
};

// Helper function to upload document to server
const uploadDocumentToServer = async (blob, fileName, projectId, methodology, title) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return null;
    }
    
    const formData = new FormData();
    
    // Convert blob to File object
    const file = new File([blob], fileName, { type: 'application/pdf' });
    
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('methodology', methodology);
    formData.append('projectTitle', title);
    
    console.log('Uploading document to server...');
    
    const response = await axios({
      method: 'post',
      url: 'http://localhost:5000/api/documents',
      data: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading document to server:', error);
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const generateIMRADPdf = async (projectId, steps, projectTitle) => {
  try {
    const doc = new jsPDF();
    const displayTitle = projectTitle || `Project ${projectId}`;

    // Title Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 153);
    doc.text('IMRAD Research Protocol', 105, 20, { align: 'center' });
    
    // Project Title Section - Only show title, no ID
    doc.setFontSize(14);
    doc.text(displayTitle, 105, 35, { align: 'center' });
    
    // Generation Date
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${formatDate(new Date())}`, 105, 45, { align: 'center' });

    // Completion Status
    addHorizontalLine(doc, 55);
    const completedSteps = Object.values(steps).filter(step => step.statut === 'terminé').length;
    const completionPercentage = Math.round((completedSteps / Object.keys(steps).length) * 100);
    doc.text(`Overall Completion: ${completionPercentage}%`, 20, 70);
    
    // Steps Status
    addHorizontalLine(doc, 80);
    let yPos = 95;
    Object.entries(steps).forEach(([key, step]) => {
      const stepName = key.charAt(0).toUpperCase() + key.slice(1);
      const stepStatus = step.statut || 'not started';
      doc.text(`${stepName} - ${stepStatus}`, 20, yPos);
      addHorizontalLine(doc, yPos + 10);
      yPos += 30;
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Footer with project title
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`IMRAD Research Report - ${displayTitle} - Page ${i} of ${pageCount}`, 
              105, 290, { align: 'center' });
    }

    const fileName = `IMRAD_Research_Report_${displayTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    
    // Return the PDF data without creating blob immediately
    return {
      success: true,
      fileName: fileName,
      pdf: doc,
      projectTitle: displayTitle
    };
    
  } catch (error) {
    console.error('Error generating IMRAD PDF:', error);
    throw error;
  }
};
// Generate PDF for PRISMA methodology
export const generatePrismaPdf = async (projectId, steps, projectTitle = null) => {
  try {
    // Get project title if not provided
    let title = projectTitle;
    if (!title) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        title = response.data.titre || `Project ${projectId}`;
      } catch (error) {
        console.error('Error fetching project details:', error);
        title = `Project ${projectId}`;
      }
    }

    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('PRISMA Systematic Review', 105, 20, { align: 'center' });
    
    // Add project title
    doc.setFontSize(16);
    doc.text(`${title}`, 105, 30, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${formatDate(new Date())}`, 105, 38, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);
    
    // Add content sections
    let y = 50;
    
    // Identification section
    y = addSection(doc, 'Identification', [
      { label: 'Sources', value: steps.identification.sources },
      { label: 'Results', value: steps.identification.resultats },
      { label: 'Status', value: steps.identification.statut }
    ], y);
    
    // Duplicate Elimination section
    y = addSection(doc, 'Duplicate Elimination', [
      { label: 'Number', value: steps.elimination_doublons.nombre },
      { label: 'Tools', value: steps.elimination_doublons.outils },
      { label: 'Status', value: steps.elimination_doublons.statut }
    ], y);
    
    // Selection section
    y = addSection(doc, 'Selection', [
      { label: 'Criteria', value: steps.selection.criteres },
      { label: 'Exclusions (Titles/Abstracts)', value: steps.selection.exclusions_titres_resumes },
      { label: 'Exclusions (Full Text)', value: steps.selection.exclusions_texte_integral },
      { label: 'Status', value: steps.selection.statut }
    ], y);
    
    // Quality Evaluation section
    y = addSection(doc, 'Quality Evaluation', [
      { label: 'Tools', value: steps.evaluation_qualite.outils },
      { label: 'Scores', value: steps.evaluation_qualite.scores },
      { label: 'Limitations', value: steps.evaluation_qualite.limites },
      { label: 'Status', value: steps.evaluation_qualite.statut }
    ], y);
    
    // Data Extraction section
    y = addSection(doc, 'Data Extraction', [
      { label: 'Descriptive', value: steps.extraction_donnees.descriptives },
      { label: 'Methodological', value: steps.extraction_donnees.methodologiques },
      { label: 'Results', value: steps.extraction_donnees.resultats },
      { label: 'Status', value: steps.extraction_donnees.statut }
    ], y);
    
    // Results Synthesis section
    y = addSection(doc, 'Results Synthesis', [
      { label: 'Qualitative', value: steps.synthese_resultats.qualitatifs },
      { label: 'Quantitative', value: steps.synthese_resultats.quantitatifs },
      { label: 'Tables/Graphics', value: steps.synthese_resultats.tableaux_graphiques },
      { label: 'Status', value: steps.synthese_resultats.statut }
    ], y);
    
    // Discussion section
    y = addSection(doc, 'Discussion', [
      { label: 'Interpretation', value: steps.discussion.interpretation },
      { label: 'Comparison', value: steps.discussion.comparaison },
      { label: 'Limitations', value: steps.discussion.limites },
      { label: 'Recommendations', value: steps.discussion.recommandations },
      { label: 'Status', value: steps.discussion.statut }
    ], y);
    
    // Drafting section
    y = addSection(doc, 'Drafting', [
      { label: 'PRISMA Diagram', value: steps.redaction.diagramme_prisma },
      { label: 'Summary Tables', value: steps.redaction.tableaux_resumes },
      { label: 'Final Report', value: steps.redaction.rapport_final },
      { label: 'Status', value: steps.redaction.statut }
    ], y);
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`PRISMA Research Report - ${title || `Project #${projectId}`} - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF locally
    const fileName = `PRISMA_Research_Report_${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);
    
    // Get the PDF as blob for upload
    const blobPDF = doc.output('blob');
    
    // Upload to server
    try {
      await uploadDocumentToServer(blobPDF, fileName, projectId, 'PRISMA', title);
      return {
        success: true,
        fileName: fileName,
        methodology: 'PRISMA',
        projectId: projectId,
        projectTitle: title
      };
    } catch (uploadError) {
      console.error('Error uploading to server:', uploadError);
      return {
        success: false,
        fileName: fileName,
        methodology: 'PRISMA',
        projectId: projectId,
        projectTitle: title,
        error: uploadError.message
      };
    }
    
  } catch (error) {
    console.error('Error generating PRISMA PDF:', error);
    throw error;
  }
};

// Generate PDF for Global methodology
export const generateGlobalPdf = async (projectId, steps, projectTitle = null) => {
  try {
    // Get project title if not provided
    let title = projectTitle;
    if (!title) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        title = response.data.titre || `Project ${projectId}`;
      } catch (error) {
        console.error('Error fetching project details:', error);
        title = `Project ${projectId}`;
      }
    }

    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('Global Research Report', 105, 20, { align: 'center' });
    
    // Add project title
    doc.setFontSize(16);
    doc.text(`${title}`, 105, 30, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${formatDate(new Date())}`, 105, 38, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);
    
    // Add content sections
    let y = 50;
    
    // Idea section
    y = addSection(doc, 'Idea', [
      { label: 'Content', value: steps.idee.contenu || 'No content provided' },
      { label: 'Status', value: steps.idee.statut },
      { label: 'Completion Date', value: formatDate(steps.idee.date_completion) }
    ], y);
    
    // Problem Statement section
    y = addSection(doc, 'Problem Statement', [
      { label: 'Content', value: steps.problematique.contenu || 'No content provided' },
      { label: 'Status', value: steps.problematique.statut },
      { label: 'Completion Date', value: formatDate(steps.problematique.date_completion) }
    ], y);
    
    // Keywords section
    y = addSection(doc, 'Keywords', [
      { label: 'Content', value: steps.mots_cles.contenu },
      { label: 'Status', value: steps.mots_cles.statut },
      { label: 'Completion Date', value: formatDate(steps.mots_cles.date_completion) }
    ], y);
    
    // Literature Review section
    y = addSection(doc, 'Literature Review', [
      { label: 'Content', value: steps.revue_litterature.contenu },
      { label: 'Status', value: steps.revue_litterature.statut },
      { label: 'Completion Date', value: formatDate(steps.revue_litterature.date_completion) },
      { label: 'Sources Used', value: Array.isArray(steps.revue_litterature.sources) ? 
        steps.revue_litterature.sources.join(', ') : steps.revue_litterature.sources }
    ], y);
    
    // Research Gap section
    y = addSection(doc, 'Research Gap', [
      { label: 'Content', value: steps.research_gap.contenu },
      { label: 'Status', value: steps.research_gap.statut },
      { label: 'Completion Date', value: formatDate(steps.research_gap.date_completion) }
    ], y);
    
    // Solution section
    y = addSection(doc, 'Proposed Solution', [
      { label: 'Content', value: steps.solution.contenu },
      { label: 'Status', value: steps.solution.statut },
      { label: 'Completion Date', value: formatDate(steps.solution.date_completion) }
    ], y);
    
    // Evaluation section
    y = addSection(doc, 'Evaluation', [
      { label: 'Content', value: steps.evaluation.contenu },
      { label: 'Status', value: steps.evaluation.statut },
      { label: 'Completion Date', value: formatDate(steps.evaluation.date_completion) }
    ], y);
    
    // Writing section
    y = addSection(doc, 'Paper Writing', [
      { label: 'Content', value: steps.redaction.contenu },
      { label: 'Status', value: steps.redaction.statut },
      { label: 'Completion Date', value: formatDate(steps.redaction.date_completion) },
      { label: 'Google Docs Link', value: steps.redaction.lien_docs }
    ], y);
    
    // Submission section
    y = addSection(doc, 'Journal Submission', [
      { label: 'Content', value: steps.soumission.contenu },
      { label: 'Status', value: steps.soumission.statut },
      { label: 'Submission Date', value: formatDate(steps.soumission.date) },
      { label: 'Journal Name', value: steps.soumission.journal },
      { label: 'Review Comments', value: steps.soumission.commentaires }
    ], y);
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Global Research Report - ${title || `Project #${projectId}`} - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF locally
    const fileName = `Global_Research_Report_${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);
    
    // Get the PDF as blob for upload
    const blobPDF = doc.output('blob');
    
    // Upload to server
    try {
      await uploadDocumentToServer(blobPDF, fileName, projectId, 'Global', title);
      return {
        success: true,
        fileName: fileName,
        methodology: 'Global',
        projectId: projectId,
        projectTitle: title
      };
    } catch (uploadError) {
      console.error('Error uploading to server:', uploadError);
      return {
        success: false,
        fileName: fileName,
        methodology: 'Global',
        projectId: projectId,
        projectTitle: title,
        error: uploadError.message
      };
    }
  } catch (error) {
    console.error('Error generating Global PDF:', error);
    throw error;
  }
};