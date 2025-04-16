from app.utils.database import execute_query
from app.models.project import Project
from app.utils.database import get_db_connection    
from flask import jsonify

def create_project(titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id=None, calendar_event_link=None):
    """Creates a new project and saves it to the database."""
    try:
        # Add debug logging
        print(f"Received project data:")
        print(f"titre: {titre}")
        print(f"description: {description}")
        print(f"methodologie_id: {methodologie_id}")
        print(f"createur_id: {createur_id}")
        print(f"date_creation: {date_creation}")
        print(f"date_fin: {date_fin}")
        print(f"statut: {statut}")

        # Validation des données
        if not titre or not description or not methodologie_id or not createur_id:
            missing_fields = []
            if not titre: missing_fields.append("titre")
            if not description: missing_fields.append("description")
            if not methodologie_id: missing_fields.append("methodologie_id")
            if not createur_id: missing_fields.append("createur_id")
            raise ValueError(f"Champs manquants: {', '.join(missing_fields)}")

        # Vérification que le statut est valide
        valid_statuts = ['en cours', 'validé', 'refusé']
        if statut not in valid_statuts:
            raise ValueError(f"Le statut doit être l'un des suivants : {', '.join(valid_statuts)}")

        query = """
            INSERT INTO project (titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id, calendar_event_link)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id, calendar_event_link
        """
        
        print(f"Executing query with values: {(titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id, calendar_event_link)}")
        
        project_data = execute_query(
            query,
            (titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id, calendar_event_link),
            fetch_one=True
        )
        
        if not project_data:
            raise Exception("Échec de l'insertion du projet dans la base de données")

        # Créer un objet Project avec les données retournées
        project = {
            'id': project_data[0],
            'titre': project_data[1],
            'description': project_data[2],
            'methodologie_id': project_data[3],
            'createur_id': project_data[4],
            'date_creation': project_data[5],
            'date_fin': project_data[6],
            'statut': project_data[7],
            'calendar_event_id': project_data[8],
            'calendar_event_link': project_data[9]
        }
        return jsonify({
            'message': 'Projet créé avec succès',
            'project': project
        }), 201
            
    except ValueError as ve:
        print(f"Validation Error: {str(ve)}")
        return jsonify({'error': str(ve)}), 422
    except Exception as e:
        print(f"Database Error: {str(e)}")
        return jsonify({'error': f'Erreur lors de la création du projet: {str(e)}'}), 500

def get_project_by_id(project_id):
    """Retrieves a project by its ID."""
    query = "SELECT id, titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id, calendar_event_link FROM project WHERE id = %s"
    project_data = execute_query(query, (project_id,), fetch_one=True)
    
    if project_data:
        return Project(*project_data)
    return None
def get_all_projects_by_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Execute the SQL query to get projects where the user is the creator or a collaborator
    cursor.execute('''
        SELECT DISTINCT p.* 
        FROM project p
        LEFT JOIN collaborateurs c ON p.id = c.project_id
        WHERE p.createur_id = %s OR c.user_id = %s
    ''', (user_id, user_id))

    # Fetch all results
    projects = cursor.fetchall()

    # Close the connection
    conn.close()

    # Convert rows to a list of dictionaries
    return [dict(zip(['id', 'titre', 'description', 'methodologie_id', 'createur_id', 
                      'date_fin', 'statut', 'date_creation', 'date_modification', 
                      'calendar_event_id', 'calendar_event_link'], project)) for project in projects]
def get_all_projects():
    """Retrieves all projects from the database."""
    query = "SELECT id, titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id, calendar_event_link FROM project"
    projects_data = execute_query(query, fetch_all=True)
    return [Project(*data) for data in projects_data]

def delete_project(project_id):
    """Deletes a project from the database."""
    query = "DELETE FROM project WHERE id = %s RETURNING id"
    result = execute_query(query, (project_id,), fetch_one=True)
    return result is not None

def update_project(project_id, titre, description, methodologie_id, date_fin, statut, calendar_event_id=None, calendar_event_link=None):
    """Updates an existing project in the database."""
    query = """
        UPDATE project
        SET titre = %s,
            description = %s,
            methodologie_id = %s,
            date_fin = %s,
            statut = %s,
            calendar_event_id = %s,
            calendar_event_link = %s
        WHERE id = %s
        RETURNING id, titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id, calendar_event_link
    """
    project_data = execute_query(
        query,
        (titre, description, methodologie_id, date_fin, statut, calendar_event_id, calendar_event_link, project_id),
        fetch_one=True
    )
    
    if project_data:
        return Project(*project_data)
    return None


def get_projects_by_user(user_id):
    """Retrieves all projects created by a specific user."""
    query = "SELECT id, titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id, calendar_event_link FROM project WHERE createur_id = %s"
    projects_data = execute_query(query, (user_id,), fetch_all=True)
    return [Project(*data) for data in projects_data]
