import React, { useState } from 'react';
import { X, CheckCircle2, Shield, Sparkles, Database, Key, Terminal, ExternalLink } from 'lucide-react';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestCase {
  id: string;
  category: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
}

export const TEST_CASES: TestCase[] = [
  {
    id: 'TC-01',
    category: 'Authentication',
    title: 'Google Federated Sign-In & User Identity',
    description: 'Verify the user can sign in via Google Sign-In with Firebase Auth without entering or exposing passwords.',
    steps: [
      'Load the application landing page.',
      'Click the "Sign In with Google" button (#btn-google-sign-in).',
      'Complete the Google Auth account selection in the popup window.',
      'Observe the landing page transition into the private dashboard.',
      'Verify the user display name, avatar, and email are rendered in the header.',
    ],
    expectedResult: 'Firebase Auth returns authenticated user credentials; session token is established; private dashboard is rendered.',
  },
  {
    id: 'TC-02',
    category: 'Gemini AI Integration',
    title: 'Multi-Turn Journal Reflection Generation',
    description: 'Verify that user reflections are processed by Gemini 3.6 Flash via server-side fallback ladder.',
    steps: [
      'In the active entry editor, select "Deep Reflection" mode (#mode-tab-reflection).',
      'Type a reflection into the prompt textarea (#input-journal-prompt).',
      'Click "Submit" (#btn-submit-reflection) or press Cmd/Ctrl+Enter.',
      'Observe the thinking/loading indicator while Gemini processes the input.',
      'Verify the Gemini response appears in the timeline formatted in clean Markdown.',
      'Type a follow-up response in the same thread and submit again to verify multi-turn context.',
    ],
    expectedResult: 'Gemini generates an empathetic reflection; the model ladder utilizes gemini-3.6-flash or fallbacks gracefully; multi-turn context is maintained.',
  },
  {
    id: 'TC-03',
    category: 'Mode Customization',
    title: 'Executive Summary and Brainstorming Modes',
    description: 'Verify that changing modes alters Gemini system instructions and reflection formatting.',
    steps: [
      'Switch the mode tab to "Summary" (#mode-tab-summary).',
      'Submit a multi-paragraph thought or reflection.',
      'Verify the AI response extracts key themes, emotional highlights, and concise bulleted takeaways.',
      'Switch the mode tab to "Brainstorm" (#mode-tab-brainstorm).',
      'Submit a problem statement or goal.',
      'Verify the AI response generates inventive angles and probing follow-up questions.',
    ],
    expectedResult: 'System instruction dynamically tunes the response format according to the active mode.',
  },
  {
    id: 'TC-04',
    category: 'Firestore Isolation',
    title: 'Strict User-Bound Data Persistence',
    description: 'Verify all user entries are saved under /users/{userId}/interactions/{interactionId} and isolated by Firestore security rules.',
    steps: [
      'Submit a journal prompt and receive a Gemini response.',
      'Observe the Firestore status badge showing sync confirmation.',
      'Check the sidebar "Past Entries" list to confirm the entry appears immediately.',
      'Refresh the browser tab while authenticated.',
      'Confirm all past entries and messages reload automatically from the Firestore real-time listener.',
    ],
    expectedResult: 'Entries persist under the authenticated user UID path; zero cross-UID document leakage is possible under firestore.rules.',
  },
  {
    id: 'TC-05',
    category: 'Resilience & Payload Hygiene',
    title: 'Undefined-Stripping & Transaction Integrity',
    description: 'Verify payloads are sanitized of undefined values and failed saves offer explicit retry options.',
    steps: [
      'Submit an entry with optional fields omitted.',
      'Confirm the stripUndefined sanitizer clears all undefined keys before Firestore setDoc.',
      'Simulate an offline or network interruption.',
      'Verify an error banner appears (#editor-error-banner) with an actionable "Retry Save" button (#btn-retry-save).',
      'Verify user input in the text buffer is NOT erased or discarded during a failed save.',
    ],
    expectedResult: 'Zero database driver crashes from undefined values; user text is preserved safely with a retry option.',
  },
  {
    id: 'TC-06',
    category: 'History & Search',
    title: 'Real-Time Search, Filtering, and Entry Deletion',
    description: 'Verify user can search past entries by keyword, filter by mode, and delete obsolete entries.',
    steps: [
      'Type a keyword into the search input (#input-search-history).',
      'Confirm only entries containing matching titles or text remain visible.',
      'Click the mode filter pills ("Summary", "Brainstorm", "All") to filter the list.',
      'Click on any past entry card to load the full conversation thread into the editor.',
      'Click the trash icon (#btn-delete-{id}) and confirm deletion in the dialog.',
      'Verify the entry is removed from Firestore and the UI.',
    ],
    expectedResult: 'Search and mode filters filter entries instantly; entry deletion updates Firestore and local state.',
  },
  {
    id: 'TC-07',
    category: 'Session Termination',
    title: 'Secure Sign-Out',
    description: 'Verify the user can sign out and terminate their authenticated session.',
    steps: [
      'Click the "Sign Out" button (#btn-sign-out) in the top header.',
      'Verify the user is returned to the clean Landing Page.',
      'Verify private journal entries and user tokens are cleared from memory.',
    ],
    expectedResult: 'Firebase Auth signOut executes cleanly; state resets to unauthenticated.',
  },
];

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'threats' | 'deploy'>('tests');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        id="modal-test-walkthrough"
        className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10 border border-zinc-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Functional Walkthrough &amp; Security Directives
            </h2>
            <p className="text-xs text-zinc-500">
              Complete test verification procedures and architectural threat mapping
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-zinc-200 flex gap-4 text-xs font-medium bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'tests'
                ? 'border-zinc-900 text-zinc-900 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Verification Test Cases ({TEST_CASES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('threats')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'threats'
                ? 'border-zinc-900 text-zinc-900 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Threat Model (5 Zones)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'deploy'
                ? 'border-zinc-900 text-zinc-900 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Cloud Run &amp; Rules Specs
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-600">
                Each interaction and flow that a user can trigger is mapped below into an end-to-end test specification.
              </p>
              <div className="space-y-4">
                {TEST_CASES.map((tc) => (
                  <div
                    key={tc.id}
                    id={`test-case-${tc.id}`}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-zinc-800 bg-zinc-200/80 px-2 py-0.5 rounded text-[11px]">
                          {tc.id}
                        </span>
                        <span className="font-medium text-zinc-900 text-xs">{tc.title}</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
                        {tc.category}
                      </span>
                    </div>

                    <p className="text-zinc-600">{tc.description}</p>

                    <div className="bg-white p-3 rounded-lg border border-zinc-200/80 space-y-1">
                      <p className="font-semibold text-zinc-700 text-[11px]">Execution Steps:</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-zinc-600 text-[11px]">
                        {tc.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/60 text-[11px] text-emerald-800">
                      <strong>Expected Result:</strong> {tc.expectedResult}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800">
                <p className="font-medium mb-1 text-zinc-900">Agentic Threat Modeling Summary</p>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  A structured scenario-driven analysis protecting all 5 Threat Zones according to OWASP Top 10 and LLM Security Directives.
                </p>
              </div>

              <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Threat Zone</th>
                      <th className="px-3 py-2 font-semibold">Identified Risk</th>
                      <th className="px-3 py-2 font-semibold">Security Countermeasure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    <tr>
                      <td className="px-3 py-2 font-semibold text-zinc-900">1. Input Surfaces</td>
                      <td className="px-3 py-2 text-zinc-600">Oversized payloads, script injection, malformed prompts</td>
                      <td className="px-3 py-2 text-zinc-700">10k char cap, null-safe deserialization, defensive validation</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold text-zinc-900">2. Planning &amp; Reasoning</td>
                      <td className="px-3 py-2 text-zinc-600">Prompt injection, system rule extraction</td>
                      <td className="px-3 py-2 text-zinc-700">Passive data isolation, explicit system instructions</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold text-zinc-900">3. Tool Execution</td>
                      <td className="px-3 py-2 text-zinc-600">Gemini key exposure, quota denial of service</td>
                      <td className="px-3 py-2 text-zinc-700">Strict server-side proxy, 4-tier model fallback ladder</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold text-zinc-900">4. Memory &amp; State</td>
                      <td className="px-3 py-2 text-zinc-600">Cross-user Firestore data snooping, token hijacking</td>
                      <td className="px-3 py-2 text-zinc-700">Strict owner-bound path /users/{'{uid}'}/interactions, zero public read</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold text-zinc-900">5. Inter-System Comm</td>
                      <td className="px-3 py-2 text-zinc-600">Hardcoded secrets in frontend or Git</td>
                      <td className="px-3 py-2 text-zinc-700">Secret Manager / env injection, Federated Google Auth</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <p className="font-medium text-zinc-800">Deployed Firestore Security Rules:</p>
                <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto font-mono text-[11px]">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
                </pre>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <p className="font-medium text-zinc-800">Cloud Run Deployment with Campaign Label:</p>
                <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto font-mono text-[11px]">
{`gcloud run deploy journal-reflections \\
  --source . \\
  --region asia-southeast1 \\
  --allow-unauthenticated \\
  --update-labels=dev-tutorial=cloud-run-ai-challenge`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50/50 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
