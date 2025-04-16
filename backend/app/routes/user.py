from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.user_controller import get_user_by_id, update_user_avatar, update_user_social
import os
from werkzeug.utils import secure_filename

user_bp = Blueprint('user', __name__)

@user_bp.route('/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = get_user_by_id(current_user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'user': {
            'id': user.id,
            'email': user.email,
            'nom': user.nom,
            'prenom': user.prenom,
            'avatar_url': user.avatar_url,
            'has_google': bool(user.google_id),
            'has_github': bool(user.github_id),
            'profile_image': user.profile_image
        }
    }), 200

@user_bp.route('/users/<int:user_id>/avatar', methods=['POST'])
@jwt_required()
def update_user_avatar(user_id):
    if 'avatar' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
        
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
        
    if file and allowed_file(file.filename):
        filename = f"user_{user_id}_{secure_filename(file.filename)}"
        
        # Use absolute path for file storage
        upload_folder = os.path.join(os.getcwd(), 'uploads', 'profile_images')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        file_path = os.path.join(upload_folder, filename)
        
        # Save the file
        file.save(file_path)
        
        # Store the relative path in the database
        profile_image_path = f'/uploads/profile_images/{filename}'
        updated_user = update_user_avatar(user_id, profile_image_path)
        
        if updated_user:
            # Verify file exists after saving
            if os.path.exists(file_path):
                print(f"File successfully saved at: {file_path}")
                return jsonify({
                    'message': 'Avatar updated successfully',
                    'profile_image': profile_image_path
                }), 200
            else:
                return jsonify({'message': 'File save failed'}), 500
            
    return jsonify({'message': 'Invalid file type'}), 400

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/user/social', methods=['PUT'])
@jwt_required()
def update_social_connections():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    user = update_user_social(
        current_user_id,
        google_id=data.get('google_id'),
        github_id=data.get('github_id')
    )
    
    if not user:
        return jsonify({'message': 'Failed to update social connections'}), 500
    
    return jsonify({
        'message': 'Social connections updated successfully',
        'user': {
            'id': user.id,
            'has_google': bool(user.google_id),
            'has_github': bool(user.github_id)
        }
    }), 200 