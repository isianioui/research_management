from flask import Blueprint
from app.controllers.document_controller import create_document, get_document, delete_document, get_documents

document_bp = Blueprint('document', __name__)

@document_bp.route('/documents', methods=['POST'])
def upload_document():
    return create_document()

@document_bp.route('/documents/<int:id>', methods=['GET'])
def fetch_document(id):
    return get_document(id)

@document_bp.route('/documents/<int:id>', methods=['DELETE'])
def remove_document(id):
    return delete_document(id)

@document_bp.route('/documents', methods=['GET'])
def list_documents():
    return get_documents()
