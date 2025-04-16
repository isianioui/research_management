from flask_mail import Message
from secrets import token_urlsafe
from flask import Blueprint, request, jsonify, current_app
from flask_cors import CORS, cross_origin
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app.utils.email_utils import mail
from app.utils.email_utils import send_email
from werkzeug.security import generate_password_hash, check_password_hash
from urllib.parse import urlencode, unquote

from app.controllers.collaborateur_controller import (
    get_collaborateur,
    get_project_collaborateurs,
    add_collaborateur,
    update_collaborateur_status,
    remove_collaborateur
)
from app.utils.database import get_db_connection
from app.config import mail

collaborateur_bp = Blueprint('collaborateur', __name__, url_prefix='/api/collaborateurs')

# Simplify CORS configuration
CORS(collaborateur_bp, 
     origins=["http://localhost:5173"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Accept"])

def handle_options_request():
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200

@collaborateur_bp.route('/<int:collaborateur_id>', methods=['GET'])
def get_single_collaborateur(collaborateur_id):
    response, status_code = get_collaborateur(collaborateur_id)
    return jsonify(response), status_code

@collaborateur_bp.route('/project/<int:project_id>', methods=['GET'])
def list_project_collaborateurs(project_id):
    response, status_code = get_project_collaborateurs(project_id)
    return jsonify(response), status_code

@collaborateur_bp.route('/add', methods=['POST', 'OPTIONS'])
@cross_origin(origins=["http://localhost:5173"],
             methods=['POST', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization', 'Accept'],
             supports_credentials=True)
def create_collaborateur():
    if request.method == 'OPTIONS':
        return handle_options_request()

    try:
        data = request.get_json()
        print("\n=== Creating Collaborateur ===")
        print(f"Recipient email: {data['email']}")
        
        response, status_code = add_collaborateur(data['project_id'], data)
        
        if status_code == 201:
            try:
                invitation_link = f"http://localhost:5173/auth?{urlencode({
                    'email': data['email'],
                    'temp_password': response['temp_password']
                })}"
                
                email_body = f"""
                Vous avez été invité à collaborer sur un projet.
                
                Email: {data['email']}
                Mot de passe temporaire: {response['temp_password']}
                
                Utilisez ces informations pour vous connecter: {invitation_link}
                """
                
                email_html = f'''
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2>Invitation à collaborer</h2>
                        <p>Voici vos informations de connexion :</p>
                        <ul>
                            <li>Email : {data['email']}</li>
                            <li>Mot de passe temporaire : {response['temp_password']}</li>
                        </ul>
                        <p>Cliquez sur le lien ci-dessous pour vous connecter :</p>
                        <a href="{invitation_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
                            Se connecter
                        </a>
                    </div>
                '''
                
                print("\n=== Sending Email ===")
                email_sent = send_email(
                    to=data['email'],
                    subject="Invitation à collaborer",
                    body=email_body,
                    html=email_html
                )
                
                response['email_sent'] = email_sent
                print(f"Email sending {'successful' if email_sent else 'failed'}")
                
            except Exception as email_error:
                print(f"\nError sending invitation email: {str(email_error)}")
                response['email_sent'] = False
        
        return jsonify(response), status_code
            
    except Exception as e:
        print(f"Error in create_collaborateur: {str(e)}")
        return jsonify({"message": f"Erreur: {str(e)}"}), 500

@collaborateur_bp.route('/<int:collaborateur_id>/status', methods=['PUT'])
def update_status(collaborateur_id):
    data = request.json
    response, status_code = update_collaborateur_status(
        collaborateur_id,
        data['status']
    )
    return jsonify(response), status_code

@collaborateur_bp.route('/<int:collaborateur_id>', methods=['DELETE'])
def delete_collaborateur(collaborateur_id):
    response, status_code = remove_collaborateur(collaborateur_id)
    return jsonify(response), status_code

@collaborateur_bp.route('/update-invited-user', methods=['PUT'])
@cross_origin()
@jwt_required()
def update_invited_user():
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        if not all(key in data for key in ['nom', 'prenom', 'password']):
            return jsonify({"message": "Tous les champs sont requis"}), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"message": "Erreur de connexion à la base de données"}), 500
            
        cursor = conn.cursor()
        
        try:
            # Vérifier si l'utilisateur est un utilisateur invité
            cursor.execute("""
                SELECT id, type FROM users 
                WHERE id = %s AND nom = 'Invité' AND prenom = 'Temporaire'
            """, (current_user_id,))
            
            user = cursor.fetchone()
            if not user:
                return jsonify({"message": "Utilisateur non trouvé ou non invité"}), 404
                
            # Mettre à jour les informations de l'utilisateur
            hashed_password = generate_password_hash(data['password'])
            cursor.execute("""
                UPDATE users 
                SET nom = %s, prenom = %s, password = %s
                WHERE id = %s
            """, (data['nom'], data['prenom'], hashed_password, current_user_id))
            
            conn.commit()
            return jsonify({"message": "Informations mises à jour avec succès"}), 200
            
        except Exception as e:
            conn.rollback()
            return jsonify({"message": f"Erreur lors de la mise à jour: {str(e)}"}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({"message": f"Erreur: {str(e)}"}), 500

@collaborateur_bp.route('/invited-user-info/<string:email>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_invited_user_info(email):
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, nom, prenom, email, password, type 
                FROM users 
                WHERE id = %s AND email = %s AND nom = 'Invité' AND prenom = 'Temporaire'
            """, (current_user_id, email))
            
            user = cursor.fetchone()
            if not user:
                return jsonify({"message": "Utilisateur invité non trouvé"}), 404
                
            return jsonify({
                "id": user[0],
                "nom": user[1],
                "prenom": user[2],
                "email": user[3],
                "temp_password": user[4],  # Include the temporary password
                "type": user[5]
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({"message": f"Erreur: {str(e)}"}), 500

@collaborateur_bp.route('/login-invited-user', methods=['POST', 'OPTIONS'])
@cross_origin(origins=["http://localhost:5173"],
             methods=['POST', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization', 'Accept'],
             supports_credentials=True)
def login_invited_user():
    if request.method == 'OPTIONS':
        return handle_options_request()

    try:
        data = request.get_json()
        print("Received login data:", {
            'email': data.get('email'),
            'password': data.get('password')
        })
        
        if not all(key in data for key in ['email', 'password']):
            return jsonify({"message": "Email et mot de passe requis"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # First, get the temporary password from project_collaborators
            cursor.execute("""
                SELECT pc.temp_password, u.id, u.nom, u.prenom, u.type
                FROM users u
                JOIN project_collaborators pc ON u.id = pc.user_id
                WHERE u.email = %s AND u.nom = 'Invité' AND u.prenom = 'Temporaire'
                AND pc.temp_password IS NOT NULL
                LIMIT 1
            """, (data['email'],))
            
            result = cursor.fetchone()
            print("Found user with temp password:", result)
            
            if not result:
                return jsonify({"message": "Utilisateur non trouvé ou mot de passe temporaire invalide"}), 404
            
            temp_password, user_id, nom, prenom, user_type = result
            
            # Compare the provided password with the stored temporary password
            if data['password'] == temp_password:
                print("Login successful")
                access_token = create_access_token(identity=user_id)
                
                return jsonify({
                    "message": "Connexion réussie",
                    "user": {
                        "id": user_id,
                        "nom": nom,
                        "prenom": prenom,
                        "email": data['email'],
                        "type": user_type,
                        "is_invited": True
                    },
                    "access_token": access_token
                }), 200
            else:
                print("Password mismatch")
                print(f"Received: {data['password']}")
                print(f"Stored temp password: {temp_password}")
                return jsonify({"message": "Mot de passe temporaire incorrect"}), 401
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error in login_invited_user: {str(e)}")
        return jsonify({"message": f"Erreur: {str(e)}"}), 500

@collaborateur_bp.route('/verify-password', methods=['POST'])
@jwt_required()
def verify_password():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT password FROM users WHERE id = %s", (current_user_id,))
        user = cursor.fetchone()
        
        if user and check_password_hash(user[0], data['password']):
            return jsonify({"valid": True}), 200
        return jsonify({"valid": False}), 401
        
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

def create_success_response(user, email, access_token):
    return jsonify({
        "message": "Connexion réussie",
        "user": {
            "id": user[0],
            "nom": user[2],
            "prenom": user[3],
            "email": email,
            "type": user[4]
        },
        "access_token": access_token
    }), 200
