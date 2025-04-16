from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from app.utils.database import get_db_connection, execute_query
from app.controllers.collaborateur_controller import update_user_profile

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

# Configuration pour le stockage des images
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads/profile_images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Créer le dossier d'upload s'il n'existe pas
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        
        data = {}
        if request.form:
            data['nom'] = request.form.get('nom')
            data['prenom'] = request.form.get('prenom')
        
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_extension = filename.rsplit('.', 1)[1].lower()
                new_filename = f"profile_{user_id}.{file_extension}"
                
                # Ensure upload directory exists
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                
                # Save file
                file_path = os.path.join(UPLOAD_FOLDER, new_filename)
                file.save(file_path)
                
                # Store just the filename
                data['profile_image'] = new_filename
                
                print(f"Image saved to: {file_path}")
                print(f"Image filename stored: {new_filename}")
        
        response, status_code = update_user_profile(user_id, data)
        print("Response to client:", response)  # Debug log
        return jsonify(response), status_code
        
    except Exception as e:
        print(f"Error in update_profile route: {str(e)}")
        return jsonify({'message': str(e)}), 500

@users_bp.route('/password', methods=['PUT'])
@jwt_required()
def update_password():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        print("Received data:", {
            "is_invited_user": data.get('is_invited_user'),
            "has_new_password": bool(data.get('new_password'))
        })

        # Get user data from database
        query = """
            SELECT password, is_invited, invitation_status, type
            FROM users 
            WHERE id = %s
        """
        result = execute_query(query, (current_user_id,), fetch_one=True)
        print("Database result:", result)  # Debug log
        
        if not result:
            return jsonify({"message": "Utilisateur non trouvé"}), 404
            
        stored_password, is_invited, invitation_status, user_type = result

        # If frontend indicates this is an invited user, treat it as such
        # regardless of database status
        if data.get('is_invited_user'):
            print("Processing as invited user")  # Debug log
            update_query = """
                UPDATE users 
                SET password = %s,
                    is_invited = FALSE,
                    invitation_status = 'accepted',
                    invitation_accepted_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
            """
            new_password_hash = generate_password_hash(data['new_password'])
            update_result = execute_query(
                update_query, 
                (new_password_hash, current_user_id),
                fetch_one=True
            )
            
            if update_result:
                # Create notification for password change
                notif_query = """
                    INSERT INTO notifications (user_id, type, message)
                    VALUES (%s, 'password_change', 'Votre mot de passe a été mis à jour avec succès')
                """
                execute_query(notif_query, (current_user_id,))
                
                return jsonify({
                    "success": True,
                    "message": "Mot de passe mis à jour avec succès"
                }), 200
        else:
            print("Processing as regular user")  # Debug log
            # For regular users, verify current password
            if not check_password_hash(stored_password, data['current_password']):
                return jsonify({"message": "Mot de passe actuel incorrect"}), 401

            # Update password for regular user
            update_query = """
                UPDATE users 
                SET password = %s
                WHERE id = %s
                RETURNING id
            """
            new_password_hash = generate_password_hash(data['new_password'])
            update_result = execute_query(
                update_query, 
                (new_password_hash, current_user_id),
                fetch_one=True
            )
            
            if update_result:
                return jsonify({
                    "success": True,
                    "message": "Mot de passe mis à jour avec succès"
                }), 200

        return jsonify({"message": "Erreur lors de la mise à jour du mot de passe"}), 500

    except Exception as e:
        print(f"Error updating password: {str(e)}")
        return jsonify({
            "message": f"Erreur lors de la mise à jour du mot de passe: {str(e)}"
        }), 500

@users_bp.route('/profile', methods=['GET', 'OPTIONS'])
@cross_origin(origins=["http://localhost:5173"], 
             methods=['GET', 'OPTIONS'], 
             allow_headers=['Content-Type', 'Authorization'])
@jwt_required()
def get_profile():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"Récupération du profil pour l'utilisateur {current_user_id}")  # Debug log
        
        if not current_user_id:
            return jsonify({"message": "ID utilisateur non trouvé dans le token"}), 401

        conn = get_db_connection()
        if not conn:
            return jsonify({"message": "Erreur de connexion à la base de données"}), 500

        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT id, nom, prenom, email, profile_image, type
                FROM users 
                WHERE id = %s
            """, (current_user_id,))
            
            user = cursor.fetchone()
            print(f"Données utilisateur trouvées: {user}")  # Debug log
            
            if not user:
                return jsonify({"message": "Utilisateur non trouvé"}), 404

            return jsonify({
                "id": user[0],
                "nom": user[1],
                "prenom": user[2],
                "email": user[3],
                "profile_image": user[4],
                "type": user[5]
            }), 200

        except Exception as e:
            print(f"Erreur SQL: {str(e)}")  # Debug log
            return jsonify({"message": f"Erreur lors de la requête: {str(e)}"}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Erreur générale: {str(e)}")  # Debug log
        return jsonify({"message": f"Erreur: {str(e)}"}), 500 
    
@users_bp.route('/test', methods=['GET'])
@jwt_required()
def test_auth():
    current_user_id = get_jwt_identity()
    return jsonify({"message": "Authentication successful", "user_id": current_user_id}), 200

@users_bp.route('/profile-image/<filename>')
def get_profile_image(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        print(f"Error serving image: {str(e)}")
        return jsonify({'message': 'Image not found'}), 404
