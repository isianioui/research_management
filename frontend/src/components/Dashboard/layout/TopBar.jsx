// components/TopBar.js
import React, { useState, useRef, useEffect } from 'react'; // Add useRef and useEffect here
import { Menu, Plus, HelpCircle, Settings } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import UserAvatar from '../components/UserAvatar';
import CreateDropdown from '../functions/CreateDropdown';
import CreateProjectForm from '../functions/CreateProjectForm';
import './TopBar.css';
import axios from 'axios'; // Don't forget to import axios
import { useSession } from '../../../context/SessionContext';


const TopBar = ({ onSidebarToggle }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [selectedMethodology, setSelectedMethodology] = useState(null);
  const dropdownRef = useRef(null); // useRef is now defined
  const { session } = useSession();


  const handleCreateButtonClick = () => {
    setIsDropdownOpen((prev) => !prev); // Toggle dropdown visibility
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownItemClick = (methodologyId) => {
    setSelectedMethodology(methodologyId);
    setIsCreateFormOpen(true);
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/project', {
        ...projectData,
        methodologie_id: selectedMethodology,
        createur_id: 1 // Example creator ID
      });
      alert('Project created successfully!');
      console.log(response.data);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={onSidebarToggle} className="icon-button">
            <Menu size={24} />
          </button>

          <div style={{ position: 'relative' }} ref={dropdownRef}> {/* Attach ref here */}
            <button onClick={handleCreateButtonClick} className="create-button">
              <Plus size={20} />
              <span>Create project</span>
            </button>
            {isDropdownOpen && <CreateDropdown onMethodologySelect={handleDropdownItemClick} />}
          </div>
        </div>

        {/* Middle Section */}
        <div style={{ flex: 1, margin: '0 32px' }}>
          <SearchBar />
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button className="icon-button">
            <HelpCircle size={20} />
          </button>
          <button className="icon-button">
            <Settings size={20} />
          </button>
          <UserAvatar 
            initials={`${session.user?.nom?.[0]}${session.user?.prenom?.[0]}`}
            imageUrl={session.user?.profile_image 
              ? `http://localhost:5000/api/users/profile-image/${session.user.profile_image}`
              : null
            }
          />
        </div>
      </div>

      {/* Project Creation Form */}
      {isCreateFormOpen && (
        <div className="modal-overlay">
          <CreateProjectForm onClose={() => setIsCreateFormOpen(false)} onCreate={handleCreateProject} selectedMethodology={selectedMethodology} />
        </div>
      )}
    </div>
  );
};

export default TopBar;