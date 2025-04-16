class Comment:
    def __init__(self, id, project_id, user_id, contenu, date_creation, etape, statut):
        self.id = id
        self.project_id = project_id
        self.user_id = user_id
        self.contenu = contenu
        self.date_creation = date_creation
        self.etape = etape
        self.statut = statut

    def __repr__(self):
        return f"<Comment {self.id}>"
