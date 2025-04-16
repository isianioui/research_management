from app.utils.database import get_db_connection, execute_query
from werkzeug.security import generate_password_hash, check_password_hash
from secrets import token_urlsafe

def get_collaborateur(collaborateur_id):
    query = """
        SELECT * FROM project_collaborators
        WHERE id = %s
    """
    result = execute_query(query, (collaborateur_id,), fetch_one=True)
    if result:
        return {'data': result}, 200
    return {'message': 'Collaborateur not found'}, 404

def get_project_collaborateurs(project_id):
    query = """
        SELECT c.*, u.name, u.email
        FROM project_collaborators c
        JOIN users u ON c.user_id = u.id
        WHERE c.project_id = %s
    """
    results = execute_query(query, (project_id,), fetch_all=True)
    return {'data': results}, 200

def add_collaborateur(project_id, user_data):
    conn = get_db_connection()
    if not conn:
        return {'message': 'Database connection failed'}, 500
        
    cursor = conn.cursor()
    try:
        # Check if user exists with this email
        cursor.execute("""
            SELECT id FROM users WHERE email = %s
        """, (user_data['email'],))
        existing_user = cursor.fetchone()
        
        # Check if user already has a temp_password in any project
        cursor.execute("""
            SELECT temp_password 
            FROM project_collaborators pc
            JOIN users u ON pc.user_id = u.id
            WHERE u.email = %s
            LIMIT 1
        """, (user_data['email'],))
        existing_temp_password = cursor.fetchone()

        if existing_temp_password:
            temp_password = existing_temp_password[0]
            hashed_password = generate_password_hash(temp_password)
        else:
            # Generate new temp password only if user doesn't have one
            temp_password = token_urlsafe(16)
            hashed_password = generate_password_hash(temp_password)

        print(f"DEBUG - Using temp password for {user_data['email']}: {temp_password}")
        
        if existing_user:
            user_id = existing_user[0]
            # Check if already a collaborator for this specific project
            cursor.execute("""
                SELECT id FROM project_collaborators 
                WHERE project_id = %s AND user_id = %s
            """, (project_id, user_id))
            
            if cursor.fetchone():
                return {'message': 'User is already a collaborator for this project'}, 400
            
            # Update existing user's password if they don't have one
            cursor.execute("""
                UPDATE users 
                SET password = %s, is_invited = true 
                WHERE id = %s AND is_invited = false
            """, (hashed_password, user_id))
        else:
            # Create new user with hashed password
            cursor.execute("""
                INSERT INTO users (email, nom, prenom, type, is_invited, password)
                VALUES (%s, 'Invité', 'Temporaire', %s, true, %s)
                RETURNING id
            """, (user_data['email'], user_data.get('type', 'etudiant'), hashed_password))
            user_id = cursor.fetchone()[0]
        
        # Add collaborator entry with the same temp_password
        cursor.execute("""
            INSERT INTO project_collaborators 
                (project_id, user_id, role, status, temp_password)
            VALUES 
                (%s, %s, %s, 'pending', %s)
            RETURNING id
        """, (project_id, user_id, user_data['role'], temp_password))
        collab_id = cursor.fetchone()[0]
        
        conn.commit()
        
        return {
            'message': 'Collaborator added successfully',
            'collaborator_id': collab_id,
            'temp_password': temp_password,
            'user_id': user_id
        }, 201
        
    except Exception as e:
        conn.rollback()
        print(f"Error in add_collaborateur: {str(e)}")
        return {'message': f'Error: {str(e)}'}, 500
    finally:
        cursor.close()
        conn.close()

def verify_invited_user(email, temp_password):
    """Verify an invited user's credentials"""
    conn = get_db_connection()
    if not conn:
        return None
        
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id, email, password, nom, prenom, type
            FROM users 
            WHERE email = %s AND password = %s AND is_invited = true
        """, (email, temp_password))
        
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def accept_collaboration(user_id, project_id):
    query = """
        SELECT manually_accept_collaboration(%s, %s);
    """
    try:
        result = execute_query(query, (user_id, project_id), fetch_one=True)
        return result[0] if result else False
    except Exception as e:
        print("Error accepting collaboration:", str(e))
        return False

def update_collaborateur_status(collaborateur_id, status):
    valid_status = ['active', 'inactive', 'pending']
    
    if status not in valid_status:
        return {'message': 'Invalid status'}, 400
        
    query = """
        UPDATE project_collaborators
        SET status = %s
        WHERE id = %s
        RETURNING *
    """
    result = execute_query(query, (status, collaborateur_id), fetch_one=True)
    if result:
        return {
            'message': 'Status updated successfully',
            'data': result
        }, 200
    return {'message': 'Collaborateur not found'}, 404

def remove_collaborateur(collaborateur_id):
    query = """
        DELETE FROM project_collaborators
        WHERE id = %s
        RETURNING id
    """
    result = execute_query(query, (collaborateur_id,), fetch_one=True)
    if result:
        return {'message': 'Collaborateur removed successfully'}, 200
    return {'message': 'Collaborateur not found'}, 404

def update_user_profile(user_id, data):
    try:
        update_fields = []
        update_values = []
        
        if 'nom' in data:
            update_fields.append("nom = %s")
            update_values.append(data['nom'])
            
        if 'prenom' in data:
            update_fields.append("prenom = %s")
            update_values.append(data['prenom'])
            
        if 'profile_image' in data:
            update_fields.append("profile_image = %s")
            update_values.append(data['profile_image'])
        
        if not update_fields:
            return {"message": "No data to update"}, 400
            
        # Add user_id to values
        update_values.append(user_id)
        
        query = f"""
            UPDATE users 
            SET {", ".join(update_fields)}
            WHERE id = %s
            RETURNING id, nom, prenom, email, profile_image, type
        """
        
        result = execute_query(query, tuple(update_values), fetch_one=True)
        
        if result:
            return {
                "message": "Profile updated successfully",
                "user": {
                    "id": result[0],
                    "nom": result[1],
                    "prenom": result[2],
                    "email": result[3],
                    "profile_image": result[4],
                    "type": result[5]
                }
            }, 200
        else:
            return {"message": "User not found"}, 404
            
    except Exception as e:
        print(f"Error in update_user_profile: {str(e)}")
        return {"message": str(e)}, 500
