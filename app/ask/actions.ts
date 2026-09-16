"use server";

import { createClient } from "@/lib/supabase/server";

type AssistantAnswer = { answer: string; links: { label: string; href: string }[] };

export async function askEcclesia(question: string): Promise<AssistantAnswer> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { answer: "Please sign in to use Ecclesia AI.", links: [{ label: "Sign in", href: "/login" }] };

  const { data: membership } = await supabase.from("church_memberships").select("church_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) return { answer: "Create your church workspace before using the assistant.", links: [{ label: "Set up church", href: "/onboarding" }] };

  const churchId = membership.church_id;
  const q = question.toLowerCase().trim();
  const now = new Date().toISOString();

  const [{ count: activePeople }, { data: visitors }, { data: tasks }, { data: journeys }] = await Promise.all([
    supabase.from("people").select("id", { count: "exact", head: true }).eq("church_id", churchId).neq("status", "inactive"),
    supabase.from("people").select("id,first_name,last_name").eq("church_id", churchId).eq("status", "visitor"),
    supabase.from("tasks").select("id,title,priority,due_at,related_person_id").eq("church_id", churchId).in("status", ["open","in_progress"]),
    supabase.from("visitor_journeys").select("person_id,stage,next_follow_up_at").eq("church_id", churchId).neq("stage", "closed"),
  ]);

  const overdueTasks = (tasks ?? []).filter(t => t.due_at && t.due_at < now);
  const urgentTasks = (tasks ?? []).filter(t => t.priority === "urgent");
  const overdueVisitors = (journeys ?? []).filter(j => j.next_follow_up_at && j.next_follow_up_at < now);

  if (q.includes("visitor") || q.includes("follow up") || q.includes("follow-up")) return { answer: `You currently have ${visitors?.length ?? 0} visitors in People and ${journeys?.length ?? 0} active visitor journeys. ${overdueVisitors.length} visitor follow-up${overdueVisitors.length === 1 ? " is" : "s are"} overdue.`, links: [{ label: "Open Visitor Journey", href: "/visitors" }, { label: "Open People", href: "/people?status=visitor" }] };
  if (q.includes("overdue") || q.includes("task") || q.includes("attention") || q.includes("today")) return { answer: `There are ${tasks?.length ?? 0} open ministry tasks. ${overdueTasks.length} are overdue and ${urgentTasks.length} are marked urgent.`, links: [{ label: "Open Follow-Up Queue", href: "/tasks" }] };
  if (q.includes("people") || q.includes("member") || q.includes("attendance")) return { answer: `ECCLESIA currently has ${activePeople ?? 0} active people records and ${visitors?.length ?? 0} people marked as visitors.`, links: [{ label: "Open People CRM", href: "/people" }] };

  return { answer: `Your church workspace currently has ${activePeople ?? 0} active people, ${visitors?.length ?? 0} visitors, ${tasks?.length ?? 0} open tasks, and ${overdueTasks.length} overdue actions. Ask me about visitors, follow-up, overdue tasks, people, or what needs attention.`, links: [{ label: "Command Center", href: "/command-center" }] };
}