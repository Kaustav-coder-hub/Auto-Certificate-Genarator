import os
import smtplib
from email.message import EmailMessage
from PIL import Image, ImageDraw, ImageFont
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv
# X: 984, Y: 1101
load_dotenv()

# ----- config -----
TEMPLATE_PATH = "samplecertificate.png"  # exported from Canva without a name
FONT_PATH = "fonts/Calligraphy Brilliant.ttf"   # pick a cursive/brush font to match “Sample”
FONT_SIZE = 75                              # tune to match design
TEXT_COLOR = (20, 30, 60)                    # dark ink color

# Center point where “Sample” sits (measure once, reuse)
CENTER_X, CENTER_Y = 1013, 746              # estimated center for name placement

OUTPUT_DIR = "certificates"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Email
SENDER_EMAIL = os.environ["SENDER_EMAIL"]  # your email
if not SENDER_EMAIL:
    raise ValueError("SENDER_EMAIL is not set in the environment variables.")
SMTP_PASS = os.environ["SMTP_PASS"]          # app password
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SUBJECT = "Your Certificate: From Campus to Code"
BODY = """Hello {first_name},

Thank you for participating in the 2025 Computer Training activities.
Attached is your certificate.

Best,
The JISCE Coding Club
"""

# Google Sheets
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE", "static/serviceAccountKey.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    raise FileNotFoundError(f"Service account file not found: {SERVICE_ACCOUNT_FILE}")
creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
gc = gspread.authorize(creds)

SHEET_URL = "https://docs.google.com/spreadsheets/d/1X3-st3h1W3vJA-8fxmzIMPg0Wy5Ny6TyW0u6yrJag_Y/edit?gid=0#gid=0"
TAB_NAME = "Sheet1"
ws = gc.open_by_url(SHEET_URL).worksheet(TAB_NAME)
rows = ws.get_all_records(expected_headers=["Name", "Email"])

# ----- helpers -----
def render_certificate(name: str, outpath: str):
    img = Image.open(TEMPLATE_PATH).convert("RGBA")
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)

    # measure and center on the chosen point
    bbox = draw.textbbox((0,0), name, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = CENTER_X - text_w // 2
    y = CENTER_Y - text_h // 2

    draw.text((x, y), name, fill=TEXT_COLOR, font=font)
    img.save(outpath, format="PNG")

def send_email(to_email: str, first_name: str, filepath: str):
    msg = EmailMessage()
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg["Subject"] = SUBJECT
    msg.set_content(BODY.format(first_name=first_name))

    with open(filepath, "rb") as f:
        msg.add_attachment(f.read(), maintype="application",
                           subtype="octet-stream",
                           filename=os.path.basename(filepath))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as s:
        s.starttls()
        s.login(SENDER_EMAIL, SMTP_PASS)
        s.send_message(msg)

# ----- batch -----
for r in rows:
    full = str(r.get("Name","")).strip()
    email = str(r.get("Email","")).strip()
    if not full or not email:
        continue
    event_name = "CampusToCode"  # You can set this dynamically if needed
    out = os.path.join(OUTPUT_DIR, f"{event_name}_{full.replace(' ','_')}.png")
    render_certificate(full, out)
    verification_url = "http://localhost:5000"  # Change to your deployed Flask app URL
    # Update email body to include verification link
    custom_body = BODY + f"\n\nTo verify or download your certificate, visit: {verification_url}"
    msg = EmailMessage()
    msg["From"] = SENDER_EMAIL
    msg["To"] = email
    msg["Subject"] = SUBJECT
    msg.set_content(custom_body.format(first_name=full.split()[0]))
    with open(out, "rb") as f:
        msg.add_attachment(f.read(), maintype="application",
                           subtype="octet-stream",
                           filename=os.path.basename(out))
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as s:
        s.starttls()
        s.login(SENDER_EMAIL, SMTP_PASS)
        s.send_message(msg)
