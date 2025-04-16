from flask import Blueprint
from app.controllers.comment_controller import (
    create_comment, 
    get_comment, 
    update_comment, 
    delete_comment,
    get_comments_by_project_id,
    get_comments_by_user_id,
    get_comment_by_project_id_and_user_id
)

comment_bp = Blueprint('comment', __name__)

@comment_bp.route('/comments', methods=['POST'])
def add_comment():
    return create_comment()

@comment_bp.route('/comments/<int:id>', methods=['GET'])
def fetch_comment(id):
    return get_comment(id)

@comment_bp.route('/comments/<int:id>', methods=['PUT'])
def modify_comment(id):
    return update_comment(id)

@comment_bp.route('/comments/<int:id>', methods=['DELETE'])
def remove_comment(id):
    return delete_comment(id)

@comment_bp.route('/comments/project/<int:project_id>', methods=['GET'])
def list_project_comments(project_id):
    return get_comments_by_project_id(project_id)

@comment_bp.route('/comments/user/<int:user_id>', methods=['GET'])
def list_user_comments(user_id):
    return get_comments_by_user_id(user_id)

@comment_bp.route('/comments/project/<int:project_id>/user/<int:user_id>', methods=['GET'])
def get_project_user_comment(project_id, user_id):
    return get_comment_by_project_id_and_user_id(project_id, user_id)
