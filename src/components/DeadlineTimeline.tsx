import React, { useState } from 'react';
import { ActionItem, Meeting } from '../types';
import { getGoogleCalendarUrl, generateICS, downloadFile } from '../services/export';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Download, 
  Flame, 
  Zap, 
  User,
  Filter
} from 'lucide-react';

interface DeadlineTimelineProps {
  meeting: Meeting;
  onToggleStatus: (id: string) => void;
  onOpenAmbiguityModal: (item: ActionItem) => void;
}

export const DeadlineTimeline: React.FC<DeadlineTimelineProps> = ({
  meeting,
  onToggleStatus,
  onOpenAmbiguityModal,
}) => {
  const [filterPersonal, setFilterPersonal] = useState(false);

  // Group items by timeline urgency
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const items = filterPersonal
    ? meeting.actionItems.filter(i => i.isPersonal)
    : meeting.actionItems;

  const overdueOrToday: ActionItem[] = [];
  const thisWeek: ActionItem[] = [];
  const nextWeekOrLater: ActionItem[] = [];
  const noDate: ActionItem[] = [];

  items.forEach(item => {
    if (!item.dueDate) {
      noDate.push(item);
      return;
    }

    const itemDate = new Date(item.dueDate);
    const diffDays = Math.ceil((itemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 || item.dueDate === todayStr) {
      overdueOrToday.push(item);
    } else if (diffDays <= 7) {
      thisWeek.push(item);
    } else {
      nextWeekOrLater.push(item);
    }
  });

  const handleExportAllCalendar = () => {
    const icsContent = generateICS(meeting);
    const safeTitle = meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadFile(icsContent, `${safeTitle}-deadlines.ics`, 'text/calendar;charset=utf-8;');
  };

  const renderSection = (
    title: string,
    subtitle: string,
    badgeColor: string,
    taskList: ActionItem[],
    emptyText: string
  ) => (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <span className={`w-3 h-3 rounded-full ${badgeColor}`}></span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
            {taskList.length}
          </span>
        </div>
        <span className="text-xs text-zinc-400">{subtitle}</span>
      </div>

      {taskList.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-2">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {taskList.map(item => {
            const isDone = item.status === 'done';
            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-zinc-50/50 dark:bg-zinc-850/30 border-zinc-200/50 dark:border-zinc-800/50 opacity-60'
                    : 'bg-zinc-50 dark:bg-zinc-850/60 border-zinc-200/70 dark:border-zinc-750 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(item.id)}
                    className="mt-0.5 text-zinc-400 hover:text-indigo-600 transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 hover:border-indigo-500" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {item.isPersonal ? (
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-sm">
                          My Task
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded-sm">
                          @{item.assignee}
                        </span>
                      )}

                      {item.priority === 'high' && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> High
                        </span>
                      )}

                      {item.isAmbiguous && !isDone && (
                        <button
                          onClick={() => onOpenAmbiguityModal(item)}
                          className="text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-sm"
                        >
                          ⚠️ Verify
                        </button>
                      )}
                    </div>

                    <p className={`text-xs font-semibold leading-snug truncate ${isDone ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {item.title}
                    </p>

                    {(item.deadlineLabel || item.dueDate) && (
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{item.deadlineLabel || item.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={getGoogleCalendarUrl(item, meeting.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors shrink-0"
                  title="Schedule in Google Calendar"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-850 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Deadline Tracking & Calendar Radar
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Never miss post-meeting commitments. Sync deliverables directly into your calendar.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterPersonal(!filterPersonal)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              filterPersonal
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {filterPersonal ? 'Showing My Deadlines Only' : 'Filter My Deadlines'}
          </button>

          <button
            type="button"
            onClick={handleExportAllCalendar}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Sync All (.ics)
          </button>
        </div>
      </div>

      {/* Grid of timeline columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderSection(
          'Critical / Today',
          'Immediate focus',
          'bg-rose-500',
          overdueOrToday,
          'No overdue items or tasks due today.'
        )}

        {renderSection(
          'This Week',
          'Within 7 days',
          'bg-amber-500',
          thisWeek,
          'No immediate deadlines scheduled this week.'
        )}

        {renderSection(
          'Next Week & Later',
          'Upcoming milestones',
          'bg-indigo-500',
          nextWeekOrLater,
          'No later milestones mapped yet.'
        )}

        {renderSection(
          'Milestone / Flexible',
          'No firm date set',
          'bg-zinc-400',
          noDate,
          'All action items have concrete deadlines!'
        )}
      </div>
    </div>
  );
};
