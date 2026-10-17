import React, { useState, useEffect } from 'react';
import { ActionItem, AmbiguityWarning } from '../types';
import { AlertTriangle, Check, Copy, MessageSquare, User, X, Sparkles, Send } from 'lucide-react';

interface AmbiguityResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ActionItem | null;
  warning?: AmbiguityWarning | null;
  currentUserName: string;
  attendees: string[];
  meetingTitle: string;
  onResolve: (itemId: string, updates: Partial<ActionItem>) => void;
}

export const AmbiguityResolverModal: React.FC<AmbiguityResolverModalProps> = ({
  isOpen,
  onClose,
  item,
  warning,
  currentUserName,
  attendees,
  meetingTitle,
  onResolve,
}) => {
  const [selectedAssignee, setSelectedAssignee] = useState<string>(item?.assignee || 'Unassigned');
  const [customAssignee, setCustomAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState<string>(item?.dueDate || '');
  const [deadlineText, setDeadlineText] = useState<string>(item?.deadlineLabel || '');
  const [draftMessage, setDraftMessage] = useState<string>('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setSelectedAssignee(item.assignee || 'Unassigned');
      setCustomAssignee('');
      setNewDueDate(item.dueDate || '');
      setDeadlineText(item.deadlineLabel || '');
      setDraftMessage('');
      setIsDrafting(false);
      setCopied(false);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleGenerateClarificationDraft = async () => {
    setIsDrafting(true);
    try {
      const res = await fetch('/api/suggest-clarification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: item.title,
          ambiguityReason: item.ambiguityReason || warning?.issue || 'Ownership or timeline is vague',
          meetingTitle,
          recipientName: selectedAssignee !== 'Unassigned' ? selectedAssignee : 'the team',
        }),
      });
      const data = await res.json();
      setDraftMessage(data.message || `Hey team, quick follow-up on "${item.title}" from ${meetingTitle}: who is driving this and what is the target date?`);
    } catch {
      setDraftMessage(`Hey team, quick follow-up on "${item.title}" from ${meetingTitle}: who is driving this and what is the target date?`);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(draftMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyResolution = () => {
    const finalAssignee = customAssignee.trim() || selectedAssignee;
    const isPersonal = finalAssignee.toLowerCase() === currentUserName.toLowerCase() || finalAssignee === 'Me';

    onResolve(item.id, {
      assignee: finalAssignee,
      isPersonal,
      dueDate: newDueDate || item.dueDate,
      deadlineLabel: deadlineText || item.deadlineLabel,
      isAmbiguous: false,
      ambiguityReason: undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-amber-50/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Verify & Resolve Ambiguity
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Prevent missed commitments by clarifying ownership & deadline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Task info */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Action Item
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {item.title}
            </div>
            {item.originalQuote && (
              <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 italic bg-white dark:bg-zinc-850 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                💬 "{item.originalQuote}"
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Issue: {item.ambiguityReason || warning?.issue || 'Vague ownership or unspecified timeline in notes'}
            </div>
          </div>

          {/* Assignment Resolution */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Confirm Assignee
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedAssignee(currentUserName);
                  setCustomAssignee('');
                }}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                  selectedAssignee === currentUserName
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Me ({currentUserName.split(' ')[0]})</span>
              </button>

              {attendees
                .filter(a => !a.toLowerCase().includes(currentUserName.toLowerCase()))
                .slice(0, 4)
                .map((attendee) => {
                  const cleanName = attendee.replace(/\s*\(.*\)/, '');
                  return (
                    <button
                      key={attendee}
                      type="button"
                      onClick={() => {
                        setSelectedAssignee(cleanName);
                        setCustomAssignee('');
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all truncate ${
                        selectedAssignee === cleanName
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-semibold'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {cleanName}
                    </button>
                  );
                })}
            </div>

            <div className="mt-2.5">
              <input
                type="text"
                placeholder="Or specify another assignee name..."
                value={customAssignee}
                onChange={(e) => {
                  setCustomAssignee(e.target.value);
                  setSelectedAssignee(e.target.value);
                }}
                className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Deadline Resolution */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Deadline Label
              </label>
              <input
                type="text"
                placeholder="e.g. Thursday EOD"
                value={deadlineText}
                onChange={(e) => setDeadlineText(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* AI Slack Clarification Generator */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Slack / Team Chat Clarification
              </span>
              <button
                type="button"
                onClick={handleGenerateClarificationDraft}
                disabled={isDrafting}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {isDrafting ? 'Drafting...' : draftMessage ? 'Re-draft' : 'Generate Slack Draft'}
              </button>
            </div>

            {draftMessage ? (
              <div className="relative bg-zinc-50 dark:bg-zinc-800/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200">
                <p className="pr-7">{draftMessage}</p>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="absolute right-2 top-2 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 bg-white dark:bg-zinc-700 rounded-md border border-zinc-200 dark:border-zinc-600 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500">
                Need to ask the team? Click "Generate Slack Draft" to get an effortless, polite message ready to paste into Slack or Teams.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-850 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyResolution}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Verify & Save Task
          </button>
        </div>
      </div>
    </div>
  );
};
