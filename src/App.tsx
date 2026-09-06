import React, { useState, useEffect, useCallback } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  logOut,
  saveInteraction,
  deleteInteraction,
  subscribeToUserInteractions,
  FirebaseUser,
} from './lib/firebase';
import { AuthUserProfile, JournalInteraction, ReflectionMode } from './types';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { JournalEditor } from './components/JournalEditor';
import { InteractionHistory } from './components/InteractionHistory';
import { WalkthroughModal } from './components/WalkthroughModal';
import { Menu, ShieldAlert } from 'lucide-react';

function createFreshInteraction(userId: string, defaultMode: ReflectionMode = 'reflection'): JournalInteraction {
  const now = new Date().toISOString();
  const id = 'intr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  return {
    id,
    userId,
    title: 'New Reflection',
    createdAt: now,
    updatedAt: now,
    mode: defaultMode,
    messages: [],
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteraction, setActiveInteraction] = useState<JournalInteraction | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState<boolean>(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
        setInteractions([]);
        setActiveInteraction(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user-isolated interactions in Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToUserInteractions(
      currentUser.uid,
      (fetchedInteractions) => {
        setInteractions(fetchedInteractions);
        // If active interaction exists in fetched list, keep it synchronized
        setActiveInteraction((prev) => {
          if (!prev) {
            // Default to most recent or brand new draft
            return fetchedInteractions.length > 0
              ? fetchedInteractions[0]
              : createFreshInteraction(currentUser.uid);
          }
          const matched = fetchedInteractions.find((i) => i.id === prev.id);
          if (matched) {
            return matched;
          }
          // If previous was a draft with no messages, preserve it
          if (prev.messages.length === 0) {
            return prev;
          }
          return fetchedInteractions.length > 0
            ? fetchedInteractions[0]
            : createFreshInteraction(currentUser.uid);
        });
      },
      (err) => {
        console.error('Failed to sync interactions:', err);
        setSaveError('Failed to load reflections from Firestore. Check permissions or network.');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      if (!user) {
        // User closed or dismissed the popup window before completing sign-in
        return;
      }
    } catch (err: unknown) {
      const errorCode = (err as { code?: string })?.code;
      const errorStr = err instanceof Error ? err.message : String(err);
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorStr.includes('popup-closed-by-user')
      ) {
        return;
      }
      setAuthError(errorStr);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err: unknown) {
      console.error('Sign out error:', err);
    }
  };

  const handleNewInteraction = useCallback(() => {
    if (!currentUser?.uid) return;
    const fresh = createFreshInteraction(currentUser.uid);
    setActiveInteraction(fresh);
  }, [currentUser?.uid]);

  const handleSaveInteraction = async (interactionToSave: JournalInteraction) => {
    if (!currentUser?.uid) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveInteraction(currentUser.uid, interactionToSave);
      setActiveInteraction(interactionToSave);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database save failed.';
      console.error('Firestore save failed:', err);
      setSaveError(msg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInteraction = async (id: string) => {
    if (!currentUser?.uid) return;
    try {
      await deleteInteraction(currentUser.uid, id);
      if (activeInteraction?.id === id) {
        handleNewInteraction();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed.';
      setSaveError(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-900 font-sans">
      {/* Top Header */}
      <Header
        user={currentUser}
        onSignOut={handleSignOut}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
            <p className="text-xs font-medium text-zinc-600 tracking-wide uppercase">Securing session...</p>
          </div>
        ) : !currentUser ? (
          /* Step 1: Landing page with Google Authentication CTA */
          <LandingPage
            onSignIn={handleSignIn}
            isLoading={authLoading}
            errorMessage={authError}
          />
        ) : (
          /* Step 2-6: Authenticated Private Dashboard with Journal & Gemini */
          <div className="flex-1 flex flex-col overflow-hidden max-w-7xl mx-auto w-full md:px-6 md:py-4">
            {/* Mobile Bar for History Toggle */}
            <div className="md:hidden bg-white border-b border-zinc-200 px-4 py-2.5 flex items-center justify-between">
              <button
                id="btn-toggle-mobile-history"
                type="button"
                onClick={() => setIsMobileHistoryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                <Menu className="w-4 h-4 text-zinc-600" />
                <span>Past Entries ({interactions.length})</span>
              </button>

              <button
                type="button"
                onClick={handleNewInteraction}
                className="text-xs font-medium text-zinc-900 bg-white hover:bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 transition-colors"
              >
                + New Reflection
              </button>
            </div>

            {/* Dashboard Workspace */}
            <div className="flex-1 flex flex-row overflow-hidden md:rounded-xl md:border md:border-zinc-200 md:shadow-xs bg-white">
              {/* Step 6: Past Entries History Sidebar */}
              <InteractionHistory
                interactions={interactions}
                activeId={activeInteraction?.id || null}
                onSelectInteraction={(item) => setActiveInteraction(item)}
                onNewInteraction={handleNewInteraction}
                onDeleteInteraction={handleDeleteInteraction}
                isOpenMobile={isMobileHistoryOpen}
                onCloseMobile={() => setIsMobileHistoryOpen(false)}
              />

              {/* Step 3-5: Active Reflection & Gemini Multi-Turn Editor */}
              {activeInteraction ? (
                <JournalEditor
                  key={activeInteraction.id}
                  currentInteraction={activeInteraction}
                  onSaveInteraction={handleSaveInteraction}
                  onNewInteraction={handleNewInteraction}
                  isSaving={isSaving}
                  saveError={saveError}
                  onClearSaveError={() => setSaveError(null)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-zinc-400 text-xs">
                  Loading reflection space...
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Directive #6: Functional Stability & Walkthrough Modal */}
      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />
    </div>
  );
}

