# Research Project Management Web Application


A comprehensive web application designed to help researchers, PhD students, and academic teams manage their research projects efficiently. Built with Flask (Python) backend and React.js frontend.

## Features

### Core Functionalities
- **Project Management**: Create, track, and organize research projects with methodologies (PRISMA, GLOBAL, IMRAD)
- **Task System**: Assign tasks with priorities, deadlines, and status tracking
- **Collaboration Tools**: Invite team members with role-based permissions
- **Documentation Hub**: Centralized resource sharing and documentation

### User Experience
- JWT Authentication (Email/Password + OAuth via Google/GitHub)
- Responsive dashboard with project analytics
- Real-time messaging system

### Technical Highlights
- RESTful API architecture
- PostgreSQL database with SQLAlchemy ORM
- Secure authentication with Flask-JWT
- Modern React.js frontend with Axios integration

## Technology Stack

### Frontend
- React.js
- CSS3
- Axios (API communication)
- React Router

### Backend
- Flask (Python)
- Flask-JWT (Authentication)
- SQLAlchemy (ORM)
- Psycopg2 (PostgreSQL adapter)

### Database
- PostgreSQL

### Development Tools
- Visual Studio Code
- Git/GitHub
- Pylint (Code analysis)
- SonarQube (Code quality)
- Postman (API testing)

## Installation Guide

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- Git

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/isianioui/research_management.git
   cd research-project-management/backend

   ```
2. Create a virtual environment and install dependencies:
   ```bash
 cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt

### frontend Setup
Navigate to the frontend directory:
   ```bash

   cd ../frontend
   npm install
    npm start

