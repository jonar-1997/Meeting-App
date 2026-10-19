import { Meeting } from '../types';

const STORAGE_KEY = 'actiondraft_meetings_v1';
const USER_PROFILE_KEY = 'actiondraft_user_profile_v1';
const WELCOME_DISMISSED_KEY = 'actiondraft_welcome_dismissed_v1';

export interface UserProfile {
  name: string;
  role: string;
  email: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  role: 'Lead Product Engineer',
  email: 'alex@company.com',
};

export const SAMPLE_MEETINGS: Meeting[] = [
  {
    id: 'sample-sprint-sync',
    title: 'Q4 Core Platform Sprint & Launch Sync',
    date: '2026-10-17',
    meetingType: 'sprint',
    userName: 'Alex Rivera',
    userRole: 'Lead Product Engineer',
    attendees: ['Alex Rivera', 'Sarah Chen (Design)', 'Marcus Brody (Backend)', 'David Kim (Product Manager)'],
    rawNotes: `Product Sync - Oct 17
Attendees: David, Sarah, Marcus, Alex

- David kicked off talking about the Stripe checkout v3 rollout. Conversions dropped 4% on mobile safari. Alex: I'll audit the mobile viewport CSS and Safari webhook retries by today 5pm. David says that's top priority.
- Sarah presented new onboarding flow designs in Figma. Look great. Sarah: "I'll export final SVG icon assets and the design token spec by Tuesday EOD."
- Marcus mentioned database CPU spiked to 88% yesterday during batch sync. "We probably need someone to look into the PostgreSQL connection pool sizing or index missing queries... maybe devops can check?"
- Alex: I will coordinate with Marcus on the indexing PR and review his migration before it hits staging on Monday.
- Decision: We agreed not to delay the mobile launch. Feature freeze is definitely next Friday Oct 23.
- Someone asked about the GDPR data deletion endpoint audit. Marcus said "Someone should ping the compliance consultant to double check if we need 30-day logs." (Unclear who is doing this).
- David wants an updated release candidate changelog doc prepared by Alex by Wednesday morning before executive standup.`,
    summary: {
      executiveSummary: 'Reviewed mobile conversion drop, Q4 onboarding designs, and database performance spikes ahead of the Friday feature freeze.',
      keyOutcomes: [
        'Confirmed Friday Oct 23 hard feature freeze for Q4 release.',
        'Prioritized mobile Safari checkout fix above all other bug triage.',
        'Sarah delivering design tokens and SVGs by Tuesday.',
      ],
      unresolvedQuestions: [
        'Who owns contacting the compliance consultant for GDPR log retention?',
        'Who is responsible for the Postgres connection pool investigation (Marcus or DevOps)?',
      ],
    },
    actionItems: [
      {
        id: 'ai-sample-1',
        title: 'Audit mobile Safari checkout CSS and webhook retry logic',
        originalQuote: "Alex: I'll audit the mobile viewport CSS and Safari webhook retries by today 5pm. David says that's top priority.",
        assignee: 'Alex Rivera',
        isPersonal: true,
        priority: 'high',
        priorityReason: 'Directly impacts 4% conversion drop on mobile checkout; top blocker.',
        dueDate: '2026-10-17',
        deadlineLabel: 'Today at 5:00 PM',
        status: 'todo',
        effort: 'medium',
        category: 'Engineering',
        isAmbiguous: false,
        tags: ['P0 Blocker', 'Checkout', 'Mobile'],
      },
      {
        id: 'ai-sample-2',
        title: 'Draft updated release candidate changelog for executive standup',
        originalQuote: 'David wants an updated release candidate changelog doc prepared by Alex by Wednesday morning before executive standup.',
        assignee: 'Alex Rivera',
        isPersonal: true,
        priority: 'high',
        priorityReason: 'Required for executive sign-off before Wednesday morning standup.',
        dueDate: '2026-10-21',
        deadlineLabel: 'Wednesday 9:00 AM',
        status: 'todo',
        effort: 'quick',
        category: 'Product',
        isAmbiguous: false,
        tags: ['Executive Brief', 'Release'],
      },
      {
        id: 'ai-sample-3',
        title: 'Review Marcus’s database migration PR before staging deploy',
        originalQuote: 'Alex: I will coordinate with Marcus on the indexing PR and review his migration before it hits staging on Monday.',
        assignee: 'Alex Rivera',
        isPersonal: true,
        priority: 'medium',
        priorityReason: 'Prevents database downtime during staging deployment on Monday.',
        dueDate: '2026-10-19',
        deadlineLabel: 'Monday before Staging Deploy',
        status: 'todo',
        effort: 'quick',
        category: 'Engineering',
        isAmbiguous: false,
        tags: ['Code Review', 'Backend'],
      },
      {
        id: 'ai-sample-4',
        title: 'Export final SVG onboarding icons and design token specs',
        originalQuote: "Sarah: 'I'll export final SVG icon assets and the design token spec by Tuesday EOD.'",
        assignee: 'Sarah Chen',
        isPersonal: false,
        priority: 'medium',
        priorityReason: 'Dependencies needed by frontend before feature freeze on Friday.',
        dueDate: '2026-10-20',
        deadlineLabel: 'Tuesday EOD',
        status: 'in_progress',
        effort: 'medium',
        category: 'Design',
        isAmbiguous: false,
        tags: ['Design', 'Tokens'],
      },
      {
        id: 'ai-sample-5',
        title: 'Investigate PostgreSQL CPU spike & connection pool tuning',
        originalQuote: 'We probably need someone to look into the PostgreSQL connection pool sizing or index missing queries... maybe devops can check?',
        assignee: 'Marcus Brody',
        isPersonal: false,
        priority: 'high',
        priorityReason: 'Database reached 88% CPU peak; risks server crash.',
        dueDate: '2026-10-20',
        deadlineLabel: 'Tuesday',
        status: 'todo',
        effort: 'deep',
        category: 'DevOps / DB',
        isAmbiguous: true,
        ambiguityReason: 'Ownership was suggested loosely ("maybe devops can check?") without firm assignee.',
        suggestedClarification: 'Confirm whether Marcus or dedicated DevOps engineer takes primary ticket.',
        tags: ['Database', 'Infra'],
      },
      {
        id: 'ai-sample-6',
        title: 'Consult compliance specialist on GDPR 30-day log deletion rules',
        originalQuote: 'Someone should ping the compliance consultant to double check if we need 30-day logs. (Unclear who is doing this).',
        assignee: 'Unassigned',
        isPersonal: false,
        priority: 'low',
        priorityReason: 'Regulatory compliance requirement for EU launch.',
        dueDate: '2026-10-27',
        deadlineLabel: 'Next week',
        status: 'todo',
        effort: 'quick',
        category: 'Legal / Compliance',
        isAmbiguous: true,
        ambiguityReason: 'No specific individual was designated to make the contact.',
        suggestedClarification: 'Assign either Product Manager (David) or Tech Lead to send email inquiry.',
        tags: ['Compliance', 'Unassigned'],
      },
    ],
    decisions: [
      {
        id: 'dec-1',
        decision: 'Strict feature freeze date locked for Friday, October 16.',
        context: 'Agreed unanimously to safeguard stability ahead of holiday traffic.',
        stakeholders: 'Alex, Sarah, Marcus, David',
      },
      {
        id: 'dec-2',
        decision: 'Proceed with rollout without delaying for secondary cosmetic UI.',
        context: 'Mobile Safari conversion bug takes precedent over redesign enhancements.',
        stakeholders: 'David Kim',
      },
    ],
    ambiguities: [
      {
        id: 'amb-1',
        issue: 'PostgreSQL connection pool investigation owner is vague',
        snippet: 'Marcus mentioned... "maybe devops can check?"',
        suggestedAction: 'Clarify if Marcus owns the ticket or if a DevOps JIRA ticket should be created.',
        resolved: false,
      },
      {
        id: 'amb-2',
        issue: 'GDPR compliance consultant outreach is unassigned',
        snippet: 'Someone should ping the compliance consultant...',
        suggestedAction: 'Designate David Kim (PM) to send the formal email inquiry.',
        resolved: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const RAW_TEMPLATES = [
  {
    name: 'Chaotic Sprint Planning (Product & Bugs)',
    type: 'sprint' as const,
    title: 'Sprint 24 Planning & Hotfix Triage',
    attendees: ['Alex Rivera', 'Sarah Chen', 'Marcus Brody', 'David Kim'],
    notes: `Sprint 24 Triage - notes:
- David started late, internet cut out. Discussed API latency in US-East.
- Alex: I will profile the GraphQL resolver bottlenecks and push an in-memory Redis cache branch by Wednesday 5pm. Marcus will review it.
- Marcus: working on auth token expiration bug. Says he will push fix by Thursday EOD.
- Sarah: "Need feedback on the dark mode contrast tokens from Alex before I commit them." Alex said "I'll do that tonight".
- Mentioned something about billing: "Someone really needs to fix the invoice PDF generation, clients are complaining." (Nobody volunteered, David said we can't let it slip).
- Sarah asked if we should migrate to Tailwind v4. Decided: Yes, starting next sprint, no rewrites this week.
- Alex will also write up the release notes for v2.4 before Friday morning deploy.
- Elena from QA needs test accounts by Thursday noon. Marcus said he can script it if he has time, otherwise maybe Alex can do it? (Vague).`,
  },
  {
    name: 'Executive 1-on-1 & Quarterly Review',
    type: 'one_on_one' as const,
    title: 'Weekly 1:1 with VP Engineering',
    attendees: ['Alex Rivera', 'Elena Rostova (VP Eng)'],
    notes: `1:1 with Elena - Oct 12
- Elena praised the latency reduction work last week.
- Career check-in: We agreed on target Staff Engineer competencies.
- Action for me: Submit my self-evaluation document and 3 peer review nominations by Monday Oct 19.
- Team staffing: Elena approved opening a Senior Full-Stack role. Alex to draft job spec and technical screening questions by Friday 4pm.
- Elena will follow up with CFO regarding equipment budget for monitors.
- Discussed the architectural RFC for event-driven webhooks. Elena wants me to schedule an architecture review with the principal leads for next Wednesday.
- Decision: We will sunset legacy v1 endpoints on Nov 30; deprecation notice to be announced on blog next week.`,
  },
  {
    name: 'Client Discovery & Scope Negotiation',
    type: 'client' as const,
    title: 'Acme Corp Enterprise Integration Discovery',
    attendees: ['Alex Rivera (Tech Lead)', 'Rachel Vance (Sales)', 'Jordan Lee (Acme CTO)', 'Priya Patel (Acme Eng)'],
    notes: `Acme Integration Discovery Call
- Acme wants custom SSO (SAML Okta) and dedicated webhook endpoints with signature validation.
- Jordan (Acme CTO) emphasized strict SOC2 Type II audit trail requirements.
- Rachel (Sales): "We will send over the revised MSA and pricing schedule by end of day Wednesday."
- Alex: I will provide the OpenAPI spec and webhook payload sample schemas to Priya by tomorrow 12pm EST.
- Question raised: Does Acme need IP allowlisting? Jordan said "Probably yes, our security team will confirm by Thursday."
- Rachel promised a custom sandbox tenant would be spun up. Who is provisioning it? Alex said "I can spin up a staging workspace in AWS by Thursday afternoon if sales provides the company ID."
- Decision: Acme agreed to our standard REST API contract rather than custom gRPC. Target pilot kickoff: Nov 1.`,
  },
];

export function getStoredMeetings(): Meeting[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredMeetings(SAMPLE_MEETINGS);
      return SAMPLE_MEETINGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_MEETINGS;
  } catch (err) {
    console.error('Failed to load meetings from localStorage:', err);
    return SAMPLE_MEETINGS;
  }
}

export function saveStoredMeetings(meetings: Meeting[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  } catch (err) {
    console.error('Failed to save meetings to localStorage:', err);
  }
}

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save user profile:', err);
  }
}

export function getWelcomeDismissed(): boolean {
  try {
    return localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveWelcomeDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    } else {
      localStorage.removeItem(WELCOME_DISMISSED_KEY);
    }
  } catch (err) {
    console.error('Failed to save welcome state:', err);
  }
}
