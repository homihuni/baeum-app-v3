import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';

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

export { db, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc, Timestamp };
export default app;
