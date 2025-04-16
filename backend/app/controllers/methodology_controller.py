from flask import jsonify
from app.models.methodology import Methodology
from app.utils.database import execute_query


def get_methodology_by_id(methodology_id):
    """Retrieves a methodology by its ID."""
    query = "SELECT id, nom, description FROM methodologies WHERE id = %s"
    methodology_data = execute_query(query, (methodology_id,), fetch_one=True)
    
    if methodology_data:
        return Methodology(*methodology_data)
    return None

def get_all_methodologies():
    """Retrieves all methodologies from the database."""
    query = "SELECT id, nom, description FROM methodologies"
    methodologies_data = execute_query(query, fetch_all=True)
    
    return [Methodology(*data) for data in methodologies_data]

