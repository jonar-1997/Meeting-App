import React from 'react';
import { 
  Mic, 
  Sliders, 
  CheckSquare, 
  Sparkles, 
  X, 
  ArrowRight, 
  UserCheck,
  Calendar,
  ListChecks
} from 'lucide-react';

interface WelcomeGuideProps {
  userName: string;
  onStartRecording: () => void;
  onSetMeetingDetails: () => void;
  onGenerateChecklist: () => void;
  onOpenProfile: () => void;
  onDismiss: () => void;
}

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({
  userName,
  onStartRecording,
  onSetMeetingDetails,
  onGenerateChecklist,
  onOpenProfile,
  onDismiss,
}) => {
  return (
    <section
      aria-label="Welcome Guide for First-Time Users"
      className="relative bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-900 text-white rounded-3xl border border-indigo-500/30 p-6 sm:p-7 shadow-xl mb-6 overflow-hidden"
    >
      {/* Subtle decorative radial glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Welcome to ActionDraft • First-Time User Guide</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Turn messy meetings into verified action checklists in 3 simple steps
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Capture live discussions from your microphone, define your meeting context, and automatically separate your personal to-dos from team deliverables.
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors shrink-0 cursor-pointer"
            title="Dismiss welcome guide"
            aria-label="Dismiss welcome guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Step Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Record Meeting from Microphone */}
          <div className="bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-black">
                  1
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300/90 flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5" />
                  Live Voice Capture
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">
                Record the Meeting from Microphone
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Click <strong>Voice Dictate</strong> to record live spoken audio directly from your microphone. Speech is transcribed in real time into the meeting scratchpad—or you can paste raw notes manually.
              </p>
            </div>

            <button
              type="button"
              onClick={onStartRecording}
              className="mt-4 w-full py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record from Microphone</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>

          {/* Step 2: Set Meeting Details */}
          <div className="bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-black">
                  2
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300/90 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Context & Attendees
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">
                Set Meeting Details
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Enter the <strong>Meeting Title, Date, Format, and Key Attendees</strong>. Adding attendee names and verifying your identity (currently <span className="text-indigo-300 font-semibold">{userName}</span>) ensures accurate owner matching.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={onSetMeetingDetails}
                className="flex-1 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Set Meeting Details</span>
              </button>
              <button
                type="button"
                onClick={onOpenProfile}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                title="Configure your personal identity"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Step 3: Generate an Action Checklist */}
          <div className="bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black">
                  3
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90 flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" />
                  Verified Output
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">
                Generate an Action Checklist
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Click <strong>Transform Into Action Checklist</strong> to extract a verified personal to-do list, team deliverables matrix, deadline timeline, and flag vague tasks that need owner confirmation.
              </p>
            </div>

            <button
              type="button"
              onClick={onGenerateChecklist}
              className="mt-4 w-full py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Generate Action Checklist</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <span>
            Tip: We have loaded a sample sprint meeting below so you can explore verified tasks, timelines, and ambiguity alerts right away.
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors shrink-0 cursor-pointer"
          >
            Got it, hide guide
          </button>
        </div>
      </div>
    </section>
  );
};
