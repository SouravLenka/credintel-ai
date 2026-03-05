// Firebase configuration and authentication utilities
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "AIzaSyD9HQMFqP1hHjvyVgc2F0uX7yQPb0YHjSw",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         ?? "theboss-9d225.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID          ?? "theboss-9d225",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      ?? "theboss-9d225.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "703142789950",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID              ?? "1:703142789950:web:e3a1bbbb608f114597a26f",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID      ?? "G-1EERBVYB99",
};

// Prevent duplicate initialization in Next.js dev hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/** Sign in with Google popup */
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

/** Sign out the current user */
export const signOutUser = () => signOut(auth);

/** Get the current user's Firebase ID token */
export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export type { User };
export { onAuthStateChanged };
