import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged,
  signOut 
} from "firebase/auth";

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
googleProvider.setCustomParameters({ prompt: "select_account" });

export { onAuthStateChanged };

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function getRedirectUser() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error("Redirect auth error:", error);
    return null;
  }
}

export async function logOut() {
  await signOut(auth);
}