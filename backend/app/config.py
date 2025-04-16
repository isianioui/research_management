# app/config.py
import os

from flask_mail import Mail

class Config:
    # Flask configuration
    SECRET_KEY = 'dev-secret-key'  # Change this in production
    JWT_SECRET_KEY = 'jwt-secret'  # Change this in production
    DEBUG = True

    # Database configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_NAME = os.getenv('DB_NAME', 'research_appFinal')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASS = os.getenv('DB_PASS', 'your_postgres_password')

    # Email configuration
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = 'doha.isianioui@gmail.com'  # Your Gmail address
    MAIL_PASSWORD = 'Your Gmail App Password'  # Your Gmail App Password
    MAIL_DEFAULT_SENDER = ('isianioui doha', 'doha.isianioui@gmail.com')  # Add a sender name
    MAIL_MAX_EMAILS = None
    MAIL_ASCII_ATTACHMENTS = False
    
mail = Mail()

