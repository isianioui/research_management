import secrets
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_mail import Mail
from datetime import timedelta
from app.routes.login import login_bp
from app.routes.register import register_bp
from app.routes.contact import contact_bp
from app.routes.project import project_bp
from app.routes.methodology import methodology_bp
from app.config import Config, mail
from app.routes.imrad import imrad_bp  
from app.routes.global_steps import global_bp
from app.routes.prisma import prisma_bp
from app.routes.document import document_bp
from app.routes.comment import comment_bp
from app.routes.notification import notification_bp
from app.routes.collaborateurs import collaborateur_bp
from app.routes.user import user_bp
from app.routes.analytics import analytics_bp
from app.routes.tasks import tasks_bp
from app.routes.users import users_bp
from app.routes.chat import chat_bp
from flask_socketio import SocketIO
import os
from app.utils.email_utils import mail

socketio = SocketIO()

def create_app():
    """Create and configure the Flask app."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configure CORS at app level
    CORS(app, 
         resources={r"/api/*": {"origins": "http://localhost:5173"}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"])

    # Initialize SocketIO with CORS settings
    socketio.init_app(app, 
                     cors_allowed_origins="http://localhost:5173",
                     async_mode='threading')

    # Other configurations
    app.config['CORS_HEADERS'] = 'Content-Type'
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'

    # Initialize extensions
    jwt = JWTManager(app)
    mail.init_app(app)

    # Register blueprints
    app.register_blueprint(login_bp, url_prefix='/api')
    app.register_blueprint(register_bp, url_prefix='/api')      
    app.register_blueprint(contact_bp, url_prefix='/api')
    app.register_blueprint(project_bp, url_prefix='/api')
    app.register_blueprint(methodology_bp, url_prefix='/api')
    app.register_blueprint(imrad_bp, url_prefix='/api')  
    app.register_blueprint(global_bp, url_prefix='/api')
    app.register_blueprint(prisma_bp, url_prefix='/api')
    app.register_blueprint(document_bp, url_prefix='/api')
    app.register_blueprint(comment_bp, url_prefix='/api')
    app.register_blueprint(notification_bp, url_prefix='/api')
    app.register_blueprint(collaborateur_bp, url_prefix='/api/collaborateurs')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(tasks_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'status': 401,
            'sub_status': 42,
            'msg': 'The token has expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'status': 401,
            'sub_status': 42,
            'msg': 'Invalid token'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'status': 401,
            'sub_status': 42,
            'msg': 'Missing Authorization Header'
        }), 401

    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return str(user)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        try:
            return int(identity)
        except (ValueError, TypeError):
            return None

    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory('uploads', filename)

    # Add this to serve static files
    @app.route('/uploads/profile_images/<path:filename>')
    def serve_avatar(filename):
        uploads_dir = os.path.join(os.getcwd(), 'uploads', 'profile_images')
        return send_from_directory(uploads_dir, filename)

    # Ensure upload directory exists
    uploads_dir = os.path.join(os.getcwd(), 'uploads', 'profile_images')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    return app
