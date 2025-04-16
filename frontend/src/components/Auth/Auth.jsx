import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from "@react-oauth/google";
import { useSession } from '../../context/SessionContext';
import './Auth.css';
import GithubLoginButton from './GithubLoginButton';


function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, updateSession } = useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    type: 'etudiant',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    const temp_password = params.get('temp_password');

    if (email && temp_password) {
      console.log('Setting invited user credentials');
      setFormData({
        email: decodeURIComponent(email),
        password: decodeURIComponent(temp_password)
      });
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login logic
        const response = await axios.post('http://localhost:5000/api/login', 
          {
            email: formData.email,
            password: formData.password
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            withCredentials: true
          }
        );

        console.log('Login response:', response.data);

        // Check for either token or access_token
        const token = response.data.token || response.data.access_token;
        
        if (token && response.data.user) {
          // Store the token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Update the session context
          await updateSession({
            isAuthenticated: true,
            user: response.data.user,
            token: token
          });
          
          // Clear any existing error
          setError(null);
          
          // Log successful login
          console.log('Login successful, redirecting to dashboard...');
          
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          console.error('Invalid login response:', response.data);
          setError('Invalid login response from server');
        }
      } else {
        // Registration logic
        const response = await axios.post('http://localhost:5000/api/register',
          {
            email: formData.email,
            password: formData.password,
            nom: formData.nom,
            prenom: formData.prenom,
            type: formData.type
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            withCredentials: true
          }
        );

        if (response.data.token && response.data.user) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          await updateSession({
            isAuthenticated: true,
            user: response.data.user,
            token: response.data.token
          });
          
          setError(null);
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.response?.data?.error || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGithubLogin = async () => {
    const clientId = 'Ov23liXKd505uJFJbNLW';
    const redirectUri = encodeURIComponent('http://localhost:5173/auth/github/callback');
    const scope = encodeURIComponent('user:email read:user');
    
    // Rediriger vers GitHub pour l'authentification
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  const handleGithubCallback = async (code) => {
    try {
      console.log('Attempting GitHub login with code:', code);
      const response = await axios.post(
        'http://localhost:5000/api/auth/github/login',
        { 
          code,
          isInvitedLogin: false // Add this flag to indicate it's a regular OAuth login
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('GitHub login response:', response.data);

      if (response.data.token && response.data.user) {
        const token = response.data.token;
        localStorage.setItem('token', token);
        
        // Make sure to use the regular user data, not the invited user data
        const userData = {
          id: response.data.user.id,
          nom: response.data.user.nom || response.data.user.name, // Handle both name formats
          prenom: response.data.user.prenom,
          email: response.data.user.email,
          profile_image: response.data.user.avatar_url,
          avatar_url: response.data.user.avatar_url,
          is_invited: false // Explicitly mark as not invited
        };
        
        console.log('Setting user data:', userData);
        
        await updateSession({
          token: token,
          user: userData,
          isAuthenticated: true
        });
        
        navigate('/dashboard');
      } else {
        console.error('Invalid response format:', response.data);
        setError('Authentication failed: Invalid response format');
      }
    } catch (error) {
      console.error('GitHub Auth Error:', error.response?.data || error);
      setError(error.response?.data?.message || 'GitHub Authentication Failed');
    }
  };

  // Vérifier si nous sommes sur la page de callback
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      console.log('GitHub callback received with code:', code);
      handleGithubCallback(code);
    }
  }, []);

  const handleLoginSuccess = async (response) => {
    try {
      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        // Prepare user data with consistent property names
        const userData = {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          profile_image: user.profile_image, // Use profile_image instead of picture
          avatar_url: user.avatar_url
        };

        console.log('User data being stored:', userData);
        
        localStorage.setItem('token', token);
        login(userData, token);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Authentication failed');
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      // First, verify the token with Google
      const response = await axios.post(
        "http://localhost:5000/api/auth/google/login", 
        { 
          credential: credentialResponse.credential,
          isInvitedLogin: false
        },
        {
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        }
      );

      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        // Store both token and user data in localStorage
        localStorage.setItem('token', token);
        
        // Ensure all required user fields are present
        const userData = {
          id: user.id,
          nom: user.nom || user.name || '',
          prenom: user.prenom || '',
          email: user.email,
          profile_image: user.profile_image || user.picture || '',
          avatar_url: user.avatar_url || user.picture || '',
          is_invited: false,
          invitation_status: null,
          // Add a default password for Google users
          password: user.password || 'google_oauth_user'
        };

        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('Google login user data:', userData);
        
        await updateSession({
          token: token,
          user: userData,
          isAuthenticated: true
        });

        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      // More detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Authentication failed. Please try again.';
      setError(errorMessage);
    }
  };

  // When handling invited user login
  const handleInvitedLogin = async (email, password) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/collaborateurs/login-invited-user',
        {
          email: email,
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      if (response.data.access_token) {
        // Handle successful login
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Redirect or update state as needed
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle error appropriately
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className={`forms-container ${!isLogin ? 'move-left' : ''}`}>
          {/* Login Section */}
          <div className="login-section">
            <div className="form-box">
              <h2>{location.pathname.includes('invited-login') ? 'Complete Your Invitation' : 'Login'}</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              
              <div className="social-login">
                <div className="google-btn-container">
                  <GoogleLogin
                    clientId="547045655615-cqmvkm4evaoqh0mkqbm7ishq1vg7sipp.apps.googleusercontent.com"
                    onSuccess={handleGoogleLoginSuccess}
                    onError={() => console.log("Google Login Failed")}
                  />
                </div>
                
                <div className="github-btn-container">
                  <button 
                    onClick={handleGithubLogin}
                    className="github-button"
                  >
                    <i className="fab fa-github"></i>
                    Sign in with GitHub
                  </button>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <p>
                  Don't have an account?{' '}
                  <span className="auth-toggle" onClick={() => setIsLogin(false)}>
                    Register here
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Register Section */}
          <div className="register-section">
            <div className="form-box">
              <h2>Register</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Prénom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </form>
              
              <div className="text-center mt-3">
                <p>
                  Already have an account?{' '}
                  <span className="auth-toggle" onClick={() => setIsLogin(true)}>
                    Login here
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
