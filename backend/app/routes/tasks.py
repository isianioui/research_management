from flask import Blueprint, request, jsonify
from app.models.task import Task
from flask_jwt_extended import jwt_required, get_jwt_identity
import traceback
from app.utils.database import get_db_connection

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    try:
        print("Début de get_tasks")
        user_id = get_jwt_identity()
        print(f"User ID: {user_id}")
        
        tasks = Task.get_tasks_by_user(user_id)
        print(f"Tasks récupérées: {tasks}")
        
        # Récupérer les projets de l'utilisateur
        user_projects = Task.get_user_projects(user_id)
        print(f"Projets récupérés: {user_projects}")
        
        # Si un project_id est fourni, récupérer les collaborateurs de ce projet
        project_id = request.args.get('project_id')
        collaborators = []
        if project_id:
            collaborators = Task.get_project_collaborators(project_id)
            print(f"Collaborateurs récupérés pour le projet {project_id}: {collaborators}")
        
        response = {
            'tasks': tasks,
            'projects': user_projects,
            'collaborators': collaborators,
            'current_user_id': user_id
        }
        print(f"Réponse finale: {response}")
        return jsonify(response)
        
    except Exception as e:
        print("Erreur dans get_tasks:")
        print(str(e))
        print("Traceback:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@tasks_bp.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        print("Received task creation request:")
        print("User ID:", user_id)
        print("Request data:", data)
        
        if not data:
            return jsonify({'error': 'Aucune donnée fournie'}), 400
        
        required_fields = ['titre', 'description', 'priorite', 'date_echeance', 'project_id']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': 'Champs requis manquants',
                'missing_fields': missing_fields
            }), 400

        # Validate project_id exists
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # Check both tables
            cursor.execute("""
                SELECT 'project' as table_name, id, titre, createur_id 
                FROM project 
                WHERE id = %s
                UNION ALL
                SELECT 'projects' as table_name, id, titre, createur_id 
                FROM projects 
                WHERE id = %s
            """, (data['project_id'], data['project_id']))
            
            results = cursor.fetchall()
            print("Project lookup results:", results)
            
            if not results:
                return jsonify({
                    'error': f"Le projet avec l'ID {data['project_id']} n'existe pas"
                }), 404
                
            # Use the first result found
            table_name, project_id, titre, createur_id = results[0]
            print(f"Found project in table {table_name}: ID={project_id}, Title={titre}")
            
            # Update the tasks table foreign key constraint if needed
            cursor.execute("""
                SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS foreign_table
                FROM pg_constraint 
                WHERE contype = 'f' AND conrelid = 'tasks'::regclass;
            """)
            constraints = cursor.fetchall()
            print("Task table foreign key constraints:", constraints)
            
        except Exception as e:
            print(f"Error checking project: {e}")
            traceback.print_exc()
            return jsonify({'error': f'Erreur lors de la vérification du projet: {str(e)}'}), 500
        finally:
            cursor.close()
            conn.close()
        
        # Validation de la priorité
        if data['priorite'] not in ['basse', 'moyenne', 'haute']:
            return jsonify({'error': 'Priorité invalide. Valeurs acceptées: basse, moyenne, haute'}), 400
        
        # Validation de la date
        try:
            date_echeance = data['date_echeance']
            if not date_echeance:
                return jsonify({'error': 'La date d\'échéance est requise'}), 400
        except ValueError:
            return jsonify({'error': 'Format de date invalide'}), 400
        
        # Si assigne_id n'est pas fourni, utiliser l'utilisateur courant
        if not data.get('assigne_id'):
            data['assigne_id'] = user_id
        
        task_id = Task.create_task(
            titre=data['titre'],
            description=data['description'],
            priorite=data['priorite'],
            date_echeance=date_echeance,
            createur_id=user_id,
            assigne_id=data['assigne_id'],
            project_id=data['project_id']
        )
        
        if task_id:
            # Get the created task details
            created_task = Task.get_task_by_id(task_id)
            return jsonify({
                'message': 'Tâche créée avec succès',
                'task': created_task
            }), 201
        
        return jsonify({'error': 'Erreur lors de la création de la tâche'}), 500

    except Exception as e:
        print("Error creating task:", str(e))
        print("Traceback:")
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la création de la tâche: {str(e)}'}), 500

@tasks_bp.route('/tasks/<int:task_id>/status', methods=['PUT'])
@jwt_required()
def update_status(task_id):
    try:
        data = request.get_json()
        if not data or 'statut' not in data:
            return jsonify({"error": "Le statut est requis"}), 400
            
        new_status = data['statut']
        
        # Mettre à jour le statut directement
        success = Task.update_task_status(task_id, new_status)
        if success:
            return jsonify({
                "message": "Statut mis à jour avec succès",
                "task_id": task_id,
                "new_status": new_status
            }), 200
        return jsonify({"error": "Erreur lors de la mise à jour du statut"}), 500
    except Exception as e:
        print(f"Erreur lors de la mise à jour du statut: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500

@tasks_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()
    if Task.delete_task(task_id):
        return jsonify({'message': 'Tâche supprimée avec succès'})
    return jsonify({'error': 'Erreur lors de la suppression de la tâche'}), 500 