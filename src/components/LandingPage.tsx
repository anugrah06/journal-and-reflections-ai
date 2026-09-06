import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Lock, BookOpen, Key, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isLoading, errorMessage }) => {
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleSignInClick = async () => {
    setInternalError(null);
    try {
      await onSignIn();
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      const errorCode = (err as { code?: string })?.code;
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorStr.includes('popup-closed-by-user') ||
        errorStr.includes('cancelled-popup-request')
      ) {
        // User closed or dismissed the popup without authenticating. No error banner required.
        setInternalError(null);
      } else if (errorCode === 'auth/popup-blocked' || errorStr.includes('popup-blocked')) {
        setInternalError('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setInternalError(errorStr);
      }
    }
  };

  return (
    <div id="landing-page-container" className="min-h-[calc(100vh-4rem)] bg-[#FAFAFA] flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Main Card */}
        <div id="card-auth-landing" className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-8 sm:p-14 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
              <span>Personal Reflection &amp; AI Thinking Partner</span>
            </div>

            {/* Title & Description */}
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
              A private space for your thoughts, reflections, and ideas
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 max-w-xl mx-auto mb-8 leading-relaxed">
              Sign in securely with Google to enter your private reflection studio. Converse with Gemini 3.6 Flash for summaries, brainstorming, and deep reflections—isolated exclusively to your account.
            </p>

            {/* Error Message if any */}
            {(errorMessage || internalError) && (
              <div
                id="landing-error-alert"
                className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 text-left max-w-md mx-auto"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Sign In Notice</p>
                  <p className="text-xs text-rose-700 mt-0.5">{errorMessage || internalError}</p>
                </div>
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="flex flex-col items-center justify-center gap-3">
              <button
                id="btn-google-sign-in"
                onClick={handleSignInClick}
                disabled={isLoading}
                type="button"
                className="w-full sm:w-auto min-w-[240px] inline-flex items-center justify-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white rounded-xl font-medium text-sm transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    {/* Google 'G' standard icon */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.54 0 2.92.57 3.99 1.51l2.97-2.97C17.16 1.83 14.76 1 12 1 7.42 1 3.55 3.6 1.63 7.37l3.66 2.84C6.18 7.36 8.84 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-2 3.72-4.94 3.72-8.69z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.29 14.79c-.24-.71-.38-1.47-.38-2.29s.14-1.58.38-2.29L1.63 7.37C.59 9.47 0 11.67 0 14s.59 4.53 1.63 6.63l3.66-2.84z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.23 1.16-3.16 0-5.82-2.36-6.71-5.21L1.63 15.01C3.55 18.78 7.42 23 12 23z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-zinc-400">
                Powered by Firebase Authentication. No custom passwords stored.
              </p>
            </div>
          </div>

          {/* Architecture & Security Highlights Grid */}
          <div className="bg-zinc-50/70 border-t border-zinc-200 px-6 py-8 sm:px-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <div className="w-7 h-7 rounded-md bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center font-medium text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-900">User Data Isolation</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Entries are secured under owner-bound paths (<code className="text-zinc-800 bg-zinc-200/60 px-1 py-0.5 rounded text-[10px]">/users/{'{uid}'}/interactions</code>). No other user can read your journals.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-7 h-7 rounded-md bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center font-medium text-xs">
                <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-900">Gemini 3.6 Flash</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Multi-turn reflection engine equipped with an automatic model fallback ladder for uninterrupted conversational resilience.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-7 h-7 rounded-md bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center font-medium text-xs">
                <Lock className="w-3.5 h-3.5 text-zinc-700" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-900">Zero-Secret Exposure</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Gemini API tokens stay strictly server-side behind secure proxy endpoints. Client credentials are managed via Federated Google Auth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
