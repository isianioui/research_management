import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from '../../context/SessionContext';
import './UserSettings.css';
import { Camera } from 'lucide-react';

const UserSettings = () => {
  const { session, updateUser } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    nom: session?.user?.nom || '',
    prenom: session?.user?.prenom || '',
    profileImage: null
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [previewImage, setPreviewImage] = useState(
    session?.user?.profile_image 
      ? `http://localhost:5000/api/users/profile-image/${session.user.profile_image}`
      : '/default-avatar.png'
  );

  const [isInvitedUser, setIsInvitedUser] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        nom: session.user.nom || '',
        prenom: session.user.prenom || ''
      }));
      
      if (session.user.profile_image) {
        setPreviewImage(`http://localhost:5000/api/users/profile-image/${session.user.profile_image}`);
      }
    }
  }, [session]);

  useEffect(() => {
    const checkIfInvitedUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/collaborateurs/invited-user-info/${session.user.email}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.status === 200) {
          setIsInvitedUser(true);
          setPasswordData(prev => ({
            ...prev,
            currentPassword: response.data.temp_password || ''
          }));
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error checking invited user status:', error);
        }
        setIsInvitedUser(false);
      }
    };

    if (session?.user?.email) {
      checkIfInvitedUser();
    }
  }, [session]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setProfileData(prev => ({ ...prev, profileImage: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nom', profileData.nom);
      formData.append('prenom', profileData.prenom);
      
      if (profileData.profileImage instanceof File) {
        formData.append('profile_image', profileData.profileImage);
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/profile',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess('Profil mis à jour avec succès');
      
      if (response.data.user) {
        const updatedUser = {
          ...response.data.user,
          profile_image: response.data.user.profile_image
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        updateUser(updatedUser);
        
        if (updatedUser.profile_image) {
          const imageUrl = `http://localhost:5000/api/users/profile-image/${updatedUser.profile_image}`;
          setPreviewImage(imageUrl);
        }
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const updateData = {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        is_invited_user: isInvitedUser
      };

      const response = await axios.put(
        'http://localhost:5000/api/users/password',
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Mot de passe mis à jour avec succès');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsInvitedUser(false);
      }
    } catch (error) {
      console.error('Password update error details:', {
        message: error.response?.data?.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Paramètres du compte</h1>
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profil
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Sécurité
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileUpdate} className="settings-form">
          <div className="profile-image-section">
            <div className="image-container">
              <img src={previewImage} alt="Profile" className="profile-image" />
              <label htmlFor="profile-image" className="image-upload-label">
                <Camera size={20} />
                <span>Changer la photo</span>
              </label>
              <input
                type="file"
                id="profile-image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nom">Nom</label>
            <input
              type="text"
              id="nom"
              value={profileData.nom}
              onChange={(e) => setProfileData({...profileData, nom: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prenom">Prénom</label>
            <input
              type="text"
              id="prenom"
              value={profileData.prenom}
              onChange={(e) => setProfileData({...profileData, prenom: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
          </button>
        </form>
      )}

      {activeTab === 'security' && (
        <form onSubmit={handlePasswordUpdate} className="settings-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Mot de passe actuel</label>
            <input
              type="password"
              id="currentPassword"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              required
              placeholder="Entrez votre mot de passe actuel"
              readOnly={isInvitedUser}
              style={isInvitedUser ? { backgroundColor: '#f0f0f0' } : {}}
            />
            {isInvitedUser && (
              <small style={{ color: '#666' }}>
                Mot de passe temporaire automatiquement rempli
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <input
              type="password"
              id="newPassword"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              required
              placeholder="Entrez votre nouveau mot de passe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              required
              placeholder="Confirmez votre nouveau mot de passe"
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      )}
    </div>
  );
};

export default UserSettings; 