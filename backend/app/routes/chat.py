from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.controllers.chat_controller import (
    get_user_conversations,
    get_conversation_messages,
    create_message,
    start_conversation,
    get_project_collaborators
)

chat_bp = Blueprint('chat', __name__)

@chat_bp.before_request
def before_request():
    verify_jwt_in_request()

@chat_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401
            
        conversations = get_user_conversations(user_id)
        return jsonify(conversations)
    except Exception as e:
        print(f"Error in get_conversations: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@chat_bp.route('/messages/<int:conversation_id>', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    try:
        user_id = get_jwt_identity()
        messages = get_conversation_messages(conversation_id, user_id)
        if messages is None:
            return jsonify({'error': 'Access denied'}), 403
        return jsonify(messages)
    except Exception as e:
        print(f"Error in get_messages: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@chat_bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'conversation_id' not in data or 'content' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        message = create_message(data['conversation_id'], user_id, data['content'])
        if message is None:
            return jsonify({'error': 'Access denied'}), 403
        return jsonify(message)
    except Exception as e:
        print(f"Error in send_message: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@chat_bp.route('/conversation', methods=['POST'])
@jwt_required()
def create_conversation():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'user_id' not in data or 'project_id' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    result = start_conversation(user_id, data['user_id'], data['project_id'])
    if result is None:
        return jsonify({'error': 'Failed to create conversation'}), 500
    return jsonify(result)

@chat_bp.route('/collaborators', methods=['GET'])
@jwt_required()
def get_collaborators():
    try:
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401
            
        collaborators = get_project_collaborators(user_id)
        return jsonify(collaborators)
    except Exception as e:
        print(f"Error in get_collaborators: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500 