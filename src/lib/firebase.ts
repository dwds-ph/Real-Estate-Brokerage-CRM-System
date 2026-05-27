import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import {
  getMessaging,
  isSupported as isMessagingSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ─── Firebase Messaging (lazy init) ──────────────────────────────────
// FCM is not available in all environments (emulators, SSR, HTTP).
// We export a getter so callers can use it only when available.
let _messaging: ReturnType<typeof getMessaging> | null = null;

export async function getMessagingInstance() {
  if (!_messaging) {
    const supported = await isMessagingSupported();
    if (supported) {
      _messaging = getMessaging(app);
    }
  }
  return _messaging;
}

// ─── Emulator Connection ─────────────────────────────────────────────
// When VITE_USE_EMULATORS=true, the app connects to local Firebase
// Emulators instead of production. Start them with:
//   firebase emulators:start
//
// Or use the combined script:
//   npm run dev:full
//
// Emulator ports are defined in firebase.json > emulators.
if (import.meta.env.VITE_USE_EMULATORS === "true") {
  const authHost =
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || "http://localhost:9099";
  const firestoreHost =
    import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || "localhost";
  const firestorePort =
    Number(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT) || 8080;
  const storageHost =
    import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || "localhost";
  const storagePort =
    Number(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT) || 9199;

  connectAuthEmulator(auth, authHost, { disableWarnings: true });
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
  connectStorageEmulator(storage, storageHost, storagePort);

  console.log(
    `[firebase] Connected to emulators: auth=${authHost} firestore=${firestoreHost}:${firestorePort} storage=${storageHost}:${storagePort}`,
  );
}

export default app;
