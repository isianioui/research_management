from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from functools import wraps
from app.models.user import User
from app.utils.database import get_db_connection
from app.utils.email_utils import mail
from flask_mail import Message
import os
from datetime import timedelta
from app.controllers.auth_controller import login_user, google_login_user, github_login_user
from app.controllers.user_controller import get_user_by_email
from werkzeug.security import check_password_hash

login_bp = Blueprint('login', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        return f(*args, **kwargs)
    return decorated_function

def get_user_id():
    return get_jwt_identity()

@login_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = get_user_by_email(email)
        
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        if not check_password_hash(user.password, password):
            return jsonify({'error': 'Invalid password'}), 401
            
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'nom': user.nom,
                'prenom': user.prenom,
                'type': user.type,
                'profile_image': user.profile_image,
                'avatar_url': user.avatar_url,
                'is_invited': user.is_invited,
                'invitation_status': user.invitation_status
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@login_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email requis'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erreur de connexion à la base de données'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user:
            # Générer un token de réinitialisation
            reset_token = User.generate_reset_token()
            cursor.execute("""
                UPDATE users 
                SET reset_token = %s, reset_token_expires = NOW() + INTERVAL '1 hour'
                WHERE id = %s
            """, (reset_token, user[0]))
            conn.commit()

            # Envoyer l'email
            reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
            msg = Message(
                'Réinitialisation de mot de passe',
                sender=os.getenv('MAIL_USERNAME'),
                recipients=[email]
            )
            msg.body = f'Cliquez sur ce lien pour réinitialiser votre mot de passe: {reset_link}'
            mail.send(msg)

            return jsonify({'message': 'Instructions envoyées par email'})
        else:
            return jsonify({'error': 'Email non trouvé'}), 404

    except Exception as e:
        print(f"Erreur lors de la réinitialisation du mot de passe: {str(e)}")
        return jsonify({'error': 'Erreur lors de la réinitialisation du mot de passe'}), 500
    finally:
        cursor.close()
        conn.close()

@login_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({'error': 'Token et nouveau mot de passe requis'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Erreur de connexion à la base de données'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id FROM users 
            WHERE reset_token = %s 
            AND reset_token_expires > NOW()
        """, (token,))
        
        user = cursor.fetchone()
        
        if user:
            hashed_password = User.hash_password(new_password)
            cursor.execute("""
                UPDATE users 
                SET password = %s, reset_token = NULL, reset_token_expires = NULL
                WHERE id = %s
            """, (hashed_password, user[0]))
            conn.commit()
            
            return jsonify({'message': 'Mot de passe réinitialisé avec succès'})
        else:
            return jsonify({'error': 'Token invalide ou expiré'}), 400
            
    except Exception as e:
        print(f"Erreur lors de la réinitialisation du mot de passe: {str(e)}")
        return jsonify({'error': 'Erreur lors de la réinitialisation du mot de passe'}), 500
    finally:
        cursor.close()
        conn.close()

@login_bp.route('/auth/google/login', methods=['POST'])
def google_login():
    token_data = request.get_json()
    response, status = google_login_user(token_data)
    return jsonify(response), status

@login_bp.route('/auth/github/login', methods=['POST'])
def github_login():
    token_data = request.get_json()
    response, status = github_login_user(token_data)
    return jsonify(response), status
