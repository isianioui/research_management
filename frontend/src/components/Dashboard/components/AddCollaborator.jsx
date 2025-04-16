import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddCollaborator.css';
import { useSession } from '../../../context/SessionContext';
import collaboratorImage from '../../../assets/collab.png'; 

const AddCollaborator = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    role: 'chercheur',
    project_id: '',
    message: ''
  });

  const { session } = useSession();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProjects = async () => {
      const token = localStorage.getItem('token');
      const userId = session.user?.id;
      
      console.log('Récupération des projets pour userId:', userId);
      
      try {
        const response = await axios.get(`http://localhost:5000/api/projects/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Données des projets reçues:', response.data);
        setProjects(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des projets:', error);
        setError("Impossible de charger vos projets");
        setIsLoading(false);
      }
    };
  
    if (session?.user?.id) {
      fetchUserProjects();
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
        setIsLoading(true);
        console.log('Envoi de la requête avec les données:', formData);
        
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true
        };

        const response = await axios.post('http://localhost:5000/api/collaborateurs/add', formData, config);

        if (response.status === 201) {
            const emailSent = response.data.email_sent;
            if (emailSent) {
                alert(`Collaborateur invité avec succès. Un email a été envoyé avec les instructions de connexion.`);
            } else {
                alert(`Collaborateur invité avec succès, mais l'envoi de l'email a échoué. Veuillez partager manuellement les informations de connexion.`);
            }
            
            setFormData({
                email: '',
                role: 'chercheur',
                project_id: '',
                message: ''
            });
            onClose && onClose();
        }
    } catch (error) {
        console.error('Détails de l\'erreur:', error);
        const errorMessage = error.response?.data?.message || 'Échec de l\'invitation du collaborateur';
        alert(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading-message">Loading projects...</div>;
  }

  return (
    <div className="collaborator-page-container">
      <div className="collaborator-form-wrapper">
        <div className="collaborator-form-content">
          <div className="brand-logo">Collaborator Invitation</div>
          <h2 className="form-title">
            Invite a <span className="highlighted-text">New Collaborator</span>
          </h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group half-width">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                  placeholder="Enter collaborator's email"
                  required
                />
              </div>

              <div className="form-group half-width">
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="form-input"
                >
                  <option value="encadrant">Encadrant</option>
                  <option value="co-encadrant">Co-encadrant</option>
                  <option value="chercheur">Chercheur</option>
                  <option value="etudiant">Etudiant</option>
                </select>
              </div>

              <div className="form-group full-width">
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Choose a project</option>
                  {projects && projects.length > 0 ? (
                    projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title || project.titre}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Aucun projet disponible</option>
                  )}
                </select>
              </div>

              <div className="form-group full-width">
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="form-input"
                  placeholder="Add a personal message to the invitation"
                />
              </div>
            </div>

            <button type="submit" className="submit-button">
              Send Invitation
            </button>
          </form>
        </div>

        <div className="furniture-image-container">
          <img 
            src={collaboratorImage} 
            alt="Collaborator" 
            className="furniture-image" 
          />
        </div>
      </div>
    </div>
  );
};

export default AddCollaborator;