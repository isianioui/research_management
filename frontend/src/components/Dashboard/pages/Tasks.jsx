import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Flag, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import axios from 'axios';
import { useSession } from '../../../context/SessionContext';
import './Tasks.css';

const Tasks = () => {
  const { session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    titre: '',
    description: '',
    priorite: 'moyenne',
    date_echeance: '',
    assigne_id: '',
    project_id: ''
  });
  const [userProjects, setUserProjects] = useState([]);
  const [projectCollaborators, setProjectCollaborators] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (session?.token) {
      // Configurer l'intercepteur Axios pour tous les appels
      axios.interceptors.request.use(
        (config) => {
          config.headers['Authorization'] = `Bearer ${session.token}`;
          config.headers['Content-Type'] = 'application/json';
          config.headers['Accept'] = 'application/json';
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
      fetchData();
      
      // Débogage - récupérer directement les projets pour voir la structure
      axios.get('http://localhost:5000/api/projects')
        .then(response => {
          console.log('DEBUG - Projets directement depuis l\'API:', response.data);
        })
        .catch(error => {
          console.error('DEBUG - Erreur lors de la récupération directe des projets:', error);
        });
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tasks');
      console.log('Response data:', response.data);
      
      // Récupérer les projets
      const projectsResponse = await axios.get('http://localhost:5000/api/projects');
      const projects = projectsResponse.data;
      
      // Mapper les tâches avec les informations de projet
      const tasksWithProjects = (response.data.tasks || []).map(task => {
        const project = projects.find(p => p.id === parseInt(task.project_id));
        return {
          ...task,
          project_titre: project?.titre || task.project_titre || 'Pas de projet'
        };
      });

      // Filtrer les tâches terminées de plus d'un jour
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const filteredTasks = tasksWithProjects.filter(task => {
        if (task.statut === 'terminé') {
          // Vérifier si la tâche a une date de mise à jour
          const taskCompletionDate = task.updated_at ? new Date(task.updated_at) : null;
          if (!taskCompletionDate) return true; // Garder la tâche si pas de date de mise à jour
          return taskCompletionDate > oneDayAgo; // Garder seulement si complétée il y a moins d'un jour
        }
        return true; // Garder toutes les tâches non terminées
      });

      // Trier les tâches : nouvelles d'abord, terminées à la fin
      const sortedTasks = filteredTasks.sort((a, b) => {
        // Si une tâche est terminée, elle va à la fin
        if (a.statut === 'terminé' && b.statut !== 'terminé') return 1;
        if (a.statut !== 'terminé' && b.statut === 'terminé') return -1;
        
        // Si les deux tâches ont le même statut, trier par ID (les plus récents d'abord)
        return b.id - a.id;
      });
      
      console.log('Sorted and filtered tasks:', sortedTasks);
      setTasks(sortedTasks);
      setUserProjects(projects);
      setCurrentUser({ id: response.data.current_user_id });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      if (error.response?.status === 401 || error.response?.status === 422) {
        console.error('Erreur d\'authentification - veuillez vous reconnecter');
      }
    }
  };

  const fetchProjectCollaborators = async (projectId) => {
    try {
      // Première tentative: obtenir les collaborateurs via l'API des tâches
      const response = await axios.get(`http://localhost:5000/api/tasks?project_id=${projectId}`);
      console.log('Réponse collaborateurs depuis API tasks:', response.data);
      
      if (response.data.collaborators && response.data.collaborators.length > 0) {
        setProjectCollaborators(response.data.collaborators);
      } else {
        // Deuxième tentative: essayer d'obtenir les collaborateurs directement via l'API des projets
        try {
          const projectResponse = await axios.get(`http://localhost:5000/api/projects/${projectId}`);
          console.log('Réponse détaillée du projet:', projectResponse.data);
          
          // Vérifier différentes structures possibles
          const collaborators = 
            projectResponse.data.collaborators || 
            projectResponse.data.collaborateurs || 
            projectResponse.data.membres ||
            projectResponse.data.members || 
            [];
            
          console.log('Collaborateurs extraits:', collaborators);
          setProjectCollaborators(collaborators);
        } catch (projectError) {
          console.error('Erreur lors de la récupération du projet:', projectError);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des collaborateurs:', error);
      // En cas d'échec, assurez-vous que le champ du collaborateur reste disponible
      setProjectCollaborators([]);
    }
  };

  const handleProjectChange = (projectId) => {
    console.log('Selected project ID:', projectId); // Pour le débogage
    
    // Trouver le projet sélectionné pour le débogage
    const selectedProject = userProjects.find(p => (p.id === projectId || p.project_id === projectId));
    console.log('Selected project details:', selectedProject);
    
    setNewTask(prev => ({
      ...prev,
      project_id: projectId,
      assigne_id: currentUser ? currentUser.id : ''
    }));
    
    if (projectId) {
      fetchProjectCollaborators(projectId);
    } else {
      setProjectCollaborators([]);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!newTask.titre.trim()) {
      alert('Le titre est requis');
      return;
    }
    if (!newTask.project_id) {
      alert('Veuillez sélectionner un projet');
      return;
    }
    if (!newTask.date_echeance) {
      alert('La date d\'échéance est requise');
      return;
    }

    // Affichage des données pour le débogage
    console.log('Données de la nouvelle tâche à envoyer:', newTask);

    try {
      const response = await axios.post('http://localhost:5000/api/tasks', newTask);
      console.log('Réponse création de tâche:', response.data);
      
      if (response.data.task_id || response.data.id) {
        setShowAddTask(false);
        setNewTask({
          titre: '',
          description: '',
          priorite: 'moyenne',
          date_echeance: '',
          assigne_id: '',
          project_id: ''
        });
        // Recharger les données et appliquer le tri
        await fetchData();
      }
    } catch (error) {
      console.error('Erreur détaillée lors de la création de la tâche:', error.response?.data || error);
      
      if (error.response) {
        if (error.response.status === 401) {
          console.error('Erreur d\'authentification - veuillez vous reconnecter');
        }
        alert(error.response.data.error || error.response.data.message || 'Erreur lors de la création de la tâche');
      } else {
        alert('Erreur de connexion au serveur');
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      console.log('Mise à jour du statut:', taskId, newStatus);
      
      // Mise à jour optimiste de l'interface avec la date de mise à jour
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { ...task, statut: newStatus, updated_at: new Date().toISOString() }
          : task
      );
      setTasks(updatedTasks);

      const response = await axios.put(`http://localhost:5000/api/tasks/${taskId}/status`, 
        { 
          statut: newStatus,
          updated_at: new Date().toISOString()
        }
      );

      console.log('Réponse du serveur:', response.data);

      if (response.data.message === "Statut mis à jour avec succès") {
        return;
      }

      fetchData();
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data || error);
      fetchData();
      const errorMessage = error.response?.data?.error || error.response?.data?.msg || 'Erreur lors de la mise à jour du statut.';
      alert(errorMessage + ' Veuillez réessayer.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
        fetchData();
      } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'haute': return 'text-red-500';
      case 'moyenne': return 'text-yellow-500';
      case 'basse': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>Tâches</h1>
        <button
          onClick={() => setShowAddTask(true)}
          className="add-task-button"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle tâche
        </button>
      </div>

      {showAddTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Nouvelle tâche</h2>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  value={newTask.titre}
                  onChange={(e) => setNewTask({ ...newTask, titre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Projet</label>
                <select
                  value={newTask.project_id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un projet</option>
                  {userProjects && userProjects.length > 0 ? (
                    userProjects.map(project => {
                      // Support pour différentes structures de données
                      const projectId = project.id || project.project_id;
                      const projectTitle = project.titre || project.title || project.nom || project.name;
                      
                      return (
                        <option key={projectId} value={projectId}>
                          {projectTitle}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>Aucun projet disponible</option>
                  )}
                </select>
                {userProjects && userProjects.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    Vous n'avez pas encore de projets. Veuillez d'abord créer un projet.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Assigné à</label>
                <select
                  value={newTask.assigne_id}
                  onChange={(e) => setNewTask({ ...newTask, assigne_id: e.target.value })}
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {projectCollaborators.map(user => (
                    <option key={user.id} value={user.id}>{user.nom} {user.prenom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priorité</label>
                <select
                  value={newTask.priorite}
                  onChange={(e) => setNewTask({ ...newTask, priorite: e.target.value })}
                >
                  <option value="basse">Basse</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date d'échéance</label>
                <input
                  type="date"
                  value={newTask.date_echeance}
                  onChange={(e) => setNewTask({ ...newTask, date_echeance: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddTask(false)}>
                  Annuler
                </button>
                <button type="submit">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tasks-grid">
        {tasks.map(task => (
          <div key={task.id} className={`task-card ${task.statut === 'terminé' ? 'completed' : ''}`}>
            <div className="task-header">
              <h3>{task.titre}</h3>
              <span className={getPriorityColor(task.priorite)}>
                <Flag className="w-5 h-5" />
              </span>
            </div>
            <p className="task-description">{task.description}</p>
            <div className="task-info">
              <div className="info-item">
                <Calendar className="w-4 h-4" />
                <span>{new Date(task.date_echeance).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <User className="w-4 h-4" />
                <span>{task.assigne_nom || 'Non assigné'}</span>
              </div>
              <div className="info-item">
                <Briefcase className="w-4 h-4" />
                <span>{task.project_titre}</span>
              </div>
            </div>
            <div className="task-actions">
              <select
                value={task.statut}
                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                className="status-select"
                data-status={task.statut}
              >
                <option value="à faire" title="À faire">⭕ À faire</option>
                <option value="en cours" title="En cours">🔄 En cours</option>
                <option value="terminé" title="Terminé">✅ Terminé</option>
                <option value="annulé" title="Annulé">❌ Annulé</option>
              </select>
              <div className="action-buttons">
                <button
                  onClick={() => handleStatusChange(task.id, 'terminé')}
                  className={`action-button success ${task.statut === 'terminé' ? 'active' : ''}`}
                  title="Marquer comme terminé"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="action-button danger"
                  title="Supprimer la tâche"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;