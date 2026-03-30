import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // Realtime Database


const firebaseConfig = {
  apiKey: "AIzaSyB0BYmHzRJ_r0N74-Q_iLJFoc4EuvZ-DW8",
  authDomain: "prjmobi-calixte-hout-morvan.firebaseapp.com",
  databaseURL: "https://prjmobi-calixte-hout-morvan-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "prjmobi-calixte-hout-morvan",
  storageBucket: "prjmobi-calixte-hout-morvan.firebasestorage.app",
  messagingSenderId: "330511281632",
  appId: "1:330511281632:web:f55acca10a473933848f85",
  measurementId: "G-36MWZNXFTF"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

//Exports de services Firebase
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
