import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
  Compass,
  FileText,
  Lightbulb,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { JournalInteraction, JournalMessage, ReflectionMode } from '../types';

interface JournalEditorProps {
  currentInteraction: JournalInteraction;
  onSaveInteraction: (interaction: JournalInteraction) => Promise<void>;
  onNewInteraction: () => void;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  currentInteraction,
  onSaveInteraction,
  onNewInteraction,
  isSaving,
  saveError,
  onClearSaveError,
}) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editableTitle, setEditableTitle] = useState(currentInteraction.title);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync title when active interaction changes
  useEffect(() => {
    setEditableTitle(currentInteraction.title);
    setInputText('');
    setApiError(null);
  }, [currentInteraction.id, currentInteraction.title]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentInteraction.messages, isGenerating]);

  const handleTitleBlur = async () => {
    if (editableTitle.trim() && editableTitle !== currentInteraction.title) {
      const updated: JournalInteraction = {
        ...currentInteraction,
        title: editableTitle.trim(),
        updatedAt: new Date().toISOString(),
      };
      await onSaveInteraction(updated);
    }
  };

  const handleModeChange = async (newMode: ReflectionMode) => {
    if (newMode === currentInteraction.mode) return;
    const updated: JournalInteraction = {
      ...currentInteraction,
      mode: newMode,
      updatedAt: new Date().toISOString(),
    };
    await onSaveInteraction(updated);
  };

  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isGenerating) return;

    setApiError(null);
    onClearSaveError();
    setIsGenerating(true);

    const now = new Date().toISOString();
    const userMsgId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newUserMessage: JournalMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmedInput,
      timestamp: now,
    };

    // Auto-generate title from first prompt if still untitled
    let interactionTitle = currentInteraction.title;
    if (
      (!interactionTitle || interactionTitle === 'New Reflection' || interactionTitle === 'Untitled Entry') &&
      currentInteraction.messages.length === 0
    ) {
      interactionTitle = trimmedInput.slice(0, 48) + (trimmedInput.length > 48 ? '...' : '');
      setEditableTitle(interactionTitle);
    }

    const updatedMessagesWithUser = [...currentInteraction.messages, newUserMessage];

    // Optimistically prepare the interaction object
    const pendingInteraction: JournalInteraction = {
      ...currentInteraction,
      title: interactionTitle,
      messages: updatedMessagesWithUser,
      updatedAt: now,
    };

    try {
      // 1. First ensure user turn is staged
      // Format prior history for Gemini API
      const historyPayload = currentInteraction.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      }));

      // 2. Query Gemini API endpoint
      const response = await fetch('/api/reflections/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: trimmedInput,
          history: historyPayload,
          mode: currentInteraction.mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to receive reflection from Gemini API.');
      }

      // 3. Assemble Assistant Response
      const assistantMsgId = 'ast_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const assistantMessage: JournalMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed,
      };

      const finalInteraction: JournalInteraction = {
        ...pendingInteraction,
        messages: [...updatedMessagesWithUser, assistantMessage],
        summarySnippet: data.response.slice(0, 160).replace(/\n/g, ' ') + '...',
        updatedAt: new Date().toISOString(),
      };

      // 4. Guaranteed Transaction Verification (Input-to-Save Completeness)
      await onSaveInteraction(finalInteraction);
      setInputText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(msg);
      // Still persist the user's input so their work is never lost!
      try {
        await onSaveInteraction(pendingInteraction);
      } catch (saveErr) {
        console.error('Failed to persist pending user message:', saveErr);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetrySave = async () => {
    onClearSaveError();
    await onSaveInteraction(currentInteraction);
  };

  return (
    <div id="journal-editor-container" className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Top Action Bar */}
      <div className="border-b border-zinc-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <input
            id="input-entry-title"
            type="text"
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Title of this reflection..."
            className="text-base sm:text-lg font-semibold text-zinc-900 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none transition-colors w-full px-1 py-0.5"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Reflection Mode Segmented Control */}
          <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 border border-zinc-200/80">
            <button
              id="mode-tab-reflection"
              type="button"
              onClick={() => handleModeChange('reflection')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                currentInteraction.mode === 'reflection'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-zinc-700" />
              <span>Deep Reflection</span>
            </button>
            <button
              id="mode-tab-summary"
              type="button"
              onClick={() => handleModeChange('summary')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                currentInteraction.mode === 'summary'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-zinc-700" />
              <span>Summary</span>
            </button>
            <button
              id="mode-tab-brainstorm"
              type="button"
              onClick={() => handleModeChange('brainstorm')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                currentInteraction.mode === 'brainstorm'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-zinc-700" />
              <span>Brainstorm</span>
            </button>
          </div>

          <button
            id="btn-new-entry"
            onClick={onNewInteraction}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 rounded-lg border border-zinc-200 transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">New Entry</span>
          </button>
        </div>
      </div>

      {/* Error Banners */}
      {(saveError || apiError) && (
        <div
          id="editor-error-banner"
          className="mx-4 sm:mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs sm:text-sm gap-3"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveError || apiError}</span>
          </div>
          {saveError && (
            <button
              id="btn-retry-save"
              onClick={handleRetrySave}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium whitespace-nowrap"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Save</span>
            </button>
          )}
        </div>
      )}

      {/* Conversation / Reflections Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {currentInteraction.messages.length === 0 ? (
          <div
            id="empty-conversation-state"
            className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center mb-3.5">
              <Sparkles className="w-5 h-5 text-zinc-700" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Begin Your Reflection</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mb-6 leading-relaxed">
              Write about your day, a difficult decision, an aspiration, or a thought you want to unpack. Gemini will respond based on your selected mode (
              <span className="font-semibold text-zinc-800">{currentInteraction.mode}</span>).
            </p>

            <div className="w-full grid grid-cols-1 gap-2 text-left">
              <button
                type="button"
                onClick={() =>
                  setInputText('Today I had a realization about balancing focused work and rest...')
                }
                className="p-3 text-xs bg-zinc-50/70 hover:bg-zinc-100/80 text-zinc-700 rounded-lg border border-zinc-200 transition-colors text-left"
              >
                &quot;Today I had a realization about balancing focused work and rest...&quot;
              </button>
              <button
                type="button"
                onClick={() =>
                  setInputText('I need help brainstorming angles for an upcoming project that feels overwhelming...')
                }
                className="p-3 text-xs bg-zinc-50/70 hover:bg-zinc-100/80 text-zinc-700 rounded-lg border border-zinc-200 transition-colors text-left"
              >
                &quot;I need help brainstorming angles for an upcoming project...&quot;
              </button>
            </div>
          </div>
        ) : (
          currentInteraction.messages.map((msg) => (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-zinc-100 rounded-br-xs shadow-xs'
                    : 'bg-white border border-zinc-200 text-zinc-900 rounded-bl-xs shadow-xs'
                }`}
              >
                {/* Message Header */}
                <div className={`flex items-center justify-between gap-4 mb-2.5 pb-2 border-b text-xs ${
                  msg.role === 'user' ? 'border-zinc-800' : 'border-zinc-100'
                }`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    {msg.role === 'user' ? (
                      <span className="text-zinc-300">Your Journal Entry</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-zinc-900 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                        Gemini Reflection
                        {msg.modelUsed && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 ml-1 border border-zinc-200/60">
                            {msg.modelUsed}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] opacity-75">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1 hover:opacity-100 transition-opacity rounded"
                      title="Copy message"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none text-zinc-800 leading-relaxed">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isGenerating && (
          <div className="flex items-start gap-3">
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-xs p-3.5 flex items-center gap-3 text-zinc-600 text-xs shadow-xs">
              <div className="w-4 h-4 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
              <span>Gemini is reflecting on your entry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Persistence & Save Indicator */}
      <div className="px-6 py-1.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          {isSaving ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-zinc-600" />
              <span>Syncing with Firestore...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Isolated in Firestore under user path</span>
            </>
          )}
        </div>
        <div>
          <span>{inputText.length} / 10,000 characters</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-4 sm:p-6 bg-white border-t border-zinc-200">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative border border-zinc-200 rounded-xl focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all bg-white shadow-xs">
            <textarea
              id="input-journal-prompt"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={3}
              maxLength={10000}
              placeholder={`Write your thought or follow-up reflection... (Press ${
                navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
              }+Enter to submit)`}
              className="w-full px-4 py-3 text-sm text-zinc-900 bg-transparent resize-none focus:outline-none placeholder-zinc-400"
            />
            <div className="px-3 py-2 flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 rounded-b-xl">
              <span className="text-[11px] text-zinc-500">
                Mode: <strong className="capitalize text-zinc-800">{currentInteraction.mode}</strong>
              </span>

              <button
                id="btn-submit-reflection"
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                    <span>Reflecting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
