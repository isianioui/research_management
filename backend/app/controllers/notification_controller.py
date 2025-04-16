from flask import Blueprint, request, jsonify
from app.models.notification import Notification
from datetime import datetime
from app.utils.database import execute_query

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/notifications', methods=['POST'])
def create_notification():
    data = request.json
    query = """
        INSERT INTO notifications (user_id, type, message, lu, date_creation)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """
    params = (
        data['user_id'],
        data['type'],
        data['message'],
        False,
        datetime.now()
    )
    execute_query(query, params)
    return jsonify({'message': 'Notification created successfully'})

@notification_bp.route('/notifications/<int:id>', methods=['GET'])
def get_notification(id):
    query = "SELECT * FROM notifications WHERE id = %s"
    notification = execute_query(query, (id,), fetch_one=True)
    
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404
        
    return jsonify({
        'id': notification[0],
        'user_id': notification[1],
        'type': notification[2],
        'message': notification[3],
        'lu': notification[4],
        'date_creation': notification[5].isoformat()
    })

@notification_bp.route('/notifications/<int:id>', methods=['PUT'])
def update_notification(id):
    data = request.json
    query = """
        UPDATE notifications 
        SET user_id = %s, type = %s, message = %s, lu = %s
        WHERE id = %s
    """
    params = (
        data.get('user_id'),
        data.get('type'),
        data.get('message'),
        data.get('lu'),
        id
    )
    execute_query(query, params)
    return jsonify({'message': 'Notification updated successfully'})

@notification_bp.route('/notifications/<int:id>', methods=['DELETE'])
def delete_notification(id):
    query = "DELETE FROM notifications WHERE id = %s"
    execute_query(query, (id,))
    return jsonify({'message': 'Notification deleted successfully'})

@notification_bp.route('/notifications/user/<int:user_id>', methods=['GET'])
def get_notifications_by_user(user_id):
    query = "SELECT * FROM notifications WHERE user_id = %s"
    notifications = execute_query(query, (user_id,), fetch_all=True)
    return jsonify([{
        'id': notification[0],
        'user_id': notification[1],
        'type': notification[2],
        'message': notification[3],
        'lu': notification[4],
        'date_creation': notification[5].isoformat()
    } for notification in notifications])

@notification_bp.route('/notifications/lu/<int:user_id>', methods=['PUT'])
def mark_notifications_as_lu(user_id):
    query = "UPDATE notifications SET lu = TRUE WHERE user_id = %s AND lu = FALSE"
    execute_query(query, (user_id,))
    return jsonify({'message': 'Notifications marked as read'})

@notification_bp.route('/notifications/unread/<int:user_id>', methods=['GET'])
def get_unread_notifications(user_id):
    query = "SELECT * FROM notifications WHERE user_id = %s AND lu = FALSE"
    notifications = execute_query(query, (user_id,), fetch_all=True)
    return jsonify([{
        'id': notification[0],
        'user_id': notification[1],
        'type': notification[2],
        'message': notification[3],
        'lu': notification[4],
        'date_creation': notification[5].isoformat()
    } for notification in notifications])

@notification_bp.route('/notifications/all', methods=['GET'])
def get_all_notifications():
    query = "SELECT * FROM notifications"
    notifications = execute_query(query, fetch_all=True)
    return jsonify([{
        'id': notification[0],
        'user_id': notification[1],
        'type': notification[2],
        'message': notification[3],
        'lu': notification[4],
        'date_creation': notification[5].isoformat()
    } for notification in notifications])

@notification_bp.route('/notifications/count/<int:user_id>', methods=['GET'])
def get_notification_count(user_id):
    query = "SELECT COUNT(*) FROM notifications WHERE user_id = %s AND lu = FALSE"
    count = execute_query(query, (user_id,), fetch_one=True)
    return jsonify({'count': count[0]})
