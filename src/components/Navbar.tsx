import React from 'react';
import { Meeting } from '../types';
import { UserProfile } from '../services/storage';
import { 
  CheckSquare, 
  Share2, 
  Plus, 
  User, 
  ChevronDown, 
  Sparkles,
  Layers,
  History
} from 'lucide-react';

interface NavbarProps {
  currentMeeting: Meeting;
  allMeetings: Meeting[];
  onSelectMeeting: (meetingId: string) => void;
  onNewMeeting: () => void;
  onOpenExport: () => void;
  onOpenProfile: () => void;
  userProfile: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMeeting,
  allMeetings,
  onSelectMeeting,
  onNewMeeting,
  onOpenExport,
  onOpenProfile,
  userProfile,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-xs">
              <CheckSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                  ActionDraft
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI Verified
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-zinc-500 dark:text-zinc-400 font-medium -mt-0.5">
                Meeting Notes → Verified Personal & Team Action Items
              </p>
            </div>
          </div>

          {/* Meeting Switcher Dropdown */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="relative">
              <select
                value={currentMeeting.id}
                onChange={(e) => onSelectMeeting(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 max-w-xs truncate cursor-pointer"
              >
                {allMeetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.actionItems.length} items)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={onNewMeeting}
              className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Create new meeting notes"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Identity Switcher Button */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
              title="Edit your identity so AI assigns 'My Tasks' accurately"
            >
              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline max-w-[120px] truncate">{userProfile.name}</span>
              <span className="sm:hidden">Identity</span>
            </button>

            {/* New Meeting (Mobile / Compact) */}
            <button
              type="button"
              onClick={onNewMeeting}
              className="lg:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700"
              title="New Meeting"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Export Action Items Button */}
            <button
              type="button"
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs hover:shadow-indigo-500/20 active:scale-[0.98] transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
