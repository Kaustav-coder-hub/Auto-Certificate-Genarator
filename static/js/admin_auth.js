// Firebase authentication logic extracted from admin.html
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDoqtK-CAMYjDy8jb4ASlqCad_ehqRzKkw",
  authDomain: "certificate-management-6710c.firebaseapp.com",
  projectId: "certificate-management-6710c",
  storageBucket: "certificate-management-6710c.firebasestorage.app",
  messagingSenderId: "5631280297",
  appId: "1:5631280297:web:346ddd973de20dc6f995b8",
  measurementId: "G-47JG3SN0GN",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user.email);
    // User is signed in - token will be handled by backend session
  } else {
    console.log('No user signed in');
    // User is signed out
  }
});

// Setup event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Login page Google button
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
      firebaseSignIn('google', e);
    });
  }

  // Login page GitHub button
  const githubLoginBtn = document.getElementById('githubLoginBtn');
  if (githubLoginBtn) {
    githubLoginBtn.addEventListener('click', (e) => {
      firebaseSignIn('github', e);
    });
  }

  // Signup page buttons (admin.html) - these use onclick still, will fix next
  const socialBtns = document.querySelectorAll('.social-btn[title="Google"], .social-btn[title="Github"], .social-btn[title="Phone"]');
  socialBtns.forEach(btn => {
    const title = btn.getAttribute('title');
    if (title === 'Google') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        firebaseSignIn('google', e);
      });
    } else if (title === 'Github') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        firebaseSignIn('github', e);
      });
    } else if (title === 'Phone') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        firebaseSignIn('phone', e);
      });
    }
  });
});

// Firebase Email/Password signup
window.handleEmailSignup = function () {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }
  
  console.log('Creating user with email:', email);
  
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User signed up:', userCredential.user.email);
      return userCredential.user.getIdToken();
    })
    .then((idToken) => sendTokenToBackend(idToken))
    .catch((err) => {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        alert('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        alert('Password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        alert('Invalid email address.');
      } else {
        alert('Signup failed: ' + err.message);
      }
    });
};

// Firebase Email/Password login
window.handleEmailLogin = function () {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  
  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }
  
  console.log('Signing in user:', email);
  
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User logged in:', userCredential.user.email);
      return userCredential.user.getIdToken();
    })
    .then((idToken) => sendTokenToBackend(idToken))
    .catch((err) => {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        alert('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        alert('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        alert('Invalid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        alert('Too many failed attempts. Please try again later.');
      } else {
        alert('Login failed: ' + err.message);
      }
    });
};

window.firebaseSignIn = function (providerName, event) {
  let provider;
  if (providerName === 'google') {
    provider = new GoogleAuthProvider();
    // Request additional scopes (optional)
    provider.addScope('email');
    provider.addScope('profile');
  } else if (providerName === 'github') {
    provider = new GithubAuthProvider();
    provider.addScope('user:email');
  } else if (providerName === 'phone') {
    alert('Phone authentication not yet implemented');
    return;
  } else {
    alert('Provider not implemented');
    return;
  }
  
  // Show loading indicator
  let button = null;
  let originalText = '';
  if (event && event.target) {
    button = event.target.closest('button');
    if (button) {
      originalText = button.innerHTML;
      button.innerHTML = '⏳ Signing in...';
      button.disabled = true;
    }
  }
  
  console.log('Starting Firebase sign-in with:', providerName);
  
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log('Firebase sign-in successful:', result.user.email);
      return result.user.getIdToken();
    })
    .then((idToken) => {
      console.log('Sending token to backend...');
      return sendTokenToBackend(idToken);
    })
    .catch((err) => {
      console.error('Firebase sign-in error:', err);
      if (button) {
        button.innerHTML = originalText;
        button.disabled = false;
      }
      
      // User-friendly error messages
      if (err.code === 'auth/popup-closed-by-user') {
        alert('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized. Please contact administrator.');
      } else {
        alert('Sign-in failed: ' + err.message);
      }
    });
};

function sendTokenToBackend(idToken) {
  return fetch('/admin/firebase-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  .then((res) => {
    if (res.ok) {
      console.log('Backend authentication successful');
      alert('✅ Sign-in successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 500);
    } else {
      return res.json().then(data => {
        throw new Error(data.message || 'Authentication failed');
      });
    }
  })
  .catch((err) => {
    console.error('Backend authentication error:', err);
    alert('Backend authentication failed: ' + err.message);
    throw err;
  });
}
