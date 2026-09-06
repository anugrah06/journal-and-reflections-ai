import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalInteraction } from '../types';
import { stripUndefined } from './sanitize';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use provisioned firestoreDatabaseId if configured
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in using Firebase Auth GoogleAuthProvider
 * Gracefully handles user popup dismissals without logging fatal errors
 */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code;
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request'
    ) {
      // User closed or dismissed the popup before signing in.
      // This is expected user interaction, not a runtime application crash.
      console.info('Google sign-in popup closed by user.');
      return null;
    }
    console.warn('Google sign-in encountered an issue:', error);
    throw error;
  }
}

/**
 * Sign out current authenticated user
 */
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Path builder for user-isolated interactions collection
 * Strict path isolation: /users/{userId}/interactions/{interactionId}
 */
export function getUserInteractionsPath(userId: string): string {
  return `users/${userId}/interactions`;
}

/**
 * Save or update a journal interaction with strict payload hygiene
 */
export async function saveInteraction(userId: string, interaction: JournalInteraction): Promise<void> {
  if (!userId) throw new Error('User ID is required to persist interaction.');
  const docRef = doc(db, 'users', userId, 'interactions', interaction.id);
  const cleanPayload = stripUndefined(interaction);
  await setDoc(docRef, cleanPayload, { merge: true });
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required to delete interaction.');
  const docRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(docRef);
}

/**
 * Subscribe to real-time updates of the user's isolated interactions collection
 */
export function subscribeToUserInteractions(
  userId: string,
  onUpdate: (interactions: JournalInteraction[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'interactions');
  const q = query(colRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const results: JournalInteraction[] = [];
      snapshot.forEach((docSnap) => {
        results.push(docSnap.data() as JournalInteraction);
      });
      onUpdate(results);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      onError(err);
    }
  );
}

export { onAuthStateChanged };
export type { FirebaseUser };
