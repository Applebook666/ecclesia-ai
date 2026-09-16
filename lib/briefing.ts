export type BriefingInput = {
  activePeople: number;
  visitors: number;
  visitorsWithoutFollowUp: number;
  openTasks: number;
  overdueTasks: number;
  urgentTasks: number;
};

export type BriefingItem = {
  level: "urgent" | "attention" | "positive";
  title: string;
  detail: string;
  href?: string;
};

export function buildMorningBriefing(input: BriefingInput) {
  const items: BriefingItem[] = [];

  if (input.overdueTasks > 0) items.push({ level: "urgent", title: `${input.overdueTasks} overdue follow-up${input.overdueTasks === 1 ? "" : "s"}`, detail: "These ministry actions have passed their due date and should be reviewed first.", href: "/tasks" });
  if (input.urgentTasks > 0) items.push({ level: "urgent", title: `${input.urgentTasks} urgent action${input.urgentTasks === 1 ? "" : "s"}`, detail: "Your team has marked these items urgent.", href: "/tasks" });
  if (input.visitorsWithoutFollowUp > 0) items.push({ level: "attention", title: `${input.visitorsWithoutFollowUp} visitor${input.visitorsWithoutFollowUp === 1 ? "" : "s"} without follow-up`, detail: "Create a personal next step so no new visitor falls through the cracks.", href: "/people?status=visitor" });
  if (!items.length) items.push({ level: "positive", title: "No immediate follow-up gaps", detail: "Your current people and task records have no overdue or unassigned visitor follow-up." });

  const summary = `Your workspace has ${input.activePeople} active people, ${input.visitors} visitors and ${input.openTasks} open ministry tasks. ${input.overdueTasks ? `${input.overdueTasks} are overdue.` : "No tasks are currently overdue."}`;
  return { summary, items };
}