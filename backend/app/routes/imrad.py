from flask import Blueprint, request, jsonify
from datetime import datetime
from app.utils.database import get_db_connection, execute_query

imrad_bp = Blueprint('imrad_bp', __name__)

@imrad_bp.route('/imrad/<int:project_id>', methods=['POST'])
def create_imrad_steps(project_id):
    data = request.get_json()
    query = """
        INSERT INTO etapes_imrad (
            methodologie_id,
            project_id,
            introduction_context, introduction_objectives, statut_introduction,
            methodes_protocole, methodes_outils, methodes_echantillonnage, methodes_analyse, statut_methodes,
            resultats_bruts, resultats_statistiques, resultats_observations, statut_resultats,
            discussion_interpretation, discussion_comparaison, discussion_limites, discussion_perspectives, statut_discussion
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """
    
    values = (
        2,  # methodologie_id for IMRAD
        project_id,
        data.get('introduction_context'),
        data.get('introduction_objectives'),
        data.get('statut_introduction', 'en attente'),
        data.get('methodes_protocole'),
        data.get('methodes_outils'),
        data.get('methodes_echantillonnage'),
        data.get('methodes_analyse'),
        data.get('statut_methodes', 'en attente'),
        data.get('resultats_bruts'),
        data.get('resultats_statistiques'),
        data.get('resultats_observations'),
        data.get('statut_resultats', 'en attente'),
        data.get('discussion_interpretation'),
        data.get('discussion_comparaison'),
        data.get('discussion_limites'),
        data.get('discussion_perspectives'),
        data.get('statut_discussion', 'en attente')
    )
    
    result = execute_query(query, values, fetch_one=True)
    if result:
        return jsonify({'message': 'IMRAD steps created successfully', 'id': result[0]}), 201
    return jsonify({'message': 'Failed to create IMRAD steps'}), 400

@imrad_bp.route('/imrad/<int:project_id>', methods=['GET'])
def get_imrad_steps(project_id):
    query = """
        SELECT * FROM etapes_imrad 
        WHERE project_id = %s

    """
    steps = execute_query(query, (project_id,), fetch_one=True)
    
    if steps:
        return jsonify({
            'introduction': {
                'context': steps[2],
                'objectives': steps[3],
                'statut': steps[4],
                'date_completion': steps[5]
            },
            'methodes': {
                'protocole': steps[6],
                'outils': steps[7],
                'echantillonnage': steps[8],
                'analyse': steps[9],
                'statut': steps[10],
                'date_completion': steps[11]
            },
            'resultats': {
                'bruts': steps[12],
                'statistiques': steps[13],
                'observations': steps[14],
                'statut': steps[15],
                'date_completion': steps[16]
            },
            'discussion': {
                'interpretation': steps[17],
                'comparaison': steps[18],
                'limites': steps[19],
                'perspectives': steps[20],
                'statut': steps[21],
                'date_completion': steps[22]
            }
        }), 200
    return jsonify({'message': 'No IMRAD steps found for this project'}), 404

# @imrad_bp.route('/imrad/<int:project_id>', methods=['PUT'])
# def update_imrad_steps(project_id):
#     data = request.get_json()
#     query = """
#         UPDATE etapes_imrad SET
#             introduction_context = %s,
#             introduction_objectives = %s,
#             statut_introduction = %s,
#             methodes_protocole = %s,
#             methodes_outils = %s,
#             methodes_echantillonnage = %s,
#             methodes_analyse = %s,
#             statut_methodes = %s,
#             resultats_bruts = %s,
#             resultats_statistiques = %s,
#             resultats_observations = %s,
#             statut_resultats = %s,
#             discussion_interpretation = %s,
#             discussion_comparaison = %s,
#             discussion_limites = %s,
#             discussion_perspectives = %s,
#             statut_discussion = %s,
#             date_modification = CURRENT_TIMESTAMP
#         WHERE project_id = %s
#         RETURNING id
#     """
#     values = (
#         data.get('introduction_context'),
#         data.get('introduction_objectives'),
#         data.get('statut_introduction'),
#         data.get('methodes_protocole'),
#         data.get('methodes_outils'),
#         data.get('methodes_echantillonnage'),
#         data.get('methodes_analyse'),
#         data.get('statut_methodes'),
#         data.get('resultats_bruts'),
#         data.get('resultats_statistiques'),
#         data.get('resultats_observations'),
#         data.get('statut_resultats'),
#         data.get('discussion_interpretation'),
#         data.get('discussion_comparaison'),
#         data.get('discussion_limites'),
#         data.get('discussion_perspectives'),
#         data.get('statut_discussion'),
#         project_id
#     )
    
#     result = execute_query(query, values, fetch_one=True)
#     if result:
#         return jsonify({'message': 'IMRAD steps updated successfully'}), 200
#     return jsonify({'message': 'Failed to update IMRAD steps'}), 400
@imrad_bp.route('/imrad/<int:project_id>', methods=['PUT'])
def update_imrad_steps(project_id):
    data = request.get_json()
    
    # Get current data to check for status changes
    current_data_query = "SELECT statut_introduction, statut_methodes, statut_resultats, statut_discussion FROM etapes_imrad WHERE project_id = %s"
    current_data = execute_query(current_data_query, (project_id,), fetch_one=True)
    
    # Check if current data exists
    if not current_data:
        return jsonify({'message': 'No IMRAD steps found for this project'}), 404
    
    # Prepare date completion fields
    date_fields = []
    date_values = []
    
    # Check introduction status
    if data.get('statut_introduction') == 'terminé' and current_data[0] != 'terminé':
        date_fields.append("date_completion_introduction = CURRENT_TIMESTAMP")
    
    # Check methodes status
    if data.get('statut_methodes') == 'terminé' and current_data[1] != 'terminé':
        date_fields.append("date_completion_methodes = CURRENT_TIMESTAMP")
    
    # Check resultats status
    if data.get('statut_resultats') == 'terminé' and current_data[2] != 'terminé':
        date_fields.append("date_completion_resultats = CURRENT_TIMESTAMP")
    
    # Check discussion status
    if data.get('statut_discussion') == 'terminé' and current_data[3] != 'terminé':
        date_fields.append("date_completion_discussion = CURRENT_TIMESTAMP")
    
    # Build the query with conditional date updates
    date_fields_str = ", ".join(date_fields)
    date_fields_str = f", {date_fields_str}" if date_fields_str else ""
    
    query = f"""
        UPDATE etapes_imrad SET
            introduction_context = %s,
            introduction_objectives = %s,
            statut_introduction = %s,
            methodes_protocole = %s,
            methodes_outils = %s,
            methodes_echantillonnage = %s,
            methodes_analyse = %s,
            statut_methodes = %s,
            resultats_bruts = %s,
            resultats_statistiques = %s,
            resultats_observations = %s,
            statut_resultats = %s,
            discussion_interpretation = %s,
            discussion_comparaison = %s,
            discussion_limites = %s,
            discussion_perspectives = %s,
            statut_discussion = %s,
            date_modification = CURRENT_TIMESTAMP{date_fields_str}
        WHERE project_id = %s
        RETURNING id
    """
    
    values = (
        data.get('introduction_context'),
        data.get('introduction_objectives'),
        data.get('statut_introduction'),
        data.get('methodes_protocole'),
        data.get('methodes_outils'),
        data.get('methodes_echantillonnage'),
        data.get('methodes_analyse'),
        data.get('statut_methodes'),
        data.get('resultats_bruts'),
        data.get('resultats_statistiques'),
        data.get('resultats_observations'),
        data.get('statut_resultats'),
        data.get('discussion_interpretation'),
        data.get('discussion_comparaison'),
        data.get('discussion_limites'),
        data.get('discussion_perspectives'),
        data.get('statut_discussion'),
        project_id
    )
    
    result = execute_query(query, values, fetch_one=True)
    if result:
        return jsonify({'message': 'IMRAD steps updated successfully'}), 200
    return jsonify({'message': 'Failed to update IMRAD steps'}), 400

@imrad_bp.route('/imrad/<int:project_id>', methods=['DELETE'])
def delete_imrad_steps(project_id):
    query = """
        DELETE FROM etapes_imrad
        WHERE project_id = %s
        RETURNING id
    """
    result = execute_query(query, (project_id,), fetch_one=True)
    
    if result:
        return jsonify({'message': 'IMRAD steps deleted successfully'}), 200
    return jsonify({'message': 'No IMRAD steps found to delete'}), 404
