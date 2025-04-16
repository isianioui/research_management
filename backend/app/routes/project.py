from app.controllers.project_controller import create_project,get_all_projects_by_user, get_all_projects, get_project_by_id, delete_project, update_project
from app.utils.database import execute_query, get_db_connection
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import logging
import traceback

project_bp = Blueprint('project_bp', __name__)

# from app.controllers.project_controller import create_project, get_all_projects, get_project_by_id,  delete_project, update_project
# from app.utils.database import get_db_connection
# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from datetime import datetime

# project_bp = Blueprint('project_bp', __name__)

# @project_bp.route('/projects', methods=['GET'])
# def list_projects():
#     projects = get_all_projects()
#     return jsonify([project.__dict__ for project in projects])

@project_bp.route('/test-auth', methods=['GET'])
@jwt_required()
def test_auth():
    current_user_id = get_jwt_identity()
    return jsonify({
        "message": "Authentication successful",
        "user_id": current_user_id
    }), 200


@project_bp.route('/projects', methods=['GET'])
@jwt_required()
def list_projects():
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({"message": "Utilisateur non authentifié"}), 401

        conn = get_db_connection()
        if not conn:
            return jsonify({"message": "Erreur de connexion à la base de données"}), 500
            
        cursor = conn.cursor()
        try:
            # Première requête pour obtenir les projets
            cursor.execute("""
                SELECT DISTINCT p.*, m.nom as methodologie_nom, 
                       u.nom as createur_nom, u.prenom as createur_prenom
                FROM project p
                LEFT JOIN methodologies m ON p.methodologie_id = m.id
                LEFT JOIN users u ON p.createur_id = u.id
                WHERE p.createur_id = %s 
                   OR EXISTS (
                       SELECT 1 
                       FROM project_collaborators pc2 
                       WHERE pc2.project_id = p.id 
                       AND pc2.user_id = %s
                   )
                ORDER BY p.date_creation DESC
            """, (current_user_id, current_user_id))
            
            columns = [desc[0] for desc in cursor.description]
            projects = []
            
            for row in cursor.fetchall():
                project_dict = dict(zip(columns, row))
                
                # Deuxième requête pour obtenir les collaborateurs de chaque projet
                cursor.execute("""
                    SELECT u.id, u.nom, u.prenom, u.email, pc.role, pc.status
                    FROM project_collaborators pc
                    JOIN users u ON pc.user_id = u.id
                    WHERE pc.project_id = %s
                """, (project_dict['id'],))
                
                collaborateurs = []
                for collab in cursor.fetchall():
                    collaborateurs.append({
                        'user_id': collab[0],
                        'nom': collab[1],
                        'prenom': collab[2],
                        'email': collab[3],
                        'role': collab[4],
                        'status': collab[5]
                    })
                
                project_dict['collaborateurs'] = collaborateurs
                
                # Formater les dates
                if project_dict.get('date_fin'):
                    project_dict['date_fin'] = project_dict['date_fin'].isoformat() if project_dict['date_fin'] else None
                if project_dict.get('date_creation'):
                    project_dict['date_creation'] = project_dict['date_creation'].isoformat() if project_dict['date_creation'] else None
                if project_dict.get('date_modification'):
                    project_dict['date_modification'] = project_dict['date_modification'].isoformat() if project_dict['date_modification'] else None
                
                # Ajouter le champ 'title' pour la compatibilité frontend
                project_dict['title'] = project_dict.get('titre', '')
                
                projects.append(project_dict)
                
            return jsonify(projects), 200
            
        except Exception as e:
            print(f"Erreur lors de la récupération des projets: {str(e)}")
            return jsonify({"message": f"Erreur lors de la récupération des projets: {str(e)}"}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Erreur d'authentification: {str(e)}")
        return jsonify({"message": "Erreur d'authentification"}), 401


@project_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def project_detail(project_id):
    project = get_project_by_id(project_id)
    if project:
        return jsonify({
            **project.__dict__,
            'calendar_event_id': project.calendar_event_id,
            'calendar_event_link': project.calendar_event_link
        })
    return jsonify({"message": "Project not found"}), 404

@project_bp.route('/project', methods=['POST'])
@jwt_required()
def create_new_project():
    try:
        # Debug authentication headers
        auth_header = request.headers.get('Authorization')
        print("Full Authorization header:", auth_header)
        
        if not auth_header:
            return jsonify({"message": "No Authorization header"}), 401
            
        if not auth_header.startswith('Bearer '):
            return jsonify({"message": "Invalid Authorization header format"}), 401
            
        token = auth_header.replace('Bearer ', '')
        print("Extracted token:", token[:20] + "..." if token else "None")  # Print first 20 chars for safety
        
        # Get and validate user identity
        creator_id = get_jwt_identity()
        print(f"Creator ID from token: {creator_id}")
        
        if not creator_id:
            return jsonify({"message": "Invalid or missing user identity", "error": "auth_error"}), 401

        # Convert creator_id to int since it comes as string from the token
        try:
            creator_id = int(creator_id)
        except (ValueError, TypeError):
            return jsonify({"message": "Invalid user ID format", "error": "invalid_user_id"}), 422

        data = request.get_json()
        print(f"Received data: {data}")
        
        # Validation des données requises
        required_fields = ['titre', 'description', 'methodologie_id', 'date_fin', 'statut']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return jsonify({
                "message": f"Champs requis manquants: {', '.join(missing_fields)}",
                "error": "validation_error"
            }), 422

        try:
            # Log des données reçues pour le débogage
            logging.info(f"Données reçues pour la création du projet: {data}")
            
            # Vérification du format de la date
            try:
                date_fin = datetime.strptime(data['date_fin'], '%Y-%m-%d')
            except ValueError:
                return jsonify({
                    "message": "Format de date invalide. Utilisez le format YYYY-MM-DD",
                    "error": "date_format_error"
                }), 422

            # Vérification que methodologie_id est un entier
            try:
                methodologie_id = int(data['methodologie_id'])
            except (ValueError, TypeError):
                return jsonify({
                    "message": "methodologie_id doit être un nombre entier",
                    "error": "invalid_methodology"
                }), 422

            project = create_project(
                titre=data['titre'],
                description=data['description'],
                methodologie_id=methodologie_id,
                createur_id=creator_id,
                date_creation=datetime.today(),
                date_fin=date_fin,
                statut=data['statut'],
                calendar_event_id=data.get('calendar_event_id'),
                calendar_event_link=data.get('calendar_event_link')
            )
            
            if isinstance(project, tuple) and len(project) == 2:
                return project
            
            return jsonify({"message": "Project created successfully", "project": project}), 201
            
        except Exception as e:
            logging.error(f"Error creating project: {str(e)}")
            logging.error(f"Request data: {data}")
            return jsonify({
                "message": f"Erreur lors de la création du projet: {str(e)}",
                "error": "creation_error"
            }), 422

    except Exception as e:
        print(f"Authentication error details: {str(e)}")
        print("Full traceback:")
        print(traceback.format_exc())
        return jsonify({
            "message": "Authentication error",
            "error": str(e),
            "details": traceback.format_exc()
        }), 401

@project_bp.route('/project/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project_route(project_id):
    if delete_project(project_id):
        return jsonify({"message": "Project deleted successfully"}), 200
    return jsonify({"message": "Project not found"}), 404

@project_bp.route('/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project_route(project_id):
    data = request.get_json()
    project = update_project(
        project_id,
        data.get('titre'),
        data.get('description'),
        data.get('methodologie_id'),
        data.get('date_fin'),
        data.get('statut', 'en cours'),
        data.get('calendar_event_id'),
        data.get('calendar_event_link')
    )
    
    if project:
        return jsonify(project.__dict__), 200
    return jsonify({"message": "Project not found"}), 404

@project_bp.route('/project/<int:project_id>/calendar', methods=['PUT'])
@jwt_required()
def update_project_calendar(project_id):
    data = request.get_json()
    project = get_project_by_id(project_id)
    
    if not project:
        return jsonify({"message": "Project not found"}), 404
        
    project = update_project(
        project_id,
        project.titre,
        project.description,
        project.methodologie_id,
        project.date_fin,
        project.statut,
        data.get('calendar_event_id'),
        data.get('calendar_event_link')
    )
    
    return jsonify({
        "message": "Calendar information updated successfully",
        "project": project.__dict__
    }), 200

@project_bp.route('/projects/user/<int:user_id>', methods=['GET'])
def get_projects_by_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT DISTINCT p.*, m.nom as methodologie_nom, 
                   u.nom as createur_nom, u.prenom as createur_prenom
            FROM project p
            LEFT JOIN methodologies m ON p.methodologie_id = m.id
            LEFT JOIN users u ON p.createur_id = u.id
            WHERE p.createur_id = %s 
               OR EXISTS (
                   SELECT 1 
                   FROM project_collaborators pc 
                   WHERE pc.project_id = p.id 
                   AND pc.user_id = %s
               )
            ORDER BY p.date_creation DESC
        """, (user_id, user_id))
        
        columns = [desc[0] for desc in cursor.description]
        projects = []
        
        for row in cursor.fetchall():
            project_dict = dict(zip(columns, row))
            
            # Récupérer les collaborateurs pour chaque projet
            cursor.execute("""
                SELECT u.id, u.nom, u.prenom, u.email, pc.role, pc.status
                FROM project_collaborators pc
                JOIN users u ON pc.user_id = u.id
                WHERE pc.project_id = %s
            """, (project_dict['id'],))
            
            collaborateurs = []
            for collab in cursor.fetchall():
                collaborateurs.append({
                    'user_id': collab[0],
                    'nom': collab[1],
                    'prenom': collab[2],
                    'email': collab[3],
                    'role': collab[4],
                    'status': collab[5]
                })
            
            project_dict['collaborateurs'] = collaborateurs
            
            # Ajouter le champ 'title' pour la compatibilité frontend
            project_dict['title'] = project_dict['titre']
            
            # Formater les dates
            if project_dict.get('date_fin'):
                project_dict['date_fin'] = project_dict['date_fin'].isoformat()
            if project_dict.get('date_creation'):
                project_dict['date_creation'] = project_dict['date_creation'].isoformat()
            if project_dict.get('date_modification'):
                project_dict['date_modification'] = project_dict['date_modification'].isoformat()
                
            projects.append(project_dict)
        
        return jsonify(projects), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des projets: {str(e)}")
        return jsonify({"message": f"Erreur lors de la récupération des projets: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@project_bp.route('/projects/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    try:
        # Get project details
        project = get_project_by_id(project_id)
        if not project:
            return jsonify({"error": "Project not found"}), 404

        # Get project collaborators
        query = """
            SELECT u.id, u.nom, u.prenom
            FROM users u
            INNER JOIN project_collaborators pc ON u.id = pc.user_id
            WHERE pc.project_id = %s
        """
        collaborators = execute_query(query, (project_id,), fetch_all=True)
        
        return jsonify({
            "project": project.__dict__,
            "collaborators": [
                {
                    "id": collab[0],
                    "nom": collab[1],
                    "prenom": collab[2]
                } for collab in (collaborators or [])
            ]
        }), 200
    except Exception as e:
        print(f"Error getting project: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
