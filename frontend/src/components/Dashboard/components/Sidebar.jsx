import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <Link to="/dashboard/settings" className="sidebar-item">
        <i className="fas fa-cog"></i>
        <span>Paramètres</span>
      </Link>
    </div>
  );
};

export default Sidebar; 