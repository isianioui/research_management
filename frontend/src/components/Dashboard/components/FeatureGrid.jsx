import React, { useState } from 'react';
import { 
  InboxIcon, Settings, BarChart2, Briefcase, 
  Users, Calendar, FileText, MessageSquare,
  PieChart, Bell, Star, Clock, Plus, MoreHorizontal
} from 'lucide-react';
import FeatureCard from './FeatureCard';

const FeatureGrid = () => {
  const [activeTab, setActiveTab] = useState('upcoming');

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="mb-12">
        <p className="text-gray-400 mb-2">
        </p>
        
      
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-8">
        <div className="feature-card-wrapper">
          <FeatureCard
            title="Project intake"
            backgroundColor="#1F2937"
            description="Manage project requests and automate workflows"
            features={[
              { name: 'Forms', icon: InboxIcon, path: '/forms' },
              { name: 'Rules and automation', icon: Settings, path: '/automation' }
            ]}
          />
        </div>
        <div className="feature-card-wrapper">
          <FeatureCard
            title="Goal management"
            backgroundColor="#14532D"
            description="Track and achieve team objectives"
            features={[
              { name: 'Goals', icon: BarChart2, path: '/goals' },
              { name: 'Rules and automation', icon: Settings, path: '/goal-automation' }
            ]}
          />
        </div>
        <div className="feature-card-wrapper">
          <FeatureCard
            title="Project management"
            backgroundColor="#7F1D1D"
            description="Oversee and organize project portfolios"
            features={[
              { name: 'Rules and automation', icon: Settings, path: '/project-automation' },
              { name: 'Portfolios', icon: Briefcase, path: '/portfolios' }
            ]}
          />
        </div>
        <div className="feature-card-wrapper">
          <FeatureCard
            title="Team Collaboration"
            backgroundColor="#1E40AF"
            description="Coordinate with your team effectively"
            features={[
              { name: 'Team Members', icon: Users, path: '/team' },
              { name: 'Calendar', icon: Calendar, path: '/calendar' }
            ]}
          />
        </div>
        <div className="feature-card-wrapper">
          <FeatureCard
            title="Documentation"
            backgroundColor="#3730A3"
            description="Manage project documentation and resources"
            features={[
              { name: 'Documents', icon: FileText, path: '/documents' },
              { name: 'Messages', icon: MessageSquare, path: '/messages' }
            ]}
          />
        </div>
        <div className="feature-card-wrapper">
          <FeatureCard
            title="Analytics & Reports"
            backgroundColor="#5B21B6"
            description="Track project metrics and generate insights"
            features={[
              { name: 'Analytics', icon: PieChart, path: '/analytics' },
              { name: 'Notifications', icon: Bell, path: '/notifications' }
            ]}
          />
        </div>
      </div>

      {/* Task and Project Cards Section */}
      <div className="grid grid-cols-2 gap-8 mt-12">
        {/* Tasks Card */}
        <div className="bg-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="/path-to-avatar.jpg" 
              alt="User" 
              className="w-8 h-8 rounded-full"
            />
            <h2 className="text-lg font-semibold text-white">Mes tâches</h2>
            <span className="text-gray-400">🔒</span>
            <button className="ml-auto text-gray-400 hover:text-white">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mb-4 border-b border-gray-700">
            <button 
              className={`tab-button ${activeTab === 'upcoming' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              À venir
            </button>
            <button 
              className={`tab-button ${activeTab === 'late' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('late')}
            >
              En retard
            </button>
            <button 
              className={`tab-button ${activeTab === 'completed' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Terminées
            </button>
          </div>

          {/* Create Task Button */}
          <button className="create-task-button mb-4">
            <Plus size={16} className="mr-2" />
            <span>Créer une tâche</span>
          </button>

          {/* Task List */}
          <div className="space-y-2">
            <TaskItem 
              title="Rédiger un brief de projet"
              project="nothing"
              date="Aujourd'hui — 25 mar"
            />
            <TaskItem 
              title="Planifier la réunion de lancement"
              project="nothing"
              date="24 - 26 mar"
            />
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Projets</h2>
            <div className="flex items-center gap-2">
              <button className="text-sm text-gray-400 hover:text-white">
                Éléments récents ▾
              </button>
              <button className="text-gray-400 hover:text-white">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Create Project Button */}
          <div className="flex items-center mb-4">
            <button className="create-project-button">
              <Plus size={16} className="mr-2" />
              <span>Créer un projet</span>
            </button>
          </div>

          {/* Project List */}
          <div className="space-y-2">
            <ProjectItem 
              name="nothing"
              taskCount="3 tâches à terminer bientôt"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Item Component
const TaskItem = ({ title, project, date }) => (
  <div className="task-item">
    <div className="flex items-center gap-3">
      <div className="checkbox-wrapper">
        <input type="checkbox" className="task-checkbox" />
      </div>
      <div>
        <p className="text-white text-sm font-medium">{title}</p>
        <div className="flex items-center gap-2">
          <span className="project-tag">{project}</span>
          <span className="text-gray-400 text-xs">{date}</span>
        </div>
      </div>
    </div>
  </div>
);

// Project Item Component
const ProjectItem = ({ name, taskCount }) => (
  <div className="project-item">
    <div className="flex items-center gap-3">
      <div className="project-icon">
        <span>N</span>
      </div>
      <div>
        <p className="text-white text-sm font-medium">{name}</p>
        <span className="text-gray-400 text-xs">{taskCount}</span>
      </div>
    </div>
  </div>
);

export default FeatureGrid;