import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { RAW_TEMPLATES } from '../services/storage';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  FileText, 
  Calendar, 
  Users, 
  RotateCcw, 
  ChevronDown, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface NotesInputProps {
  initialTitle: string;
  initialNotes: string;
  initialDate: string;
  initialType: Meeting['meetingType'];
  initialAttendees: string[];
  userName: string;
  userRole?: string;
  isProcessing: boolean;
  onAnalyze: (payload: {
    rawNotes: string;
    title: string;
    date: string;
    meetingType: Meeting['meetingType'];
    attendees: string[];
  }) => void;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  initialTitle,
  initialNotes,
  initialDate,
  initialType,
  initialAttendees,
  userName,
  userRole,
  isProcessing,
  onAnalyze,
}) => {
  const [title, setTitle] = useState(initialTitle || 'Product & Sprint Alignment');
  const [notes, setNotes] = useState(initialNotes || '');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [meetingType, setMeetingType] = useState<Meeting['meetingType']>(initialType || 'sprint');
  const [attendeeInput, setAttendeeInput] = useState(initialAttendees.join(', '));
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));
  }, []);

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
        if (transcript) {
          setNotes((prev) => (prev ? `${prev.trim()}\n${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsRecording(false);
    }
  };

  const handleApplyTemplate = (idx: number) => {
    const t = RAW_TEMPLATES[idx];
    if (!t) return;
    setTitle(t.title);
    setNotes(t.notes);
    setMeetingType(t.type);
    setAttendeeInput(t.attendees.join(', '));
    setSelectedTemplateIndex(idx);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || isProcessing) return;

    const attendeesList = attendeeInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    onAnalyze({
      rawNotes: notes.trim(),
      title: title.trim() || 'Meeting Notes',
      date,
      meetingType,
      attendees: attendeesList,
    });
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Meeting Notes Ingestion
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Paste messy scratchpad notes, bullet points, or transcript excerpts. The AI separates your personal commitments from team deliverables.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400 font-medium">Try Sample:</span>
          {RAW_TEMPLATES.map((tmpl, idx) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => handleApplyTemplate(idx)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs transition-all"
            >
              {tmpl.name.split(' ')[0]} {tmpl.type}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Sprint Planning"
              required
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Meeting Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Type / Format
            </label>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sprint">Sprint / Engineering Sync</option>
              <option value="sync">Product / Cross-Functional</option>
              <option value="one_on_one">Executive 1-on-1</option>
              <option value="client">Client / External Discovery</option>
              <option value="all_hands">All-Hands / Leadership</option>
              <option value="brainstorm">Brainstorm / Roadmap</option>
              <option value="other">Other Meeting</option>
            </select>
          </div>
        </div>

        {/* Attendees */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            Key Attendees (Comma-separated)
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value)}
              placeholder="e.g. Alex Rivera, Sarah Chen, Marcus Brody, David Kim"
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Include names so the engine can accurately match team tasks to specific owners. Your profile is set to: <strong className="text-indigo-600 dark:text-indigo-400">{userName}</strong>.
          </p>
        </div>

        {/* Text Area for Notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Raw Meeting Notes & Scratchpad
            </label>
            <div className="flex items-center gap-3">
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                  title="Speak into microphone to transcribe notes directly"
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecording ? 'Listening...' : 'Voice Dictate'}
                </button>
              )}
              <span className="text-xs text-zinc-400">{wordCount} words</span>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={10}
            required
            placeholder="Paste raw notes here... e.g.&#10;- David kicked off the sync. Checkout bugs dropped conversion by 4%. Alex: I'll audit the mobile Safari CSS by tomorrow 3pm.&#10;- Sarah will finish the Figma token specs by Thursday EOD.&#10;- Marcus: 'Someone needs to check why Postgres CPU hit 88%...'&#10;- Feature freeze confirmed for Friday Oct 16."
            className="w-full p-4 font-mono text-xs sm:text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

        {/* Submit Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>AI will extract personal to-dos, team tasks, deadlines, and flag ambiguities.</span>
          </div>

          <button
            type="submit"
            disabled={!notes.trim() || isProcessing}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
              isProcessing
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-[0.98]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Analyzing & Verifying with Gemini...' : 'Transform Into Action Checklist'}
          </button>
        </div>
      </form>
    </div>
  );
};
