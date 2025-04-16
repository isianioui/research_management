class Notification:
    def __init__(self, id, user_id, type, message, lu, date_creation):
        self.id = id
        self.user_id = user_id
        self.type = type
        self.message = message
        self.lu = lu
        self.date_creation = date_creation

    def __repr__(self):
        return f"<Notification {self.id}>"
