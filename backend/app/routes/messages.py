from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.message_controller import (
    get_user_conversations,
    get_conversation_messages,
    create_or_get_conversation,
    send_message
)

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def list_conversations():
    user_id = get_jwt_identity()
    conversations = get_user_conversations(user_id)
    return jsonify({'conversations': conversations}), 200

@messages_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    user_id = get_jwt_identity()
    messages = get_conversation_messages(conversation_id, user_id)
    return jsonify({'messages': messages}), 200

@messages_bp.route('/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    user_id = get_jwt_identity()
    data = request.json
    project_id = data['project_id']
    user_ids = data['user_ids']
    
    if user_id not in user_ids:
        user_ids.append(user_id)
    
    conversation_id = create_or_get_conversation(project_id, user_ids)
    return jsonify({'conversation_id': conversation_id}), 201

@messages_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@jwt_required()
def create_message(conversation_id):
    user_id = get_jwt_identity()
    data = request.json
    message = send_message(conversation_id, user_id, data['content'])
    return jsonify({'message': message}), 201 