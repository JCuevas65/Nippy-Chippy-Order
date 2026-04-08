import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSRGRgaPnWM7ANazsfVVNCUweZOWDCxls",
  authDomain: "nippychippyorder.firebaseapp.com",
  projectId: "nippychippyorder",
  storageBucket: "nippychippyorder.firebasestorage.app",
  messagingSenderId: "858345589661",
  appId: "1:858345589661:web:af8cb22200a4d65bc0bd74"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
