from flask import Blueprint, request, jsonify
from app.models.contact import Contact
from app.utils.email_utils import send_contact_notification

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/contact', methods=['POST'])
def submit_contact():
    data = request.get_json()
    
    try:
        Contact.create(
            name=data['name'],
            email=data['email'],
            message=data['message']
        )
        send_contact_notification(data)
        return jsonify({'message': 'Message sent successfully'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400
