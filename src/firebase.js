// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD5SIMMB-9x-DTff5AVehiNE3U-bKIs254",
  authDomain: "karyika.firebaseapp.com",
  projectId: "karyika",
  storageBucket: "karyika.firebasestorage.app",
  messagingSenderId: "864847121134",
  appId: "1:864847121134:web:fc3be64de5864a397f01ff",
  measurementId: "G-RH8TK14M55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);