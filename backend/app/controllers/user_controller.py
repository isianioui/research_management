from werkzeug.security import generate_password_hash
from app.utils.database import execute_query
from app.models.user import User

def create_user(nom, prenom, email, password, avatar_url=None, google_id=None, github_id=None, last_login=None, profile_image=None, is_invited=False, invitation_status=None):
    # This function handles the process of creating a new user.
    print(f"Creating user with email: {email}")  # Debug log
    hashed_password = generate_password_hash(password)
    query = """
        INSERT INTO users (
            nom, prenom, email, password, avatar_url, google_id, github_id, 
            last_login, profile_image, is_invited, invitation_status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, nom, prenom, email, password, avatar_url, google_id, 
                  github_id, last_login, profile_image, is_invited, invitation_status
    """
    user_data = execute_query(
        query, 
        (nom, prenom, email, hashed_password, avatar_url, google_id, github_id, 
         last_login, profile_image, is_invited, invitation_status), 
        fetch_one=True
    )
    print(f"User data returned from database: {user_data}")  # Debug log
    if user_data:
        user = User(*user_data)
        print(f"User object created: {user.email}")  # Debug log
        return user
    return None

def get_user_by_email(email):
    # This function handles retrieving a user by email.
    print(f"Looking up user by email: {email}")  # Debug log
    query = """
        SELECT id, nom, prenom, email, password, avatar_url, google_id, github_id, 
               last_login, profile_image, is_invited, invitation_status
        FROM users WHERE email = %s
    """
    user_data = execute_query(query, (email,), fetch_one=True)
    print(f"Found user data: {user_data}")  # Debug log
    return User(*user_data) if user_data else None

def update_user_avatar(user_id, avatar_url):
    query = """
        UPDATE users 
        SET avatar_url = %s 
        WHERE id = %s
        RETURNING id, nom, prenom, email, password, avatar_url, google_id, github_id, last_login, profile_image
    """
    user_data = execute_query(query, (avatar_url, user_id), fetch_one=True)
    return User(*user_data) if user_data else None

def update_user_social(user_id, google_id=None, github_id=None):
    updates = []
    params = []
    if google_id is not None:
        updates.append("google_id = %s")
        params.append(google_id)
    if github_id is not None:
        updates.append("github_id = %s")
        params.append(github_id)
    
    if not updates:
        return None
    
    query = f"""
        UPDATE users 
        SET {", ".join(updates)}
        WHERE id = %s
        RETURNING id, nom, prenom, email, password, avatar_url, google_id, github_id, last_login,profile_image
    """
    params.append(user_id)
    user_data = execute_query(query, tuple(params), fetch_one=True)
    return User(*user_data) if user_data else None

def get_user_by_id(user_id):
    query = """
        SELECT id, nom, prenom, email, password, avatar_url, google_id, github_id, 
               last_login, profile_image, is_invited, invitation_status
        FROM users WHERE id = %s
    """
    user_data = execute_query(query, (user_id,), fetch_one=True)
    return User(*user_data) if user_data else None
