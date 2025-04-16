import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import Overview from './pages/Overview';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import IMRADSteps from './pages/IMRADSteps';
import GLOBALSteps from './pages/GlobalSteps';
import PRISMASteps from './pages/PrismaSteps';
import AddCollaborator from './components/AddCollaborator';
import UserSettings from '../Settings/UserSettings';
import Analytics from './pages/Analytics';
import { useSession } from '../../context/SessionContext';
import Messages from './pages/Messages';

const ProtectedRoute = ({ children }) => {
  const { session } = useSession();
  const location = useLocation();

  if (!session?.isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const invitationToken = params.get('invitation');
  const projectId = params.get('project');
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    if (invitationToken && projectId) {
      // Redirect to the specific project
      window.location.href = `/dashboard/projects/${projectId}`;
    }
  }, [invitationToken, projectId]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to auth');
      navigate('/auth');
      return;
    }

    // Verify session exists
    if (!session?.user) {
      console.log('No session user found, redirecting to auth');
      navigate('/auth');
      return;
    }
  }, [navigate, session]);

  // Show loading state while checking authentication
  if (!session?.user) {
    return (
      <div className="loading-container">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="add-collaborator" element={<AddCollaborator />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/team" element={<Team />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/projects/:projectId/imrad" element={<IMRADSteps />} />
          <Route path="/projects/:projectId/global" element={<GLOBALSteps />} />
          <Route path="/projects/:projectId/prisma" element={<PRISMASteps />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Dashboard;

