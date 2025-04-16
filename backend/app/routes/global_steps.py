from flask import Blueprint, request, jsonify
from app.controllers.global_controller import create_global_steps, get_global_steps, delete_global_steps, update_global_steps

global_bp = Blueprint('global_bp', __name__)

@global_bp.route('/global/<int:project_id>', methods=['POST'])
def create_global_steps_route(project_id):
    data = request.get_json()
    result = create_global_steps(project_id, data)
    if result:
        return jsonify({'message': 'Global steps created successfully', 'id': result[0]}), 201
    return jsonify({'message': 'Failed to create global steps'}), 400

@global_bp.route('/global/<int:project_id>', methods=['GET'])
def get_global_steps_route(project_id):
    steps = get_global_steps(project_id)
    if steps:
        return jsonify({
            'idee': {
                'contenu': steps[3],
                'statut': steps[4],
                'date_completion': steps[5]
            },
            'problematique': {
                'contenu': steps[6],
                'statut': steps[7],
                'date_completion': steps[8]
            },
            'mots_cles': {
                'contenu': steps[9],
                'statut': steps[10],
                'date_completion': steps[11]
            },
            'revue_litterature': {
                'contenu': steps[12],
                'statut': steps[13],
                'date_completion': steps[14],
                'sources': steps[15]
            },
            'research_gap': {
                'contenu': steps[16],
                'statut': steps[17],
                'date_completion': steps[18]
            },
            'solution': {
                'contenu': steps[19],
                'statut': steps[20],
                'date_completion': steps[21]
            },
            'evaluation': {
                'contenu': steps[22],
                'statut': steps[23],
                'date_completion': steps[24]
            },
            'redaction': {
                'contenu': steps[25],
                'statut': steps[26],
                'date_completion': steps[27],
                'lien_docs': steps[28]
            },
            'soumission': {
                'contenu': steps[29],
                'statut': steps[30],
                'date': steps[31],
                'journal': steps[32],
                'commentaires': steps[33]
            }
        }), 200
    return jsonify({'message': 'No global steps found for this project'}), 404

@global_bp.route('/global/<int:project_id>', methods=['DELETE'])
def delete_global_steps_route(project_id):
    result = delete_global_steps(project_id)
    if result:
        return jsonify({'message': 'Global steps deleted successfully'}), 200
    return jsonify({'message': 'Global steps not found'}), 404


@global_bp.route('/global/<int:project_id>', methods=['PUT'])
def update_global_steps_route(project_id):
    data = request.get_json()
    result = update_global_steps(project_id, data)
    if result:
        return jsonify({'message': 'Global steps updated successfully'}), 200
    return jsonify({'message': 'Failed to update global steps'}), 400

