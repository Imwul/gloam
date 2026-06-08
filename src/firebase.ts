import { initializeApp, getApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const LOCAL_STORAGE_KEY = 'gloam_firebase_config';

// 1. Get configuration from environment variables or localStorage
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };

  // If environment variables are provided, use them
  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // Otherwise check localStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse local Firebase configuration", e);
    }
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig | null) {
  if (config) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

// 2. Initialize Firebase safely
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let configured = false;

const config = getSavedFirebaseConfig();

if (config && config.apiKey && config.projectId) {
  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    configured = true;
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed with current config:", error);
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    configured = false;
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseConfigured = configured;
export const currentFirebaseConfig = config;
