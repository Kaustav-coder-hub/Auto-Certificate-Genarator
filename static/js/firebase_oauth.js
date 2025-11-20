// Firebase OAuth Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup
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

// Attach event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Google sign-in buttons
  const googleBtns = document.querySelectorAll('[data-auth="google"]');
  googleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      signInWithProvider('google', btn);
    });
  });

  // GitHub sign-in buttons
  const githubBtns = document.querySelectorAll('[data-auth="github"]');
  githubBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      signInWithProvider('github', btn);
    });
  });
});

function signInWithProvider(providerName, button) {
  let provider;
  
  if (providerName === 'google') {
    provider = new GoogleAuthProvider();
  } else if (providerName === 'github') {
    provider = new GithubAuthProvider();
  } else {
    alert('Invalid provider');
    return;
  }
  
  // Show loading state
  const originalHTML = button.innerHTML;
  button.innerHTML = ' Signing in...';
  button.disabled = true;
  
  console.log(`Starting ${providerName} sign-in...`);
  
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log('Sign-in successful:', result.user.email);
      return result.user.getIdToken();
    })
    .then((idToken) => {
      console.log('Sending token to backend...');
      return fetch('/admin/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    })
    .then((response) => {
      console.log('Backend response status:', response.status);
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.status === 'success') {
        console.log('Backend authentication successful');
        window.location.href = data.redirect || '/admin/dashboard';
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    })
    .catch((error) => {
      console.error('Sign-in error:', error);
      button.innerHTML = originalHTML;
      button.disabled = false;
      
      // User-friendly error messages
      if (error.code === 'auth/popup-closed-by-user') {
        alert('Sign-in cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(`This domain is not authorized. Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains`);
      } else if (error.code === 'auth/internal-error') {
        alert('Authentication error. Please ensure localhost is authorized in Firebase Console.');
      } else {
        alert('Sign-in failed: ' + error.message);
      }
    });
}
