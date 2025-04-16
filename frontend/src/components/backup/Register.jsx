import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import { GoogleLogin } from "@react-oauth/google";
import "./Register.css"; // Import the CSS file

function Register() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await response.json();
      console.log("Google login response:", data);

      if (response.ok) {
        alert("Google Registration Successful!");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      alert("Google Authentication Failed!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/register",
        formData
      );
      setMessage(response.data.message);
      if (response.status === 201) {
        alert("Registration successful!");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "An error occurred");
      alert(`Registration failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="register-left">
          <h1>Welcome</h1>
          <p>Sign up to continue</p>
        </div>
        <div className="register-right">
          <h2>Register</h2>
          {message && <p className="error-message">{message}</p>}
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="nom">Nom</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="prenom">Prénom</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="register-btn">Register</button>
          </form>
          {/* <div className="social-login">
            <p>Or register with:</p>
            <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={() => console.log("Google Login Failed")} />
          </div> */}
          <p className="login-link">
            Login with Google <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
