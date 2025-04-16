import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateProject = () => {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    methodologie_id: '',
    createur_id: '',
    date_fin: '',
    statut: 'en cours'
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:5000/project', formData);
      console.log('Project created:', response.data);

      // Redirect to the appropriate steps page based on the methodology
      if (formData.methodologie_id === '2') {
        // Redirect to IMRAD steps if methodology is IMRAD
        navigate(`/projects/${response.data.id}/imrad`);
      } else if (formData.methodologie_id === '1') {
        // Redirect to Global steps if methodology is Global
        navigate(`/projects/${response.data.id}/global`);
      }else if (formData.methodologie_id === '3') {
        // Redirect to Global steps if methodology is Global
        navigate(`/projects/${response.data.id}/prisma`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Titre"
        value={formData.titre}
        onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
      />
      <input
        type="text"
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <input
        type="number"
        placeholder="Methodologie ID"
        value={formData.methodologie_id}
        onChange={(e) => setFormData({ ...formData, methodologie_id: e.target.value })}
      />
      <input
        type="number"
        placeholder="Createur ID"
        value={formData.createur_id}
        onChange={(e) => setFormData({ ...formData, createur_id: e.target.value })}
      />
      <input
        type="date"
        placeholder="Date Fin"
        value={formData.date_fin}
        onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
      />
      <button type="submit">Create Project</button>
    </form>
  );
};

export default CreateProject;

