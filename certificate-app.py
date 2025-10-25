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
import secrets
import time

# Load environment variables
load_dotenv()

# Initialize Flask app (explicit templates folder)
app = Flask(__name__, template_folder='templates')
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
# Content Security Policy: allow images from self, data URIs and jsDelivr (used for SVG icons).
# Also allow scripts/styles from Google Firebase and CDNJS where needed for the admin page.
csp = {
    'default-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
    'script-src': ["'self'", 'https://www.gstatic.com', 'https://www.googleapis.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
    'font-src': ["'self'", 'https://cdnjs.cloudflare.com']
}
Talisman(app, content_security_policy=csp, force_https=False)  # Set force_https=True in production
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
SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE", "static/serviceAccountKey.json")
EVENTS = os.getenv("EVENTS", "CampusToCode,PythonWorkshop,DataScience101").split(",")
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# # In-memory certificate database (10 predefined entries)
# CERT_DB = [
#     {"id": 1, "name": "Kaustav Chakraborty", "email": "2004.k.c2@gmail.com", "event": "CampusToCode", "drive_file_id": "abcdef1234567890", "issued_at": "2025-09-01 10:00:00"},
#     {"id": 2, "name": "Bob Smith", "email": "bob.smith@mail.com", "event": "PythonWorkshop", "drive_file_id": "bcdefa2345678901", "issued_at": "2025-09-02 14:00:00"},
#     {"id": 3, "name": "Carol Wills", "email": "carol.wills@mail.com", "event": "DataScience101", "drive_file_id": "cdefab3456789012", "issued_at": "2025-09-03 09:00:00"},
#     {"id": 4, "name": "Dan Brown", "email": "dan.brown@mail.com", "event": "CampusToCode", "drive_file_id": "defabc4567890123", "issued_at": "2025-09-04 16:00:00"},
#     {"id": 5, "name": "Ella Davis", "email": "ella.davis@mail.com", "event": "PythonWorkshop", "drive_file_id": "efabcd5678901234", "issued_at": "2025-09-05 11:00:00"},
#     {"id": 6, "name": "Frank Lee", "email": "frank.lee@mail.com", "event": "DataScience101", "drive_file_id": "fabcde6789012345", "issued_at": "2025-09-06 13:00:00"},
#     {"id": 7, "name": "Grace King", "email": "grace.king@mail.com", "event": "CampusToCode", "drive_file_id": "abcdef7890123456", "issued_at": "2025-09-07 08:00:00"},
#     {"id": 8, "name": "Henry Green", "email": "henry.green@mail.com", "event": "PythonWorkshop", "drive_file_id": "bcdefa8901234567", "issued_at": "2025-09-08 15:00:00"},
#     {"id": 9, "name": "Ivy White", "email": "ivy.white@mail.com", "event": "DataScience101", "drive_file_id": "cdefab9012345678", "issued_at": "2025-09-09 10:00:00"},
#     {"id": 10, "name": "Jake Turner", "email": "jake.turner@mail.com", "event": "CampusToCode", "drive_file_id": "defabc0123456789", "issued_at": "2025-09-10 12:00:00"},
# ]

# In-memory test link store: token -> {drive_file_id, created_at, expires_at, meta}
TEST_LINKS = {}
# Token lifetime in seconds (for testing). Change as needed.
TOKEN_TTL_SECONDS = int(os.getenv('TEST_TOKEN_TTL', 300))  # default 5 minutes

# Database configuration and helpers (SQLite by default, optional MySQL)
DB_TYPE = os.getenv('DB_TYPE', '').lower()  # 'mysql' to use MySQL
MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASS = os.getenv('MYSQL_PASS')
MYSQL_DB = os.getenv('MYSQL_DB')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306)) if os.getenv('MYSQL_PORT') else 3306

import sqlite3

def get_db_connection():
    """Return a DB connection object. Uses MySQL if DB_TYPE=='mysql' and env vars provided; otherwise SQLite file 'certificates.db'."""
    if DB_TYPE == 'mysql' and MYSQL_HOST and MYSQL_USER and MYSQL_DB:
        try:
            import pymysql
        except Exception:
            raise RuntimeError('pymysql is required for MySQL support (pip install pymysql)')
        conn = pymysql.connect(host=MYSQL_HOST, user=MYSQL_USER, password=MYSQL_PASS or '',
                               db=MYSQL_DB, port=MYSQL_PORT, charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
        return conn
    # default sqlite
    conn = sqlite3.connect('certificates.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_cert_table():
    """Create certificates table if missing."""
    if DB_TYPE == 'mysql' and MYSQL_HOST and MYSQL_USER and MYSQL_DB:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS certificates (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        event VARCHAR(255) NOT NULL,
                        drive_file_id VARCHAR(255),
                        issued_at VARCHAR(255),
                        UNIQUE KEY unique_email_event (email, event)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                    """
                )
            conn.commit()
        finally:
            conn.close()
    else:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                '''
                CREATE TABLE IF NOT EXISTS certificates (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    event TEXT NOT NULL,
                    drive_file_id TEXT,
                    issued_at TEXT,
                    UNIQUE(email, event)
                )
                '''
            )
            conn.commit()
        finally:
            conn.close()


def seed_db_from_cert_db():
    """Insert entries from CERT_DB into the database if they don't exist."""
    conn = get_db_connection()
    try:
        if DB_TYPE == 'mysql' and MYSQL_HOST and MYSQL_USER and MYSQL_DB:
            with conn.cursor() as cur:
                for r in CERT_DB:
                    cur.execute(
                        """
                        INSERT IGNORE INTO certificates (id, name, email, event, drive_file_id, issued_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """, (r['id'], r['name'], r['email'], r['event'], r['drive_file_id'], r['issued_at'])
                    )
            conn.commit()
        else:
            cur = conn.cursor()
            for r in CERT_DB:
                try:
                    cur.execute(
                        '''
                        INSERT OR IGNORE INTO certificates (id, name, email, event, drive_file_id, issued_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ''', (r['id'], r['name'], r['email'], r['event'], r['drive_file_id'], r['issued_at'])
                    )
                except Exception:
                    # fallback: try insert without id
                    try:
                        cur.execute(
                            '''
                            INSERT OR IGNORE INTO certificates (name, email, event, drive_file_id, issued_at)
                            VALUES (?, ?, ?, ?, ?)
                            ''', (r['name'], r['email'], r['event'], r['drive_file_id'], r['issued_at'])
                        )
                    except Exception:
                        continue
            conn.commit()
    finally:
        conn.close()


def get_certificate_by_email_event(email, event):
    """Query the database for certificate by email and event. Returns dict or None."""
    conn = get_db_connection()
    try:
        if DB_TYPE == 'mysql' and MYSQL_HOST and MYSQL_USER and MYSQL_DB:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, email, event, drive_file_id, issued_at FROM certificates WHERE LOWER(email)=LOWER(%s) AND event=%s LIMIT 1", (email, event))
                row = cur.fetchone()
                if not row:
                    return None
                return dict(row)
        else:
            cur = conn.cursor()
            cur.execute("SELECT id, name, email, event, drive_file_id, issued_at FROM certificates WHERE LOWER(email)=LOWER(?) AND event=? LIMIT 1", (email, event))
            row = cur.fetchone()
            if not row:
                return None
            return {k: row[k] for k in row.keys()}
    finally:
        conn.close()
    if result:
        drive_file_id = result['drive_file_id']
        participant_name = result['name']
        download_link = f"https://drive.google.com/uc?export=download&id={drive_file_id}"
        
        return render_template('certificate_found.html', 
                             name=participant_name,
                             download_link=download_link)
    else:
        return render_template('download_certificate.html', 
                             error="No certificate found.")

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
    preview_link = None
    
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
            return render_template("admin.html", events=EVENTS, error=error)
        
        try:
            # First, check the configured database for a match (fast), fall back to in-memory CERT_DB
            match = get_certificate_by_email_event(email, event)
            if not match:
                for r in CERT_DB:
                    if r['email'].lower() == email and r['event'] == event:
                        match = r
                        break

            if match:
                # generate a tokenized test download + preview just like the API
                now = time.time()
                # cleanup expired tokens
                for tkn in list(TEST_LINKS.keys()):
                    if TEST_LINKS[tkn]['expires_at'] < now:
                        TEST_LINKS.pop(tkn, None)

                token = secrets.token_urlsafe(16)
                expires_at = now + TOKEN_TTL_SECONDS
                TEST_LINKS[token] = {
                    'drive_file_id': match['drive_file_id'],
                    'created_at': now,
                    'expires_at': expires_at,
                    'meta': {
                        'id': match['id'],
                        'name': match['name'],
                        'email': match['email'],
                        'event': match['event'],
                        'issued_at': match['issued_at']
                    }
                }

                cert_link = url_for('test_download', token=token, _external=False)
                preview_link = url_for('test_preview', token=token, _external=False)
                logger.info(f"Certificate matched in CERT_DB for {email} ({event}); generated token {token}")
            else:
                # If not found in CERT_DB, fall back to Drive search (existing behavior)
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
        cert_link=cert_link,
        preview_link=preview_link
    )


@app.route('/verify', methods=['POST'])
@limiter.limit("20 per minute")
def api_verify():
    """AJAX/JSON API to verify certificate against in-memory CERT_DB"""
    data = request.get_json() or request.form
    email = str(data.get('email', '')).strip().lower()
    event = str(data.get('event', '')).strip()
    if not email or not event:
        return {"status": "error", "message": "Missing email or event"}, 400

    # Query the configured database first, fall back to in-memory CERT_DB for compatibility
    match = get_certificate_by_email_event(email, event)
    if not match:
        for r in CERT_DB:
            if r['email'].lower() == email and r['event'] == event:
                match = r
                break

    if not match:
        return {"status": "not_found", "message": "Certificate not found"}, 404

    # Cleanup expired tokens opportunistically
    now = time.time()
    for tkn in list(TEST_LINKS.keys()):
        if TEST_LINKS[tkn]['expires_at'] < now:
            TEST_LINKS.pop(tkn, None)

    # Generate a secure random token and store mapping in-memory
    token = secrets.token_urlsafe(16)
    expires_at = now + TOKEN_TTL_SECONDS
    TEST_LINKS[token] = {
        'drive_file_id': match['drive_file_id'],
        'created_at': now,
        'expires_at': expires_at,
        'meta': {
            'id': match['id'],
            'name': match['name'],
            'email': match['email'],
            'event': match['event'],
            'issued_at': match['issued_at']
        }
    }

    # Build an external URL to the tokenized download endpoint
    download_url = url_for('test_download', token=token, _external=True)
    # Build a preview URL that renders a quick SVG preview (no Drive access required)
    preview_url = url_for('test_preview', token=token, _external=True)

    return {
        "status": "found",
        "data": {
            "id": match['id'],
            "name": match['name'],
            "email": match['email'],
            "event": match['event'],
            "issued_at": match['issued_at'],
            "download_url": download_url,
            "preview_url": preview_url
        }
    }, 200

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

# Firebase admin login route (initialize only if service account file exists)
if os.path.exists(SERVICE_ACCOUNT_FILE):
    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase admin initialized from %s", SERVICE_ACCOUNT_FILE)
    except Exception as e:
        logger.warning("Firebase admin initialization skipped: %s", e)
else:
    logger.info("Firebase service account file not found (%s) — skipping firebase_admin init.", SERVICE_ACCOUNT_FILE)

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


@app.route('/test-download/<token>')
@limiter.limit("30 per minute")
def test_download(token):
    """Serve a short-lived tokenized test download link. For testing only — this
    redirects to the Drive download URL when the token is valid and not expired.
    """
    record = TEST_LINKS.get(token)
    now = time.time()
    if not record:
        return render_template_string(ERROR_HTML, error="Invalid or expired test link."), 404
    if record['expires_at'] < now:
        # expired
        TEST_LINKS.pop(token, None)
        return render_template_string(ERROR_HTML, error="This test link has expired."), 410

    # Redirect to Drive download URL (still a testing redirect; Drive may require auth)
    drive_file_id = record['drive_file_id']
    drive_url = f"https://drive.google.com/uc?id={drive_file_id}&export=download"
    logger.info(f"Redirecting test token {token} to {drive_url}")
    return redirect(drive_url)


@app.route('/preview/<token>')
@limiter.limit("60 per minute")
def test_preview(token):
        """Render a quick in-browser SVG preview of the certificate using stored metadata.
        This avoids needing Drive access for previewing during tests.
        """
        record = TEST_LINKS.get(token)
        now = time.time()
        if not record:
                return render_template_string(ERROR_HTML, error="Invalid or expired preview link."), 404
        if record['expires_at'] < now:
                TEST_LINKS.pop(token, None)
                return render_template_string(ERROR_HTML, error="This preview link has expired."), 410

        meta = record.get('meta', {})
        name = meta.get('name', 'Participant')
        event = meta.get('event', 'Event')
        issued = meta.get('issued_at', '')

        # Simple SVG certificate template
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700">
            <defs>
                <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0%" stop-color="#4b6cb7" />
                    <stop offset="100%" stop-color="#182848" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="#fff" stroke="#ddd" />
            <rect x="30" y="30" width="940" height="640" rx="16" fill="url(#g1)" opacity="0.08" />
            <text x="500" y="160" font-family="Arial, Helvetica, sans-serif" font-size="36" text-anchor="middle" fill="#222">Certificate of Participation</text>
            <text x="500" y="280" font-family="Georgia, serif" font-size="48" text-anchor="middle" fill="#111">{name}</text>
            <text x="500" y="340" font-family="Arial, Helvetica, sans-serif" font-size="22" text-anchor="middle" fill="#333">has participated in</text>
            <text x="500" y="380" font-family="Arial, Helvetica, sans-serif" font-size="28" text-anchor="middle" fill="#333">{event}</text>
            <text x="500" y="460" font-family="Arial, Helvetica, sans-serif" font-size="18" text-anchor="middle" fill="#555">Issued: {issued}</text>
            <rect x="420" y="500" width="160" height="40" rx="8" fill="#4b6cb7" />
            <text x="500" y="528" font-family="Arial, Helvetica, sans-serif" font-size="16" text-anchor="middle" fill="#fff">Verified</text>
        </svg>'''

        download_url = url_for('test_download', token=token, _external=True)

        html = f"""
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>Certificate Preview</title>
                <style>body{{font-family: Arial, Helvetica, sans-serif; text-align:center; padding:20px}} .card{{display:inline-block; border:1px solid #eee; padding:12px;}}</style>
            </head>
            <body>
                <h2>Certificate Preview</h2>
                <div class="card">{svg}</div>
                <p><a href="{download_url}">Download Certificate</a> • <small>Link expires in {int(record['expires_at']-now)} seconds</small></p>
            </body>
        </html>
        """
        return render_template_string(html)

if __name__ == '__main__':
    # Seed database (create table and insert CERT_DB) — non-fatal on error
    try:
        logger.info("Ensuring certificate table exists and seeding test data...")
        ensure_cert_table()
        seed_db_from_cert_db()
        logger.info("Database seeded with CERT_DB entries (if not already present).")
    except Exception as e:
        logger.warning(f"Database seeding skipped or failed: {e}")

    # Ensure required files exist (keep existing behavior)
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

