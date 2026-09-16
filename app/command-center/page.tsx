import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CommandCenter() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase.from("church_memberships").select("church_id, role, churches(name)").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");

  const churchId = membership.church_id;
  const churchRelation = membership.churches as unknown as { name: string } | { name: string }[] | null;
  const churchName = Array.isArray(churchRelation) ? churchRelation[0]?.name : churchRelation?.name;
  const [{ count: peopleCount }, { count: visitorCount }, { count: openTaskCount }, { data: urgentTasks }] = await Promise.all([
    supabase.from("people").select("id", { count: "exact", head: true }).eq("church_id", churchId).neq("status", "inactive"),
    supabase.from("people").select("id", { count: "exact", head: true }).eq("church_id", churchId).eq("status", "visitor"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("church_id", churchId).in("status", ["open", "in_progress"]),
    supabase.from("tasks").select("id,title,priority,due_at").eq("church_id", churchId).in("status", ["open", "in_progress"]).order("priority", { ascending: false }).order("due_at", { ascending: true, nullsFirst: false }).limit(5),
  ]);

  const metrics = [
    { label: "Active people", value: peopleCount ?? 0, note: "People in your church database" },
    { label: "Visitors", value: visitorCount ?? 0, note: "Ready for follow-up" },
    { label: "Open tasks", value: openTaskCount ?? 0, note: "Across your ministry team" },
    { label: "Your role", value: membership.role.replaceAll("_", " "), note: "Current workspace access" },
  ];

  return <main className="min-h-screen bg-[#f4f5f2] text-[#1d2923] lg:flex">
    <aside className="w-full bg-[#13271f] p-6 text-white lg:min-h-screen lg:w-64">
      <div className="mb-10"><b className="text-xl tracking-wide">✦ ECCLESIA AI</b><p className="mt-1 text-xs text-white/55">Church Operating System</p></div>
      <nav className="grid grid-cols-2 gap-1 text-sm lg:grid-cols-1">
        <Link href="/command-center" className="rounded-lg bg-white/12 px-3 py-2.5 text-[#e9ce7c]">Command Center</Link>
        <Link href="/people" className="rounded-lg px-3 py-2.5 text-white/70 hover:bg-white/5">People</Link>
        {["Care","Serve","Events","Connect","Give","Insights","Documents","Tasks","Settings"].map(item=><span key={item} className="rounded-lg px-3 py-2.5 text-white/45">{item}</span>)}
      </nav>
    </aside>
    <section className="flex-1 p-6 sm:p-10">
      <header className="flex flex-col justify-between gap-5 sm:flex-row"><div><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">CHURCH COMMAND CENTER</p><h1 className="mt-2 text-4xl font-semibold">Good morning.</h1><p className="mt-2 text-[#667068]">Here’s what needs attention at {churchName ?? "your church"}.</p></div><button className="h-fit rounded-xl bg-[#173329] px-5 py-3 font-semibold text-white">Ask Ecclesia AI ✦</button></header>
      <section className="mt-8 flex gap-4 rounded-2xl border border-[#e2d7b8] bg-[#fffaf0] p-6"><span className="text-2xl text-[#a9862f]">✦</span><div><b>Ecclesia AI Morning Briefing</b><p className="mt-1 leading-7 text-[#626a64]">Your live workspace currently has {peopleCount ?? 0} active people, {visitorCount ?? 0} visitors and {openTaskCount ?? 0} open tasks. As more ministry activity is added, this briefing will prioritize follow-up automatically.</p></div></section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(m=><article key={m.label} className="rounded-2xl border border-[#e0e3de] bg-white p-5"><p className="text-sm text-[#69736c]">{m.label}</p><strong className="mt-2 block text-3xl capitalize">{m.value}</strong><small className="mt-2 block text-[#8b948d]">{m.note}</small></article>)}</div>
      <section className="mt-6 rounded-2xl border border-[#e0e3de] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Needs attention</h2><p className="text-sm text-[#7b847e]">Live tasks from your church workspace</p></div><Link href="/people" className="text-sm font-semibold text-[#80651e]">Open People →</Link></div><div className="mt-5 divide-y divide-[#eceeea]">{urgentTasks?.length ? urgentTasks.map(task=><div key={task.id} className="flex items-center gap-4 py-4"><span className="h-2.5 w-2.5 rounded-full bg-[#bd8c2d]"/><div className="flex-1"><b className="text-sm">{task.title}</b><small className="block capitalize text-[#89918c]">{task.priority} priority{task.due_at ? ` · Due ${new Date(task.due_at).toLocaleDateString()}` : ""}</small></div></div>) : <div className="py-10 text-center text-[#7b847e]"><p className="font-medium">Nothing urgent yet.</p><p className="mt-1 text-sm">Add people and follow-up tasks to begin building your AI briefing.</p></div>}</div></section>
    </section>
  </main>;
}
