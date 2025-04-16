from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash
from app.utils.database import execute_query

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                "message": "Email et mot de passe requis"
            }), 400

        # Get user from database
        query = """
            SELECT id, email, password, nom, prenom, type, profile_image, 
                   is_invited, invitation_status
            FROM users 
            WHERE email = %s
        """
        user = execute_query(query, (email,), fetch_one=True)

        if user and check_password_hash(user[2], password):
            # Create access token
            access_token = create_access_token(identity=user[0])
            
            # Update last login
            update_query = """
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP 
                WHERE id = %s
            """
            execute_query(update_query, (user[0],))

            return jsonify({
                "message": "Login successful",
                "token": access_token,
                "user": {
                    "id": user[0],
                    "email": user[1],
                    "nom": user[3],
                    "prenom": user[4],
                    "type": user[5],
                    "profile_image": user[6],
                    "is_invited": user[7],
                    "invitation_status": user[8]
                }
            }), 200
        else:
            return jsonify({
                "message": "Email ou mot de passe incorrect"
            }), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({
            "message": "Une erreur est survenue lors de la connexion"
        }), 500 