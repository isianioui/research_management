from app.utils.database import execute_query
from app.models.chat import Message, Conversation, ConversationParticipant
from datetime import datetime

def get_user_conversations(user_id):
    query = """
        SELECT 
            c.id, 
            c.project_id,
            p.titre as project_title,
            c.created_at,
            c.updated_at,
            json_agg(
                json_build_object(
                    'id', u.id,
                    'prenom', u.prenom,
                    'nom', u.nom,
                    'last_read_at', cp.last_read_at
                )
            ) as participants,
            (
                SELECT row_to_json(last_msg)
                FROM (
                    SELECT 
                        m.id,
                        m.content,
                        m.sender_id,
                        m.created_at,
                        CONCAT(us.prenom, ' ', us.nom) as sender_name
                    FROM messages m
                    JOIN users us ON m.sender_id = us.id
                    WHERE m.conversation_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ) last_msg
            ) as last_message,
            (
                SELECT COUNT(*)
                FROM messages m
                WHERE m.conversation_id = c.id
                AND m.is_read = false
                AND m.sender_id != %s
            ) as unread_count
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        JOIN users u ON cp.user_id = u.id
        JOIN projects p ON c.project_id = p.id
        WHERE cp.user_id = %s
        GROUP BY c.id, p.titre
        ORDER BY c.updated_at DESC
    """
    
    results = execute_query(query, (user_id, user_id), fetch_all=True)
    if not results:
        return []

    conversations = []
    for row in results:
        participants = [
            ConversationParticipant(
                id=p['id'],
                user_id=p['id'],
                prenom=p['prenom'],
                nom=p['nom'],
                last_read_at=p['last_read_at']
            ) for p in row['participants']
        ]

        last_message = None
        if row['last_message']:
            last_message = Message(
                id=row['last_message']['id'],
                conversation_id=row['id'],
                sender_id=row['last_message']['sender_id'],
                content=row['last_message']['content'],
                sender_name=row['last_message']['sender_name'],
                created_at=row['last_message']['created_at']
            )

        conversation = Conversation(
            id=row['id'],
            project_id=row['project_id'],
            project_title=row['project_title'],
            participants=participants,
            last_message=last_message,
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            unread_count=row['unread_count']
        )
        conversations.append(conversation)

    return [conv.to_dict() for conv in conversations]

def get_conversation_messages(conversation_id, user_id):
    # Verify user is part of conversation
    access_query = """
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = %s AND user_id = %s
    """
    has_access = execute_query(access_query, (conversation_id, user_id), fetch_one=True)
    if not has_access:
        return None

    query = """
        SELECT 
            m.id,
            m.conversation_id,
            m.sender_id,
            m.content,
            m.is_read,
            m.created_at,
            m.updated_at,
            CONCAT(u.prenom, ' ', u.nom) as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = %s
        ORDER BY m.created_at ASC
    """
    
    results = execute_query(query, (conversation_id,), fetch_all=True)
    if not results:
        return []

    # Mark messages as read
    update_query = """
        UPDATE messages
        SET is_read = true
        WHERE conversation_id = %s
        AND sender_id != %s
        AND is_read = false
    """
    execute_query(update_query, (conversation_id, user_id))

    return [Message(
        id=row[0],
        conversation_id=row[1],
        sender_id=row[2],
        content=row[3],
        is_read=row[4],
        created_at=row[5],
        updated_at=row[6],
        sender_name=row[7]
    ).to_dict() for row in results]

def create_message(conversation_id, user_id, content):
    # Verify user is part of conversation
    access_query = """
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = %s AND user_id = %s
    """
    has_access = execute_query(access_query, (conversation_id, user_id), fetch_one=True)
    if not has_access:
        return None

    query = """
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (%s, %s, %s)
        RETURNING 
            id, 
            conversation_id,
            sender_id,
            content,
            is_read,
            created_at,
            updated_at,
            (SELECT CONCAT(prenom, ' ', nom) FROM users WHERE id = %s) as sender_name
    """
    
    result = execute_query(query, (conversation_id, user_id, content, user_id), fetch_one=True)
    if not result:
        return None

    return Message(
        id=result[0],
        conversation_id=result[1],
        sender_id=result[2],
        content=result[3],
        is_read=result[4],
        created_at=result[5],
        updated_at=result[6],
        sender_name=result[7]
    ).to_dict()

def start_conversation(user_id, other_user_id, project_id):
    # Check if conversation already exists
    check_query = """
        SELECT c.id 
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
        WHERE c.project_id = %s
        AND cp1.user_id = %s
        AND cp2.user_id = %s
    """
    existing_conv = execute_query(check_query, (project_id, user_id, other_user_id), fetch_one=True)
    
    if existing_conv:
        return {'id': existing_conv[0]}

    # Create new conversation
    conv_query = """
        INSERT INTO conversations (project_id)
        VALUES (%s)
        RETURNING id
    """
    new_conv = execute_query(conv_query, (project_id,), fetch_one=True)
    
    if not new_conv:
        return None

    # Add participants
    participants_query = """
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (%s, %s), (%s, %s)
    """
    execute_query(participants_query, (new_conv[0], user_id, new_conv[0], other_user_id))
    
    return {'id': new_conv[0]}

def get_project_collaborators(user_id):
    query = """
        WITH user_projects AS (
            SELECT DISTINCT p.id, p.titre
            FROM project p
            LEFT JOIN project_collaborators pc ON p.id = pc.project_id
            WHERE p.createur_id = %s 
            OR pc.user_id = %s
        )
        SELECT 
            up.id as project_id,
            up.titre as project_title,
            json_agg(
                json_build_object(
                    'id', u.id,
                    'prenom', u.prenom,
                    'nom', u.nom,
                    'email', u.email,
                    'role', pc.role,
                    'status', pc.status
                )
            ) as collaborators
        FROM user_projects up
        JOIN project_collaborators pc ON up.id = pc.project_id
        JOIN users u ON pc.user_id = u.id
        WHERE u.id != %s
        GROUP BY up.id, up.titre
        ORDER BY up.titre;
    """
    
    try:
        results = execute_query(query, (user_id, user_id, user_id), fetch_all=True)
        print(f"Debug - Query results: {results}")  # Add this debug line
        
        if not results:
            print("Debug - No results returned")  # Add this debug line
            return []
        
        projects = []
        for row in results:
            project = {
                'project_id': row[0],
                'project_title': row[1],
                'collaborators': row[2]
            }
            projects.append(project)
            
        print(f"Debug - Formatted projects: {projects}")  # Add this debug line
        return projects
        
    except Exception as e:
        print(f"Error in get_project_collaborators: {str(e)}")  # Add this debug line
        return [] 