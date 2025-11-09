# Firebase Google & GitHub OAuth Setup Guide

## ✅ Current Status

Your authentication system now has:
- ✅ Email/Password authentication (local storage)
- ✅ Firebase Admin SDK initialized
- ✅ Google OAuth configured
- ✅ GitHub OAuth configured
- ✅ CSP headers updated for Firebase
- ✅ OAuth buttons on login and signup pages

## 🔧 Required Firebase Console Setup

### Step 1: Add Authorized Domains

**CRITICAL**: Firebase will block auth if your domain isn't authorized!

1. Go to: https://console.firebase.google.com/project/certificate-management-6710c/authentication/settings
2. Scroll to **"Authorized domains"** section
3. **Add these domains** (click "Add domain" for each):
   - `localhost` ✅ (should already be there)
   - `127.0.0.1` ⚠️ **ADD THIS**
   - `10.202.23.190` ⚠️ **ADD THIS** (your local network IP)

### Step 2: Verify Providers Are Enabled

1. Go to: https://console.firebase.google.com/project/certificate-management-6710c/authentication/providers
2. Check that these are **Enabled**:
   - ✅ Email/Password
   - ✅ Google
   - ✅ GitHub

## 🧪 Testing Instructions

### Test Email/Password Authentication (Already Working ✅)

1. Visit: http://localhost:5000/admin
2. Fill in name, email, password
3. Click "Sign up"
4. Should redirect to dashboard

### Test Google OAuth

1. Visit: http://localhost:5000/login
2. Click the **Google** button
3. **Expected behavior**:
   - Popup opens with Google account selection
   - Select your Google account
   - Popup closes
   - Redirects to dashboard
   - Session created with your Google email

4. **If it fails**:
   - Check browser console (F12)
   - Look for the error code
   - Common errors:
     - `auth/unauthorized-domain` → Add domain to Firebase Console
     - `auth/popup-blocked` → Allow popups in browser
     - `auth/internal-error` → Domain not authorized OR API key restricted

### Test GitHub OAuth

1. Visit: http://localhost:5000/login
2. Click the **GitHub** button
3. **Expected behavior**:
   - Popup opens with GitHub authorization
   - Authorize the app
   - Popup closes
   - Redirects to dashboard

## 🔍 Debugging

### Check Browser Console

Open DevTools (F12) → Console tab:

**Success logs:**
```
Starting google sign-in...
Sign-in successful: your-email@gmail.com
Sending token to backend...
Backend authentication successful
```

**Error logs will show:**
```
Sign-in error: [error details]
```

### Check Flask Logs

Look for:
```
INFO:__main__:Firebase admin initialized from static/serviceAccountKey.json
INFO:__main__:Firebase OAuth login successful: your-email@gmail.com
```

### Common Issues & Fixes

#### Issue: "Refused to connect" CSP errors
**Fix**: CSP already updated in code! Just restart Flask:
```bash
pkill -f python.*certificate-app.py
./auto-certi-env/bin/python certificate-app.py
```

#### Issue: "auth/unauthorized-domain"
**Fix**: Add `localhost` and `127.0.0.1` to Firebase Console → Authentication → Settings → Authorized domains

#### Issue: "auth/internal-error"
**Cause**: Generic error, usually domain authorization issue
**Fix**: 
1. Add domain to authorized domains
2. Check API key restrictions in Google Cloud Console
3. Ensure Google provider is enabled

#### Issue: Popup blocked
**Fix**: Allow popups for localhost in browser settings

#### Issue: "auth/popup-closed-by-user"
**Cause**: User closed popup before completing auth
**Fix**: Click the button again

## 📋 CSP Configuration (Already Applied ✅)

The Content Security Policy now allows:

**script-src:**
- 'self'
- https://www.gstatic.com (Firebase SDK)
- https://www.googleapis.com (Google APIs)
- https://apis.google.com (Google APIs)
- https://firebase.googleapis.com (Firebase APIs)

**connect-src:**
- 'self'
- https://www.googleapis.com
- https://apis.google.com
- https://firebase.googleapis.com
- https://*.googleapis.com (all Google APIs)
- https://identitytoolkit.googleapis.com (Firebase Auth)
- https://securetoken.googleapis.com (Firebase tokens)

**frame-src:**
- 'self'
- https://accounts.google.com (Google OAuth popup)
- https://*.firebaseapp.com (Firebase hosting)

## 🎯 Quick Start

1. **Add authorized domains** (MOST IMPORTANT):
   - Go to Firebase Console
   - Add `localhost`, `127.0.0.1`, and your IP

2. **Start Flask**:
   ```bash
   cd /run/media/kaustav/Media/Project/Auto-Certificate-Genarator
   ./auto-certi-env/bin/python certificate-app.py
   ```

3. **Test**:
   - Visit http://localhost:5000/login
   - Try email/password (should work)
   - Try Google button (should work after domain authorization)
   - Try GitHub button (should work after domain authorization)

## 🔐 Security Notes

- Firebase Admin SDK runs server-side (secure)
- ID tokens are verified on backend
- Sessions created after successful verification
- No passwords stored for OAuth users
- CSP protects against XSS attacks
- CSRF protection enabled

## 📞 Support

If OAuth still doesn't work after adding domains:

1. Check `FIX_FIREBASE_INTERNAL_ERROR.md` in this directory
2. Visit test page: http://localhost:5000/test-firebase
3. Check Firebase Console → Authentication → Users to see if users are created
4. Verify serviceAccountKey.json exists in `/static/` folder

---

**Current Status**: ✅ Ready to test!  
**Next Step**: Add authorized domains to Firebase Console
