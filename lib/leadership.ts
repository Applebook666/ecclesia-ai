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

export type LeadershipHealth = {
  score: number;
  label: "Clear" | "Stable" | "Needs attention" | "High attention";
  summary: string;
};

export type LeadershipMomentum = {
  direction: "improving" | "steady" | "needs_attention";
  label: "Improving" | "Steady" | "Needs attention";
  delta: number;
  summary: string;
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

export function leadershipHealth(snapshot: LeadershipSnapshot): LeadershipHealth {
  const penalty = Math.min(100,
    Math.min(snapshot.overdueTasks, 5) * 9 +
    Math.min(snapshot.urgentTasks, 5) * 7 +
    Math.min(snapshot.visitorsNeedingFollowUp, 8) * 4 +
    Math.min(snapshot.vacantServicePositions, 8) * 3 +
    Math.min(snapshot.declinedAssignments, 5) * 2
  );
  const score = Math.max(0, 100 - penalty);
  if (score >= 90) return { score, label: "Clear", summary: "Core operational workflows are currently in a strong position based on the signals ECCLESIA can observe." };
  if (score >= 75) return { score, label: "Stable", summary: "Operations are broadly stable, with a small number of items worth leadership review." };
  if (score >= 50) return { score, label: "Needs attention", summary: "Several observable workflow issues need leadership attention before they become harder to recover." };
  return { score, label: "High attention", summary: "Multiple operational signals require leadership review. ECCLESIA recommends working the priority queue from the top." };
}

export function leadershipFocusPlan(signals: LeadershipSignal[], limit = 3) {
  return signals.slice(0, limit).map((signal, index) => ({
    rank: index + 1,
    key: signal.key,
    title: signal.title,
    detail: signal.detail,
    next: signal.next,
    href: signal.href
  }));
}

export function leadershipMomentum(current: LeadershipSnapshot, previous: LeadershipSnapshot): LeadershipMomentum {
  const currentScore = leadershipHealth(current).score;
  const previousScore = leadershipHealth(previous).score;
  const delta = currentScore - previousScore;
  if (delta >= 5) return { direction: "improving", label: "Improving", delta, summary: `Operational health improved by ${delta} points compared with the previous review period.` };
  if (delta <= -5) return { direction: "needs_attention", label: "Needs attention", delta, summary: `Operational health is ${Math.abs(delta)} points lower than the previous review period. Review the priority queue before drawing conclusions.` };
  return { direction: "steady", label: "Steady", delta, summary: "Operational health is broadly steady compared with the previous review period." };
}

export function leadershipBriefing(snapshot: LeadershipSnapshot) {
  const signals = buildLeadershipSignals(snapshot);
  const health = leadershipHealth(snapshot);
  const focus = leadershipFocusPlan(signals);
  return {
    health,
    signals,
    focus,
    summary: leadershipSummary(signals),
    headline: signals.length ? `${signals.length} leadership priorit${signals.length === 1 ? "y" : "ies"} detected` : "Core operational queue is clear",
    actionCount: signals.reduce((sum, signal) => sum + signal.count, 0)
  };
}
