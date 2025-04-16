import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../../context/SessionContext';
import { Calendar } from 'lucide-react';
import './CreateProjectForm.css';

// Google Calendar API configuration
const CLIENT_ID = "547045655615-cqmvkm4evaoqh0mkqbm7ishq1vg7sipp.apps.googleusercontent.com";
const API_KEY = 'AIzaSyDxdTdLRDqWIeCMbUQSCjthLGAwdvwx-9s';
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const API_BASE_URL = 'http://127.0.0.1:5000';

const CreateProjectForm = ({ onClose, onCreate, selectedMethodology }) => {
  const { session } = useSession();
  const [projectData, setProjectData] = useState({
    titre: '',
    description: '',
    date_fin: new Date(),
    statut: 'en cours'
  });
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  
  const methodologyNames = {
    1: 'Global',
    2: 'IMRAD',
    3: 'Prisma'
  };

  const navigate = useNavigate();

  // Initialize the GAPI client with API key
  const initializeGapiClient = async () => {
    try {
      // Check if GAPI client is already initialized
      if (window.gapi.client) {
        console.log('GAPI client already initialized');
        setGapiLoaded(true);
        return;
      }

      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      });
      setGapiLoaded(true);
      console.log('GAPI client initialized');
    } catch (error) {
      console.error('Error initializing GAPI client:', error);
      setCalendarError('Failed to initialize Google Calendar integration');
    }
  };

  // Update the useEffect for loading scripts
  useEffect(() => {
    const scriptIds = {
      gapi: 'google-gapi-script',
      gis: 'google-gis-script'
    };

    const loadGapiScript = () => {
      if (document.getElementById(scriptIds.gapi)) {
        // If script exists and GAPI is loaded, initialize directly
        if (window.gapi) {
          window.gapi.load('client', initializeGapiClient);
        }
        return;
      }
      
      const script = document.createElement('script');
      script.id = scriptIds.gapi;
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client', initializeGapiClient);
      };
      document.body.appendChild(script);
    };

    const loadGisScript = () => {
      if (document.getElementById(scriptIds.gis)) {
        if (window.google?.accounts?.oauth2) {
          setGisLoaded(true);
        }
        return;
      }
      
      const script = document.createElement('script');
      script.id = scriptIds.gis;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGisLoaded(true);
        console.log('Google Identity Services loaded');
      };
      document.body.appendChild(script);
    };

    loadGapiScript();
    loadGisScript();

    // Cleanup function
    return () => {
      // Only remove token and clean up GAPI client
      if (window.gapi?.client) {
        try {
          window.gapi.client.setToken(null);
        } catch (e) {
          console.warn('Error cleaning up GAPI client:', e);
        }
      }
      // Don't remove the scripts as they might be needed by other components
    };
  }, []);

  // Initialize the Google Identity Services token client when both libraries are loaded
  useEffect(() => {
    if (!gapiLoaded || !gisLoaded) return;

    const initializeTokenClient = () => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.error) {
              console.error('Auth error:', response.error);
              setCalendarError(`Authentication failed: ${response.error}`);
              return;
            }
            
            console.log('Token received:', response);
            setAccessToken(response.access_token);
            window.gapi.client.setToken(response);
          }
        });
        
        setTokenClient(client);
        console.log('Token client initialized');
      } catch (error) {
        console.error('Error initializing token client:', error);
        setCalendarError('Failed to initialize Google authentication');
      }
    };

    initializeTokenClient();
  }, [gapiLoaded, gisLoaded]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProjectData({ ...projectData, [name]: value });
  };

  const handleDateChange = (date) => {
    setProjectData({ ...projectData, date_fin: date });
  };

  // Function to request access token with tokenClient
  const getAccessToken = async () => {
    if (!tokenClient) {
      console.error('Token client not initialized');
      throw new Error('Google Auth not ready');
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Prompt for consent if needed
        tokenClient.requestAccessToken();
        
        // This is a bit of a hack - we'll resolve when the access token is set in the callback
        const checkToken = setInterval(() => {
          if (accessToken) {
            clearInterval(checkToken);
            resolve(accessToken);
          }
        }, 200);
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
          clearInterval(checkToken);
          if (!accessToken) {
            reject(new Error('Token request timed out'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Function to create Google Calendar event
  const createCalendarEvent = async (projectId) => {
    if (!gapiLoaded || !tokenClient) {
      console.error('Google API not fully initialized');
      throw new Error('Google API not ready');
    }

    try {
      console.log("Creating calendar event...");
      const event = {
        summary: projectData.titre,
        description: `${projectData.description}\n\nProject ID: ${projectId}\nMethodology: ${methodologyNames[selectedMethodology]}`,
        start: {
          dateTime: new Date().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: projectData.date_fin.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        },
        colorId: '2', // Couleur rouge pour les projets
        transparency: 'opaque',
        visibility: 'private'
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all'
      });

      console.log("Calendar event created successfully:", response.result);
      return response.result;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');
      
      // Add detailed token debugging
      console.log('Token value:', token);
      try {
        const tokenParts = token.split('.');
        console.log('Token structure:', {
          header: JSON.parse(atob(tokenParts[0])),
          payload: JSON.parse(atob(tokenParts[1])),
          signature: tokenParts[2]
        });
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token expiration:', new Date(payload.exp * 1000));
        console.log('Current time:', new Date());
        console.log('Token is expired:', Date.now() >= payload.exp * 1000);
      } catch (e) {
        console.error('Error parsing token:', e);
      }

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Add token validation
      if (token === 'undefined' || token === 'null' || !token.startsWith('eyJ')) {
        localStorage.removeItem('token');
        throw new Error('Invalid token format');
      }

      // Validation des champs requis
      if (!projectData.titre || !projectData.description) {
        throw new Error('Le titre et la description sont requis');

      }

      // Préparation des données du projet
      const projectPayload = {
        titre: projectData.titre,
        description: projectData.description,
        methodologie_id: parseInt(selectedMethodology),
        date_creation: new Date().toISOString().split('T')[0],
        date_fin: projectData.date_fin.toISOString().split('T')[0],
        statut: 'en cours'
      };

      // Log complete payload and headers for debugging
      console.log('Complete project payload:', JSON.stringify(projectPayload, null, 2));
      console.log('Request headers:', {
        'Authorization': `Bearer ${token}`,  // Show the complete header
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      try {
        const projectResponse = await axios.post(
          `${API_BASE_URL}/api/project`,
          projectPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,  // Add back the 'Bearer' prefix
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            withCredentials: true
          }
        );

        console.log('Project response:', projectResponse.data);

        if (projectResponse.data && projectResponse.data.project) {
          const projectId = projectResponse.data.project.id;
          console.log("Project created successfully with ID:", projectId);
          
          // Si nous avons accès à Google Calendar, créer l'événement
          if (accessToken) {
            try {
              const calendarEvent = await createCalendarEvent(projectId);
              
              if (calendarEvent && calendarEvent.id) {
                // Mettre à jour le projet avec les informations du calendrier
                await axios.put(
                  `${API_BASE_URL}/api/project/${projectId}/calendar`,
                  {
                    calendar_event_id: calendarEvent.id,
                    calendar_event_link: calendarEvent.htmlLink
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,  // Add back the 'Bearer' prefix
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    withCredentials: true
                  }
                );
              }
            } catch (error) {
              console.error("Failed to create calendar event:", error);
              setCalendarError(`Calendar creation failed: ${error.message}`);
            }
          }
          
          navigate(`/dashboard/projects/${projectId}/${methodologyNames[selectedMethodology].toLowerCase()}`);
          onClose();
        } else {
          throw new Error('Réponse invalide du serveur');
        }
      } catch (error) {
        if (error.response) {
          console.error('Server response error details:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
            error: error.response.data.error || error.response.data.message || 'Unknown error'
          });
          
          // Log the complete response data
          console.log('Complete response data:', error.response.data);
          
          if (error.response.status === 401 || error.response.status === 403) {
            localStorage.removeItem('token');
            throw new Error('Session expired. Please login again.');
          }
          
          // Use more specific error message
          const errorMessage = error.response.data.error || 
                              error.response.data.message || 
                              error.response.data.msg ||
                              JSON.stringify(error.response.data) ||
                              'Server error';
          throw new Error(errorMessage);
        } else if (error.request) {
          console.error('No response received:', error.request);
          throw new Error('No response from server');
        } else {
          console.error('Request setup error:', error.message);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.response?.status === 401) {
        alert('Votre session a expiré. Veuillez vous reconnecter.');
        // Rediriger vers la page de connexion
        navigate('/login');
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Erreur lors de la création du projet: ' + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to trigger authentication
  const handleGoogleAuth = () => {
    if (!tokenClient) {
      setCalendarError("Google authentication is not ready yet. Please try again in a moment.");
      return;
    }

    try {
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Error requesting access token:', error);
      setCalendarError('Failed to authenticate with Google');
    }
  };

  return (
    <div className="create-project-container">
      <div className="create-project-header">
        <h2 className="create-project-title">Create Project</h2>
        {selectedMethodology && (
          <div className="methodology-badge">
            {methodologyNames[selectedMethodology]}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Project Title</label>
        <input
          type="text"
          name="titre"
          placeholder="Enter project title"
          value={projectData.titre}
          onChange={handleInputChange}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Project Description</label>
        <input
          type="text"
          name="description"
          placeholder="Enter project description"
          value={projectData.description}
          onChange={handleInputChange}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">End Date</label>
        <div className="date-picker-container">
          <DatePicker
            selected={projectData.date_fin}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select end date"
            className="form-input"
          />
        </div>
      </div>

      {/* Google Calendar Integration Section */}
      <div className="google-calendar-integration">
        <h3 className="google-calendar-title">
          <Calendar size={18} />
          Google Calendar Integration
        </h3>
        
        {!gapiLoaded && (
          <div style={{ color: '#6B7280', fontSize: '14px' }}>
            Loading Google Calendar integration...
          </div>
        )}

        {calendarError && (
          <div className="warning-message">
            Warning: {calendarError}
          </div>
        )}

        {gapiLoaded && !accessToken && (
          <button
            onClick={handleGoogleAuth}
            className="google-calendar-connect-btn"
          >
            <span>Connect to Google Calendar</span>
          </button>
        )}

        {accessToken && (
          <div className="google-calendar-connected">
            <span>✓</span> Connected to Google Calendar
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-create"
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="btn-cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateProjectForm;
