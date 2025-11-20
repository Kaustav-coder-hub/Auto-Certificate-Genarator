import os
import smtplib
from email.message import EmailMessage
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
# X: 984, Y: 1101
load_dotenv()
import csv

# ----- config -----
TEMPLATE_PATH = "uploads/templates/Sample1.png"  # Predefined base certificate template
FONT_PATH = "fonts/Calligraphy Brilliant.ttf"   # pick a cursive/brush font to match “Sample”
FONT_SIZE = 75                              # tune to match design
TEXT_COLOR = (20, 30, 60)                    # dark ink color

# Center point where “Sample” sits (measure once, reuse)
CENTER_X, CENTER_Y = 1013, 746              # estimated center for name placement

OUTPUT_DIR = "certificates"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Email
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "resume.ai.analyzer@gmail.com")  # default sender email
if not SENDER_EMAIL:
    raise ValueError("SENDER_EMAIL is not set in the environment variables.")
SMTP_PASS = os.getenv("SMTP_PASS")          # Gmail app password
if not SMTP_PASS:
    raise ValueError("SMTP_PASS is not set in the environment variables.")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SUBJECT = "Your Certificate: From Campus to Code"
BODY = """Hello {first_name},

Thank you for participating in the 2025 Computer Training activities.
Attached is your certificate.

Best,
The JISCE Coding Club
"""

 # Load certificate data from local CSV file
CSV_PATH = os.getenv("CSV_PATH", "uploads/csv/certificates.csv")
rows = []
if os.path.exists(CSV_PATH):
    with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            rows.append(row)
else:
    print(f"CSV file not found: {CSV_PATH}")
    exit(1)

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
    
    # Render certificate
    render_certificate(full, out)
    print(f"✓ Generated certificate for {full}")
    
    # Send email with certificate
    first_name = full.split()[0]
    verification_url = "http://localhost:5000"  # Change to your deployed Flask app URL
    custom_body = BODY.format(first_name=first_name) + f"\n\nTo verify or download your certificate, visit: {verification_url}"
    
    msg = EmailMessage()
    msg["From"] = SENDER_EMAIL
    msg["To"] = email
    msg["Subject"] = SUBJECT
    msg.set_content(custom_body)
    
    with open(out, "rb") as f:
        msg.add_attachment(f.read(), maintype="application",
                           subtype="octet-stream",
                           filename=os.path.basename(out))
    
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as s:
            s.starttls()
            s.login(SENDER_EMAIL, SMTP_PASS)
            s.send_message(msg)
        print(f"✓ Sent email to {email}")
    except Exception as e:
        print(f"✗ Failed to send email to {email}: {e}")

print("\n✓ Certificate generation complete!")
