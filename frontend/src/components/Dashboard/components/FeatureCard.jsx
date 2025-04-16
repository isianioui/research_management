import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ title, backgroundColor, features, description }) => {
  return (
    <div 
      style={{ 
        backgroundColor, 
        borderRadius: '12px',
        padding: '24px',
        transition: 'transform 0.2s',
        cursor: 'pointer'
      }}
      className="hover:transform hover:scale-105"
    >
      <h3 className="text-xl font-semibold mb-4 text-white">{title}</h3>
      {description && (
        <p className="text-gray-300 mb-4 text-sm">{description}</p>
      )}
      <div className="space-y-3">
        {features.map((feature, index) => (
          <Link 
            key={index}
            to={feature.path || '#'} 
            className="flex items-center space-x-3 text-gray-300 hover:text-white"
          >
            <feature.icon size={20} />
            <span>{feature.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeatureCard;