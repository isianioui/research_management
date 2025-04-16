// // src/components/Dashboard/DashboardLayout.jsx
// import React from 'react';
// import TopBar from './layout/TopBar';
// import Sidebar from './layout/Sidebar';
// import ProjectList from './functions/ProjectList';
// import useProjects from './functions/useProjects';
// import './DashboardLayout.css';

// const DashboardLayout = ({ children, sidebarOpen, setSidebarOpen }) => {
//   const { projects, showProjects, fetchUserProjects, resetProjects } = useProjects();

//   return (
//     <div className="dashboard-container">
//       {/* TopBar */}
//       <div className="fixed-top">
//         <TopBar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
//       </div>

//       {/* Sidebar */}
//       <div className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
//         <Sidebar
//           isOpen={sidebarOpen}
//           fetchUserProjects={fetchUserProjects}
//           resetProjects={resetProjects}
//         />
//       </div>

//       {/* Main Content */}
//       <div className={`main-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
//         {/* Conditionally render ProjectList or children */}
//         {showProjects ? (
//           <ProjectList
//             projects={projects}
//             onView={(projectId) => console.log('View project:', projectId)}
//             onEdit={(projectId) => console.log('Edit project:', projectId)}
//             onDelete={(projectId) => console.log('Delete project:', projectId)}
//           />
//         ) : (
//           children
//         )}
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;


// src/components/Dashboard/DashboardLayout.jsx
// src/components/Dashboard/DashboardLayout.jsx
// src/components/Dashboard/DashboardLayout.jsx
import React from 'react';
import TopBar from './layout/TopBar';
import Sidebar from './layout/Sidebar';
import ProjectList from './functions/ProjectList';
import useProjects from './functions/useProjects';
import './DashboardLayout.css';

const DashboardLayout = ({ children, sidebarOpen, setSidebarOpen }) => {
  const { projects, showProjects, fetchUserProjects, resetProjects } = useProjects();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
        <Sidebar
          isOpen={sidebarOpen}
          fetchUserProjects={fetchUserProjects}
          resetProjects={resetProjects}
        />
      </div>

      {/* Main wrapper containing TopBar and Content */}
      <div className={`main-wrapper ${!sidebarOpen ? 'sidebar-hidden' : ''}`}>
        {/* TopBar */}
        <div className="fixed-top">
          <TopBar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Conditionally render ProjectList or children */}
          {showProjects ? (
            <ProjectList
              projects={projects}
              onView={(projectId) => console.log('View project:', projectId)}
              onEdit={(projectId) => console.log('Edit project:', projectId)}
              onDelete={(projectId) => console.log('Delete project:', projectId)}
            />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;




// // components/DashboardLayout.js
// import React from 'react';
// import TopBar from './layout/TopBar';
// import Sidebar from './layout/Sidebar';
// import ProjectList from './functions/ProjectList';
// import useProjects from './functions/useProjects';
// import './DashboardLayout.css';

// const DashboardLayout = ({ children, sidebarOpen, setSidebarOpen }) => {
//   const { projects, showProjects, fetchUserProjects, resetProjects } = useProjects();

//   return (
//     <div className="dashboard-container">
//       {/* TopBar */}
//       <div className="fixed-top">
//         <TopBar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
//       </div>

//       {/* Sidebar */}
//       <div className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
//         <Sidebar
//           isOpen={sidebarOpen}
//           fetchUserProjects={fetchUserProjects}
//           resetProjects={resetProjects}
//         />
//       </div>

//       {/* Main Content */}
//       <div className={`main-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
//         {/* Conditionally render ProjectList or children */}
//         {showProjects ? (
//           <ProjectList
//             projects={projects}
//             onView={(projectId) => console.log('View project:', projectId)}
//             onEdit={(projectId) => console.log('Edit project:', projectId)}
//             onDelete={(projectId) => console.log('Delete project:', projectId)}
//           />
//         ) : (
//           children
//         )}
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;