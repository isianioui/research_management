from app.utils.database import execute_query
from datetime import datetime

class Task:
    def __init__(self, id, titre, description, priorite, date_echeance, statut, createur_id, assigne_id, project_id):
        self.id = id
        self.titre = titre
        self.description = description
        self.priorite = priorite
        self.date_echeance = date_echeance
        self.statut = statut
        self.createur_id = createur_id
        self.assigne_id = assigne_id
        self.project_id = project_id

    @staticmethod
    def get_task_by_id(task_id):
        """Récupère une tâche par son ID."""
        query = """
            SELECT t.*, p.titre as project_titre, 
                   CONCAT(u.prenom, ' ', u.nom) as assigne_nom
            FROM tasks t
            LEFT JOIN project p ON t.project_id = p.id
            LEFT JOIN users u ON t.assigne_id = u.id
            WHERE t.id = %s
        """
        result = execute_query(query, (task_id,), fetch_one=True)
        if result:
            # Handle date_echeance formatting
            date_echeance = result[5]
            if isinstance(date_echeance, str):
                formatted_date = date_echeance
            elif hasattr(date_echeance, 'strftime'):
                formatted_date = date_echeance.strftime('%Y-%m-%d')
            else:
                formatted_date = str(date_echeance) if date_echeance else None

            return {
                'id': result[0],
                'titre': result[1],
                'description': result[2],
                'priorite': result[3],
                'statut': result[4],
                'date_echeance': formatted_date,
                'createur_id': result[6],
                'assigne_id': result[7],
                'project_id': result[8],
                'project_titre': result[9],
                'assigne_nom': result[10]
            }
        return None

    @staticmethod
    def get_tasks_by_user(user_id):
        """Récupère toutes les tâches associées à un utilisateur."""
        query = """
            SELECT 
                t.id,
                t.titre,
                t.description,
                t.priorite,
                t.date_echeance,
                t.statut,
                t.createur_id,
                t.assigne_id,
                t.project_id,
                p.titre as project_titre,
                CONCAT(u.prenom, ' ', u.nom) as assigne_nom
            FROM tasks t
            LEFT JOIN project p ON t.project_id = p.id
            LEFT JOIN users u ON t.assigne_id = u.id
            WHERE t.createur_id = %s OR t.assigne_id = %s
            ORDER BY t.date_echeance ASC
        """
        results = execute_query(query, (user_id, user_id), fetch_all=True)
        if results is None:
            print("Erreur lors de la récupération des tâches")
            return []
            
        tasks = []
        for row in results:
            try:
                date_echeance = row[4]
                if isinstance(date_echeance, datetime):
                    date_str = date_echeance.strftime('%Y-%m-%d')
                elif isinstance(date_echeance, str):
                    date_str = date_echeance
                else:
                    date_str = str(date_echeance) if date_echeance else None
                
                tasks.append({
                    'id': row[0],
                    'titre': row[1],
                    'description': row[2],
                    'priorite': row[3],
                    'date_echeance': date_str,
                    'statut': row[5],
                    'createur_id': row[6],
                    'assigne_id': row[7],
                    'project_id': row[8],
                    'project_titre': row[9],
                    'assigne_nom': row[10]
                })
            except Exception as e:
                print(f"Erreur lors du traitement de la tâche: {str(e)}")
                print(f"Données de la ligne: {row}")
                continue
                
        return tasks

    @staticmethod
    def create_task(titre, description, priorite, date_echeance, createur_id, assigne_id, project_id):
        """Crée une nouvelle tâche."""
        try:
            # First verify the project exists in the correct table
            verify_query = """
                SELECT id FROM project WHERE id = %s
            """
            project = execute_query(verify_query, (project_id,), fetch_one=True)
            print(f"Project verification result: {project}")

            if not project:
                print(f"Project {project_id} not found")
                return None

            query = """
                INSERT INTO tasks (
                    titre, 
                    description, 
                    priorite, 
                    statut, 
                    date_echeance, 
                    createur_id, 
                    assigne_id, 
                    project_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            params = (
                titre, 
                description, 
                priorite, 
                'à faire', 
                date_echeance, 
                createur_id, 
                assigne_id, 
                project_id
            )
            print(f"Executing task creation with params: {params}")
            
            result = execute_query(query, params, fetch_one=True)
            if result:
                print(f"Task created successfully with ID: {result[0]}")
                return result[0]
            else:
                print("No ID returned from task creation")
                return None
            
        except Exception as e:
            print(f"Error creating task: {str(e)}")
            print("Traceback:")
            import traceback
            traceback.print_exc()
            return None

    @staticmethod
    def update_task_status(task_id, new_status):
        """Met à jour le statut d'une tâche."""
        query = """
            UPDATE tasks
            SET statut = %s
            WHERE id = %s
            RETURNING id
        """
        result = execute_query(query, (new_status, task_id), fetch_one=True)
        return result is not None

    @staticmethod
    def delete_task(task_id):
        """Supprime une tâche."""
        query = "DELETE FROM tasks WHERE id = %s RETURNING id"
        result = execute_query(query, (task_id,), fetch_one=True)
        return result is not None

    @staticmethod
    def get_user_projects(user_id):
        """Récupère tous les projets d'un utilisateur."""
        print(f"Récupération des projets pour l'utilisateur {user_id}")
        query = """
            SELECT DISTINCT p.id, p.titre, p.date_creation
            FROM project p
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id
            WHERE p.createur_id = %s 
            OR (pc.user_id = %s AND pc.project_id IS NOT NULL)
            ORDER BY p.date_creation DESC
        """
        print(f"Exécution de la requête: {query}")
        print(f"Paramètres: {user_id}, {user_id}")
        
        results = execute_query(query, (user_id, user_id), fetch_all=True)
        print(f"Résultats bruts de la requête des projets: {results}")
        
        if results is None:
            print("Erreur lors de la récupération des projets")
            return []
            
        projects = []
        for row in results:
            try:
                project = {
                    'id': row[0],
                    'titre': row[1]
                    # Ne pas renvoyer date_creation au frontend
                }
                projects.append(project)
                print(f"Projet ajouté: {project}")
            except Exception as e:
                print(f"Erreur lors du traitement du projet: {str(e)}")
                print(f"Données de la ligne: {row}")
                continue
                
        print(f"Liste finale des projets: {projects}")
        return projects

    @staticmethod
    def get_project_collaborators(project_id):
        """Récupère tous les collaborateurs d'un projet."""
        query = """
            SELECT u.id, u.nom, u.prenom
            FROM users u
            INNER JOIN project_collaborators pc ON u.id = pc.user_id
            WHERE pc.project_id = %s
            AND EXISTS (
                SELECT 1 FROM project p WHERE p.id = pc.project_id
            )
        """
        results = execute_query(query, (project_id,), fetch_all=True)
        if results is None:
            print("Erreur lors de la récupération des collaborateurs")
            return []
        return [{'id': row[0], 'nom': row[1], 'prenom': row[2]} for row in results]

    @staticmethod
    def validate_project_exists(project_id):
        """Verify if a project exists."""
        query = "SELECT id FROM project WHERE id = %s"
        result = execute_query(query, (project_id,), fetch_one=True)
        return result is not None 