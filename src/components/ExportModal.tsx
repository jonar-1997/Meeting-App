import React, { useState } from 'react';
import { Meeting, ExportFormat } from '../types';
import { 
  generateSlackMarkdown, 
  generateNotionMarkdown, 
  generateTodoistFormat, 
  generateCSV, 
  generateICS, 
  downloadFile 
} from '../services/export';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  FileText, 
  Calendar, 
  Table, 
  MessageSquare, 
  ListCheck,
  CheckCircle2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, meeting }) => {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('slack');
  const [personalOnly, setPersonalOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getExportContent = () => {
    switch (activeFormat) {
      case 'slack':
        return generateSlackMarkdown(meeting, personalOnly);
      case 'notion':
        return generateNotionMarkdown(meeting);
      case 'todoist':
        return generateTodoistFormat(meeting);
      case 'csv':
        return generateCSV(meeting);
      case 'ical':
        return generateICS(meeting);
      case 'markdown':
        return generateNotionMarkdown(meeting);
      case 'json':
        return JSON.stringify(meeting, null, 2);
      default:
        return '';
    }
  };

  const content = getExportContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const safeTitle = meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    switch (activeFormat) {
      case 'csv':
        downloadFile(content, `${safeTitle}-action-items.csv`, 'text/csv;charset=utf-8;');
        break;
      case 'ical':
        downloadFile(content, `${safeTitle}-deadlines.ics`, 'text/calendar;charset=utf-8;');
        break;
      case 'markdown':
      case 'slack':
      case 'notion':
        downloadFile(content, `${safeTitle}-actions.md`, 'text/markdown;charset=utf-8;');
        break;
      case 'json':
        downloadFile(content, `${safeTitle}-backup.json`, 'application/json');
        break;
      default:
        downloadFile(content, `${safeTitle}.txt`, 'text/plain');
    }
  };

  const formats: { id: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'slack',
      label: 'Slack & Teams',
      icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
      desc: 'Formatted digest for team channel announcement',
    },
    {
      id: 'notion',
      label: 'Notion',
      icon: <Table className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />,
      desc: 'Formatted tables, callouts & task checklists',
    },
    {
      id: 'todoist',
      label: 'Todoist & TickTick',
      icon: <ListCheck className="w-4 h-4 text-rose-500" />,
      desc: 'Quick-add syntax with @tags, due dates & p1/p2',
    },
    {
      id: 'ical',
      label: 'Calendar (.ics)',
      icon: <Calendar className="w-4 h-4 text-indigo-500" />,
      desc: 'Sync deadlines into Google, Apple, or Outlook Calendar',
    },
    {
      id: 'csv',
      label: 'Spreadsheet (CSV)',
      icon: <FileText className="w-4 h-4 text-amber-500" />,
      desc: 'Import into Excel, Airtable, or Google Sheets',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Export Action Items
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Push verified to-dos directly into your team tools and calendars.
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

        {/* Format Selector Tabs */}
        <div className="p-4 bg-zinc-50/70 dark:bg-zinc-850/60 border-b border-zinc-200/60 dark:border-zinc-800">
          <div className="flex flex-wrap gap-2">
            {formats.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setActiveFormat(fmt.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeFormat === fmt.id
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                {fmt.icon}
                {fmt.label}
              </button>
            ))}
          </div>

          {activeFormat === 'slack' && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="personalOnlyCheck"
                checked={personalOnly}
                onChange={(e) => setPersonalOnly(e.target.checked)}
                className="rounded-sm border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="personalOnlyCheck" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                Export personal to-dos only (skip team matrix)
              </label>
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="p-5 flex-1 min-h-[220px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Output Preview
            </span>
            <span className="text-xs text-zinc-400">
              {activeFormat === 'ical' ? 'Ready to import into Google/Apple Calendar' : 'Ready to copy'}
            </span>
          </div>

          <div className="flex-1 overflow-auto bg-zinc-900 text-zinc-100 p-4 rounded-xl font-mono text-xs leading-relaxed border border-zinc-800 select-all">
            <pre className="whitespace-pre-wrap">{content}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-850 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {meeting.actionItems.length} action items total
          </span>

          <div className="flex items-center gap-2">
            {activeFormat === 'ical' || activeFormat === 'csv' ? (
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download {activeFormat.toUpperCase()} File
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save as File
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
