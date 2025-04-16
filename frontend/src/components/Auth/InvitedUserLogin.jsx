import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import './InvitedUserLogin.css';

const InvitedUserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const email = searchParams.get('email');
    
    if (email) {
      fetchUserInfo(email);
    } else {
      setError("Aucun email fourni dans l'URL");
      setIsLoading(false);
    }
  }, [location]);

  const fetchUserInfo = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/collaborateurs/invited-user-info/${email}`);
      setFormData(prev => ({
        ...prev,
        email: response.data.email,
        nom: response.data.nom,
        prenom: response.data.prenom
      }));
      setIsLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || "Erreur lors de la récupération des informations");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      // Première étape : connexion
      const loginResponse = await axios.post('http://localhost:5000/api/collaborateurs/login-invited-user', {
        email: formData.email,
        password: formData.password
      });

      if (loginResponse.data.token) {
        // Deuxième étape : mise à jour des informations
        const updateResponse = await axios.put(
          'http://localhost:5000/api/collaborateurs/update-invited-user',
          {
            nom: formData.nom,
            prenom: formData.prenom,
            password: formData.password
          },
          {
            headers: {
              'Authorization': `Bearer ${loginResponse.data.token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (updateResponse.status === 200) {
          // Connexion réussie et mise à jour effectuée
          await login(loginResponse.data.token, loginResponse.data.user);
          navigate('/dashboard');
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Une erreur est survenue');
    }
  };

  if (isLoading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="invited-login-container">
      <div className="login-form-wrapper">
        <h2>Bienvenue sur la plateforme</h2>
        <p className="form-description">
          Veuillez confirmer vos informations et créer votre mot de passe pour accéder à la plateforme.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="nom">Nom</label>
            <input
              type="text"
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prenom">Prénom</label>
            <input
              type="text"
              id="prenom"
              value={formData.prenom}
              onChange={(e) => setFormData({...formData, prenom: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="submit-button">
            Confirmer et se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvitedUserLogin; 