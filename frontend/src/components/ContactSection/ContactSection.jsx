import React, { useState } from 'react';
import axios from 'axios';
import './ContactSection.css'; // Import the CSS file

function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/contact', formData);
      if (response.status === 201) {
        alert('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' }); // Clear form
      }
    } catch (error) {
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="contact-section">
      <form onSubmit={handleSubmit} className="contact-form">
        <h2 className="form-title">Get in Touch</h2>
        <div className="mb-3">
          <label className="form-label">Your Name</label>
          <input 
            type="text" 
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name" 
            required 
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Your Email</label>
          <input 
            type="email" 
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email" 
            required 
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Your Message</label>
          <textarea 
            className="form-control"
            rows="4" 
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Type your message" 
            required
          ></textarea>
        </div>

        <div className="text-center">
          <button type="submit" className="submit-button">Send Message</button>
        </div>
      </form>
    </div>
  );
}

export default ContactSection;