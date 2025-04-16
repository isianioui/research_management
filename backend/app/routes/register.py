from flask import Blueprint, request, jsonify
from app.controllers.auth_controller import google_register, register_user, github_register

register_bp = Blueprint('register', __name__)

@register_bp.route('/auth/google', methods=['POST'])
def google_auth():
    token_data = request.get_json()
    response, status = google_register(token_data)
    return jsonify(response), status

@register_bp.route('/auth/github', methods=['POST'])
def github_auth():
    token_data = request.get_json()
    response, status = github_register(token_data)
    return jsonify(response), status

@register_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'nom', 'prenom']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        print("Received registration data:", data)
        response, status = register_user(data)
        
        if status != 200:
            return jsonify({'error': response.get('error', 'Registration failed')}), status
            
        return jsonify(response), status
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': str(e)}), 500
