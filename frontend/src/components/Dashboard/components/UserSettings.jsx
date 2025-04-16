import React, { useState, useEffect } from 'react';
import { useSession } from '../../../context/SessionContext';
import axios from 'axios';

const getInitials = (name) => {
  const [firstName, lastName] = name.split(' ');
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

const UserSettings = () => {
  const { session, login, updateSession } = useSession();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(session.user?.profile_image ? `http://localhost:5000${session.user.profile_image}` : null);

  useEffect(() => {
    console.log('Avatar URL dans la session:', session?.user?.avatar_url);
    if (session?.user?.avatar_url) {
      setAvatarUrl(session.user.avatar_url);
    }
    console.log('Avatar URL après mise à jour de l\'état:', avatarUrl);
  }, [session]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAvatarChange = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      setLoading(true);
      const response = await axios.post(
        `http://localhost:5000/api/users/${session.user.id}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.profile_image) {
        const updatedUser = {
          ...session.user,
          profile_image: response.data.profile_image
        };
        updateSession({ ...session, user: updatedUser });
        setMessage('Avatar updated successfully');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      setMessage(error.response?.data?.message || 'Error updating avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkSocial = async (provider) => {
    try {
      const response = await axios.put(
        'http://localhost:5000/api/user/social',
        { [provider]: null },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.user) {
        const updatedUser = {
          ...session.user,
          [`has_${provider}`]: false
        };
        login(updatedUser);
        setMessage(`Compte ${provider} délié avec succès`);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || `Erreur lors de la déliaison du compte ${provider}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Paramètres utilisateur</h2>
      
      {message && (
        <div className="mb-4 p-4 rounded-lg bg-blue-100 text-blue-700">
          {message}
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Avatar</h3>
        <div className="flex items-center space-x-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {`${session.user?.nom?.[0]}${session.user?.prenom?.[0]}`}
              </span>
            </div>
          )}
          <form onSubmit={handleAvatarChange} className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full p-2 border rounded-lg"
            />
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Avatar'}
            </button>
          </form>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Connexions sociales</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Google</span>
            {session?.user?.has_google ? (
              <button
                onClick={() => handleUnlinkSocial('google')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Délier le compte
              </button>
            ) : (
              <span className="text-gray-500">Non connecté</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>GitHub</span>
            {session?.user?.has_github ? (
              <button
                onClick={() => handleUnlinkSocial('github')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Délier le compte
              </button>
            ) : (
              <span className="text-gray-500">Non connecté</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings; 