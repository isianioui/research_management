from flask import jsonify
from app.utils.database import execute_query

def create_prisma_steps(project_id, data):
    query = """
        INSERT INTO etapes_prisma (
            methodologie_id, project_id,
            identification_sources, identification_resultats, statut_identification,
            elimination_doublons_nombre, elimination_doublons_outils, statut_elimination_doublons,
            selection_criteres, selection_exclusions_titres_resumes, selection_exclusions_texte_integral, statut_selection,
            evaluation_qualite_outils, evaluation_qualite_scores, evaluation_qualite_limites, statut_evaluation_qualite,
            extraction_donnees_descriptives, extraction_donnees_methodologiques, extraction_donnees_resultats, statut_extraction_donnees,
            synthese_resultats_qualitatifs, synthese_resultats_quantitatifs, synthese_resultats_tableaux_graphiques, statut_synthese_resultats,
            discussion_interpretation, discussion_comparaison, discussion_limites, discussion_recommandations, statut_discussion,
            redaction_diagramme_prisma, redaction_tableaux_resumes, redaction_rapport_final, statut_redaction
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """
    values = (
        3,  # methodologie_id for PRISMA
        project_id,
        data.get('identification_sources'),
        data.get('identification_resultats'),
        data.get('statut_identification', 'en attente'),
        data.get('elimination_doublons_nombre'),
        data.get('elimination_doublons_outils'),
        data.get('statut_elimination_doublons', 'en attente'),
        data.get('selection_criteres'),
        data.get('selection_exclusions_titres_resumes'),
        data.get('selection_exclusions_texte_integral'),
        data.get('statut_selection', 'en attente'),
        data.get('evaluation_qualite_outils'),
        data.get('evaluation_qualite_scores'),
        data.get('evaluation_qualite_limites'),
        data.get('statut_evaluation_qualite', 'en attente'),
        data.get('extraction_donnees_descriptives'),
        data.get('extraction_donnees_methodologiques'),
        data.get('extraction_donnees_resultats'),
        data.get('statut_extraction_donnees', 'en attente'),
        data.get('synthese_resultats_qualitatifs'),
        data.get('synthese_resultats_quantitatifs'),
        data.get('synthese_resultats_tableaux_graphiques'),
        data.get('statut_synthese_resultats', 'en attente'),
        data.get('discussion_interpretation'),
        data.get('discussion_comparaison'),
        data.get('discussion_limites'),
        data.get('discussion_recommandations'),
        data.get('statut_discussion', 'en attente'),
        data.get('redaction_diagramme_prisma'),
        data.get('redaction_tableaux_resumes'),
        data.get('redaction_rapport_final'),
        data.get('statut_redaction', 'en attente')
    )
    return execute_query(query, values, fetch_one=True)

def get_prisma_steps(project_id):
    query = "SELECT * FROM etapes_prisma WHERE project_id = %s"
    return execute_query(query, (project_id,), fetch_one=True)

def delete_prisma_steps(project_id):
    query = "DELETE FROM etapes_prisma WHERE project_id = %s RETURNING id"
    return execute_query(query, (project_id,), fetch_one=True)

# def update_prisma_steps(project_id, data):
#     query = """
#         UPDATE etapes_prisma
#         SET
#             identification_sources = %s,
#             identification_resultats = %s,
#             statut_identification = %s,
#             elimination_doublons_nombre = %s,
#             elimination_doublons_outils = %s,
#             statut_elimination_doublons = %s,
#             selection_criteres = %s,
#             selection_exclusions_titres_resumes = %s,
#             selection_exclusions_texte_integral = %s,
#             statut_selection = %s,
#             evaluation_qualite_outils = %s,
#             evaluation_qualite_scores = %s,
#             evaluation_qualite_limites = %s,
#             statut_evaluation_qualite = %s,
#             extraction_donnees_descriptives = %s,
#             extraction_donnees_methodologiques = %s,
#             extraction_donnees_resultats = %s,
#             statut_extraction_donnees = %s,
#             synthese_resultats_qualitatifs = %s,
#             synthese_resultats_quantitatifs = %s,
#             synthese_resultats_tableaux_graphiques = %s,
#             statut_synthese_resultats = %s,
#             discussion_interpretation = %s,
#             discussion_comparaison = %s,
#             discussion_limites = %s,
#             discussion_recommandations = %s,
#             statut_discussion = %s,
#             redaction_diagramme_prisma = %s,
#             redaction_tableaux_resumes = %s,
#             redaction_rapport_final = %s,
#             statut_redaction = %s
#         WHERE project_id = %s
#         RETURNING id
#     """
#     values = (
#         data.get('identification_sources'),
#         data.get('identification_resultats'),
#         data.get('statut_identification', 'en attente'),
#         data.get('elimination_doublons_nombre'),
#         data.get('elimination_doublons_outils'),
#         data.get('statut_elimination_doublons', 'en attente'),
#         data.get('selection_criteres'),
#         data.get('selection_exclusions_titres_resumes'),
#         data.get('selection_exclusions_texte_integral'),
#         data.get('statut_selection', 'en attente'),
#         data.get('evaluation_qualite_outils'),
#         data.get('evaluation_qualite_scores'),
#         data.get('evaluation_qualite_limites'),
#         data.get('statut_evaluation_qualite', 'en attente'),
#         data.get('extraction_donnees_descriptives'),
#         data.get('extraction_donnees_methodologiques'),
#         data.get('extraction_donnees_resultats'),
#         data.get('statut_extraction_donnees', 'en attente'),
#         data.get('synthese_resultats_qualitatifs'),
#         data.get('synthese_resultats_quantitatifs'),
#         data.get('synthese_resultats_tableaux_graphiques'),
#         data.get('statut_synthese_resultats', 'en attente'),
#         data.get('discussion_interpretation'),
#         data.get('discussion_comparaison'),
#         data.get('discussion_limites'),
#         data.get('discussion_recommandations'),
#         data.get('statut_discussion', 'en attente'),
#         data.get('redaction_diagramme_prisma'),
#         data.get('redaction_tableaux_resumes'),
#         data.get('redaction_rapport_final'),
#         data.get('statut_redaction', 'en attente'),
#         project_id
#     )
#     return execute_query(query, values, fetch_one=True)


def update_prisma_steps(project_id, data):
    # Get current data to check for status changes
    current_data_query = """
        SELECT 
            statut_identification, statut_elimination_doublons, statut_selection, 
            statut_evaluation_qualite, statut_extraction_donnees, statut_synthese_resultats,
            statut_discussion, statut_redaction
        FROM etapes_prisma 
        WHERE project_id = %s
    """
    current_data = execute_query(current_data_query, (project_id,), fetch_one=True)
    
    # Check if current data exists
    if not current_data:
        return None
    
    # Prepare date completion fields
    date_fields = []
    
    # Check each status for changes to "terminé"
    if data.get('statut_identification') == 'terminé' and current_data[0] != 'terminé':
        date_fields.append("date_completion_identification = CURRENT_TIMESTAMP")
    
    if data.get('statut_elimination_doublons') == 'terminé' and current_data[1] != 'terminé':
        date_fields.append("date_completion_elimination_doublons = CURRENT_TIMESTAMP")
    
    if data.get('statut_selection') == 'terminé' and current_data[2] != 'terminé':
        date_fields.append("date_completion_selection = CURRENT_TIMESTAMP")
    
    if data.get('statut_evaluation_qualite') == 'terminé' and current_data[3] != 'terminé':
        date_fields.append("date_completion_evaluation_qualite = CURRENT_TIMESTAMP")
    
    if data.get('statut_extraction_donnees') == 'terminé' and current_data[4] != 'terminé':
        date_fields.append("date_completion_extraction_donnees = CURRENT_TIMESTAMP")
    
    if data.get('statut_synthese_resultats') == 'terminé' and current_data[5] != 'terminé':
        date_fields.append("date_completion_synthese_resultats = CURRENT_TIMESTAMP")
    
    if data.get('statut_discussion') == 'terminé' and current_data[6] != 'terminé':
        date_fields.append("date_completion_discussion = CURRENT_TIMESTAMP")
    
    if data.get('statut_redaction') == 'terminé' and current_data[7] != 'terminé':
        date_fields.append("date_completion_redaction = CURRENT_TIMESTAMP")
    
    # Build the query with conditional date updates
    date_fields_str = ", ".join(date_fields)
    date_fields_str = f", {date_fields_str}" if date_fields_str else ""
    
    query = f"""
        UPDATE etapes_prisma
        SET
            identification_sources = %s,
            identification_resultats = %s,
            statut_identification = %s,
            elimination_doublons_nombre = %s,
            elimination_doublons_outils = %s,
            statut_elimination_doublons = %s,
            selection_criteres = %s,
            selection_exclusions_titres_resumes = %s,
            selection_exclusions_texte_integral = %s,
            statut_selection = %s,
            evaluation_qualite_outils = %s,
            evaluation_qualite_scores = %s,
            evaluation_qualite_limites = %s,
            statut_evaluation_qualite = %s,
            extraction_donnees_descriptives = %s,
            extraction_donnees_methodologiques = %s,
            extraction_donnees_resultats = %s,
            statut_extraction_donnees = %s,
            synthese_resultats_qualitatifs = %s,
            synthese_resultats_quantitatifs = %s,
            synthese_resultats_tableaux_graphiques = %s,
            statut_synthese_resultats = %s,
            discussion_interpretation = %s,
            discussion_comparaison = %s,
            discussion_limites = %s,
            discussion_recommandations = %s,
            statut_discussion = %s,
            redaction_diagramme_prisma = %s,
            redaction_tableaux_resumes = %s,
            redaction_rapport_final = %s,
            statut_redaction = %s,
            date_modification = CURRENT_TIMESTAMP{date_fields_str}
        WHERE project_id = %s
        RETURNING id
    """

    values = (
        data.get('identification_sources'),
        data.get('identification_resultats'),
        data.get('statut_identification', 'en attente'),
        data.get('elimination_doublons_nombre'),
        data.get('elimination_doublons_outils'),
        data.get('statut_elimination_doublons', 'en attente'),
        data.get('selection_criteres'),
        data.get('selection_exclusions_titres_resumes'),
        data.get('selection_exclusions_texte_integral'),
        data.get('statut_selection', 'en attente'),
        data.get('evaluation_qualite_outils'),
        data.get('evaluation_qualite_scores'),
        data.get('evaluation_qualite_limites'),
        data.get('statut_evaluation_qualite', 'en attente'),
        data.get('extraction_donnees_descriptives'),
        data.get('extraction_donnees_methodologiques'),
        data.get('extraction_donnees_resultats'),
        data.get('statut_extraction_donnees', 'en attente'),
        data.get('synthese_resultats_qualitatifs'),
        data.get('synthese_resultats_quantitatifs'),
        data.get('synthese_resultats_tableaux_graphiques'),
        data.get('statut_synthese_resultats', 'en attente'),
        data.get('discussion_interpretation'),
        data.get('discussion_comparaison'),
        data.get('discussion_limites'),
        data.get('discussion_recommandations'),
        data.get('statut_discussion', 'en attente'),
        data.get('redaction_diagramme_prisma'),
        data.get('redaction_tableaux_resumes'),
        data.get('redaction_rapport_final'),
        data.get('statut_redaction', 'en attente'),
        project_id
    )

    return execute_query(query, values, fetch_one=True)