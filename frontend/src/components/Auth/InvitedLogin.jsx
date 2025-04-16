import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../context/SessionContext';
import './InvitedLogin.css';

const InvitedLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateSession } = useSession();
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    const tempPassword = params.get('temp_password');
    
    console.log('URL Parameters:', { email, tempPassword });
    
    setLoginData({
      email: email || '',
      password: tempPassword || ''
    });
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('Attempting login with:', {
        email: loginData.email,
        passwordLength: loginData.password?.length
      });

      const response = await axios.post(
        'http://localhost:5000/api/collaborateurs/login-invited-user',
        loginData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      console.log('Login response:', response.data);

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        updateSession({
          isAuthenticated: true,
          user: response.data.user,
          token: response.data.access_token
        });

        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error.response || error);
      setError(
        error.response?.data?.message || 
        'Une erreur est survenue lors de la connexion'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login as Invited User</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            value={loginData.email}
            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
            placeholder="Email"
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            placeholder="Temporary Password"
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default InvitedLogin; 