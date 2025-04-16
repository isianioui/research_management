
from flask_mail import Mail, Message

mail = Mail()

def send_contact_notification(contact_data):
    msg = Message(
        'New Contact Form Submission',
        sender='doha.isianioui@gmail.com',
        recipients=['doha.isianioui@gmail.com']
    )
    msg.body = f"""
    New message from your website contact form:
   
    From: {contact_data['name']} ({contact_data['email']})
    Message: {contact_data['message']}
    """
    mail.send(msg)

def send_email(to, subject, body, html=None):
    msg = Message(
        subject=subject,
        sender='doha.isianioui@gmail.com',
        recipients=[to]
    )
    msg.body = body
    if html:
        msg.html = html
    mail.send(msg)
    return True
