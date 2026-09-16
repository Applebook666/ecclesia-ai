import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("church_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");

  const { data: tasks } = await supabase.from("tasks").select("id,title,description,status,priority,due_at,related_person_id,people(first_name,last_name)").eq("church_id", membership.church_id).in("status", ["open","in_progress"]).order("due_at", { ascending: true, nullsFirst: false }).limit(100);
  const now = Date.now();

  return <main className="min-h-screen bg-[#f4f5f2] text-[#1d2923]"><header className="bg-[#13271f] px-6 py-5 text-white"><div className="mx-auto flex max-w-6xl justify-between"><Link href="/command-center" className="font-bold">✦ ECCLESIA AI</Link><Link href="/command-center" className="text-sm text-white/70">← Command Center</Link></div></header><div className="mx-auto max-w-6xl p-6 sm:p-10"><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">MINISTRY WORKFLOW</p><h1 className="mt-2 text-4xl font-semibold">Follow-Up Queue</h1><p className="mt-2 text-[#69736c]">One place for visitor, member and ministry actions that need attention.</p><section className="mt-7 rounded-2xl border border-[#e0e3de] bg-white p-6"><div className="divide-y divide-[#eceeea]">{tasks?.map(task => { const person = task.people as unknown as { first_name: string; last_name: string } | null; const overdue = !!task.due_at && new Date(task.due_at).getTime() < now; return <div key={task.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center"><div className={`h-3 w-3 rounded-full ${overdue || task.priority === "urgent" ? "bg-red-500" : task.priority === "high" ? "bg-[#bd8c2d]" : "bg-[#76917e]"}`}/><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><strong>{task.title}</strong><span className="rounded-full bg-[#f2eee2] px-2 py-0.5 text-xs capitalize">{task.priority}</span>{overdue && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Overdue</span>}</div><p className="mt-1 text-sm text-[#747e77]">{person ? `${person.first_name} ${person.last_name}` : "General ministry task"}{task.due_at ? ` · Due ${new Date(task.due_at).toLocaleDateString()}` : " · No due date"}</p></div>{task.related_person_id && <Link href={`/people/${task.related_person_id}`} className="font-semibold text-[#80651e]">Open person →</Link>}</div>})}{!tasks?.length && <div className="py-12 text-center text-[#7a847d]">Your follow-up queue is clear.</div>}</div></section></div></main>;
}