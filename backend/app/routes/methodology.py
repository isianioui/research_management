
from flask import Blueprint, jsonify
from app.controllers.methodology_controller import get_all_methodologies, get_methodology_by_id

methodology_bp = Blueprint('methodology_bp', __name__)

@methodology_bp.route('/methodologies', methods=['GET'])
def list_methodologies():
    methodologies = get_all_methodologies()
    return jsonify([methodology.__dict__ for methodology in methodologies])

@methodology_bp.route('/methodology/<int:methodology_id>', methods=['GET'])
def methodology_detail(methodology_id):
    methodology = get_methodology_by_id(methodology_id)
    if methodology:
        return jsonify(methodology.__dict__)
    return jsonify({"message": "Methodology not found"}), 404
