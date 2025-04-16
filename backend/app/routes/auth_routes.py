from flask import app, jsonify, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.user_controller import get_user_by_id

@app.route('/api/user/me', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_current_user():
    if request.method == 'OPTIONS':
        # Handle CORS preflight request
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
        
    current_user_id = get_jwt_identity()
    user = get_user_by_id(current_user_id)
    
    if user:
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'nom': user.nom,
                'prenom': user.prenom,
                'type': user.type,
                'avatar_url': user.avatar_url,
                'profile_image': user.profile_image,
                'is_invited': user.is_invited
            }
        }), 200
    
    return jsonify({'message': 'User not found'}), 404 