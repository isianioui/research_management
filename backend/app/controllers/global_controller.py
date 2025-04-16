from flask import jsonify
from app.utils.database import execute_query

def create_global_steps(project_id, data):
    query = """
        INSERT INTO etapes_global (
            methodologie_id,
            project_id,
            idee, statut_idee,
            problematique, statut_problematique,
            mots_cles, statut_mots_cles,
            revue_litterature, statut_revue, sources_utilisees,
            research_gap, statut_gap,
            solution_proposee, statut_solution,
            evaluation_solution, statut_evaluation,
            redaction_papier, statut_redaction, lien_google_docs,
            soumission_journal, statut_soumission, nom_journal, commentaires_revision
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """
    values = (
        1,  # methodologie_id for global
        project_id,
        data.get('idee'),
        data.get('statut_idee', 'en attente'),
        data.get('problematique'),
        data.get('statut_problematique', 'en attente'),
        data.get('mots_cles'),
        data.get('statut_mots_cles', 'en attente'),
        data.get('revue_litterature'),
        data.get('statut_revue', 'en attente'),
        data.get('sources_utilisees'),
        data.get('research_gap'),
        data.get('statut_gap', 'en attente'),
        data.get('solution_proposee'),
        data.get('statut_solution', 'en attente'),
        data.get('evaluation_solution'),
        data.get('statut_evaluation', 'en attente'),
        data.get('redaction_papier'),
        data.get('statut_redaction', 'en attente'),
        data.get('lien_google_docs'),
        data.get('soumission_journal'),
        data.get('statut_soumission', 'en attente'),
        data.get('nom_journal'),
        data.get('commentaires_revision')
    )
    return execute_query(query, values, fetch_one=True)

def get_global_steps(project_id):
    query = "SELECT * FROM etapes_global WHERE project_id = %s"
    return execute_query(query, (project_id,), fetch_one=True)

def delete_global_steps(project_id):
    query = "DELETE FROM etapes_global WHERE project_id = %s RETURNING id"
    return execute_query(query, (project_id,), fetch_one=True)
# def update_global_steps(project_id, data):
#     query = """
#         UPDATE etapes_global
#         SET
#             idee = %s,
#             statut_idee = %s,
#             problematique = %s,
#             statut_problematique = %s,
#             mots_cles = %s,
#             statut_mots_cles = %s,
#             revue_litterature = %s,
#             statut_revue = %s,
#             sources_utilisees = %s,
#             research_gap = %s,
#             statut_gap = %s,
#             solution_proposee = %s,
#             statut_solution = %s,
#             evaluation_solution = %s,
#             statut_evaluation = %s,
#             redaction_papier = %s,
#             statut_redaction = %s,
#             lien_google_docs = %s,
#             soumission_journal = %s,
#             statut_soumission = %s,
#             nom_journal = %s,
#             commentaires_revision = %s
#         WHERE project_id = %s
#         RETURNING id
#     """
#     values = (
#         data.get('idee'),
#         data.get('statut_idee', 'en attente'),
#         data.get('problematique'),
#         data.get('statut_problematique', 'en attente'),
#         data.get('mots_cles'),
#         data.get('statut_mots_cles', 'en attente'),
#         data.get('revue_litterature'),
#         data.get('statut_revue', 'en attente'),
#         data.get('sources_utilisees'),
#         data.get('research_gap'),
#         data.get('statut_gap', 'en attente'),
#         data.get('solution_proposee'),
#         data.get('statut_solution', 'en attente'),
#         data.get('evaluation_solution'),
#         data.get('statut_evaluation', 'en attente'),
#         data.get('redaction_papier'),
#         data.get('statut_redaction', 'en attente'),
#         data.get('lien_google_docs'),
#         data.get('soumission_journal'),
#         data.get('statut_soumission', 'en attente'),
#         data.get('nom_journal'),
#         data.get('commentaires_revision'),
#         project_id
#     )
    # return execute_query(query, values, fetch_one=True)




def update_global_steps(project_id, data):
    current_data_query = """
        SELECT 
            statut_idee, statut_problematique, statut_mots_cles, statut_revue, 
            statut_gap, statut_solution, statut_evaluation, statut_redaction,
            statut_soumission
        FROM etapes_global 
        WHERE project_id = %s
    """
    current_data = execute_query(current_data_query, (project_id,), fetch_one=True)
    
    if not current_data:
        return None
    
    date_fields = []
    
    if data.get('statut_idee') == 'terminé' and current_data[0] != 'terminé':
        date_fields.append("date_completion_idee = CURRENT_TIMESTAMP")
    
    if data.get('statut_problematique') == 'terminé' and current_data[1] != 'terminé':
        date_fields.append("date_completion_problematique = CURRENT_TIMESTAMP")
    
    if data.get('statut_mots_cles') == 'terminé' and current_data[2] != 'terminé':
        date_fields.append("date_completion_mots_cles = CURRENT_TIMESTAMP")
    
    if data.get('statut_revue') == 'terminé' and current_data[3] != 'terminé':
        date_fields.append("date_completion_revue = CURRENT_TIMESTAMP")
    
    if data.get('statut_gap') == 'terminé' and current_data[4] != 'terminé':
        date_fields.append("date_completion_gap = CURRENT_TIMESTAMP")
    
    if data.get('statut_solution') == 'terminé' and current_data[5] != 'terminé':
        date_fields.append("date_completion_solution = CURRENT_TIMESTAMP")
    
    if data.get('statut_evaluation') == 'terminé' and current_data[6] != 'terminé':
        date_fields.append("date_completion_evaluation = CURRENT_TIMESTAMP")
    
    if data.get('statut_redaction') == 'terminé' and current_data[7] != 'terminé':
        date_fields.append("date_completion_redaction = CURRENT_TIMESTAMP")
    
    # Special case for submission - it has different status values
    if data.get('statut_soumission') in ['accepté', 'rejeté', 'modifications requises'] and current_data[8] == 'en attente':
        date_fields.append("date_soumission = CURRENT_TIMESTAMP")
    
    # Build the query with conditional date updates
    date_fields_str = ", ".join(date_fields)
    date_fields_str = f", {date_fields_str}" if date_fields_str else ""
    
    query = f"""
        UPDATE etapes_global
        SET
            idee = %s,
            statut_idee = %s,
            problematique = %s,
            statut_problematique = %s,
            mots_cles = %s,
            statut_mots_cles = %s,
            revue_litterature = %s,
            statut_revue = %s,
            sources_utilisees = %s,
            research_gap = %s,
            statut_gap = %s,
            solution_proposee = %s,
            statut_solution = %s,
            evaluation_solution = %s,
            statut_evaluation = %s,
            redaction_papier = %s,
            statut_redaction = %s,
            lien_google_docs = %s,
            soumission_journal = %s,
            statut_soumission = %s,
            nom_journal = %s,
            commentaires_revision = %s,
            date_modification = CURRENT_TIMESTAMP{date_fields_str}
        WHERE project_id = %s
        RETURNING id
    """

    values = (
        data.get('idee'),
        data.get('statut_idee', 'en attente'),
        data.get('problematique'),
        data.get('statut_problematique', 'en attente'),
        data.get('mots_cles'),
        data.get('statut_mots_cles', 'en attente'),
        data.get('revue_litterature'),
        data.get('statut_revue', 'en attente'),
        data.get('sources_utilisees'),
        data.get('research_gap'),
        data.get('statut_gap', 'en attente'),
        data.get('solution_proposee'),
        data.get('statut_solution', 'en attente'),
        data.get('evaluation_solution'),
        data.get('statut_evaluation', 'en attente'),
        data.get('redaction_papier'),
        data.get('statut_redaction', 'en attente'),
        data.get('lien_google_docs'),
        data.get('soumission_journal'),
        data.get('statut_soumission', 'en attente'),
        data.get('nom_journal'),
        data.get('commentaires_revision'),
        project_id
    )

    return execute_query(query, values, fetch_one=True)