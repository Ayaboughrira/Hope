// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore}   from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAR9oeLsXlv7wpAc6Lp7mqqgrWaJ9zNGFw",
  authDomain: "memoire-appweb.firebaseapp.com",
  projectId: "memoire-appweb",
  storageBucket: "memoire-appweb.firebasestorage.app",
  messagingSenderId: "715276107169",
  appId: "1:715276107169:web:31d1de7f8064708036dfe0",
  measurementId: "G-36MW39Y14J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db =getFirestore(app);

export {db};
