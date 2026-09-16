import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addPerson } from "./actions";

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("church_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");

  let query = supabase.from("people").select("id,first_name,last_name,email,phone,status,first_visit_date,created_at").eq("church_id", membership.church_id).order("created_at", { ascending: false });
  if (["visitor","regular_attender","member","inactive"].includes(params.status ?? "")) query = query.eq("status", params.status as "visitor" | "regular_attender" | "member" | "inactive");
  if (params.q?.trim()) query = query.or(`first_name.ilike.%${params.q.trim()}%,last_name.ilike.%${params.q.trim()}%,email.ilike.%${params.q.trim()}%`);
  const { data: people } = await query.limit(100);

  return <main className="min-h-screen bg-[#f4f5f2] text-[#1d2923]">
    <header className="border-b border-[#e0e3de] bg-[#13271f] px-6 py-5 text-white"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/command-center" className="font-bold tracking-wide">✦ ECCLESIA AI</Link><Link href="/command-center" className="text-sm text-white/70">← Command Center</Link></div></header>
    <div className="mx-auto max-w-7xl p-6 sm:p-10">
      <div><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">PEOPLE CRM</p><h1 className="mt-2 text-4xl font-semibold">People</h1><p className="mt-2 text-[#69736c]">Members, attenders and visitors in one secure church workspace.</p></div>
      {(params.message || params.error) && <div className={`mt-5 rounded-xl p-3 text-sm ${params.error ? "bg-red-50 text-red-700" : "bg-[#edf5ef] text-[#285b3e]"}`}>{params.error ?? params.message}</div>}
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-[#e0e3de] bg-white p-5">
          <form className="flex flex-col gap-3 sm:flex-row"><input name="q" defaultValue={params.q} placeholder="Search name or email…" className="flex-1 rounded-xl border border-[#d9ddd8] px-4 py-2.5 outline-none focus:border-[#9a7b29]"/><select name="status" defaultValue={params.status ?? ""} className="rounded-xl border border-[#d9ddd8] px-4 py-2.5"><option value="">All people</option><option value="visitor">Visitors</option><option value="regular_attender">Regular attenders</option><option value="member">Members</option><option value="inactive">Inactive</option></select><button className="rounded-xl bg-[#173329] px-5 py-2.5 font-semibold text-white">Filter</button></form>
          <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-[#e7e9e5] text-[#7a847d]"><tr><th className="py-3">Name</th><th>Status</th><th>Contact</th><th>First visit</th><th></th></tr></thead><tbody className="divide-y divide-[#eceeea]">{people?.map(person=><tr key={person.id}><td className="py-4 pr-4 font-semibold"><Link href={`/people/${person.id}`} className="hover:text-[#9a7b29]">{person.first_name} {person.last_name}</Link></td><td className="pr-4"><span className="rounded-full bg-[#f2eee2] px-2.5 py-1 text-xs capitalize text-[#755d20]">{person.status.replaceAll("_"," ")}</span></td><td className="pr-4 text-[#667068]"><div>{person.email ?? "—"}</div><div>{person.phone ?? ""}</div></td><td className="text-[#667068]">{person.first_visit_date ?? "—"}</td><td><Link href={`/people/${person.id}`} className="font-semibold text-[#80651e]">Open →</Link></td></tr>)}</tbody></table>{!people?.length && <div className="py-14 text-center text-[#7a847d]">No people found. Add your first person to begin building the church CRM.</div>}</div>
        </section>
        <aside className="h-fit rounded-2xl border border-[#e0e3de] bg-white p-5"><h2 className="text-xl font-semibold">Add a person</h2><p className="mt-1 text-sm text-[#7a847d]">Create a member, attender or visitor record.</p><form action={addPerson} className="mt-5 space-y-3"><input required name="first_name" placeholder="First name" className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"/><input required name="last_name" placeholder="Last name" className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"/><input type="email" name="email" placeholder="Email" className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"/><input name="phone" placeholder="Phone" className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"/><select name="status" defaultValue="visitor" className="w-full rounded-xl border border-[#d9ddd8] px-4 py-2.5"><option value="visitor">Visitor</option><option value="regular_attender">Regular attender</option><option value="member">Member</option><option value="inactive">Inactive</option></select><button className="w-full rounded-xl bg-[#173329] px-5 py-3 font-semibold text-white">Add person</button></form></aside>
      </div>
    </div>
  </main>;
}