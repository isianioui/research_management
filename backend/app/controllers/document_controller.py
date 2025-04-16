from flask import Blueprint, request, jsonify
from app.models.document import Document
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from app.utils.database import execute_query

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

document_bp = Blueprint('document', __name__)

@document_bp.route('/documents', methods=['POST'])
def create_document():
    try:
        data = request.form
        file = request.files['file']
        
        # Get required fields with proper error handling
        project_id = data.get('projectId')
        user_id = data.get('userId')  # Make sure this is sent from frontend
        methodology = data.get('methodology')
        
        if not all([project_id, user_id, methodology, file]):
            return jsonify({
                'error': 'Missing required fields',
                'message': 'Project ID, user ID, methodology, and file are required'
            }), 400
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        query = """
            INSERT INTO documents (project_id, user_id, nom_fichier, chemin_fichier, type, date_upload)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        params = (
            project_id,
            user_id,
            filename,
            filepath,
            methodology,
            datetime.now()
        )
        
        result = execute_query(query, params)
        return jsonify({
            'message': 'Document created successfully',
            'document_id': result[0] if result else None
        })
        
    except Exception as e:
        print(f"Error creating document: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@document_bp.route('/documents/<int:id>', methods=['GET'])
def get_document(id):
    query = "SELECT * FROM documents WHERE id = %s"
    document = execute_query(query, (id,), fetch_one=True)
    
    if not document:
        return jsonify({'message': 'Document not found'}), 404
        
    return jsonify({
        'id': document[0],
        'project_id': document[1],
        'nom_fichier': document[2],
        'type': document[3],
        'date_upload': document[4]
    })

@document_bp.route('/documents/<int:id>', methods=['DELETE'])
def delete_document(id):
    query = "SELECT chemin_fichier FROM documents WHERE id = %s"
    document = execute_query(query, (id,), fetch_one=True)
    
    if document:
        os.remove(document[0])
        delete_query = "DELETE FROM documents WHERE id = %s"
        execute_query(delete_query, (id,))
        return jsonify({'message': 'Document deleted successfully'})
    
    return jsonify({'message': 'Document not found'}), 404

@document_bp.route('/documents', methods=['GET'])
def get_documents():
    query = "SELECT * FROM documents"
    documents = execute_query(query, fetch_all=True)
    
    return jsonify([{
        'id': doc[0],
        'project_id': doc[1],
        'nom_fichier': doc[2],
        'type': doc[3],
        'date_upload': doc[4]
    } for doc in documents])
