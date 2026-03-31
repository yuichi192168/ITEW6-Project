import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { getStorage } from 'firebase/storage';

const firebaseConfig: Record<string, string | undefined> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseInitError = missingConfigKeys.length
  ? new Error(
      `Firebase configuration is not properly set. Missing environment variables: ${missingConfigKeys.join(
        ', '
      )}. Create a frontend--/.env.local file from frontend--/.env.example.`
    )
  : null;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (!firebaseInitError) {
  app = initializeApp(firebaseConfig as FirebaseOptions);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  console.warn(firebaseInitError.message);
}

export { app, auth, db, storage };
export default app;
