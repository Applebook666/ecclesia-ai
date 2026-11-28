import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeTask, createFollowUp } from "./actions";

export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const { id } = await params;
  const notice = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("church_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");

  const { data: person } = await supabase.from("people").select("id,first_name,last_name,preferred_name,email,phone,status,first_visit_date,member_since,notes,created_at").eq("id", id).eq("church_id", membership.church_id).maybeSingle();
  if (!person) notFound();
  const { data: tasks } = await supabase.from("tasks").select("id,title,description,status,priority,due_at,created_at").eq("church_id", membership.church_id).eq("related_person_id", id).order("created_at", { ascending: false });
  const openTasks = tasks?.filter(task => task.status === "open" || task.status === "in_progress") ?? [];

  return <main className="min-h-screen bg-[#f4f5f2] text-[#1d2923]">
    <header className="border-b border-[#e0e3de] bg-[#13271f] px-6 py-5 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/command-center" className="font-bold tracking-wide">✦ ECCLESIA AI</Link><Link href="/people" className="text-sm text-white/70">← People</Link></div></header>
    <div className="mx-auto max-w-6xl p-6 sm:p-10">
      {(notice.message || notice.error) && <div className={`mb-5 rounded-xl p-3 text-sm ${notice.error ? "bg-red-50 text-red-700" : "bg-[#edf5ef] text-[#285b3e]"}`}>{notice.error ?? notice.message}</div>}
      <div className="flex flex-col justify-between gap-4 md:flex-row"><div><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">PERSON PROFILE</p><h1 className="mt-2 text-4xl font-semibold">{person.preferred_name || person.first_name} {person.last_name}</h1><p className="mt-2 capitalize text-[#69736c]">{person.status.replaceAll("_", " ")} · {person.email || person.phone || "No contact details yet"}</p></div><div className="rounded-2xl border border-[#e2d7b8] bg-[#fffaf0] px-5 py-4"><p className="text-xs font-bold tracking-wider text-[#9a7b29]">FOLLOW-UP STATUS</p><strong className="mt-1 block text-2xl">{openTasks.length}</strong><span className="text-sm text-[#69736c]">open action{openTasks.length === 1 ? "" : "s"}</span></div></div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="space-y-6"><article className="rounded-2xl border border-[#e0e3de] bg-white p-6"><h2 className="text-xl font-semibold">Contact & journey</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Info label="Email" value={person.email}/><Info label="Phone" value={person.phone}/><Info label="First visit" value={person.first_visit_date}/><Info label="Member since" value={person.member_since}/></div>{person.notes && <div className="mt-6 border-t border-[#eceeea] pt-5"><p className="text-xs font-bold tracking-wider text-[#8a938d]">NOTES</p><p className="mt-2 leading-7 text-[#59645d]">{person.notes}</p></div>}</article>
        <article className="rounded-2xl border border-[#e0e3de] bg-white p-6"><h2 className="text-xl font-semibold">Follow-up history</h2><p className="mt-1 text-sm text-[#7a847d]">Actions connected directly to this person.</p><div className="mt-5 divide-y divide-[#eceeea]">{tasks?.map(task => <div key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><div className="flex-1"><div className="flex items-center gap-2"><strong>{task.title}</strong><span className="rounded-full bg-[#f2eee2] px-2 py-0.5 text-xs capitalize text-[#755d20]">{task.priority}</span></div><p className="mt-1 text-sm text-[#747e77]">{task.description || "No notes"}{task.due_at ? ` · Due ${new Date(task.due_at).toLocaleDateString()}` : ""}</p></div>{task.status === "open" || task.status === "in_progress" ? <form action={completeTask.bind(null, id, task.id)}><button className="rounded-lg border border-[#d9ddd8] px-3 py-2 text-sm font-semibold">Mark complete</button></form> : <span className="text-sm font-semibold text-[#4d7b5d]">Completed ✓</span>}</div>)}{!tasks?.length && <p className="py-8 text-center text-[#7a847d]">No follow-up activity yet.</p>}</div></article></section>
        <aside className="h-fit rounded-2xl border border-[#e0e3de] bg-white p-6"><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">NEXT ACTION</p><h2 className="mt-2 text-xl font-semibold">Create follow-up</h2><p className="mt-1 text-sm text-[#7a847d]">Assign a ministry action to this person.</p><form action={createFollowUp.bind(null, id)} className="mt-5 space-y-3"><input required name="title" defaultValue={person.status === "visitor" ? `Follow up with ${person.first_name}` : ""} placeholder="Follow-up title" className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"/><textarea name="description" placeholder="Notes or desired outcome" rows={4} className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"/><select name="priority" defaultValue="normal" className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option><option value="urgent">Urgent</option></select><input type="date" name="due_date" className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"/><button className="w-full rounded-xl bg-[#173329] px-5 py-3 font-semibold text-white">Create follow-up</button></form></aside>
      </div>
    </div>
  </main>;
}

function Info({ label, value }: { label: string; value: string | null }) { return <div><p className="text-xs font-bold tracking-wider text-[#8a938d]">{label.toUpperCase()}</p><p className="mt-1 font-medium">{value || "—"}</p></div>; }