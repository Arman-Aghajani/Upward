// firebase-sync.js
// Include this in CourseMap.html to sync XP/rank to Firestore
// <script type="module" src="../firebase-sync.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDug8Iz8FkYck24-E8bFHyW-nt-PgXfvew",
    authDomain: "upward-44313.firebaseapp.com",
    projectId: "upward-44313",
    storageBucket: "upward-44313.firebasestorage.app",
    messagingSenderId: "101564287746",
    appId: "1:101564287746:web:a5b50c89520fadc006d01b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sync localStorage to Firestore every time CourseMap loads
const uid = localStorage.getItem('current_user');
if (uid) {
    const xp = Number(localStorage.getItem('xp')) || 0;
    const rankIndex = Number(localStorage.getItem('rankIndex')) || 0;
    const lessonsCompleted = Number(localStorage.getItem('lessonsCompleted')) || 0;

    updateDoc(doc(db, 'users', uid), {
        xp: xp,
        rankIndex: rankIndex,
        lessonsCompleted: lessonsCompleted
    }).catch(err => console.log('Sync error:', err));
}
