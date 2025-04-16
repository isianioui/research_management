from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.database import get_db_connection
from datetime import datetime, timedelta
import traceback

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/projects/analytics', methods=['GET'])
@jwt_required()
def get_project_analytics():
    try:
        current_user_id = get_jwt_identity()
        print(f"Fetching analytics for user ID: {current_user_id}")
        
        conn = get_db_connection()
        if not conn:
            print("Failed to establish database connection")
            return jsonify({'error': 'Database connection failed'}), 500
            
        cursor = conn.cursor()
        
        # 1. Statistiques des projets par statut
        try:
            cursor.execute("""
                SELECT statut, COUNT(*) as count
                FROM project
                WHERE createur_id = %s
                GROUP BY statut
            """, (current_user_id,))
            status_stats = cursor.fetchall()
            print(f"Status stats: {status_stats}")
        except Exception as e:
            print(f"Error fetching status stats: {str(e)}")
            status_stats = []
        
        # 2. Progression par jours (30 derniers jours)
        try:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            cursor.execute("""
                SELECT 
                    DATE(date_creation) as date,
                    COUNT(*) as count
                FROM project
                WHERE createur_id = %s 
                AND date_creation >= %s
                GROUP BY DATE(date_creation)
                ORDER BY date
            """, (current_user_id, thirty_days_ago))
            daily_progress = cursor.fetchall()
            print(f"Daily progress: {daily_progress}")
        except Exception as e:
            print(f"Error fetching daily progress: {str(e)}")
            daily_progress = []
        
        # 3. Statistiques des projets par méthodologie
        try:
            cursor.execute("""
                SELECT m.nom, COUNT(*) as count
                FROM project p
                JOIN methodologies m ON p.methodologie_id = m.id
                WHERE p.createur_id = %s
                GROUP BY m.nom
            """, (current_user_id,))
            methodology_stats = cursor.fetchall()
            print(f"Methodology stats: {methodology_stats}")
        except Exception as e:
            print(f"Error fetching methodology stats: {str(e)}")
            methodology_stats = []
        
        # 4. Progression des étapes par méthodologie
        step_progress = []
        
        # IMRAD Steps
        try:
            cursor.execute("""
                WITH imrad_stats AS (
                    SELECT 
                        'IMRAD' as methodology,
                        'Introduction' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_introduction = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_imrad ei
                    JOIN project p ON ei.project_id = p.id
                    WHERE p.createur_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        'IMRAD' as methodology,
                        'Méthodes' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_methodes = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_imrad ei
                    JOIN project p ON ei.project_id = p.id
                    WHERE p.createur_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        'IMRAD' as methodology,
                        'Résultats' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_resultats = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_imrad ei
                    JOIN project p ON ei.project_id = p.id
                    WHERE p.createur_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        'IMRAD' as methodology,
                        'Discussion' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_discussion = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_imrad ei
                    JOIN project p ON ei.project_id = p.id
                    WHERE p.createur_id = %s
                )
                SELECT * FROM imrad_stats
            """, (current_user_id, current_user_id, current_user_id, current_user_id))
            imrad_progress = cursor.fetchall()
            if imrad_progress:
                step_progress.extend([{
                    'step': row[1],
                    'total': row[2],
                    'completed': row[3] or 0,
                    'methodology': 'IMRAD'
                } for row in imrad_progress])
        except Exception as e:
            print(f"Error fetching IMRAD progress: {str(e)}")
        
        # PRISMA Steps
        try:
            cursor.execute("""
                WITH prisma_stats AS (
                    SELECT 
                        'PRISMA' as methodology,
                        'Identification' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_identification = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_prisma ep
                    JOIN project p ON ep.project_id = p.id
                    WHERE p.createur_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        'PRISMA' as methodology,
                        'Élimination' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_elimination_doublons = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_prisma ep
                    JOIN project p ON ep.project_id = p.id
                    WHERE p.createur_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        'PRISMA' as methodology,
                        'Sélection' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_selection = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_prisma ep
                    JOIN project p ON ep.project_id = p.id
                    WHERE p.createur_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        'PRISMA' as methodology,
                        'Évaluation' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_evaluation_qualite = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_prisma ep
                    JOIN project p ON ep.project_id = p.id
                    WHERE p.createur_id = %s
                )
                SELECT * FROM prisma_stats
            """, (current_user_id, current_user_id, current_user_id, current_user_id))
            prisma_progress = cursor.fetchall()
            if prisma_progress:
                step_progress.extend([{
                    'step': row[1],
                    'total': row[2],
                    'completed': row[3] or 0,
                    'methodology': 'PRISMA'
                } for row in prisma_progress])
        except Exception as e:
            print(f"Error fetching PRISMA progress: {str(e)}")
        
        # Global Steps
        try:
            cursor.execute("""
                WITH global_stats AS (
                    SELECT 
                        'Global' as methodology,
                        'Idée' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_idee = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_global eg
                    JOIN project p ON eg.project_id = p.id
                    WHERE p.createur_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        'Global' as methodology,
                        'Problématique' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_problematique = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_global eg
                    JOIN project p ON eg.project_id = p.id
                    WHERE p.createur_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        'Global' as methodology,
                        'Revue' as step_name,
                        COUNT(*) as total,
                        SUM(CASE WHEN statut_revue = 'terminé' THEN 1 ELSE 0 END) as completed
                    FROM etapes_global eg
                    JOIN project p ON eg.project_id = p.id
                    WHERE p.createur_id = %s
                )
                SELECT * FROM global_stats
            """, (current_user_id, current_user_id, current_user_id))
            global_progress = cursor.fetchall()
            if global_progress:
                step_progress.extend([{
                    'step': row[1],
                    'total': row[2],
                    'completed': row[3] or 0,
                    'methodology': 'Global'
                } for row in global_progress])
        except Exception as e:
            print(f"Error fetching Global progress: {str(e)}")
        
        cursor.close()
        conn.close()
        
        response_data = {
            'status_stats': [{'status': row[0], 'count': row[1]} for row in status_stats],
            'daily_progress': [{'date': row[0].strftime('%Y-%m-%d'), 'count': row[1]} for row in daily_progress],
            'methodology_stats': [{'methodology': row[0], 'count': row[1]} for row in methodology_stats],
            'step_progress': step_progress
        }
        
        print("Successfully prepared analytics response")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Unexpected error in get_project_analytics: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500 