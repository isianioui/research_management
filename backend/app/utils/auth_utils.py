from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import jwt
from datetime import datetime, timedelta
import requests
import traceback
from app.config import Config
import uuid
GOOGLE_CLIENT_ID = "your google_client_id"
SECRET_KEY = Config.JWT_SECRET_KEY
GITHUB_CLIENT_ID = "your_github_client_id"
GITHUB_CLIENT_SECRET ="your_github_client_secret"


def verify_google_token(token):
    try:
        print("Starting Google token verification")
        print(f"Token length: {len(token)}")
        print(f"First 50 chars of token: {token[:50]}")
        
        # Verify the token
        request = google_requests.Request()
        
        # Detailed verification
        idinfo = id_token.verify_oauth2_token(
            token, 
            request, 
            GOOGLE_CLIENT_ID
        )
        
        # Additional validation
        if 'aud' not in idinfo or idinfo['aud'] != GOOGLE_CLIENT_ID:
            print("Token audience validation failed")
            print(f"Expected audience: {GOOGLE_CLIENT_ID}")
            print(f"Actual audience: {idinfo.get('aud')}")
            return None
        
        # Log successful verification details
        print("Token verification successful")
        print("Token payload details:")
        for key, value in idinfo.items():
            print(f"{key}: {value}")
        
        # Return structured user info
        return {
            'sub': idinfo.get('sub'),
            'email': idinfo.get('email'),
            'email_verified': idinfo.get('email_verified', False),
            'given_name': idinfo.get('given_name', ''),
            'family_name': idinfo.get('family_name', ''),
            'picture': idinfo.get('picture', ''),
            'name': idinfo.get('name', ''),
            'is_invited': False,  # Default to False for Google login
            'invitation_status': None
        }
    except ValueError as ve:
        print("Google token verification ValueError:")
        print(f"Error details: {str(ve)}")
        print("Traceback:")
        traceback.print_exc()
        return None
    except Exception as e:
        print("Unexpected error during Google token verification:")
        print(f"Error details: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        return None

def generate_jwt_token(user_id, email=None, nom=None, prenom=None):
    """Generate a JWT token with user information."""
    now = datetime.utcnow()
    token_data = {
        'fresh': False,
        'iat': int(now.timestamp()),
        'jti': str(uuid.uuid4()),
        'type': 'access',
        'sub': str(user_id),
        'nbf': int(now.timestamp()),
        'exp': int((now + timedelta(days=1)).timestamp()),
        'email': email,
        'nom': nom,
        'prenom': prenom
    }
    return jwt.encode(token_data, SECRET_KEY, algorithm='HS256')

def exchange_github_code(code):
    """
    Exchange the GitHub authorization code for an access token
    """
    try:
        print(f"Exchanging GitHub code: {code}")
        response = requests.post(
            'https://github.com/login/oauth/access_token',
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            json={
                'client_id': GITHUB_CLIENT_ID,
                'client_secret': GITHUB_CLIENT_SECRET,
                'code': code,
                'redirect_uri': 'http://localhost:5173/auth/github/callback'
            }
        )
        print(f"GitHub token exchange response status: {response.status_code}")
        print(f"GitHub token exchange response: {response.text}")
        
        if response.status_code != 200:
            print(f"GitHub error: Status {response.status_code} - {response.text}")
            return None
            
        data = response.json()
        if 'error' in data:
            print(f"GitHub API error: {data['error']} - {data.get('error_description', '')}")
            return None
            
        access_token = data.get('access_token')
        if not access_token:
            print("No access token in response")
            print("Full response data:", data)
            return None
            
        return access_token
    except Exception as e:
        print(f"Error exchanging GitHub code: {str(e)}")
        return None

def verify_github_token(access_token):
    """
    Verify GitHub access token and get user information.
    """
    try:
        headers = {
            'Authorization': f'token {access_token}',
            'Accept': 'application/json'
        }
        
        # Get user profile
        print("Fetching GitHub user profile...")
        user_response = requests.get('https://api.github.com/user', headers=headers)
        print(f"GitHub user response status: {user_response.status_code}")
        print(f"GitHub user response: {user_response.text}")
        
        if user_response.status_code != 200:
            print(f"GitHub user error: {user_response.text}")
            return None
            
        user_data = user_response.json()
        
        # Get user email
        print("Fetching GitHub user emails...")
        email_response = requests.get('https://api.github.com/user/emails', headers=headers)
        print(f"GitHub email response status: {email_response.status_code}")
        
        email = None
        if email_response.status_code == 200:
            emails = email_response.json()
            primary_email = next((email for email in emails if email.get('primary')), None)
            email = primary_email.get('email') if primary_email else None
        
        return {
            'id': str(user_data.get('id')),
            'email': email or user_data.get('email'),
            'given_name': user_data.get('name', '').split()[0] if user_data.get('name') else '',
            'family_name': ' '.join(user_data.get('name', '').split()[1:]) if user_data.get('name') else '',
            'avatar_url': user_data.get('avatar_url'),
            'is_invited': False,  # Default to False for GitHub login
            'invitation_status': None
        }
    except Exception as e:
        print(f"Error verifying GitHub token: {str(e)}")
        return None
