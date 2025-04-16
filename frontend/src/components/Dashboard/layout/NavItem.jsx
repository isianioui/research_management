

// import React from "react";
// import { useNavigate } from 'react-router-dom';

// const NavItem = ({ name, icon: Icon, current, badge, href, onClick }) => {
//   const navigate = useNavigate();

//   const handleClick = (e) => {
//     e.preventDefault();
//     if (name === 'Calendar') {
//       window.open('https://calendar.google.com', '_blank');
//     } else if(name == 'My tasks') {
//       navigate('/dashboard/tasks');
//     }else if(name == 'Reporting') {
//       navigate('/dashboard/reporting');
//     }else if(name == 'Messages') {
//       navigate('/dashboard/messages');
//     }else if(name == 'Projects') {
//       navigate('/dashboard/projects');
//     }else {
//       navigate(href);
//     }
//   };

//   return (
//     <a
//       href={href}
//       style={{
//         display: "flex",
//         alignItems: "center",
//         padding: "8px 16px",
//         fontSize: "14px",
//         color: current ? "white" : "#9CA3AF",
//         backgroundColor: current ? "#1F2937" : "transparent",
//         textDecoration: "none",
//         cursor: "pointer",
//       }}
//       onClick={handleClick}
//       onMouseEnter={(e) => {
//         if (!current) {
//           e.currentTarget.style.backgroundColor = '#1F2937';
//           e.currentTarget.style.color = 'white';
//         }
//       }}
//       onMouseLeave={(e) => {
//         if (!current) {
//           e.currentTarget.style.backgroundColor = 'transparent';
//           e.currentTarget.style.color = '#9CA3AF';
//         }
//       }}
//     >
//       <Icon style={{ marginRight: "12px", width: "20px", height: "20px" }} />
//       <span>{name}</span>
//       {badge && (
//         <span
//           style={{
//             marginLeft: "auto",
//             backgroundColor: "#374151",
//             fontSize: "12px",
//             padding: "2px 8px",
//             borderRadius: "9999px",
//           }}
//         >
//           {badge}
//         </span>
//       )}
//     </a>
//   );
// };

// export default NavItem;


import React from "react";
import { useNavigate } from 'react-router-dom';

const NavItem = ({ name, icon: Icon, current, badge, href, onClick }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault(); // Prevent default link behavior

    // If a custom onClick is provided, call it first
    if (onClick) {
      const shouldNavigate = onClick(); // Allow onClick to return false to prevent navigation
      if (shouldNavigate === false) {
        return; // Stop further execution if onClick returns false
      }
    }

    // Handle specific navigation cases
    switch (name) {
      case 'Calendar':
        window.open('https://calendar.google.com', '_blank');
        break;
      case 'My tasks':
        navigate('/dashboard/tasks');
        break;
      case 'Reporting':
        navigate('/dashboard/reporting');
        break;
      case 'Messages':
        navigate('/dashboard/messages');
        break;
      case 'Projects':
        navigate('/dashboard/projects');
        break;
      case 'Add collaborator':
        navigate('/dashboard/add-collaborator');
        window.location.reload(); // Ensure this matches your route
        break;
      default:
        // If href is provided and no specific case matches, navigate to href
        if (href) {
          navigate(href);
        }
    }
  };

  return (
    <a
      href={href || '#'}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 16px",
        fontSize: "14px",
        color: current ? "white" : "#9CA3AF",
        backgroundColor: current ? "#1F2937" : "transparent",
        textDecoration: "none",
        cursor: "pointer",
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!current) {
          e.currentTarget.style.backgroundColor = '#1F2937';
          e.currentTarget.style.color = 'white';
        }
      }}
      onMouseLeave={(e) => {
        if (!current) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#9CA3AF';
        }
      }}
    >
      <Icon style={{ marginRight: "12px", width: "20px", height: "20px" }} />
      <span>{name}</span>
      {badge && (
        <span
          style={{
            marginLeft: "auto",
            backgroundColor: "#374151",
            fontSize: "12px",
            padding: "2px 8px",
            borderRadius: "9999px",
          }}
        >
          {badge}
        </span>
      )}
    </a>
  );
};

export default NavItem;