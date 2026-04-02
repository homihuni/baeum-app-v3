import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithCredential, OAuthCredential } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyD09ssSJWL_jK5siqXwlHINuG9Xsz6l234",
  authDomain: "baeum-app.firebaseapp.com",
  projectId: "baeum-app",
  storageBucket: "baeum-app.firebasestorage.app",
  messagingSenderId: "184542935339",
  appId: "1:184542935339:web:d9a6060d46469dd004ed6e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

export { 
  db, auth, functions,
  collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, limit, updateDoc,
  deleteDoc, addDoc, Timestamp,
  GoogleAuthProvider, signInWithCredential
};
export default app;
