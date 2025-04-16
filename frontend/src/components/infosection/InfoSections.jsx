import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './InfoSections.css';


const FeatureCard = ({ icon, title, description, backgroundColor }) => {
  return (
    <div className="card shadow-sm border-0 mb-4 feature-card"  style={{ backgroundColor }}>
      <div className="card-body text-center">
        <div className="feature-icon display-4 text-primary mb-3">{icon}</div>
        <h3 className="card-title">{title}</h3>
        <p className="card-text">{description}</p>
      </div>
    </div>
  );
};

const InfoSections = () => {
  const features = [
    {
      icon: <i className="bi bi-people-fill"></i>,
      title: 'Who We Are',
      description: 'We are a dynamic platform designed to empower teams and individuals to manage their tasks and projects efficiently, fostering collaboration and productivity.',
      backgroundColor: '#c9c4b3',
    },
    {
      icon: <i className="bi bi-gear-fill"></i>,
      title: 'What We Do',
      description: 'Through an intuitive interface and powerful features, we provide tools to streamline task organization, prioritize effectively, and track progress in real-time, ensuring seamless project execution.',
      backgroundColor: '#d2cec0',
    },
    {
      icon: <i className="bi bi-lightbulb-fill"></i>,
      title: 'How We Do It',
      description: 'We help teams and individuals stay organized, meet deadlines, and achieve their goals by offering a comprehensive solution for task management and project collaboration.',
      backgroundColor: '#e6e3dc',
    }
  ];

  return (
    <section className="features py-5 bg-light">
      <div className="container">
        <div className="row">
          {features.map((feature, index) => (
            <div key={index} className="col-md-4">
              <FeatureCard 
                icon={feature.icon} 
                title={feature.title} 
                description={feature.description} 
                backgroundColor={feature.backgroundColor}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InfoSections;
