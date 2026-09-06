import React, { useState } from 'react';
import { Search, Plus, Trash2, Calendar, MessageSquare, Compass, FileText, Lightbulb, X } from 'lucide-react';
import { JournalInteraction, ReflectionMode } from '../types';

interface InteractionHistoryProps {
  interactions: JournalInteraction[];
  activeId: string | null;
  onSelectInteraction: (interaction: JournalInteraction) => void;
  onNewInteraction: () => void;
  onDeleteInteraction: (id: string) => Promise<void>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const InteractionHistory: React.FC<InteractionHistoryProps> = ({
  interactions,
  activeId,
  onSelectInteraction,
  onNewInteraction,
  onDeleteInteraction,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredInteractions = interactions.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMode = filterMode === 'all' || item.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this reflection? This cannot be undone.')) {
      setDeletingId(id);
      try {
        await onDeleteInteraction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getModeIcon = (mode: ReflectionMode) => {
    switch (mode) {
      case 'summary':
        return <FileText className="w-3.5 h-3.5 text-zinc-500" />;
      case 'brainstorm':
        return <Lightbulb className="w-3.5 h-3.5 text-zinc-500" />;
      case 'reflection':
      default:
        return <Compass className="w-3.5 h-3.5 text-zinc-700" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (diffDays === 1) {
        return 'Yesterday';
      }
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const content = (
    <div id="history-sidebar" className="h-full flex flex-col bg-zinc-50/50 border-r border-zinc-200 w-80 shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Past Entries</h2>
            <span className="text-[11px] bg-zinc-100 text-zinc-600 px-2 py-0.2 rounded-full font-medium border border-zinc-200">
              {interactions.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              id="btn-sidebar-new-entry"
              onClick={() => {
                onNewInteraction();
                onCloseMobile();
              }}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
            <button
              onClick={onCloseMobile}
              type="button"
              className="md:hidden p-1 text-zinc-400 hover:text-zinc-800 rounded-md"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="input-search-history"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries & reflections..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 text-zinc-900 placeholder-zinc-400 transition-colors"
          />
        </div>

        {/* Mode filter buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
          {['all', 'reflection', 'summary', 'brainstorm'].map((mode) => (
            <button
              key={mode}
              id={`filter-mode-${mode}`}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`px-2 py-0.5 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                filterMode === mode
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
        {filteredInteractions.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400">
            {searchQuery || filterMode !== 'all'
              ? 'No reflections match your search filters.'
              : 'No entries yet. Click "+ New" above to write your first reflection!'}
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isSelected = item.id === activeId;
            const previewText =
              item.messages.find((m) => m.role === 'user')?.content || 'No text written yet';

            return (
              <div
                key={item.id}
                id={`history-entry-${item.id}`}
                onClick={() => {
                  onSelectInteraction(item);
                  onCloseMobile();
                }}
                className={`p-3.5 cursor-pointer transition-all flex flex-col gap-1.5 group text-left ${
                  isSelected
                    ? 'bg-zinc-100/90 border-l-2 border-zinc-900'
                    : 'bg-white hover:bg-zinc-50/90 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    {getModeIcon(item.mode)}
                    <span className="text-xs font-medium text-zinc-900 truncate">
                      {item.title || 'Untitled Entry'}
                    </span>
                  </div>

                  <button
                    id={`btn-delete-${item.id}`}
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={deletingId === item.id}
                    type="button"
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 transition-opacity rounded"
                    title="Delete reflection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                  {previewText}
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    {formatDate(item.updatedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-zinc-400" />
                    {item.messages.length} {item.messages.length === 1 ? 'turn' : 'turns'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">{content}</div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
