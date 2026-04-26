import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtj9C6-V2fQhP96RQf9yT1RN6uLyH0ek0",
  authDomain: "neuralcafe.firebaseapp.com",
  projectId: "neuralcafe",
  storageBucket: "neuralcafe.firebasestorage.app",
  messagingSenderId: "712858222741",
  appId: "1:712858222741:web:e582f64bd1efacbaaa5b9c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}