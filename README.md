# Auto Certificate Generator

A small Flask-based certificate verification and management portal. This project provides a verification UI where users can verify their certificate by email and event, generate short-lived tokenized download links and previews, and an admin area to manage bulk certificate generation and distribution.

This README documents what the project is, what is finished, what's still pending, how to access the site as a normal user and as a developer, and some troubleshooting tips.

---

## Quick summary

- Tech: Python 3.13+, Flask, Jinja2 templates, SQLite (default) or optional MySQL, Google Drive API (service account), Firebase (client-side sign-in), Flask-Limiter, Flask-WTF CSRF, Flask-Talisman.
- Location: project root contains `certificate-app.py`, templates in `templates/`, static CSS in `static/styles1.css`.

## Current status

Completed (implemented):
- Core verification UI at `/` (index) with AJAX `/verify` API.
- Tokenized short-lived download links and SVG preview endpoints (`/test-download/<token>` and `/preview/<token>`).
- Admin UI template at `/admin` (protected via simple session login or Firebase client-side login flow).
- Database helpers with SQLite by default and option for MySQL.
- DB seeding helper (will seed an in-memory sample `CERT_DB` if enabled).
- Google Drive integration code paths (you must configure a Service Account and share the Drive folder with it for Drive lookups/download to work).
- Responsive CSS: `static/styles1.css` updated with a modern admin/sign-in layout.

Partially done / Pending / Recommended next steps:
- Bulk certificate generation implementation (the admin UI has forms and placeholders; the generation pipeline and email delivery are not yet implemented).
- Server-side streaming for private Drive files (a reference implementation exists; decide whether to enable by default).
- Add automated tests and CI workflow.
- Add persistent admin user management (currently saved to `admin_users.json` in the project root — simple file-based storage).
- Production hardening: rate-limit storage backend, WSGI server (gunicorn), HTTPS, secure secret management.

---

## How to use (normal user)

1. Open the verification portal in your browser: http://<host>:5000/ (host/port depends on how app is run).
2. Enter your registered email and select the event from the dropdown.
3. Click "Verify & Get Certificate".
   - If found, the page will show a short-lived download URL and a preview link.
   - Preview shows an inline SVG preview and a download link.

Admin access:
- Click "Generate Bulk Website" on the index page which navigates to the admin route (`/admin`).
- If not authenticated, you will see sign-up/login options. You can sign up using the provided form (stored in `admin_users.json`) or sign-in using Firebase social providers (client-side flow; the token is POSTed to `/admin/firebase-login`).

---

## How to run (developer)

Prerequisites:
- Python 3.11+ (project uses Python 3.13 in the virtualenv in repo but 3.11+ should work).
- Create and activate a virtual environment or use the provided `auto-certi-env` if present.

Install dependencies:

```bash
# using the project's virtualenv if you have it
source auto-certi-env/bin/activate
pip install -r requirements.txt
```

Environment variables (important):
- `SERVICE_ACCOUNT_FILE` - path to Google service account JSON (default `static/serviceAccountKey.json`). Required for Drive operations and Firebase admin initialisation.
- `DRIVE_FOLDER_ID` - Drive folder ID where certificate files live.
- `DB_TYPE` - set to `mysql` to use MySQL (optional). If unset, SQLite (`certificates.db`) is used.
- `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASS`, `MYSQL_DB`, `MYSQL_PORT` - MySQL connection details (if using MySQL).
- `TEST_TOKEN_TTL` - token lifetime in seconds for the generated test links (default 300).
- `SECRET_KEY` - flask secret key (recommended to override the default in production).
- `PORT` - port to run the app on (default 5000).

Run the app (development):

```bash
source auto-certi-env/bin/activate
python certificate-app.py
```

The app will attempt to seed the DB from an in-memory `CERT_DB` (if present). By default the code currently sets `CERT_DB = 'certificates.db'` (a filename) — this prevents auto-seeding. To seed sample data, uncomment and enable the `CERT_DB` list near the top of `certificate-app.py` (there's a commented sample list with 10 example entries). After seeding and server start, visit `http://127.0.0.1:5000/`.

API endpoints of interest for developers:
- `GET /` — index page
- `POST /verify` — AJAX JSON verification endpoint; request JSON: {"email": "...", "event": "..."}
- `GET /test-download/<token>` — redirect to Drive download (short-lived)
- `GET /preview/<token>` — inline SVG preview page
- `GET /admin` — admin UI
- `POST /admin/signup`, `POST /admin/login` — admin sign-up/login (form posts)
- `POST /admin/firebase-login` — receives Firebase idToken and creates a server-side session
- `GET /health` — health check for Drive connectivity
- `GET /stats` — basic app stats

---

## Google Drive & Service Account setup (short)

1. Create a Google Cloud project and enable the Google Drive API.
2. Create a Service Account and generate a JSON key file.
3. Share the Drive folder that contains certificates with the service account email (so it can list/search inside that folder).
4. Set `SERVICE_ACCOUNT_FILE` to the path of the JSON key file (or place it at `static/serviceAccountKey.json`). Set `DRIVE_FOLDER_ID` in environment variables or .env.

Example file-share flow: share the folder in Drive -> Add the service-account-email@...iam.gserviceaccount.com as a viewer/editor for that folder.

---

## Troubleshooting & notes

- If you see a template URL build error for `url_for('admin')`, the app registers the admin route endpoint as `admin`. If you changed the view name, ensure the endpoint name matches the template call, or use `url_for('admin_dashboard')` depending on your route registration.
- Startup message `Skipping DB seeding: CERT_DB is not an in-memory list` is normal if `CERT_DB` points to the SQLite filename. To seed sample records, set `CERT_DB` to the in-memory list of dicts (uncomment the sample in `certificate-app.py`).
- If Drive API calls return 403, ensure the service account JSON is valid and the folder is shared with the service account.
- Missing package error (e.g., `ModuleNotFoundError: No module named 'flask_talisman'`) — install dependencies with `pip install -r requirements.txt` inside the project venv.

---

## Contributing & development notes

- Branching: create feature branches (e.g., `feature/bulk-generation`) and open PRs into `main` or your chosen integration branch.
- Tests: none included yet — please add unit tests for the verification API and the token lifecycle.
- Next recommended items:
  - Implement bulk-generation pipeline and email delivery.
  - Add server-side streaming for Drive downloads (to support private files without public sharing).
  - Add production-ready configuration: worker WSGI server, HTTPS, config file for secrets.

---

If you'd like, I can (a) enable the sample `CERT_DB` data so the app seeds sample certificates automatically, (b) implement server-side Drive streaming as the default download behavior, or (c) add a small health-check script and a minimal test. Tell me which and I'll implement it next.

--
Generated by the project maintainer helper on 2025-10-26
