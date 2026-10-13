import React, { useState } from 'react';
import { ActionItem } from '../types';
import { getGoogleCalendarUrl } from '../services/export';
import { 
  Check, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  User, 
  Trash2, 
  Edit3, 
  Flame, 
  Zap, 
  CheckCircle2, 
  Circle,
  Tag
} from 'lucide-react';

interface TaskCardProps {
  item: ActionItem;
  meetingTitle: string;
  onToggleStatus: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ActionItem>) => void;
  onDelete: (id: string) => void;
  onOpenAmbiguityModal: (item: ActionItem) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  item,
  meetingTitle,
  onToggleStatus,
  onUpdate,
  onDelete,
  onOpenAmbiguityModal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [showQuote, setShowQuote] = useState(false);

  const isCompleted = item.status === 'done';

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdate(item.id, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const priorityConfig = {
    high: {
      label: 'High Priority',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
      icon: <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
    },
    medium: {
      label: 'Medium Priority',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
      icon: <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    },
    low: {
      label: 'Low Priority',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
      icon: <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
    },
  }[item.priority] || {
    label: 'Normal',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    icon: null,
  };

  const effortLabel = {
    quick: '⚡ Quick win (<30m)',
    medium: '⏱️ 1-2 hours',
    deep: '🎯 Deep focus (half-day+)',
  }[item.effort || 'medium'];

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-75'
          : item.isAmbiguous
          ? 'bg-white dark:bg-zinc-900 border-amber-200/90 dark:border-amber-900/60 shadow-xs ring-1 ring-amber-400/20'
          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => onToggleStatus(item.id)}
            className="mt-0.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 focus:outline-hidden"
            title={isCompleted ? 'Mark as incomplete' : 'Mark as done'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 fill-emerald-50 dark:fill-emerald-950/30" />
            ) : (
              <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600 hover:text-indigo-500" />
            )}
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top row: Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {/* Personal vs Team badge */}
              {item.isPersonal ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 shadow-2xs">
                  <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  My Action Item
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                  <User className="w-3 h-3 text-zinc-500" />
                  {item.assignee}
                </span>
              )}

              {/* Priority badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priorityConfig.badgeClass}`}
              >
                {priorityConfig.icon}
                {priorityConfig.label}
              </span>

              {/* Deadline */}
              {(item.deadlineLabel || item.dueDate) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  {item.deadlineLabel || item.dueDate}
                </span>
              )}

              {/* Effort badge */}
              {item.effort && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
                  {effortLabel}
                </span>
              )}
            </div>

            {/* Task Title / Edit mode */}
            {isEditing ? (
              <div className="flex items-center gap-2 my-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="flex-1 px-2.5 py-1 text-sm bg-white dark:bg-zinc-800 border border-indigo-400 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h4
                onClick={() => setIsEditing(true)}
                className={`text-sm sm:text-base font-semibold leading-snug cursor-pointer transition-colors ${
                  isCompleted
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {item.title}
              </h4>
            )}

            {/* Priority Reason / Impact Justification */}
            {item.priorityReason && !isCompleted && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">Context:</span>
                {item.priorityReason}
              </p>
            )}

            {/* Ambiguity Warning Banner */}
            {item.isAmbiguous && !isCompleted && (
              <div className="mt-3 p-3 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-bold">Unverified: </span>
                    {item.ambiguityReason || 'Vague ownership or deadline in notes'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAmbiguityModal(item)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors shrink-0 flex items-center justify-center gap-1"
                >
                  Verify / Clarify
                </button>
              </div>
            )}

            {/* Original Quote Excerpt toggle */}
            {item.originalQuote && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowQuote(!showQuote)}
                  className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors"
                >
                  {showQuote ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showQuote ? 'Hide original note excerpt' : 'View verified excerpt in notes'}
                </button>
                {showQuote && (
                  <div className="mt-1.5 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 text-xs text-zinc-600 dark:text-zinc-300 italic font-mono leading-relaxed">
                    "{item.originalQuote}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Menu (Right side) */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
            {/* Google Calendar quick add */}
            <a
              href={getGoogleCalendarUrl(item, meetingTitle)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Add to Google Calendar"
            >
              <Calendar className="w-4 h-4" />
            </a>

            {/* Edit button */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Edit task title"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Remove action item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
