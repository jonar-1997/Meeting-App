import { ActionItem, Meeting } from '../types';

export function generateSlackMarkdown(meeting: Meeting, personalOnly: boolean = false): string {
  const lines: string[] = [];
  lines.push(`*📋 Action Item Digest — ${meeting.title}*`);
  lines.push(`_Date: ${meeting.date} | Attendees: ${meeting.attendees.join(', ') || 'Team'}_`);
  lines.push('');

  if (meeting.summary.executiveSummary) {
    lines.push(`*💡 Executive Summary:*`);
    lines.push(`> ${meeting.summary.executiveSummary}`);
    lines.push('');
  }

  const items = personalOnly
    ? meeting.actionItems.filter(i => i.isPersonal)
    : meeting.actionItems;

  const personalItems = items.filter(i => i.isPersonal);
  const teamItems = items.filter(i => !i.isPersonal);

  if (personalItems.length > 0) {
    lines.push(`*👤 My Action Items (${meeting.userName}):*`);
    personalItems.forEach(item => {
      const pBadge = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      const due = item.deadlineLabel || item.dueDate ? ` (📅 ${item.deadlineLabel || item.dueDate})` : '';
      const status = item.status === 'done' ? '✅ ~' : '☐ ';
      const statusEnd = item.status === 'done' ? '~' : '';
      lines.push(`${status}${pBadge} *${item.title}*${due}${statusEnd}`);
      if (item.priorityReason) lines.push(`   └ _Why:_ ${item.priorityReason}`);
      if (item.isAmbiguous) lines.push(`   └ ⚠️ _Verify:_ ${item.ambiguityReason || 'Needs clarification'}`);
    });
    lines.push('');
  }

  if (!personalOnly && teamItems.length > 0) {
    lines.push(`*👥 Team Action Matrix:*`);
    teamItems.forEach(item => {
      const pBadge = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      const due = item.deadlineLabel || item.dueDate ? ` (📅 ${item.deadlineLabel || item.dueDate})` : '';
      const status = item.status === 'done' ? '✅ ~' : '☐ ';
      const statusEnd = item.status === 'done' ? '~' : '';
      lines.push(`${status}${pBadge} *@${item.assignee}*: ${item.title}${due}${statusEnd}`);
      if (item.isAmbiguous) lines.push(`   └ ⚠️ _Ambiguity:_ ${item.ambiguityReason || 'Unconfirmed owner/timeline'}`);
    });
    lines.push('');
  }

  if (meeting.decisions && meeting.decisions.length > 0) {
    lines.push(`*🤝 Agreed Decisions:*`);
    meeting.decisions.forEach(d => {
      lines.push(`• *${d.decision}*${d.context ? ` — _${d.context}_` : ''}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

export function generateNotionMarkdown(meeting: Meeting): string {
  const lines: string[] = [];
  lines.push(`# 📋 ${meeting.title}`);
  lines.push(`**Date:** ${meeting.date} | **Owner:** ${meeting.userName}`);
  lines.push('');

  lines.push(`> ### 📌 Executive Brief`);
  lines.push(`> ${meeting.summary.executiveSummary}`);
  lines.push('');

  lines.push(`## 👤 My Personal To-Dos`);
  const personal = meeting.actionItems.filter(i => i.isPersonal);
  if (personal.length === 0) lines.push(`_No personal tasks assigned._`);
  personal.forEach(item => {
    const checked = item.status === 'done' ? '[x]' : '[ ]';
    const due = item.deadlineLabel || item.dueDate ? ` | 🗓️ ${item.deadlineLabel || item.dueDate}` : '';
    const prio = ` | Priority: **${item.priority.toUpperCase()}**`;
    lines.push(`- ${checked} **${item.title}**${prio}${due}`);
    if (item.priorityReason) lines.push(`  - ⚡ *Impact:* ${item.priorityReason}`);
    if (item.originalQuote) lines.push(`  - 💬 *Source:* "${item.originalQuote}"`);
  });
  lines.push('');

  lines.push(`## 👥 Team Action Matrix`);
  lines.push(`| Status | Assignee | Action Item | Priority | Deadline | Ambiguity |`);
  lines.push(`|---|---|---|---|---|---|`);
  meeting.actionItems.filter(i => !i.isPersonal).forEach(item => {
    const statusIcon = item.status === 'done' ? '✅ Done' : item.status === 'in_progress' ? '🔄 In Progress' : '⏳ To Do';
    const prioBadge = item.priority === 'high' ? '🔥 High' : item.priority === 'medium' ? '⚡ Med' : '🌱 Low';
    const due = item.deadlineLabel || item.dueDate || '—';
    const ambig = item.isAmbiguous ? `⚠️ ${item.ambiguityReason || 'Check'}` : 'Clear';
    lines.push(`| ${statusIcon} | **${item.assignee}** | ${item.title.replace(/\|/g, '-')} | ${prioBadge} | ${due} | ${ambig} |`);
  });
  lines.push('');

  if (meeting.decisions && meeting.decisions.length > 0) {
    lines.push(`## 🎯 Decisions Made`);
    meeting.decisions.forEach(d => {
      lines.push(`- **${d.decision}**`);
      if (d.context) lines.push(`  _${d.context}_`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

export function generateTodoistFormat(meeting: Meeting): string {
  const lines: string[] = [];
  meeting.actionItems.forEach(item => {
    let p = 'p3';
    if (item.priority === 'high') p = 'p1';
    if (item.priority === 'medium') p = 'p2';

    let due = '';
    if (item.dueDate) due = `due ${item.dueDate}`;
    else if (item.deadlineLabel) due = `due ${item.deadlineLabel}`;

    const label = item.isPersonal ? '@personal' : `@${item.assignee.toLowerCase().replace(/\s+/g, '_')}`;
    const tag = item.category ? `@${item.category.toLowerCase().replace(/\s+/g, '_')}` : '';

    lines.push(`${item.title} ${due} ${label} ${tag} ${p}`.trim());
  });
  return lines.join('\n');
}

export function generateCSV(meeting: Meeting): string {
  const headers = [
    'Task Title',
    'Assignee',
    'Is Personal',
    'Priority',
    'Due Date',
    'Deadline Label',
    'Status',
    'Effort',
    'Category',
    'Ambiguous?',
    'Ambiguity Reason',
    'Priority Reason',
    'Source Quote',
  ];

  const escapeCSV = (str: string | undefined | null) => {
    if (!str) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = meeting.actionItems.map(item => [
    escapeCSV(item.title),
    escapeCSV(item.assignee),
    escapeCSV(item.isPersonal ? 'Yes' : 'No'),
    escapeCSV(item.priority),
    escapeCSV(item.dueDate),
    escapeCSV(item.deadlineLabel),
    escapeCSV(item.status),
    escapeCSV(item.effort),
    escapeCSV(item.category),
    escapeCSV(item.isAmbiguous ? 'Yes' : 'No'),
    escapeCSV(item.ambiguityReason),
    escapeCSV(item.priorityReason),
    escapeCSV(item.originalQuote),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateICS(meeting: Meeting): string {
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ActionDraft//Meeting Action Items//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  meeting.actionItems.forEach((item, index) => {
    // Generate dates
    let startDt = '';
    let endDt = '';
    
    if (item.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)) {
      const cleanDate = item.dueDate.replace(/-/g, '');
      startDt = `VALUE=DATE:${cleanDate}`;
      endDt = `VALUE=DATE:${cleanDate}`;
    } else {
      // Default to tomorrow 9am if no date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().replace(/[-:]/g, '').split('.')[0].slice(0, 8);
      startDt = `${tomorrowStr}T090000Z`;
      endDt = `${tomorrowStr}T100000Z`;
    }

    const uid = `actiondraft-${item.id}-${index}@actiondraft.app`;
    const summary = `[${item.priority.toUpperCase()}] ${item.isPersonal ? 'My To-Do: ' : `${item.assignee}: `}${item.title}`;
    const desc = `Meeting: ${meeting.title}\\nAssignee: ${item.assignee}\\nPriority: ${item.priority}\\nReason: ${item.priorityReason || 'N/A'}\\nSource Quote: ${item.originalQuote || 'N/A'}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStr}`);
    if (startDt.startsWith('VALUE=')) {
      lines.push(`DTSTART;${startDt}`);
      lines.push(`DTEND;${endDt}`);
    } else {
      lines.push(`DTSTART:${startDt}`);
      lines.push(`DTEND:${endDt}`);
    }
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${desc}`);
    lines.push(`STATUS:${item.status === 'done' ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(item: ActionItem, meetingTitle: string): string {
  const title = encodeURIComponent(`[${item.priority.toUpperCase()}] ${item.title}`);
  const details = encodeURIComponent(
    `From Meeting: ${meetingTitle}\nAssignee: ${item.assignee}\nPriority: ${item.priority}\nNotes: ${item.originalQuote || ''}`
  );

  let dateParam = '';
  if (item.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)) {
    const d = item.dueDate.replace(/-/g, '');
    dateParam = `&dates=${d}/${d}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${dateParam}`;
}
