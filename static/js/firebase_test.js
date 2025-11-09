// Firebase Test Script - External for CSP compliance
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
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

const log = (msg, type = 'info') => {
    const output = document.getElementById('output');
    const className = type === 'error' ? 'error' : (type === 'success' ? 'success' : '');
    output.innerHTML += `<p class="${className}">${new Date().toLocaleTimeString()}: ${msg}</p>`;
    console.log(msg);
};

try {
    // Show current URL
    document.getElementById('currentUrl').textContent = window.location.href;
    
    log('🔧 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    log('✅ Firebase initialized successfully', 'success');
    
    const auth = getAuth(app);
    log('✅ Auth instance created', 'success');
    log('📍 Current domain: ' + window.location.hostname);
    log('📍 Auth domain: certificate-management-6710c.firebaseapp.com');

    document.getElementById('testGoogle').addEventListener('click', () => {
        log('🚀 Creating Google provider...');
        const provider = new GoogleAuthProvider();
        log('✅ Provider created', 'success');
        
        log('🔑 Attempting signInWithPopup...');
        signInWithPopup(auth, provider)
            .then((result) => {
                log('✅✅✅ Sign-in SUCCESSFUL!', 'success');
                log('👤 User: ' + result.user.email, 'success');
                log('🆔 UID: ' + result.user.uid, 'success');
                log('🎉 Token obtained successfully!', 'success');
            })
            .catch((error) => {
                log('❌ Sign-in FAILED', 'error');
                log('❌ Error code: ' + error.code, 'error');
                log('❌ Error message: ' + error.message, 'error');
                
                // Detailed error explanation
                if (error.code === 'auth/unauthorized-domain') {
                    log('⚠️ FIX: Add "' + window.location.hostname + '" to Firebase Console > Authentication > Settings > Authorized domains', 'error');
                } else if (error.code === 'auth/popup-blocked') {
                    log('⚠️ FIX: Allow popups for this site in your browser', 'error');
                } else if (error.code === 'auth/internal-error') {
                    log('⚠️ LIKELY CAUSE: Domain not authorized OR API key restricted', 'error');
                    log('⚠️ FIX: Check Firebase Console authorized domains', 'error');
                }
                
                console.error('Full error:', error);
            });
    });

    log('✅ Setup complete. Click the button to test.', 'success');

} catch (error) {
    log('❌ Initialization error: ' + error.message, 'error');
}
