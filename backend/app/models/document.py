class Document:
    def __init__(self, id, project_id, user_id, nom_fichier, chemin_fichier, type, date_upload):
        self.id = id
        self.project_id = project_id
        self.user_id = user_id
        self.nom_fichier = nom_fichier
        self.chemin_fichier = chemin_fichier
        self.type = type
        self.date_upload = date_upload

    def __repr__(self):
        return f"<Document {self.nom_fichier}>"
