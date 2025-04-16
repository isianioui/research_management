import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SessionProvider } from './context/SessionContext';
import Header from './components/Header/Header';
import HeroSection from './components/Herosection/HeroSection';
import InfoSections from './components/infosection/InfoSections';
import Footer from './components/Footer/Footer';
import Auth from './components/Auth/Auth';
import Dashboard from './components/Dashboard/Dashboard';
import AddCollaborator from './components/Dashboard/components/AddCollaborator';
import '@fortawesome/fontawesome-free/css/all.min.css';
import React, { useRef, useEffect } from 'react';
import { gapi } from 'gapi-script';
import InvitedLogin from './components/Auth/InvitedLogin';



const CLIENT_ID = "547045655615-cqmvkm4evaoqh0mkqbm7ishq1vg7sipp.apps.googleusercontent.com";
const API_KEY = 'AIzaSyDxdTdLRDqWIeCMbUQSCjthLGAwdvwx-9s';


function App() {
  const location = useLocation();
  const footerRef = useRef(null);

  const showHeaderAndFooter = !['/register', '/login', '/auth'].includes(location.pathname) && 
                            !location.pathname.startsWith('/dashboard') &&
                            !location.pathname.startsWith('/auth/github/callback');

  useEffect(() => {
    // Remove previous meta tags if they exist
    const existingCoopMeta = document.querySelector('meta[http-equiv="Cross-Origin-Opener-Policy"]');
    const existingCoepMeta = document.querySelector('meta[http-equiv="Cross-Origin-Embedder-Policy"]');
    
    if (existingCoopMeta) existingCoopMeta.remove();
    if (existingCoepMeta) existingCoepMeta.remove();

    // Add new meta tags
    const coopMeta = document.createElement('meta');
    coopMeta.httpEquiv = 'Cross-Origin-Opener-Policy';
    coopMeta.content = 'unsafe-none';
    document.head.appendChild(coopMeta);

    // Initialize Google API
    try {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          });
        } catch (error) {
          console.error('Error initializing Google API client:', error);
        }
      });
    } catch (error) {
      console.error('Error loading Google API:', error);
    }
  }, []);

  return (
    <SessionProvider>
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        {showHeaderAndFooter && <Header footerRef={footerRef} />}
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <InfoSections />
              </>
            }
          />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/github/callback" element={<Auth />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/invited-login" element={<Auth />} />
        </Routes>
        {showHeaderAndFooter && <Footer ref={footerRef} />}
      </GoogleOAuthProvider>
    </SessionProvider>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
