from flask import Blueprint
from app.controllers.notification_controller import (
    create_notification,
    get_notification,
    update_notification,
    delete_notification,
    get_notifications_by_user,
    mark_notifications_as_lu,
    get_unread_notifications,
    get_all_notifications,
    get_notification_count
)

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/notifications', methods=['POST'])
def add_notification():
    return create_notification()

@notification_bp.route('/notifications/<int:id>', methods=['GET'])
def fetch_notification(id):
    return get_notification(id)

@notification_bp.route('/notifications/<int:id>', methods=['PUT'])
def modify_notification(id):
    return update_notification(id)

@notification_bp.route('/notifications/<int:id>', methods=['DELETE'])
def remove_notification(id):
    return delete_notification(id)

@notification_bp.route('/notifications/user/<int:user_id>', methods=['GET'])
def list_user_notifications(user_id):
    return get_notifications_by_user(user_id)

@notification_bp.route('/notifications/lu/<int:user_id>', methods=['PUT'])
def mark_as_read(user_id):
    return mark_notifications_as_lu(user_id)

@notification_bp.route('/notifications/unread/<int:user_id>', methods=['GET'])
def list_unread_notifications(user_id):
    return get_unread_notifications(user_id)

@notification_bp.route('/notifications/all', methods=['GET'])
def list_all_notifications():
    return get_all_notifications()

@notification_bp.route('/notifications/count/<int:user_id>', methods=['GET'])
def count_notifications(user_id):
    return get_notification_count(user_id)
