export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type EffortEstimate = 'quick' | 'medium' | 'deep';

export interface ActionItem {
  id: string;
  title: string;
  originalQuote?: string;
  assignee: string; // e.g. "Me", "Sarah Chen", "Marcus", "Unassigned"
  isPersonal: boolean;
  priority: Priority;
  priorityReason?: string;
  dueDate?: string; // YYYY-MM-DD format if determinable
  deadlineLabel?: string; // e.g. "Thursday EOD", "Next sprint kickoff"
  status: TaskStatus;
  effort?: EffortEstimate;
  category?: string;
  isAmbiguous?: boolean;
  ambiguityReason?: string;
  suggestedClarification?: string;
  tags?: string[];
  notes?: string;
}

export interface AmbiguityWarning {
  id: string;
  issue: string;
  snippet: string;
  suggestedAction: string;
  resolved: boolean;
  resolvedOwner?: string;
}

export interface Decision {
  id: string;
  decision: string;
  context?: string;
  stakeholders?: string;
}

export interface MeetingSummary {
  executiveSummary: string;
  keyOutcomes: string[];
  unresolvedQuestions: string[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  meetingType: 'sprint' | 'sync' | 'one_on_one' | 'client' | 'all_hands' | 'brainstorm' | 'other';
  rawNotes: string;
  attendees: string[];
  userName: string;
  userRole?: string;
  summary: MeetingSummary;
  actionItems: ActionItem[];
  decisions: Decision[];
  ambiguities: AmbiguityWarning[];
  createdAt: string;
  updatedAt: string;
}

export type ExportFormat = 
  | 'slack'
  | 'notion'
  | 'todoist'
  | 'markdown'
  | 'csv'
  | 'ical'
  | 'json';
