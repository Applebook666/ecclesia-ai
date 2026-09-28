export type LeadershipSignalKey = "overdue_tasks" | "urgent_tasks" | "visitor_followup" | "service_vacancies" | "serve_declines";

export type LeadershipSignal = {
  key: LeadershipSignalKey;
  level: "urgent" | "attention";
  score: number;
  count: number;
  title: string;
  detail: string;
  next: string;
  href: string;
};

export type LeadershipSnapshot = {
  overdueTasks: number;
  urgentTasks: number;
  visitorsNeedingFollowUp: number;
  vacantServicePositions: number;
  declinedAssignments: number;
};

const item = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

export function buildLeadershipSignals(snapshot: LeadershipSnapshot): LeadershipSignal[] {
  const signals: (LeadershipSignal | null)[] = [
    snapshot.overdueTasks > 0 ? {
      key: "overdue_tasks", level: "urgent", score: 100, count: snapshot.overdueTasks,
      title: "Overdue work", detail: `${item(snapshot.overdueTasks, "task")} overdue.`,
      next: "Review the overdue queue, confirm ownership, and decide which items should be completed or reassigned today.", href: "/tasks"
    } : null,
    snapshot.urgentTasks > 0 ? {
      key: "urgent_tasks", level: "urgent", score: 90, count: snapshot.urgentTasks,
      title: "Urgent tasks", detail: `${item(snapshot.urgentTasks, "open task")} marked urgent.`,
      next: "Review urgent tasks and confirm each has a clear owner and next action.", href: "/tasks"
    } : null,
    snapshot.visitorsNeedingFollowUp > 0 ? {
      key: "visitor_followup", level: "attention", score: 80, count: snapshot.visitorsNeedingFollowUp,
      title: "Visitor follow-up", detail: `${item(snapshot.visitorsNeedingFollowUp, "visitor")} need a follow-up decision.`,
      next: "Review the visitor journey queue and assign a respectful next follow-up where appropriate.", href: "/visitors"
    } : null,
    snapshot.vacantServicePositions > 0 ? {
      key: "service_vacancies", level: "attention", score: 70, count: snapshot.vacantServicePositions,
      title: "Service coverage", detail: `${item(snapshot.vacantServicePositions, "planned service position")} vacant.`,
      next: "Review upcoming service plans and decide which vacant positions need staffing first.", href: "/serve"
    } : null,
    snapshot.declinedAssignments > 0 ? {
      key: "serve_declines", level: "attention", score: 60, count: snapshot.declinedAssignments,
      title: "Serve declines", detail: `${item(snapshot.declinedAssignments, "upcoming assignment")} declined.`,
      next: "Review declined assignments and determine whether replacement coverage is needed.", href: "/serve"
    } : null
  ];
  return signals.filter((signal): signal is LeadershipSignal => signal !== null).sort((a, b) => b.score - a.score);
}

export function leadershipSummary(signals: LeadershipSignal[]) {
  if (!signals.length) return "Core operational signals are currently clear across visitor follow-up, tasks and service staffing.";
  if (signals.length === 1) return "ECCLESIA sees one cross-ministry issue that deserves leadership attention.";
  return `ECCLESIA sees ${signals.length} cross-ministry issues that deserve leadership attention.`;
}
