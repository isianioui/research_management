
import { useState } from 'react';
import axios from 'axios';

const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [showProjects, setShowProjects] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Aucun token d\'authentification trouvé');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      
      console.log('Projects received:', response.data);
      setProjects(response.data);
      setShowProjects(true);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      setError(error.response?.data?.message || 'Erreur lors de la récupération des projets');
    } finally {
      setLoading(false);
    }
  };

  const resetProjects = () => {
    setProjects([]);
    setShowProjects(false);
    setError(null);
  };

  return { projects, showProjects, loading, error, fetchUserProjects, resetProjects };
};

export default useProjects;