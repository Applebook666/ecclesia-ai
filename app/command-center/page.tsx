import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMorningBriefing } from "@/lib/briefing";

export default async function CommandCenter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("church_id,role,churches(name)").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");
  const churchId = membership.church_id;
  const relation = membership.churches as unknown as { name: string } | { name: string }[] | null;
  const churchName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
  const now = new Date().toISOString();

  const [{ count: peopleCount }, { data: visitors }, { data: openTasks }] = await Promise.all([
    supabase.from("people").select("id", { count: "exact", head: true }).eq("church_id", churchId).neq("status", "inactive"),
    supabase.from("people").select("id,first_name,last_name").eq("church_id", churchId).eq("status", "visitor"),
    supabase.from("tasks").select("id,title,priority,due_at,related_person_id,status").eq("church_id", churchId).in("status", ["open","in_progress"]).order("due_at", { ascending: true, nullsFirst: false }),
  ]);
  const visitorIdsWithFollowUp = new Set((openTasks ?? []).filter(t => t.related_person_id).map(t => t.related_person_id));
  const visitorsWithoutFollowUp = (visitors ?? []).filter(v => !visitorIdsWithFollowUp.has(v.id));
  const overdue = (openTasks ?? []).filter(t => t.due_at && t.due_at < now);
  const urgent = (openTasks ?? []).filter(t => t.priority === "urgent");
  const briefing = buildMorningBriefing({ activePeople: peopleCount ?? 0, visitors: visitors?.length ?? 0, visitorsWithoutFollowUp: visitorsWithoutFollowUp.length, openTasks: openTasks?.length ?? 0, overdueTasks: overdue.length, urgentTasks: urgent.length });
  const metrics = [{ label:"Active people", value:peopleCount ?? 0, note:"People in your church database" },{ label:"Visitors", value:visitors?.length ?? 0, note:`${visitorsWithoutFollowUp.length} without open follow-up` },{ label:"Open tasks", value:openTasks?.length ?? 0, note:`${overdue.length} overdue` },{ label:"Your role", value:membership.role.replaceAll("_"," "), note:"Current workspace access" }];

  return <main className="min-h-screen bg-[#f4f5f2] text-[#1d2923] lg:flex"><aside className="w-full bg-[#13271f] p-6 text-white lg:min-h-screen lg:w-64"><div className="mb-10"><b className="text-xl tracking-wide">✦ ECCLESIA AI</b><p className="mt-1 text-xs text-white/55">Church Operating System</p></div><nav className="grid grid-cols-2 gap-1 text-sm lg:grid-cols-1"><Link href="/command-center" className="rounded-lg bg-white/12 px-3 py-2.5 text-[#e9ce7c]">Command Center</Link><Link href="/people" className="rounded-lg px-3 py-2.5 text-white/70 hover:bg-white/5">People</Link><Link href="/tasks" className="rounded-lg px-3 py-2.5 text-white/70 hover:bg-white/5">Tasks</Link>{["Care","Serve","Events","Connect","Give","Insights","Documents","Settings"].map(item=><span key={item} className="rounded-lg px-3 py-2.5 text-white/45">{item}</span>)}</nav></aside><section className="flex-1 p-6 sm:p-10"><header><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">CHURCH COMMAND CENTER</p><h1 className="mt-2 text-4xl font-semibold">Good morning.</h1><p className="mt-2 text-[#667068]">Here’s what needs attention at {churchName ?? "your church"}.</p></header>
  <section className="mt-8 rounded-2xl border border-[#e2d7b8] bg-[#fffaf0] p-6"><div className="flex gap-4"><span className="text-2xl text-[#a9862f]">✦</span><div><b>Ecclesia AI Morning Briefing</b><p className="mt-1 leading-7 text-[#626a64]">{briefing.summary}</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{briefing.items.map(item=><Link key={item.title} href={item.href ?? "/command-center"} className="rounded-xl border border-[#eadfbe] bg-white/70 p-4"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${item.level === "urgent" ? "bg-red-500" : item.level === "attention" ? "bg-[#bd8c2d]" : "bg-[#5d8769]"}`}/><strong className="text-sm">{item.title}</strong></div><p className="mt-2 text-sm leading-6 text-[#69736c]">{item.detail}</p></Link>)}</div></section>
  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(m=><article key={m.label} className="rounded-2xl border border-[#e0e3de] bg-white p-5"><p className="text-sm text-[#69736c]">{m.label}</p><strong className="mt-2 block text-3xl capitalize">{m.value}</strong><small className="mt-2 block text-[#8b948d]">{m.note}</small></article>)}</div>
  <section className="mt-6 rounded-2xl border border-[#e0e3de] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Needs attention</h2><p className="text-sm text-[#7b847e]">Operational follow-up queue</p></div><Link href="/tasks" className="text-sm font-semibold text-[#80651e]">View all tasks →</Link></div><div className="mt-5 divide-y divide-[#eceeea]">{openTasks?.slice(0,5).map(task=><div key={task.id} className="flex items-center gap-4 py-4"><span className={`h-2.5 w-2.5 rounded-full ${task.priority === "urgent" || (task.due_at && task.due_at < now) ? "bg-red-500" : "bg-[#bd8c2d]"}`}/><div className="flex-1"><b className="text-sm">{task.title}</b><small className="block capitalize text-[#89918c]">{task.priority} priority{task.due_at ? ` · Due ${new Date(task.due_at).toLocaleDateString()}` : ""}</small></div></div>)}{!openTasks?.length && <div className="py-10 text-center text-[#7b847e]">Your follow-up queue is clear.</div>}</div></section></section></main>;
}