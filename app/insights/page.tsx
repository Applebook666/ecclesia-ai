import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { leadershipBriefing } from "@/lib/leadership";

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("church_memberships")
    .select("church_id,churches(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  const churchId = membership.church_id;
  const relation = membership.churches as unknown as { name: string } | { name: string }[] | null;
  const churchName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
  const now = new Date().toISOString();

  const [{ data: tasks }, { data: visitors }, { data: journeys }, { data: services }] = await Promise.all([
    supabase.from("tasks").select("id,title,priority,due_at").eq("church_id", churchId).in("status", ["open", "in_progress"]),
    supabase.from("people").select("id").eq("church_id", churchId).eq("status", "visitor"),
    supabase.from("visitor_journeys").select("person_id,next_follow_up_at").eq("church_id", churchId).neq("stage", "closed"),
    supabase.from("services").select("id").eq("church_id", churchId).gte("starts_at", now).neq("status", "cancelled").limit(12)
  ]);

  const serviceIds = (services ?? []).map(service => service.id);
  const [{ data: positions }, { data: assignments }] = serviceIds.length
    ? await Promise.all([
        supabase.from("service_positions").select("id,required_count").eq("church_id", churchId).in("service_id", serviceIds),
        supabase.from("service_assignments").select("id,status,service_position_id").eq("church_id", churchId).in("service_id", serviceIds)
      ])
    : [{ data: [] }, { data: [] }];

  const overdueTasks = (tasks ?? []).filter(task => task.due_at && task.due_at < now).length;
  const urgentTasks = (tasks ?? []).filter(task => task.priority === "urgent").length;
  const journeyByPerson = new Map((journeys ?? []).map(journey => [journey.person_id, journey]));
  const visitorsNeedingFollowUp = (visitors ?? []).filter(visitor => {
    const journey = journeyByPerson.get(visitor.id);
    return !journey?.next_follow_up_at || journey.next_follow_up_at < now;
  }).length;
  const required = (positions ?? []).reduce((sum, position) => sum + (position.required_count ?? 0), 0);
  const filled = (assignments ?? []).filter(assignment => assignment.service_position_id && (assignment.status === "scheduled" || assignment.status === "confirmed")).length;
  const vacantServicePositions = Math.max(0, required - filled);
  const declinedAssignments = (assignments ?? []).filter(assignment => assignment.status === "declined").length;

  const snapshot = { overdueTasks, urgentTasks, visitorsNeedingFollowUp, vacantServicePositions, declinedAssignments };
  const briefing = leadershipBriefing(snapshot);
  const { signals, health, focus, actionCount } = briefing;

  const metrics = [
    { label: "Overdue tasks", value: overdueTasks },
    { label: "Urgent tasks", value: urgentTasks },
    { label: "Visitor follow-up", value: visitorsNeedingFollowUp },
    { label: "Service vacancies", value: vacantServicePositions },
    { label: "Serve declines", value: declinedAssignments }
  ];

  return (
    <main className="min-h-screen bg-[#f4f5f2] text-[#1d2923]">
      <header className="border-b border-[#dde2dc] bg-[#13271f] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div><b className="tracking-wide">✦ ECCLESIA AI</b><p className="text-xs text-white/55">Leadership Intelligence</p></div>
          <div className="flex gap-2">
            <Link href="/command-center" className="rounded-lg border border-white/20 px-3 py-2 text-sm">Command Center</Link>
            <Link href="/ask" className="rounded-lg bg-[#d2b95e] px-3 py-2 text-sm font-semibold text-[#13271f]">Ask ECCLESIA</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">LEADERSHIP INSIGHTS</p>
        <h1 className="mt-2 text-4xl font-semibold">Operational health at {churchName ?? "your church"}</h1>
        <p className="mt-2 max-w-3xl text-[#69736c]">A grounded view of observable ministry workflows. The score is a prioritization aid, not a judgment about people, ministry quality, or spiritual health.</p>

        <section className="mt-6 rounded-2xl border border-[#d9dfd9] bg-white p-5">
          <p className="text-xs font-bold tracking-[.14em] text-[#6f7c73]">ECCLESIA LEADERSHIP BRIEFING</p>
          <h2 className="mt-2 text-2xl font-semibold">{briefing.headline}</h2>
          <p className="mt-2 text-[#69736c]">{briefing.summary}</p>
          <p className="mt-3 text-sm font-medium text-[#526159]">{actionCount ? `${actionCount} observable workflow items are represented in the current priority signals.` : "No observable workflow items currently require leadership review."}</p>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <article className="rounded-2xl border border-[#d9dfd9] bg-white p-6">
            <p className="text-xs font-bold tracking-[.14em] text-[#6f7c73]">OPERATIONAL HEALTH</p>
            <div className="mt-4 flex items-end gap-3"><strong className="text-6xl">{health.score}</strong><span className="pb-2 text-[#7b847e]">/ 100</span></div>
            <b className="mt-4 block text-lg">{health.label}</b>
            <p className="mt-2 leading-7 text-[#69736c]">{health.summary}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e3e6e2]"><div className="h-full rounded-full bg-[#52745f]" style={{ width: `${health.score}%` }} /></div>
          </article>

          <article className="rounded-2xl border border-[#e2d7b8] bg-[#fffaf0] p-6">
            <p className="text-xs font-bold tracking-[.14em] text-[#9a7b29]">TODAY&apos;S FOCUS PLAN</p>
            <h2 className="mt-2 text-2xl font-semibold">Top leadership priorities</h2>
            <div className="mt-4 space-y-3">
              {focus.length ? focus.map(item => (
                <Link key={item.key} href={item.href} className="block rounded-xl border border-[#eadfbe] bg-white/75 p-4">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#173329] text-xs font-bold text-white">{item.rank}</span>
                    <div><b>{item.title}</b><p className="mt-1 text-sm text-[#69736c]">{item.detail}</p><p className="mt-2 text-sm font-medium text-[#526159]">{item.next}</p></div>
                  </div>
                </Link>
              )) : <div className="rounded-xl bg-white/75 p-5 text-[#69736c]">No priority workflow issues are currently detected.</div>}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-[#d9dfd9] bg-white p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold tracking-[.14em] text-[#6f7c73]">ACTION QUEUE</p><h2 className="mt-1 text-2xl font-semibold">{actionCount ? `${actionCount} observable items need review` : "Operational queue is clear"}</h2><p className="mt-1 text-sm text-[#69736c]">Work the queue in priority order. ECCLESIA recommends where to look; leadership decides what action to take.</p></div>
            <Link href="/ask" className="text-sm font-semibold text-[#80651e]">Ask ECCLESIA what comes first →</Link>
          </div>
          <div className="mt-5 divide-y divide-[#e7eae6]">
            {signals.length ? signals.map((signal, index) => (
              <div key={signal.key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${signal.level === "urgent" ? "bg-red-500" : "bg-[#bd8c2d]"}`} /><div><div className="flex flex-wrap items-center gap-2"><b>{index + 1}. {signal.title}</b><span className="rounded-full bg-[#f1f3ef] px-2 py-0.5 text-xs text-[#68736b]">{signal.count} item{signal.count === 1 ? "" : "s"}</span></div><p className="mt-1 text-sm text-[#69736c]">{signal.next}</p></div></div>
                <Link href={signal.href} className="ml-5 shrink-0 rounded-lg border border-[#d9ddd8] px-3 py-2 text-xs font-semibold text-[#526159] sm:ml-0">Review workflow →</Link>
              </div>
            )) : <p className="py-6 text-[#69736c]">No overdue, urgent, follow-up, staffing or declined-assignment signals are currently detected.</p>}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map(metric => <article key={metric.label} className="rounded-xl border border-[#e0e3de] bg-white p-4"><small className="text-[#7b847e]">{metric.label}</small><strong className="mt-2 block text-3xl">{metric.value}</strong></article>)}
        </section>
        <p className="mt-6 text-xs leading-5 text-[#8b948d]">ECCLESIA Insights uses observable workflow data only. It does not infer motives, faith, wellbeing, intent, or personal character. Recommendations remain advisory and require human judgment.</p>
      </section>
    </main>
  );
}
