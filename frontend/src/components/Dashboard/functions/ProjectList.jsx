
import React, { useState } from 'react';
import { Eye, Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectList = ({ projects, onView, onEdit, onDelete, refreshProjects }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const navigate = useNavigate();

  // Function to handle the delete operation
  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setIsDeleting(true);
      setDeleteError(null);
      
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/project/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        });
        console.log(projectId)
        // Call the onDelete prop (if provided) to notify parent component
        if (onDelete) {
          window.location.reload();
          onDelete(projectId);
        }
        
        // Refresh projects if the function was provided
        if (typeof refreshProjects === 'function') {
          refreshProjects();
        }
        
        // If no refresh function was provided, we'll rely on manual refresh
      } catch (error) {
        console.error('Error deleting project:', error);
        setDeleteError('Failed to delete the project. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Function to handle edit/redirect to appropriate steps
  const handleEdit = (project) => {
    // First call the provided onEdit function if it exists
    if (onEdit) {
      onEdit(project.id);
    }
    
    // Then determine which methodology is used
    // You may need to adjust this logic based on how methodologies are identified in your project
    switch (project.methodologie_id) {
      case 1: // Assuming 1 is IMRAD
        navigate(`/dashboard/projects/${project.id}/global`);
        window.location.reload();
        break;
      case 2: // Assuming 2 is Global
        navigate(`/dashboard/projects/${project.id}/imrad`);
        window.location.reload();

        break;
      case 3: // Assuming 3 is PRISMA
        navigate(`/dashboard/projects/${project.id}/prisma`);
        window.location.reload();
        break;
      default:
        // If methodology can't be determined, navigate to a default view
        navigate(`/projectsteps/${project.id}`);
    }
  };

  return (
    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#1F2937', borderRadius: '8px' }}>
      <h3 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Your Projects</h3>
      
      {deleteError && (
        <div style={{ color: '#EF4444', marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
          {deleteError}
        </div>
      )}
      
      {isDeleting && (
        <div style={{ color: '#D1D5DB', marginBottom: '12px' }}>
          Deleting project...
        </div>
      )}
      
      {projects.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>No projects found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
          {projects.map((project) => (
            <li key={project.id} style={{ 
              color: '#FFFFFF', 
              marginBottom: '8px', 
              padding: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottom: '1px solid #374151',
              borderRadius: '4px'
            }}>
              <span>{project.titre}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Eye
                  size={16}
                  color="#9CA3AF"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onView(project.id)}
                  title="View project details"
                />
                <Edit
                  size={16}
                  color="#9CA3AF"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleEdit(project)}
                  title="Edit project steps"
                />
                <Trash
                  size={16}
                  color="#9CA3AF"
                  style={{ 
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1
                  }}
                  onClick={() => !isDeleting && handleDelete(project.id)}
                  title="Delete project"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {deleteError && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            Refresh Projects List
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectList;