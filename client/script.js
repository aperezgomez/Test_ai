import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword as signIn } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import firebaseConfig from '../server/firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

async function signInWithEmailAndPassword(email, password) {
  try {
    const userCredential = await signIn(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User signed in successfully:', user);
      console.log('User data from Firestore:', userData);

      sessionStorage.setItem('openaiAPI', userData.openaiAPI);

      window.location.href = './chat/chat.html';
    } else {
      console.error('Error signing in: User not found in Firestore');
    }
  } catch (error) {
    console.error('Error signing in:', error.message);
  }
}

document.querySelector('form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  await signInWithEmailAndPassword(email, password);
});

const submitButton = document.getElementById('submitBtn');
if (submitButton) {
  submitButton.addEventListener('click', async (event) => {
    event.preventDefault();
    console.log('Form submitted');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    console.log(`Email: ${email}, Password: ${password}`);
    await signInWithEmailAndPassword(email, password);
  });
}
