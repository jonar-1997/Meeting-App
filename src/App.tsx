import React, { useState, useEffect } from 'react';
import { 
  Meeting, 
  ActionItem, 
  Priority, 
  TaskStatus, 
  EffortEstimate 
} from './types';
import { 
  getStoredMeetings, 
  saveStoredMeetings, 
  getUserProfile, 
  saveUserProfile, 
  UserProfile, 
  DEFAULT_USER_PROFILE 
} from './services/storage';
import { Navbar } from './components/Navbar';
import { NotesInput } from './components/NotesInput';
import { TaskCard } from './components/TaskCard';
import { DeadlineTimeline } from './components/DeadlineTimeline';
import { ExportModal } from './components/ExportModal';
import { AmbiguityResolverModal } from './components/AmbiguityResolverModal';
import { UserProfileModal } from './components/UserProfileModal';
import { 
  CheckSquare, 
  User, 
  Users, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Share2, 
  Lightbulb, 
  HelpCircle,
  Briefcase,
  Mic
} from 'lucide-react';

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentMeetingId, setCurrentMeetingId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [activeTab, setActiveTab] = useState<'checklist' | 'input' | 'timeline' | 'summary'>('checklist');
  const [filterScope, setFilterScope] = useState<'all' | 'personal' | 'team' | 'unverified'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [ambiguityModalItem, setAmbiguityModalItem] = useState<ActionItem | null>(null);

  // New manual item form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState(userProfile.name);
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDeadlineLabel, setNewDeadlineLabel] = useState('');
  const [isNewMeetingDraft, setIsNewMeetingDraft] = useState(false);
  const [autoStartDictation, setAutoStartDictation] = useState(false);

  // Initial load
  useEffect(() => {
    const loadedMeetings = getStoredMeetings();
    const loadedProfile = getUserProfile();
    setMeetings(loadedMeetings);
    setUserProfile(loadedProfile);
    setNewAssignee(loadedProfile.name);
    if (loadedMeetings.length > 0) {
      setCurrentMeetingId(loadedMeetings[0].id);
    }
  }, []);

  // Save meetings when updated
  const updateMeetings = (updatedList: Meeting[]) => {
    setMeetings(updatedList);
    saveStoredMeetings(updatedList);
  };

  const currentMeeting = meetings.find((m) => m.id === currentMeetingId) || meetings[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle item completion
  const handleToggleItemStatus = (itemId: string) => {
    if (!currentMeeting) return;
    const updatedItems = currentMeeting.actionItems.map((item) => {
      if (item.id === itemId) {
        const nextStatus: TaskStatus = item.status === 'done' ? 'todo' : 'done';
        return { ...item, status: nextStatus };
      }
      return item;
    });

    const updatedMeeting: Meeting = {
      ...currentMeeting,
      actionItems: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    updateMeetings(meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
  };

  // Update item details
  const handleUpdateItem = (itemId: string, updates: Partial<ActionItem>) => {
    if (!currentMeeting) return;
    const updatedItems = currentMeeting.actionItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      }
      return item;
    });

    const updatedMeeting: Meeting = {
      ...currentMeeting,
      actionItems: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    updateMeetings(meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
    showToast('Action item updated');
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    if (!currentMeeting) return;
    const updatedItems = currentMeeting.actionItems.filter((i) => i.id !== itemId);
    const updatedMeeting: Meeting = {
      ...currentMeeting,
      actionItems: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    updateMeetings(meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
    showToast('Action item removed');
  };

  // Resolve ambiguity modal confirmation
  const handleResolveAmbiguity = (itemId: string, updates: Partial<ActionItem>) => {
    if (!currentMeeting) return;
    const targetItem = currentMeeting.actionItems.find((i) => i.id === itemId);
    const updatedItems = currentMeeting.actionItems.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    const updatedAmbiguities = currentMeeting.ambiguities.map((amb) => {
      if (targetItem && amb.issue.toLowerCase().includes(targetItem.title.slice(0, 15).toLowerCase())) {
        return { ...amb, resolved: true, resolvedOwner: updates.assignee };
      }
      return amb;
    });

    const updatedMeeting: Meeting = {
      ...currentMeeting,
      actionItems: updatedItems,
      ambiguities: updatedAmbiguities,
      updatedAt: new Date().toISOString(),
    };

    updateMeetings(meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
    showToast('Verified! Ambiguity resolved & owner locked.');
  };

  // Save user profile identity
  const handleSaveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
    setNewAssignee(profile.name);

    // Update isPersonal flags across current meeting
    if (currentMeeting) {
      const updatedItems = currentMeeting.actionItems.map((item) => ({
        ...item,
        isPersonal: item.assignee.toLowerCase() === profile.name.toLowerCase() || item.assignee === 'Me',
      }));
      const updatedMeeting: Meeting = {
        ...currentMeeting,
        userName: profile.name,
        userRole: profile.role,
        actionItems: updatedItems,
      };
      updateMeetings(meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
    }
    showToast(`Identity set to ${profile.name}`);
  };

  // Add a manual action item
  const handleCreateManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentMeeting) return;

    const isPersonal = newAssignee.toLowerCase() === userProfile.name.toLowerCase() || newAssignee === 'Me';

    const newItem: ActionItem = {
      id: `manual-${Date.now()}`,
      title: newTitle.trim(),
      assignee: newAssignee.trim() || userProfile.name,
      isPersonal,
      priority: newPriority,
      dueDate: newDueDate,
      deadlineLabel: newDeadlineLabel,
      status: 'todo',
      effort: 'medium',
      isAmbiguous: false,
    };

    const updatedMeeting: Meeting = {
      ...currentMeeting,
      actionItems: [newItem, ...currentMeeting.actionItems],
      updatedAt: new Date().toISOString(),
    };

    updateMeetings(meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
    setShowAddModal(false);
    setNewTitle('');
    setNewDueDate('');
    setNewDeadlineLabel('');
    showToast('New action item added');
  };

  // AI Analysis submission
  const handleAnalyzeNotes = async (payload: {
    rawNotes: string;
    title: string;
    date: string;
    meetingType: Meeting['meetingType'];
    attendees: string[];
  }) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/analyze-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes: payload.rawNotes,
          title: payload.title,
          currentDate: payload.date,
          userName: userProfile.name,
          userRole: userProfile.role,
          attendees: payload.attendees,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const result = await res.json();

      const newMeetingId = `meeting-${Date.now()}`;
      const newMeeting: Meeting = {
        id: newMeetingId,
        title: payload.title,
        date: payload.date,
        meetingType: payload.meetingType,
        rawNotes: payload.rawNotes,
        attendees: payload.attendees,
        userName: userProfile.name,
        userRole: userProfile.role,
        summary: result.summary,
        actionItems: result.actionItems || [],
        decisions: result.decisions || [],
        ambiguities: result.ambiguities || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newMeeting, ...meetings];
      setMeetings(updated);
      saveStoredMeetings(updated);
      setCurrentMeetingId(newMeetingId);
      setIsNewMeetingDraft(false);
      setActiveTab('checklist');
      showToast(result.warning || 'Meeting notes successfully transformed into verified action items!');
    } catch (err: any) {
      console.error('Failed to analyze notes:', err);
      showToast('Could not process notes. Please check connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create new blank meeting
  const handleStartNewMeeting = () => {
    setIsNewMeetingDraft(true);
    setActiveTab('input');
  };

  if (!currentMeeting) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="animate-spin text-indigo-600">
          <Sparkles className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalItems = currentMeeting.actionItems.length;
  const completedItems = currentMeeting.actionItems.filter((i) => i.status === 'done').length;
  const personalItemsList = currentMeeting.actionItems.filter((i) => i.isPersonal);
  const teamItemsList = currentMeeting.actionItems.filter((i) => !i.isPersonal);
  const unverifiedItemsList = currentMeeting.actionItems.filter((i) => i.isAmbiguous);
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Filter tasks for display
  const filteredActionItems = currentMeeting.actionItems.filter((item) => {
    // Scope filter
    if (filterScope === 'personal' && !item.isPersonal) return false;
    if (filterScope === 'team' && item.isPersonal) return false;
    if (filterScope === 'unverified' && !item.isAmbiguous) return false;

    // Priority filter
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchAssignee = item.assignee.toLowerCase().includes(q);
      const matchQuote = item.originalQuote?.toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchQuote) return false;
    }

    return true;
  });

  const filteredPersonal = filteredActionItems.filter((i) => i.isPersonal);
  const filteredTeam = filteredActionItems.filter((i) => !i.isPersonal);

  return (
    <div className="min-h-screen bg-zinc-100/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentMeeting={currentMeeting}
        allMeetings={meetings}
        onSelectMeeting={(id) => {
          setCurrentMeetingId(id);
          setActiveTab('checklist');
        }}
        onNewMeeting={handleStartNewMeeting}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        userProfile={userProfile}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Meeting Header Banner */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-7 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 uppercase tracking-wider">
                  {currentMeeting.meetingType.replace('_', ' ')}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {currentMeeting.date}
                </span>
                {currentMeeting.attendees.length > 0 && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {currentMeeting.attendees.length} Attendees
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {currentMeeting.title}
              </h1>

              {currentMeeting.summary.executiveSummary && (
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-3xl leading-relaxed">
                  💡 {currentMeeting.summary.executiveSummary}
                </p>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap">
              {/* My Tasks Metric */}
              <div
                onClick={() => {
                  setActiveTab('checklist');
                  setFilterScope('personal');
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  filterScope === 'personal'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-zinc-50 dark:bg-zinc-850/60'
                }`}
              >
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  My To-Dos
                </div>
                <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {personalItemsList.length}
                </div>
              </div>

              {/* Team Deliverables Metric */}
              <div
                onClick={() => {
                  setActiveTab('checklist');
                  setFilterScope('team');
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  filterScope === 'team'
                    ? 'border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-zinc-50 dark:bg-zinc-850/60'
                }`}
              >
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-zinc-500" />
                  Team Matrix
                </div>
                <div className="text-lg font-black text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {teamItemsList.length}
                </div>
              </div>

              {/* Unverified / Ambiguities Metric */}
              <div
                onClick={() => {
                  setActiveTab('checklist');
                  setFilterScope('unverified');
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  unverifiedItemsList.length > 0
                    ? filterScope === 'unverified'
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                      : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/60'
                }`}
              >
                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Unverified
                </div>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {unverifiedItemsList.length}
                </div>
              </div>

              {/* Progress Metric */}
              <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850/60 min-w-[120px]">
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Progress
                </div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {progressPercent}%
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'checklist'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Action Items ({totalItems})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'timeline'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Deadlines & Radar
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'summary'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Executive Brief & Decisions ({currentMeeting.decisions.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setIsNewMeetingDraft(false);
                setActiveTab('input');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'input'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Raw Notes & Ingestion
            </button>

            <button
              type="button"
              onClick={() => {
                setIsNewMeetingDraft(false);
                setActiveTab('input');
                setAutoStartDictation(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 ml-auto cursor-pointer"
              title="Open microphone and dictate meeting notes into the scratchpad in real time"
            >
              <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Voice Dictate
            </button>
          </div>
        </div>

        {/* Tab 1: Checklist & Action Items View */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Scope filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterScope('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filterScope === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  All ({totalItems})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterScope('personal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filterScope === 'personal'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 hover:bg-indigo-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  My To-Dos ({personalItemsList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterScope('team')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filterScope === 'team'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Team Matrix ({teamItemsList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterScope('unverified')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filterScope === 'unverified'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : unverifiedItemsList.length > 0
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Needs Verification ({unverifiedItemsList.length})
                </button>
              </div>

              {/* Right Tools: Priority filter, Search & Add */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search input */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks, quotes..."
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Priority Selector */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                {/* Add Manual Action Item */}
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
              </div>
            </div>

            {/* Verification Alert Callout if unverified items exist */}
            {unverifiedItemsList.length > 0 && filterScope !== 'unverified' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100">
                      {unverifiedItemsList.length} action {unverifiedItemsList.length === 1 ? 'item has' : 'items have'} vague ownership or deadlines
                    </h4>
                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                      Notes contained unassigned phrases ("someone should look into...", "we should check..."). Verify them before leaving the meeting!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFilterScope('unverified')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs"
                >
                  Review Ambiguities
                </button>
              </div>
            )}

            {/* SECTION 1: Personal Action Items (Primary Goal) */}
            {(filterScope === 'all' || filterScope === 'personal') && filteredPersonal.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    My Personal To-Do List ({filteredPersonal.length})
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Assigned to {userProfile.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {filteredPersonal.map((item) => (
                    <TaskCard
                      key={item.id}
                      item={item}
                      meetingTitle={currentMeeting.title}
                      onToggleStatus={handleToggleItemStatus}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onOpenAmbiguityModal={(it) => setAmbiguityModalItem(it)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: Team Action Matrix */}
            {(filterScope === 'all' || filterScope === 'team') && filteredTeam.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    Team Action Matrix ({filteredTeam.length})
                  </h3>
                  <span className="text-xs text-zinc-400">Colleagues & external deliverables</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {filteredTeam.map((item) => (
                    <TaskCard
                      key={item.id}
                      item={item}
                      meetingTitle={currentMeeting.title}
                      onToggleStatus={handleToggleItemStatus}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onOpenAmbiguityModal={(it) => setAmbiguityModalItem(it)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* When viewing unverified only */}
            {filterScope === 'unverified' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Ambiguous & Unverified Deliverables ({filteredActionItems.length})
                  </h3>
                </div>

                {filteredActionItems.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      All action items are clear!
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      No ambiguous ownership or missing deadlines detected in this meeting.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredActionItems.map((item) => (
                      <TaskCard
                        key={item.id}
                        item={item}
                        meetingTitle={currentMeeting.title}
                        onToggleStatus={handleToggleItemStatus}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onOpenAmbiguityModal={(it) => setAmbiguityModalItem(it)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state if search or filter yielded nothing */}
            {filteredActionItems.length === 0 && filterScope !== 'unverified' && (
              <div className="bg-white dark:bg-zinc-900 p-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                <CheckSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                  No action items match your filter
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Try clearing your search query or switching from '{filterScope}' to 'All'.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterScope('all');
                    setPriorityFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Timeline & Radar */}
        {activeTab === 'timeline' && (
          <DeadlineTimeline
            meeting={currentMeeting}
            onToggleStatus={handleToggleItemStatus}
            onOpenAmbiguityModal={(it) => setAmbiguityModalItem(it)}
          />
        )}

        {/* Tab 3: Executive Brief & Logged Decisions */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Executive Summary Card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Executive Synthesis
              </h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                {currentMeeting.summary.executiveSummary || 'No summary available yet. Ingest notes to generate.'}
              </p>

              {/* Key Outcomes */}
              {currentMeeting.summary.keyOutcomes.length > 0 && (
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
                    Key Conclusions & Takeaways
                  </h4>
                  <ul className="space-y-2">
                    {currentMeeting.summary.keyOutcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unresolved Questions */}
              {currentMeeting.summary.unresolvedQuestions.length > 0 && (
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
                    Open Debates & Unresolved Questions
                  </h4>
                  <ul className="space-y-2">
                    {currentMeeting.summary.unresolvedQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-800 dark:text-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                        <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Decisions Card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Agreed Decisions Log ({currentMeeting.decisions.length})
              </h3>

              {currentMeeting.decisions.length === 0 ? (
                <p className="text-xs text-zinc-400">No firm decisions were logged in these notes.</p>
              ) : (
                <div className="space-y-3">
                  {currentMeeting.decisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-4 bg-zinc-50 dark:bg-zinc-850/60 rounded-xl border border-zinc-200/70 dark:border-zinc-750"
                    >
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {dec.decision}
                      </h4>
                      {dec.context && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Context: {dec.context}
                        </p>
                      )}
                      {dec.stakeholders && (
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Stakeholders: {dec.stakeholders}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Raw Notes Ingestion */}
        {activeTab === 'input' && (
          <NotesInput
            initialTitle={isNewMeetingDraft ? '' : currentMeeting.title}
            initialNotes={isNewMeetingDraft ? '' : currentMeeting.rawNotes}
            initialDate={isNewMeetingDraft ? new Date().toISOString().split('T')[0] : currentMeeting.date}
            initialType={isNewMeetingDraft ? 'sync' : currentMeeting.meetingType}
            initialAttendees={isNewMeetingDraft ? [userProfile.name] : currentMeeting.attendees}
            userName={userProfile.name}
            userRole={userProfile.role}
            isProcessing={isProcessing}
            autoStartDictation={autoStartDictation}
            onDictationStarted={() => setAutoStartDictation(false)}
            onAnalyze={handleAnalyzeNotes}
          />
        )}
      </main>

      {/* Manual Task Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Add Action Item
            </h3>

            <form onSubmit={handleCreateManualItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  Task Title (Action verb)
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Audit checkout webhook retries"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  Assignee
                </label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder={`e.g. ${userProfile.name} or Sarah`}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                  Deadline Label
                </label>
                <input
                  type="text"
                  value={newDeadlineLabel}
                  onChange={(e) => setNewDeadlineLabel(e.target.value)}
                  placeholder="e.g. Tomorrow by 3pm"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Add Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        meeting={currentMeeting}
      />

      {/* Identity Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentProfile={userProfile}
        onSave={handleSaveUserProfile}
      />

      {/* Ambiguity Resolver Modal */}
      <AmbiguityResolverModal
        isOpen={Boolean(ambiguityModalItem)}
        onClose={() => setAmbiguityModalItem(null)}
        item={ambiguityModalItem}
        warning={
          currentMeeting.ambiguities.find(
            (a) => ambiguityModalItem && a.issue.includes(ambiguityModalItem.title.slice(0, 15))
          ) || null
        }
        currentUserName={userProfile.name}
        attendees={currentMeeting.attendees}
        meetingTitle={currentMeeting.title}
        onResolve={handleResolveAmbiguity}
      />
    </div>
  );
}
