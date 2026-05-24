# SpecCheck Plan

## Purpose
Create a simple Django-based login flow for the existing SpecCheck project that authenticates users against MongoDB and displays a protected view page after successful authentication.

## Current Project State (updated)
- Django project inside `app/` with `manage.py` and `speccheck/` app.
- `docker-compose.yml` starts Django and MongoDB.
- `app/speccheck/login.py` contains a MongoDB authentication helper.
- Views have been refactored into a package: `app/speccheck/views/` with `auth_views.py` and `home_views.py`.
- A legacy copy of the old flat `views.py` is kept as `app/speccheck/views_legacy.py`.
- Templates for `login.html` (and a simple `home.html`) are present under `app/speccheck/templates/`.
- `app/speccheck/urls.py` now routes root (`/`) to the login view and includes `/login/`, `/logout/`, and `/home/`.
- `speccheck` has been added to `INSTALLED_APPS` so app templates are discovered.

## Goals (original + achieved)
1. Provide a simple login UI and POST authentication against MongoDB. (Done)
2. Use Django sessions to track authenticated users. (Done)
3. Protect the home/view page so only logged-in users can access it. (Done)
4. Use the POST→Redirect→GET pattern with Django `messages` for error feedback. (Done)
5. Keep the project simple and maintainable by splitting views into focused modules. (Done)

## Implementation (what was done)
1. Views refactor
   - Created `app/speccheck/views/__init__.py` to expose the main view callables.
   - Split `views` into `auth_views.py` (login/logout, uses `django.contrib.messages`) and `home_views.py` (protected home).
   - Kept `views_legacy.py` as an archived copy of the previous flat module.

2. URL updates
   - Updated `app/speccheck/urls.py` to route `''` and `/login/` to `login_view`, `/logout/` to `logout_view`, and `/home/` to `home`.

3. Templates
   - Added `app/speccheck/templates/login.html` that reads Django `messages` and submits to the login view.
   - Added a simple `home.html` that reads the `username` from session.

4. Authentication flow
   - `authenticate_user` in `app/speccheck/login.py` is used to validate credentials against MongoDB.
   - On failed login the view adds a message via `messages.error(...)` and redirects to the login page (POST→Redirect→GET), preventing repeated error on refresh.

5. Settings
   - `speccheck` was added to `INSTALLED_APPS` so Django will discover `app/speccheck/templates/` when `APP_DIRS` is enabled.

6. Docker / runtime
   - `docker-compose.yml` still starts Django on port 8000 and a MongoDB service; ensure `MONGO_URI` points at the `db` service in compose.

## File Map (current)
- `app/speccheck/login.py` — Mongo auth helper
- `app/speccheck/urls.py` — routes: `login`, `logout`, `home` (root redirects to login)
- `app/speccheck/views/` — package
   - `auth_views.py` — `login_view`, `logout_view` (uses `messages` and PRG)
   - `home_views.py` — `home` (protected, reads session)
   - `__init__.py` — re-exports `login_view`, `logout_view`, `home`
- `app/speccheck/views_legacy.py` — archived flat views
- `app/speccheck/templates/login.html` — login form (uses `messages`)
- `app/speccheck/templates/home.html` — protected home view
- `speccheck_plan.md` — this plan (updated)

## Notes & Next Steps
- This is a minimal, development-only flow. Passwords are matched in plaintext in MongoDB; add hashing (bcrypt/Argon2) before production use.
- Consider adding a seed script or admin UI to create test users in the `users` collection.
- Optionally replace the ad-hoc session key with Django's `auth` system if you want built-in user management later.

### Quick test steps
Run locally with Docker Compose from the repo root:
```powershell
docker compose up --build
```

Open in a browser:
- `http://localhost:8000/` (will load the login page)
- `http://localhost:8000/login/` (explicit login)
- `http://localhost:8000/home/` (protected, redirects to login if not signed in)

To stop services:
```powershell
docker compose down
```

If you want, I can:
- commit these refactor changes to a branch and run tests (if any)
- add a small seed script to insert a test user into MongoDB
- switch `authenticate_user` to check hashed passwords

## For a new developer (quick takeover)
Follow these steps to get the project running and understand where to make changes:

1. Start services (from repo root):
```powershell
docker compose up --build
```

2. Open the app in a browser:
- `http://localhost:8000/` — login page (root redirects to login)
- `http://localhost:8000/login/` — explicit login
- `http://localhost:8000/home/` — protected home (redirects to login if not signed in)

3. Key files and locations (what to edit):
- Authentication helper: `app/speccheck/login.py` (uses `MONGO_URI` and `pymongo`)
- Views package: `app/speccheck/views/`
   - `app/speccheck/views/auth_views.py` — `login_view`, `logout_view` (uses Django `messages` and PRG)
   - `app/speccheck/views/home_views.py` — `home` (protected by session)
   - `app/speccheck/views/__init__.py` — re-exports callables for `urls.py`
- URLs: `app/speccheck/urls.py` — defines routes for login, logout, and home
- Templates: `app/speccheck/templates/login.html` and `app/speccheck/templates/home.html`
- Settings: `app/speccheck/settings.py` — ensure `'speccheck'` is in `INSTALLED_APPS`, `APP_DIRS=True` in `TEMPLATES`, and message middleware is present.

4. Seed a test user (quick methods):
- Using a short Python script (recommended):
```python
from pymongo import MongoClient
cli = MongoClient('mongodb://localhost:27017/')
db = cli['ai_test_db']
db.users.insert_one({'username': 'test', 'password': 'pass'})
```
- Or using the Mongo shell inside the `db` container (if using Docker Compose):
```powershell
docker compose exec db mongo --eval "db.getSiblingDB('ai_test_db').users.insertOne({username: 'test', password: 'pass'})"
```

5. Common quick checks when things fail:
- Template errors: confirm `speccheck` is listed in `INSTALLED_APPS` (so `app/speccheck/templates/` is discovered).
- Messages not appearing: confirm `django.contrib.messages` is in `INSTALLED_APPS` and `django.contrib.messages.middleware.MessageMiddleware` is in `MIDDLEWARE`.
- DB connectivity: ensure `MONGO_URI` points to the compose service `mongodb://db:27017/ai_test_db` (set in `docker-compose.yml`) or adjust for a local dev DB.
- Login refresh showing repeated POST: this was fixed by using POST→Redirect→GET with `django.contrib.messages`.

## Ready-to-go checklist for takeover
- `docker compose up --build` runs without errors
- `http://localhost:8000/` shows the login page
- You can insert a test user into MongoDB and sign in
- `app/speccheck/views/` contains `auth_views.py` and `home_views.py` to edit behavior

If you'd like, I can add a `scripts/seed_mongo.py` script, commit these changes on a branch, or switch `authenticate_user` to use hashed passwords now.
