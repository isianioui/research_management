

import psycopg2
from app.config import Config
import traceback

def get_db_connection():
    """Establish a database connection using psycopg2."""
    try:
        print("Tentative de connexion à la base de données...")
        print(f"Host: {Config.DB_HOST}")
        print(f"Database: {Config.DB_NAME}")
        print(f"User: {Config.DB_USER}")
        conn = psycopg2.connect(
            dbname=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASS,
            host=Config.DB_HOST,
            port=5433
        )
        
        # Créer les tables si elles n'existent pas
        cursor = conn.cursor()
        
        # Table users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
             id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- This should be NOT NULL
    nom VARCHAR(255),
    prenom VARCHAR(255),
    type VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    google_id VARCHAR(255),
    github_id VARCHAR(255),
    last_login TIMESTAMP,
    profile_image TEXT,
    is_invited BOOLEAN DEFAULT FALSE,
    invitation_status VARCHAR(50)
            )
        """)
        
        # Table projects
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project (
                id SERIAL PRIMARY KEY,
                titre VARCHAR(255) NOT NULL,
                description TEXT,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_fin DATE,
                createur_id INTEGER REFERENCES users(id),
                methodologie_id INTEGER,
                statut VARCHAR(50) DEFAULT 'en cours',
                calendar_event_id TEXT,
                calendar_event_link TEXT
            )
        """)
        
        # Table project_collaborators
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS project_collaborators (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(50) DEFAULT 'member',
                date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, user_id)
            )
        """)
        
        # Table tasks
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                titre VARCHAR(255) NOT NULL,
                description TEXT,
                priorite VARCHAR(50) DEFAULT 'moyenne',
                statut VARCHAR(50) DEFAULT 'à faire',
                date_echeance DATE,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createur_id INTEGER REFERENCES users(id),
                assigne_id INTEGER REFERENCES users(id),
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE
            )
        """)
        
        conn.commit()
        cursor.close()
        print("Connexion à la base de données réussie!")
        return conn
        
    except psycopg2.Error as e:
        print("Erreur de connexion à la base de données:")
        print(f"Code d'erreur: {e.pgcode}")
        print(f"Message d'erreur: {e.pgerror}")
        print("Traceback complet:")
        traceback.print_exc()
        return None

def execute_query(query, params=(), fetch_one=False, fetch_all=False):
    """Execute a SQL query with optional fetching of results."""
    print(f"\nExécution de la requête: {query}")
    print(f"Paramètres: {params}")
    
    conn = get_db_connection()
    if not conn:
        print("Impossible d'exécuter la requête: pas de connexion à la base de données")
        return None

    cursor = conn.cursor()
    result = None

    try:
        print("Exécution de la requête...")
        cursor.execute(query, params)
        conn.commit()
        print("Requête exécutée avec succès")

        if fetch_one:
            result = cursor.fetchone()
            print(f"Résultat unique: {result}")
        elif fetch_all:
            result = cursor.fetchall()
            print(f"Tous les résultats: {result}")

        return result

    except psycopg2.Error as e:
        conn.rollback()
        print("Erreur lors de l'exécution de la requête:")
        print(f"Code d'erreur: {e.pgcode}")
        print(f"Message d'erreur: {e.pgerror}")
        print("Traceback complet:")
        traceback.print_exc()
        return None

    finally:
        cursor.close()
        conn.close()
        print("Connexion fermée")
