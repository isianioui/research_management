from app.utils.database import execute_query
from datetime import datetime

class Contact:
    @staticmethod
    def create(name, email, message):
        query = """
            INSERT INTO contacts (name, email, message, created_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """
        execute_query(query, (name, email, message, datetime.now()))

    @staticmethod
    def get_all():
        query = "SELECT * FROM contacts ORDER BY created_at DESC"
        return execute_query(query, fetch_all=True)
