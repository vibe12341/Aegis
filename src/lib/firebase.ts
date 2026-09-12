import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TelemetryEvent } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore at application boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or initial connection check failed:', error.message);
      return false;
    }
    // Expected to return permission or doc not found if online
    return true;
  }
}

/**
 * Sign in with Google
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In failed:', error);
    return null;
  }
}

/**
 * Anonymous sign-in fallback
 */
export async function loginAnonymously(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous Sign In failed:', error);
    return null;
  }
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}

/**
 * Save Telemetry Event to Firestore
 */
export async function saveTelemetryEventToFirestore(event: TelemetryEvent): Promise<void> {
  const path = `telemetry_events/${event.event_id}`;
  try {
    const docRef = doc(db, 'telemetry_events', event.event_id);
    const payload = {
      ...event,
      created_by: auth.currentUser?.uid || 'system-agent',
    };
    await setDoc(docRef, payload);
  } catch (error) {
    console.warn('Could not persist telemetry event to Firestore:', error);
    // Don't crash UI if rules or offline blocks, but log error
  }
}

/**
 * Real-time subscription to Telemetry events from Firestore
 */
export function subscribeToFirestoreTelemetry(
  onUpdate: (events: TelemetryEvent[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'telemetry_events';
  try {
    const q = query(collection(db, 'telemetry_events'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const events: TelemetryEvent[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as TelemetryEvent;
          events.push(data);
        });
        if (events.length > 0) {
          onUpdate(events);
        }
      },
      (error) => {
        console.warn('Firestore telemetry snapshot subscription notice:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Failed to initialize telemetry subscription:', err);
    return () => {};
  }
}

export { onAuthStateChanged };
export type { User };
