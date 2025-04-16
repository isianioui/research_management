// components/Sidebar.js
import React from 'react';
import { Home, InboxIcon, BarChart2, Briefcase, Users, Settings, Calendar, FileText, MessageCircle, Bell, Star, Folder, Clipboard, PieChart, UserPlus } from 'lucide-react';
import NavItem from './NavItem';
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';

const CLIENT_ID = "547045655615-cqmvkm4evaoqh0mkqbm7ishq1vg7sipp.apps.googleusercontent.com";
const API_KEY = 'AIzaSyDxdTdLRDqWIeCMbUQSCjthLGAwdvwx-9s';

const navigation = [
  { name: 'Home', icon: Home, current: true, href: '/dashboard/overview' },
  { name: 'Add collaborator', icon: UserPlus, current: false, href: '/dashboard/add-collaborator' },
  { name: 'My tasks', icon: InboxIcon, current: false, href: '/my-tasks' },
  { name: 'Inbox', icon: InboxIcon, badge: '3', current: false, href: '/inbox' },
  { name: 'Reporting', icon: BarChart2, current: false, href: '/reporting' },
  { name: 'Projects', icon: Briefcase, current: false, href: '/projects' },
  { name: 'Team', icon: Users, current: false, href: '/team' },
  { name: 'Calendar', icon: Calendar, current: false, href: 'https://calendar.google.com' },
  { name: 'Documents', icon: FileText, current: false, href: '/documents' },
  { name: 'Messages', icon: MessageCircle, current: false, href: '/dashboard/messages' },
  { name: 'Notifications', icon: Bell, badge: '5', current: false, href: '/notifications' },
  { name: 'Favorites', icon: Star, current: false, href: '/favorites' },
  { name: 'Tasks', icon: Clipboard, current: false, href: '/tasks' },
  { name: 'Analytics', icon: PieChart, current: false, href: '/dashboard/analytics' },
  { name: 'Settings', icon: Settings, current: false, href: '/dashboard/settings' },
];

const Sidebar = ({ isOpen, fetchUserProjects, resetProjects }) => {
  const navigate = useNavigate();

  const initializeGoogleCalendar = async () => {
    try {
      await gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar'
      });
      
      if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        await gapi.auth2.getAuthInstance().signIn();
      }
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
    }
  };

  const handleNavItemClick = async (item) => {
    if (item.name === 'Calendar') {
      await initializeGoogleCalendar();
      window.open('https://calendar.google.com', '_blank');
    } else if (item.name === 'Projects') {
      fetchUserProjects();
    } else if (item.name === 'Home') {
      resetProjects();
      navigate('/dashboard/overview');
    } else if (item.name === 'Add collaborator') {
      navigate('/dashboard/add-collaborator');
    } else if (item.name === 'Analytics') {
      navigate('/dashboard/analytics');
    } else if (item.name === 'Settings') {
      navigate('/dashboard/settings');
    } else if (item.name === 'Messages') {
      navigate('/dashboard/messages');
    } else {
      resetProjects();
    }
  };

  return (
    <div style={{
      width: "256px",
      backgroundColor: "#111827",
      borderRight: "1px solid #374151",
      display: isOpen ? "block" : "none",
    }}>
      <nav style={{ marginTop: "16px" }}>
        {navigation.map((item) => (
          <NavItem
            key={item.name}
            {...item}
            onClick={() => handleNavItemClick(item)}
          />
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;

