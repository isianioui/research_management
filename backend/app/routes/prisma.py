from flask import Blueprint, request, jsonify
from app.controllers.prisma_controller import create_prisma_steps, get_prisma_steps, delete_prisma_steps, update_prisma_steps

prisma_bp = Blueprint('prisma_bp', __name__)

@prisma_bp.route('/prisma/<int:project_id>', methods=['POST'])
def create_prisma_steps_route(project_id):
    data = request.get_json()
    result = create_prisma_steps(project_id, data)
    if result:
        return jsonify({'message': 'PRISMA steps created successfully', 'id': result[0]}), 201
    return jsonify({'message': 'Failed to create PRISMA steps'}), 400

@prisma_bp.route('/prisma/<int:project_id>', methods=['GET'])
def get_prisma_steps_route(project_id):
    steps = get_prisma_steps(project_id)
    if steps:
        return jsonify({
            'identification': {
                'sources': steps[3],
                'resultats': steps[4],
                'statut': steps[5],
                'date_completion': steps[6]
            },
            'elimination_doublons': {
                'nombre': steps[7],
                'outils': steps[8],
                'statut': steps[9],
                'date_completion': steps[10]
            },
            'selection': {
                'criteres': steps[11],
                'exclusions_titres_resumes': steps[12],
                'exclusions_texte_integral': steps[13],
                'statut': steps[14],
                'date_completion': steps[15]
            },
            'evaluation_qualite': {
                'outils': steps[16],
                'scores': steps[17],
                'limites': steps[18],
                'statut': steps[19],
                'date_completion': steps[20]
            },
            'extraction_donnees': {
                'descriptives': steps[21],
                'methodologiques': steps[22],
                'resultats': steps[23],
                'statut': steps[24],
                'date_completion': steps[25]
            },
            'synthese_resultats': {
                'qualitatifs': steps[26],
                'quantitatifs': steps[27],
                'tableaux_graphiques': steps[28],
                'statut': steps[29],
                'date_completion': steps[30]
            },
            'discussion': {
                'interpretation': steps[31],
                'comparaison': steps[32],
                'limites': steps[33],
                'recommandations': steps[34],
                'statut': steps[35],
                'date_completion': steps[36]
            },
            'redaction': {
                'diagramme_prisma': steps[37],
                'tableaux_resumes': steps[38],
                'rapport_final': steps[39],
                'statut': steps[40],
                'date_completion': steps[41]
            }
        }), 200
    return jsonify({'message': 'No PRISMA steps found for this project'}), 404

@prisma_bp.route('/prisma/<int:project_id>', methods=['DELETE'])
def delete_prisma_steps_route(project_id):
    result = delete_prisma_steps(project_id)
    if result:
        return jsonify({'message': 'PRISMA steps deleted successfully'}), 200
    return jsonify({'message': 'PRISMA steps not found'}), 404

@prisma_bp.route('/prisma/<int:project_id>', methods=['PUT'])
def update_prisma_steps_route(project_id):
    data = request.get_json()
    result = update_prisma_steps(project_id, data)
    if result:
        return jsonify({'message': 'PRISMA steps updated successfully'}), 200
    return jsonify({'message': 'Failed to update PRISMA steps'}), 400
