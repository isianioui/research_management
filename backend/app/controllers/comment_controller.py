from flask import Blueprint, request, jsonify
from app.models.comment import Comment
from datetime import datetime
from app.utils.database import execute_query

comment_bp = Blueprint('comment', __name__)

@comment_bp.route('/comments', methods=['POST'])
def create_comment():
    data = request.json
    query = """
        INSERT INTO commentaires (project_id, user_id, contenu, date_creation, etape, statut)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """
    params = (
        data['project_id'],
        data['user_id'],
        data['contenu'],
        datetime.now(),
        data['etape'],
        'actif'
    )
    execute_query(query, params)
    return jsonify({'message': 'Comment created successfully'})

@comment_bp.route('/comments/<int:id>', methods=['GET'])
def get_comment(id):
    query = "SELECT * FROM commentaires WHERE id = %s"
    comment = execute_query(query, (id,), fetch_one=True)
    
    if not comment:
        return jsonify({'message': 'Comment not found'}), 404
        
    return jsonify({
        'id': comment[0],
        'project_id': comment[1],
        'user_id': comment[2],
        'contenu': comment[3],
        'date_creation': comment[4],
        'etape': comment[5],
        'statut': comment[6]
    })


@comment_bp.route('/comments/<int:id>', methods=['PUT'])
def update_comment(id):
    # First get existing comment data
    get_query = "SELECT * FROM commentaires WHERE id = %s"
    existing_comment = execute_query(get_query, (id,), fetch_one=True)
    
    if not existing_comment:
        return jsonify({'message': 'Comment not found'}), 404
    
    data = request.json
    query = """
        UPDATE commentaires 
        SET project_id = %s, 
            user_id = %s, 
            contenu = %s, 
            etape = %s, 
            statut = %s
        WHERE id = %s
    """
    params = (
        data.get('project_id', existing_comment[1]),
        data.get('user_id', existing_comment[2]),
        data.get('contenu', existing_comment[3]),
        data.get('etape', existing_comment[5]),
        data.get('statut', existing_comment[6]),
        id
    )
    execute_query(query, params)
    return jsonify({'message': 'Comment updated successfully'})



# @comment_bp.route('/comments/<int:id>', methods=['PUT'])
# def update_comment(id):
#     data = request.json
#     query = """
#         UPDATE commentaires 
#         SET project_id = %s, user_id = %s, contenu = %s, 
#             etape = %s, statut = %s
#         WHERE id = %s
#     """
#     params = (
#         data.get('project_id'),
#         data.get('user_id'),
#         data.get('contenu'),
#         data.get('etape'),
#         data.get('statut'),
#         id
#     )
#     execute_query(query, params)
#     return jsonify({'message': 'Comment updated successfully'})

@comment_bp.route('/comments/<int:id>', methods=['DELETE'])
def delete_comment(id):
    query = "DELETE FROM commentaires WHERE id = %s"
    execute_query(query, (id,))
    return jsonify({'message': 'Comment deleted successfully'})

@comment_bp.route('/comments/project/<int:project_id>', methods=['GET'])
def get_comments_by_project_id(project_id):
    query = "SELECT * FROM commentaires WHERE project_id = %s"
    comments = execute_query(query, (project_id,), fetch_all=True)
    return jsonify([{
        'id': comment[0],
        'project_id': comment[1],
        'user_id': comment[2],
        'contenu': comment[3],
        'date_creation': comment[4],
        'etape': comment[5],
        'statut': comment[6]
    } for comment in comments])

@comment_bp.route('/comments/user/<int:user_id>', methods=['GET'])
def get_comments_by_user_id(user_id):
    query = "SELECT * FROM commentaires WHERE user_id = %s"
    comments = execute_query(query, (user_id,), fetch_all=True)
    return jsonify([{
        'id': comment[0],
        'project_id': comment[1],
        'user_id': comment[2],
        'contenu': comment[3],
        'date_creation': comment[4],
        'etape': comment[5],
        'statut': comment[6]
    } for comment in comments])

@comment_bp.route('/comments/project/<int:project_id>/user/<int:user_id>', methods=['GET'])
def get_comment_by_project_id_and_user_id(project_id, user_id):
    query = "SELECT * FROM commentaires WHERE project_id = %s AND user_id = %s"
    comment = execute_query(query, (project_id, user_id), fetch_one=True)
    
    if comment:
        return jsonify({
            'id': comment[0],
            'project_id': comment[1],
            'user_id': comment[2],
            'contenu': comment[3],
            'date_creation': comment[4],
            'etape': comment[5],
            'statut': comment[6]
        })
    return jsonify({'message': 'Comment not found'}), 404
