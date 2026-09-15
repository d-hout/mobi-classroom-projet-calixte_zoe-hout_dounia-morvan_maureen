import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, provider, db } from "./firebaseConfig";

export async function loginWithGoogle() {
 const result = await signInWithPopup(auth, provider);
 const user = result.user;

 const userRef = doc(db, "utilisateurs", user.uid);
 const snapshot = await getDoc(userRef);

 if (!snapshot.exists()) {
   await setDoc(userRef, {
     nomUtilisateur: user.displayName || "",
     email: user.email || "",
     photoURL: user.photoURL || "",
     deckActuel: [],
     createdAt: new Date().toISOString(),
   });
 }

 return user;
}

export async function logoutUser() {
 await signOut(auth);
}

export function observeAuth(callback) {
 return onAuthStateChanged(auth, callback);
}
