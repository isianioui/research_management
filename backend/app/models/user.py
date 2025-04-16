from werkzeug.security import check_password_hash

class User:
    def __init__(self, id, nom, prenom, email, password, type, avatar_url=None, 
                 google_id=None, github_id=None, last_login=None, profile_image=None, 
                 is_invited=False, invitation_status=None):
        self.id = id
        self.nom = nom
        self.prenom = prenom
        self.email = email
        self.password = password
        self.type = type
        self.avatar_url = avatar_url
        self.google_id = google_id
        self.github_id = github_id
        self.last_login = last_login
        self.profile_image = profile_image
        self.is_invited = is_invited
        self.invitation_status = invitation_status

    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'prenom': self.prenom,
            'email': self.email,
            'type': self.type,
            'avatar_url': self.avatar_url,
            'profile_image': self.profile_image,
            'is_invited': self.is_invited,
            'invitation_status': self.invitation_status,
            'has_google': bool(self.google_id),
            'has_github': bool(self.github_id)
        }

    @staticmethod
    def hash_password(password):
        from werkzeug.security import generate_password_hash
        return generate_password_hash(password)

    def get_profile_image(self):
        return self.profile_image

 

