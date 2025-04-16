class Message:
    def __init__(self, id, conversation_id, sender_id, content, sender_name=None, 
                 is_read=False, created_at=None, updated_at=None):
        self.id = id
        self.conversation_id = conversation_id
        self.sender_id = sender_id
        self.content = content
        self.sender_name = sender_name
        self.is_read = is_read
        self.created_at = created_at
        self.updated_at = updated_at

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender_name,
            'content': self.content,
            'is_read': self.is_read,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

class Conversation:
    def __init__(self, id, project_id, project_title=None, participants=None, 
                 last_message=None, created_at=None, updated_at=None, unread_count=0):
        self.id = id
        self.project_id = project_id
        self.project_title = project_title
        self.participants = participants or []
        self.last_message = last_message
        self.created_at = created_at
        self.updated_at = updated_at
        self.unread_count = unread_count

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'project_title': self.project_title,
            'participants': [participant.to_dict() for participant in self.participants],
            'last_message': self.last_message.to_dict() if self.last_message else None,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'unread_count': self.unread_count
        }

class ConversationParticipant:
    def __init__(self, id, user_id, prenom, nom, email=None, last_read_at=None):
        self.id = id
        self.user_id = user_id
        self.prenom = prenom
        self.nom = nom
        self.email = email
        self.last_read_at = last_read_at

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'prenom': self.prenom,
            'nom': self.nom,
            'email': self.email,
            'last_read_at': self.last_read_at
        } 