# Fix Firebase auth/internal-error

## The Problem
`Firebase: Error (auth/internal-error)` typically means your domain is not authorized in Firebase Console.

## Solution: Add Authorized Domains

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Select project: **certificate-management-6710c**

### Step 2: Navigate to Authentication Settings
1. Click **Authentication** in left sidebar
2. Click **Settings** tab
3. Scroll down to **Authorized domains** section

### Step 3: Add Your Domains
You should see these domains already added:
- `localhost` ✅
- `certificate-management-6710c.firebaseapp.com` ✅

**ADD THESE if missing:**
- `127.0.0.1`
- `10.202.23.190` (your local network IP)

### Step 4: How to Add a Domain
1. Click **Add domain** button
2. Enter the domain (e.g., `127.0.0.1`)
3. Click **Add**
4. Repeat for any other local IPs you use

### Step 5: Check Current Domains
Run this test to see what domain Firebase sees:
```bash
cd /run/media/kaustav/Media/Project/Auto-Certificate-Genarator
# Start Flask if not running
./auto-certi-env/bin/python certificate-app.py &
# Open test page
xdg-open http://127.0.0.1:5000/test_firebase_auth.html
```

## Alternative: Use localhost instead of 127.0.0.1

If adding domains doesn't work, try accessing via `localhost`:
- Instead of: `http://127.0.0.1:5000/login`
- Use: `http://localhost:5000/login`

## Common Causes of auth/internal-error:

1. ❌ **Domain not authorized** (most common)
2. ❌ **API Key restrictions** - Check if API key is restricted
3. ❌ **OAuth consent screen not configured**
4. ❌ **Google provider not enabled** (but you showed it's enabled)
5. ❌ **Browser blocking third-party cookies**

## Check API Key Settings:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select project: **certificate-management-6710c**
3. Go to **APIs & Services** > **Credentials**
4. Find API key: `AIzaSyDoqtK-CAMYjDy8jb4ASlqCad_ehqRzKkw`
5. Check if it has **Application restrictions**:
   - Should be: **None** (or include your domains)

## Check OAuth Consent Screen:

1. In Firebase Console, go to **Authentication**
2. Click **Settings** > **OAuth redirect domains**
3. Verify these are present:
   - `localhost`
   - `127.0.0.1`
   - `certificate-management-6710c.firebaseapp.com`

## Test in Different Browser

Sometimes browser extensions or privacy settings block OAuth:
- Try in **Incognito/Private mode**
- Try different browser (Chrome, Firefox, Edge)
- Disable ad blockers temporarily

## Check Browser Console

Open browser DevTools (F12) and check:
1. **Console tab** - for detailed error messages
2. **Network tab** - filter by "token" or "auth" to see failed requests
3. Look for CORS errors or blocked requests

---

After following these steps, refresh your page and try Google sign-in again.
