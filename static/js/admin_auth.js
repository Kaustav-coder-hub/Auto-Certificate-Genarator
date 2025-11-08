// Firebase authentication logic extracted from admin.html
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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

// Firebase Email/Password signup
window.handleEmailSignup = function () {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => userCredential.user.getIdToken())
    .then((idToken) => sendTokenToBackend(idToken))
    .catch((err) => alert(err.message));
};

// Firebase Email/Password login
window.handleEmailLogin = function () {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => userCredential.user.getIdToken())
    .then((idToken) => sendTokenToBackend(idToken))
    .catch((err) => alert(err.message));
};

window.firebaseSignIn = function (providerName) {
  let provider;
  if (providerName === 'google') {
    provider = new GoogleAuthProvider();
  } else if (providerName === 'github') {
    provider = new GithubAuthProvider();
  } else {
    alert('Provider not implemented');
    return;
  }
  signInWithPopup(auth, provider)
    .then((result) => result.user.getIdToken())
    .then((idToken) => sendTokenToBackend(idToken))
    .catch((err) => alert(err.message));
};

function sendTokenToBackend(idToken) {
  fetch('/admin/firebase-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  }).then((res) => {
    if (res.ok) window.location.reload();
    else alert('Authentication failed');
  });
}
