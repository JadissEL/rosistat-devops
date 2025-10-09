import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "rosistrat-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rosistrat-demo",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "rosistrat-demo.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | null = null;
let db: Firestore | null = null;

const isDemoMode = firebaseConfig.apiKey === "demo-api-key";

if (isDemoMode) {
  console.warn("Running in DEMO mode - Firebase authentication disabled");
  console.warn(
    "To enable real authentication, replace the Firebase config in .env with your actual project settings",
  );

  // In demo mode, do not initialize Firebase services
  auth = null;
  db = null;
} else {
  try {
    console.log("Initializing Firebase with config:", {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      // Don't log sensitive data like API key
    });

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log("Firebase initialized successfully");
  } catch (error: unknown) {
    console.error("Firebase initialization failed:", error);
    console.warn(
      "Running in offline mode - authentication and cloud storage disabled",
    );

    // Keep auth and db as null to indicate unavailable services
    auth = null;
    db = null;
  }
}

export { auth, db, isDemoMode };

// Initialize Analytics only in production and with consent
let analytics: Analytics | null = null;
export const getAnalyticsInstance = () => {
  if (typeof window !== "undefined" && import.meta.env.PROD && app) {
    if (!analytics) {
      analytics = getAnalytics(app);
    }
  }
  return analytics;
};

// Development environment configuration
if (import.meta.env.DEV && typeof window !== "undefined") {
  console.log("Development environment detected");

  // Check if we're running in a restricted environment
  const isRestrictedEnvironment =
    window.location.hostname.includes("fly.dev") ||
    window.location.hostname.includes("vercel.app") ||
    window.location.hostname.includes("netlify.app");

  if (isRestrictedEnvironment) {
    console.warn(
      "Running in cloud development environment - some Firebase features may be restricted",
    );
    console.warn(
      "If authentication fails, this may be due to CORS or network restrictions in the cloud environment",
    );
  }

  // Only attempt emulator connection in true local development
  if (!isRestrictedEnvironment) {
    try {
      if (auth && window.location.hostname === "localhost") {
        console.log(
          "Local development detected, attempting emulator connection...",
        );
        connectAuthEmulator(auth, "http://localhost:9099");
        console.log("Firebase Auth emulator connected");
      } else {
        console.log("Using production Firebase services");
      }
    } catch (error: unknown) {
      console.log("Firebase emulator connection skipped:", error);
    }
  }
}

export { app };
