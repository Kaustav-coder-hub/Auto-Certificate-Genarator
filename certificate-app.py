# Complete Flask Certificate Verification Application
from flask import Flask, render_template, request, render_template_string, redirect, url_for, session, flash
from flask_talisman import Talisman
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import logging
from functools import wraps
from dotenv import load_dotenv
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from flask import request, session, jsonify

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this')

# Path to admin user data file
ADMIN_USERS_FILE = 'admin_users.json'

import json
import hashlib

def load_admin_users():
    if not os.path.exists(ADMIN_USERS_FILE):
        return {}
    with open(ADMIN_USERS_FILE, 'r') as f:
        return json.load(f)

def save_admin_users(users):
    with open(ADMIN_USERS_FILE, 'w') as f:
        json.dump(users, f)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Security configurations
Talisman(app, force_https=False)  # Set to True in production
csrf = CSRFProtect(app)

# Rate limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID", "1y-IZ41vP_OdGIGxTg0skWO-YHox8Vyhd")
SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE", "trackbot-56f02-466007-4bc2606df4b9.json")
EVENTS = os.getenv("EVENTS", "CampusToCode,PythonWorkshop,DataScience101").split(",")
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Error HTML template
ERROR_HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>Error</title>
</head>
<body style="font-family: Arial; text-align: center; padding: 50px;">
    <h1>Error</h1>
    <p>{{ error }}</p>
    <a href="/" style="color: #007bff;">← Return to Certificate Verification</a>
</body>
</html>
'''

# Error handling decorator
def handle_drive_api_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except FileNotFoundError:
            logger.error("Service account file not found")
            return render_template_string(ERROR_HTML, 
                error="Configuration error. Please contact administrator."), 500
        except Exception as e:
            logger.error(f"Drive API error: {str(e)}")
            return render_template_string(ERROR_HTML, 
                error="Certificate verification service temporarily unavailable. Please try again later."), 503
    return decorated_function

@app.route('/', methods=['GET', 'POST'])
@limiter.limit("10 per minute")  # Prevent abuse
@handle_drive_api_errors
def verify():
    error = None
    cert_link = None
    
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        event = request.form.get('event', '').strip()
        
        # Input validation
        if not email or not event:
            error = "Please fill in all required fields"
            return render_template("index.html", events=EVENTS, error=error)
        
        # Basic email validation
        if '@' not in email or '.' not in email.split('@')[1]:
            error = "Please enter a valid email address"
            return render_template("index.html", events=EVENTS, error=error)

        # Event validation
        if event not in EVENTS:
            error = "Invalid event selected"
            return render_template("index.html", events=EVENTS, error=error)
        
        try:
            # Initialize Google Drive service
            creds = Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            drive_service = build('drive', 'v3', credentials=creds)
            
            # Generate possible certificate filenames
            email_part = email.split('@')[0].replace('.', '_').replace('+', '_')
            possible_filenames = [
                f"{event}_{email_part}.png",
                f"{event}_{email_part}.pdf",
                f"{email_part}_{event}.png",
                f"{email_part}_{event}.pdf",
                f"{event}-{email_part}.png",
                f"{event}-{email_part}.pdf",
            ]
            
            # Search for certificate in Google Drive
            certificate_found = False
            for filename in possible_filenames:
                query = f"name='{filename}' and '{DRIVE_FOLDER_ID}' in parents and trashed=false"
                
                try:
                    results = drive_service.files().list(
                        q=query, 
                        fields="files(id, name, mimeType, size)",
                        pageSize=10
                    ).execute()
                    
                    items = results.get('files', [])
                    if items:
                        file_info = items[0]
                        file_id = file_info['id']
                        
                        # Generate download link
                        cert_link = f"https://drive.google.com/uc?id={file_id}&export=download"
                        
                        logger.info(f"Certificate found: {filename} for email: {email} in event: {event}")
                        certificate_found = True
                        break
                        
                except Exception as e:
                    logger.error(f"Error searching for {filename}: {str(e)}")
                    continue
            
            if not certificate_found:
                error = "No certificate found for this email and event combination. Please check your email address and event selection."
                logger.info(f"No certificate found for email: {email} in event: {event}")
                
        except FileNotFoundError:
            error = "Service configuration error. Please contact support."
            logger.error("Service account file not found")
        except Exception as e:
            logger.error(f"Unexpected error during certificate verification: {str(e)}")
            error = "An unexpected error occurred. Please try again later or contact support."
    
    return render_template(
        "index.html",
        events=EVENTS,
        error=error,
        cert_link=cert_link
    )

@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test Drive API connection
        creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        drive_service = build('drive', 'v3', credentials=creds)
        
        # Simple API test
        drive_service.files().list(pageSize=1).execute()
        
        return {"status": "healthy", "service": "certificate-verification"}, 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}, 503

@app.route('/stats')
def stats():
    """Basic statistics endpoint (for admin use)"""
    return {
        "available_events": EVENTS,
        "drive_folder_id": DRIVE_FOLDER_ID,
        "service_status": "running"
    }

@app.route('/bulk-generate')
def bulk_generate():
    return render_template_string("""
    <h2>Bulk Certificate Generation</h2>
    <p>This feature will allow admins to generate certificates for all participants at once.</p>
    <a href="/">← Back to Verification Portal</a>
    """)

@app.route('/admin')
def admin_dashboard():
    return render_template('admin.html')

# Admin login route
@app.route('/admin/login', methods=['POST'])
def admin_login():
    email = request.form.get('email', '').strip().lower()
    password = request.form.get('password', '')
    users = load_admin_users()
    hashed = hash_password(password)
    if email in users and users[email]['password'] == hashed:
        session['admin_authenticated'] = True
        session['admin_email'] = email
        flash('Login successful!', 'success')
        return redirect(url_for('admin_dashboard'))
    else:
        flash('Invalid email or password.', 'error')
        return redirect(url_for('admin_dashboard'))

# Admin signup route
@app.route('/admin/signup', methods=['POST'])
def admin_signup():
    email = request.form.get('email', '').strip().lower()
    password = request.form.get('password', '')
    users = load_admin_users()
    if email in users:
        flash('Email already registered.', 'error')
        return redirect(url_for('admin_dashboard'))
    users[email] = {
        'password': hash_password(password)
    }
    save_admin_users(users)
    session['admin_authenticated'] = True
    session['admin_email'] = email
    flash('Signup successful! You are now logged in.', 'success')
    return redirect(url_for('admin_dashboard'))

# Admin logout route
@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_authenticated', None)
    session.pop('admin_email', None)
    flash('Logged out successfully.', 'success')
    return redirect(url_for('admin_dashboard'))

# Firebase admin login route
cred = credentials.Certificate('static/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

@app.route('/admin/firebase-login', methods=['POST'])
def admin_firebase_login():
    data = request.get_json()
    id_token = data.get('idToken')
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        session['admin_authenticated'] = True
        session['admin_email'] = decoded_token.get('email')
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 401

@app.errorhandler(404)
def page_not_found(e):
    return render_template_string('''
    <!DOCTYPE html>
    <html><head><title>Page Not Found</title></head>
    <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/" style="color: #007bff;">← Return to Certificate Verification</a>
    </body></html>
    '''), 404

@app.errorhandler(429)
def rate_limit_handler(e):
    return render_template_string('''
    <!DOCTYPE html>
    <html><head><title>Rate Limited</title></head>
    <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Too Many Requests</h1>
        <p>Please wait a moment before trying again.</p>
        <a href="/" style="color: #007bff;">← Return to Certificate Verification</a>
    </body></html>
    '''), 429

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return render_template_string(ERROR_HTML, 
        error="Internal server error. Please try again later."), 500

if __name__ == '__main__':
    # Ensure required files exist
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        logger.error(f"Service account file not found: {SERVICE_ACCOUNT_FILE}")
        print(f"ERROR: Service account file '{SERVICE_ACCOUNT_FILE}' not found!")
        print("Please ensure the Google Service Account JSON file is in the same directory.")
        exit(1)
    
    # Validate environment variables
    if not DRIVE_FOLDER_ID:
        logger.error("DRIVE_FOLDER_ID not configured")
        print("ERROR: DRIVE_FOLDER_ID not configured!")
        exit(1)
    
    # Run the application
    app.run(
        debug=os.getenv('FLASK_ENV') == 'development',
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000))
    )

