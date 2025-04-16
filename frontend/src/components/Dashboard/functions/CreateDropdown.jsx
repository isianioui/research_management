import React from 'react';

const CreateDropdown = ({ onMethodologySelect }) => {
  const methodologies = [
    { id: 1, name: 'Global' },
    { id: 2, name: 'IMRAD' },
    { id: 3, name: 'Prisma' }
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        backgroundColor: '#1F2937',
        borderRadius: '6px',
        padding: '8px 0',
        marginTop: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        minWidth: '160px',
      }}
    >
      {methodologies.map((method) => (
        <button
          key={method.id}
          onClick={() => onMethodologySelect(method.id)}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 16px',
            color: 'white',
            backgroundColor: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {method.name}
        </button>
      ))}
    </div>
  );
};

export default CreateDropdown;