import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQcmqH3QWe7QxZAuYT35L3rnnkVNlNBh4",
  authDomain: "onlineshopramilya.firebaseapp.com",
  projectId: "onlineshopramilya",
  storageBucket: "onlineshopramilya.firebasestorage.app",
  messagingSenderId: "396914408641",
  appId: "1:396914408641:web:db40c9c7dc02216392a840",
  measurementId: "G-2DMRZ8WZEJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);