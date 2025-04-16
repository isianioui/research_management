import secrets
import traceback
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token
from app.models.user import User
from app.utils.auth_utils import generate_jwt_token, verify_google_token, verify_github_token, exchange_github_code
from app.controllers.user_controller import get_user_by_email,create_user, update_user_social, update_user_avatar
from werkzeug.security import check_password_hash

from app.utils.database import execute_query



def login_user(data):
    """
    Handle standard login.
    """
    try:
        user = get_user_by_email(data.get('email'))
        if user and check_password_hash(user.password, data.get('password')):
            token = generate_jwt_token(user.id)
            return {
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'nom': user.nom,
                    'prenom': user.prenom
                }
            }, 200
        return {'message': 'Invalid email or password'}, 401
    except Exception as e:
        return {'message': f'Login failed: {str(e)}'}, 500


# def google_login_user(token_data):
#     """
#     Handle Google login with automatic registration for new users.
#     """
#     decoded_token = verify_google_token(token_data.get('credential'))
#     if not decoded_token:
#         return {'message': 'Invalid token'}, 401

#     email = decoded_token['email']
#     print(f"Looking up user by email: {email}")
    
#     try:
#         user = get_user_by_email(email)
#         if not user:
#             user = create_user(
#                 nom=decoded_token['family_name'],
#                 prenom=decoded_token['given_name'],
#                 email=email,
#                 password=secrets.token_urlsafe(12),
#                 avatar_url=decoded_token.get('picture'),
#                 google_id=decoded_token.get('sub')
#             )
#         else:
#             # Update Google ID and avatar if not set
#             if not user.google_id or not user.avatar_url:
#                 user = update_user_social(
#                     user.id,
#                     google_id=decoded_token.get('sub')
#                 )
#                 if not user.avatar_url:
#                     user = update_user_avatar(user.id, decoded_token.get('picture'))

#         token = create_access_token(identity=user.id)
        
#         return {
#             'message': 'Google login successful',
#             'token': token,
#             'user': {
#                 'id': user.id,
#                 'email': user.email,
#                 'nom': user.nom,
#                 'prenom': user.prenom,
#                 'avatar_url': user.avatar_url,
#                 'has_google': bool(user.google_id),
#                 'has_github': bool(user.github_id)
#             }
#         }, 200
#     except Exception as e:
#         return {'message': f'Login failed: {str(e)}'}, 500
def google_login_user(token_data):
    """
    Handle Google login with automatic registration for new users.
    """
    # Extensive logging
    print("Google Login Request Received")
    print("Token Data Keys:", token_data.keys())
    
    # Extract credential
    credential = token_data.get('credential')
    if not credential:
        print("No credential provided")
        return {'message': 'No credential provided'}, 400
    
    # Verify the token
    try:
        decoded_token = verify_google_token(credential)
        
        # Detailed token verification logging
        if not decoded_token:
            print("Token verification failed")
            return {'message': 'Invalid or expired token'}, 401
        
        # Extract email with comprehensive checks
        email = decoded_token.get('email')
        if not email:
            print("No email found in decoded token")
            return {'message': 'Unable to retrieve email from token'}, 401
        
        # Check email verification
        if not decoded_token.get('email_verified', False):
            print("Email not verified by Google")
            return {'message': 'Email not verified'}, 401
        
        print(f"Attempting to find or create user with email: {email}")
        
        # Get or create user
        query = """
            SELECT id, nom, prenom, email, password, avatar_url, google_id, 
                   profile_image, type, is_invited, invitation_status
            FROM users 
            WHERE email = %s
        """
        user = execute_query(query, (email,), fetch_one=True)

        if user:
            # Update existing user
            update_query = """
                UPDATE users 
                SET google_id = %s,
                    avatar_url = %s,
                    last_login = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, email, nom, prenom, type, profile_image, is_invited, invitation_status
            """
            updated_user = execute_query(
                update_query, 
                (decoded_token.get('sub'), decoded_token.get('picture'), user[0]),
                fetch_one=True
            )

            access_token = create_access_token(identity=updated_user[0])

            return {
                'token': access_token,
                'user': {
                    'id': updated_user[0],
                    'email': updated_user[1],
                    'nom': updated_user[2],
                    'prenom': updated_user[3],
                    'type': updated_user[4],
                    'profile_image': updated_user[5],  # Make sure to include profile_image
                    'is_invited': updated_user[6],
                    'invitation_status': updated_user[7],
                    'avatar_url': decoded_token.get('picture')
                }
            }, 200
        else:
            # Create new user
            insert_query = """
                INSERT INTO users (email, nom, prenom, google_id, avatar_url, type)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, email, nom, prenom, type, profile_image, is_invited, invitation_status
            """
            new_user = execute_query(
                insert_query,
                (email, decoded_token.get('family_name', ''), decoded_token.get('given_name', ''), decoded_token.get('sub'), decoded_token.get('picture'), 'user'),
                fetch_one=True
            )

            access_token = create_access_token(identity=new_user[0])

            return {
                'token': access_token,
                'user': {
                    'id': new_user[0],
                    'email': new_user[1],
                    'nom': new_user[2],
                    'prenom': new_user[3],
                    'type': new_user[4],
                    'profile_image': new_user[5],  # Include profile_image for new users too
                    'is_invited': new_user[6],
                    'invitation_status': new_user[7],
                    'avatar_url': decoded_token.get('picture')
                }
            }, 200

    except Exception as e:
        print(f"Google login error: {str(e)}")
        return {'error': 'Google login failed'}, 401

def google_register(token_data):
    """
    Handle registration using Google authentication.
    """
    decoded_token = verify_google_token(token_data.get('credential'))
    if not decoded_token:
        return {'message': 'Invalid token'}, 401

    email = decoded_token['email']
    prenom = decoded_token['given_name']
    nom = decoded_token['family_name']
    generated_password = secrets.token_urlsafe(12)

    try:
        user = get_user_by_email(email)
        if not user:
            user = create_user(
                nom=nom,
                prenom=prenom,
                email=email,
                password=generated_password
            )
            status_code = 201  # Created
        else:
            status_code = 200  # OK

        token = generate_jwt_token(user.id)
        return {
            'message': 'Google registration successful',
            'token': token,
            'user': {
                'email': email,
                'nom': nom,
                'prenom': prenom
            }
        }, status_code

    except Exception as e:
        return {'message': f'Registration failed: {str(e)}'}, 500

def register_user(data):
    """
    Handle standard registration.
    """
    existing_user = get_user_by_email(data.get('email'))
    if existing_user:
        return {'message': 'Email already exists'}, 409

    try:
        user = create_user(
            nom=data.get('nom'),
            prenom=data.get('prenom'),
            email=data.get('email'),
            password=data.get('password')
        )
        token = generate_jwt_token(user.id)
        return {
            'message': 'Registration successful',
            'token': token
        }, 201
    except Exception as e:
        return {'message': str(e)}, 400

def github_login_user(token_data):
    """
    Handle GitHub login with automatic registration for new users.
    """
    code = token_data.get('code')
    if not code:
        return {'message': 'No authorization code provided'}, 401

    access_token = exchange_github_code(code)
    if not access_token:
        return {'message': 'Failed to exchange code for access token'}, 401

    github_user = verify_github_token(access_token)
    print(f"GitHub user data: {github_user}")  # Debug log
    
    if not github_user:
        return {'message': 'Invalid token or failed to get user info'}, 401

    email = github_user.get('email')
    if not email:
        return {'message': 'No email address available'}, 401

    try:
        user = get_user_by_email(email)
        if not user:
            # Create new user with safe defaults
            user = create_user(
                nom=github_user.get('family_name', 'GitHub'),
                prenom=github_user.get('given_name', 'User'),
                email=email,
                password=secrets.token_urlsafe(12),
                avatar_url=github_user.get('avatar_url'),
                github_id=str(github_user.get('id'))
            )
        else:
            # Always update GitHub ID and avatar
            user = update_user_social(
                user.id,
                github_id=str(github_user.get('id'))
            )
            # Always update to GitHub avatar when logging in with GitHub
            if github_user.get('avatar_url'):
                user = update_user_avatar(user.id, github_user.get('avatar_url'))

        token = create_access_token(identity=user.id)
        
        return {
            'message': 'GitHub login successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'nom': user.nom,
                'prenom': user.prenom,
                'avatar_url': user.avatar_url,
                'has_google': bool(user.google_id),
                'has_github': bool(user.github_id)
            }
        }, 200
    except Exception as e:
        print(f"Login error: {str(e)}")
        return {'message': f'Login failed: {str(e)}'}, 500

def github_register(token_data):
    """
    Handle registration using GitHub authentication.
    """
    decoded_token = verify_github_token(token_data.get('access_token'))
    if not decoded_token:
        return {'message': 'Invalid token'}, 401

    email = decoded_token['email']
    prenom = decoded_token['given_name']
    nom = decoded_token['family_name']
    generated_password = secrets.token_urlsafe(12)

    try:
        user = get_user_by_email(email)
        if not user:
            user = create_user(
                nom=nom,
                prenom=prenom,
                email=email,
                password=generated_password
            )
            status_code = 201  # Created
        else:
            status_code = 200  # OK

        token = generate_jwt_token(user.id)
        return {
            'message': 'GitHub registration successful',
            'token': token,
            'user': {
                'email': email,
                'nom': nom,
                'prenom': prenom
            }
        }, status_code

    except Exception as e:
        return {'message': f'Registration failed: {str(e)}'}, 500
