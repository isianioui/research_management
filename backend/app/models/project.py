
class Project:
    def __init__(self, id, titre, description, methodologie_id, createur_id, date_creation, date_fin, statut, calendar_event_id=None, calendar_event_link=None):
        self.id = id
        self.titre = titre
        self.description = description
        self.methodologie_id = methodologie_id
        self.createur_id = createur_id
        self.date_creation = date_creation
        self.date_fin = date_fin
        self.statut = statut
        self.calendar_event_id = calendar_event_id
        self.calendar_event_link = calendar_event_link
   

    def __repr__(self):
        return f"<Project {self.titre}>"
