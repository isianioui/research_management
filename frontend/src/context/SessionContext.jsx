import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    // Initialize from localStorage if available
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      token: token || null,
      user: user ? JSON.parse(user) : null,
      isAuthenticated: !!token
    };
  });

  const updateUser = (userData) => {
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update session state
    setSession(prevSession => ({
      ...prevSession,
      user: userData
    }));
  };

  const updateSession = (newSession) => {
    setSession(prevSession => ({
      ...prevSession,
      ...newSession,
      user: {
        ...(prevSession.user || {}),
        ...(newSession.user || {})
      }
    }));
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', credentials);
      const { token, user } = response.data;
      
      // Store the token
      localStorage.setItem('token', token);
      
      // Set up axios defaults for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  return (
    <SessionContext.Provider value={{ session, setSession, updateUser, updateSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionProvider;
