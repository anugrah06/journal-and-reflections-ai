import React from 'react';
import { AuthUserProfile } from '../types';
import { BookOpen, LogOut, ShieldCheck, Sparkles, CheckCircle2, ClipboardList } from 'lucide-react';

interface HeaderProps {
  user: AuthUserProfile | null;
  onSignOut: () => void;
  onOpenWalkthrough: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onSignOut, onOpenWalkthrough }) => {
  return (
    <header id="app-header" className="bg-white/95 backdrop-blur-xs border-b border-zinc-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-medium text-base shadow-xs">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 leading-none">
                Journal &amp; Reflections
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/80 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Firestore Isolated
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block mt-0.5">
              Authenticated AI companion powered by Gemini 3.6 Flash
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Walkthrough & Verification button */}
          <button
            id="btn-open-walkthrough"
            onClick={onOpenWalkthrough}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 rounded-lg transition-colors border border-zinc-200 whitespace-nowrap"
            title="View system test cases & walkthrough"
          >
            <ClipboardList className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Test Walkthrough</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3 pl-2.5 border-l border-zinc-200">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-zinc-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[11px] font-medium">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-zinc-800 leading-tight">
                    {user.displayName || 'Journaler'}
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-tight truncate max-w-[130px]">
                    {user.email || user.uid.slice(0, 8)}
                  </p>
                </div>
              </div>

              <button
                id="btn-sign-out"
                onClick={onSignOut}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
