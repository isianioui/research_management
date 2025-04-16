# app/models/methodology.py

class Methodology:
    def __init__(self, id, nom, description):
        self.id = id
        self.nom = nom
        self.description = description

    def __repr__(self):
        return f"<Methodology {self.nom}>"
