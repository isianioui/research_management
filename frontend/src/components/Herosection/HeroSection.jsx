import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/dashboard.png'; // Import your image (replace with your actual image file)
import './HeroSection.css';

function HeroSection() {
  return (
    <section className="hero-section py-5">
      <div className="container">
        <div className="row align-items-center">
          {/* Left Column: Text Content */}
          <div className="col-md-6">
            <h1 className="display-4 text-left">Welcome to research app</h1>
            <p className="lead text-left">
            Empowers teams and individuals to seamlessly orchestrate, prioritize,
          and monitor the flow of their tasks and projects with precision and
          ease.
            </p>
            <div className="mt-4">
                <Link to="/Auth">
                <button className="btn btn-light me-2">Get Started</button>
                              </Link>
               {/* Light button for contrast */}
              <button className="btn btn-outline-light">Learn More</button> {/* Outline light button */}
            </div>
          </div>

          {/* Right Column: Image with Overlay */}
          <div className="col-md-6 position-relative">
            <div className="image-container">
              {/* Image */}
              <img
                src={heroImage}
                alt="Hero"
                className="img-fluid"
                style={{
                  width: '700px', // Fixed width
                  height: '300px', // Fixed height
                  objectFit: 'cover', // Ensures the image covers the area without distortion
                  borderRadius: '10px', // Optional: Add rounded corners
                }}
              />

              {/* Color Overlay */}
              <div className="image-overlay"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;