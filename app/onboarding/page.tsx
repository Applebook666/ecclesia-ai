import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createChurch } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ error?: string }> }

export default async function OnboardingPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/login')

  const { data: memberships } = await supabase
    .from('church_memberships')
    .select('church_id')
    .eq('user_id', claimsData.claims.sub)
    .eq('status', 'active')
    .limit(1)

  if (memberships?.length) redirect('/command-center')
  const { error } = await searchParams

  return (
    <main className="min-h-screen bg-[#f6f2e8] px-5 py-12 text-[#183027]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between">
          <div><b className="text-xl tracking-wide">✦ ECCLESIA AI</b><p className="text-xs text-[#6d776f]">The AI Operating System for Churches</p></div>
          <span className="rounded-full border border-[#d8c58c] px-3 py-1 text-xs font-semibold text-[#80651e]">CHURCH SETUP</span>
        </div>
        <div className="grid overflow-hidden rounded-3xl border border-[#ded8c9] bg-white shadow-sm lg:grid-cols-[1.05fr_.95fr]">
          <section className="p-8 sm:p-12">
            <p className="text-xs font-bold tracking-[.2em] text-[#9a7b29]">WELCOME TO ECCLESIA AI</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Let’s create your church workspace.</h1>
            <p className="mt-5 max-w-xl leading-7 text-[#68726b]">This becomes the secure home for your people, ministry operations, giving, finance and Ecclesia AI briefings.</p>
            {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
            <form action={createChurch} className="mt-8 space-y-5">
              <label className="block text-sm font-semibold">Church name<input name="churchName" required minLength={2} maxLength={120} placeholder="Grace Community Church" className="mt-2 w-full rounded-xl border border-[#d9ddd8] bg-white px-4 py-3.5 font-normal outline-none focus:border-[#9a7b29]" /></label>
              <label className="block text-sm font-semibold">Church workspace URL <span className="font-normal text-[#8b948d]">(optional)</span><div className="mt-2 flex overflow-hidden rounded-xl border border-[#d9ddd8] focus-within:border-[#9a7b29]"><span className="bg-[#f4f5f2] px-4 py-3.5 text-sm text-[#7c857f]">ecclesia.ai/</span><input name="slug" placeholder="grace-community" pattern="[a-z0-9-]+" className="min-w-0 flex-1 px-3 py-3.5 outline-none" /></div></label>
              <label className="block text-sm font-semibold">Timezone<select name="timezone" defaultValue="America/Chicago" className="mt-2 w-full rounded-xl border border-[#d9ddd8] bg-white px-4 py-3.5 font-normal"><option value="America/New_York">Eastern Time</option><option value="America/Chicago">Central Time</option><option value="America/Denver">Mountain Time</option><option value="America/Los_Angeles">Pacific Time</option></select></label>
              <button className="w-full rounded-xl bg-[#173329] px-5 py-4 font-semibold text-white transition hover:bg-[#214638]">Create church workspace →</button>
            </form>
            <p className="mt-5 text-xs leading-5 text-[#89918c]">You will be created as the church Owner. Additional staff and ministry roles can be invited after setup.</p>
          </section>
          <aside className="bg-[#142a21] p-8 text-white sm:p-12">
            <p className="text-xs font-bold tracking-[.2em] text-[#e1c66f]">WHAT HAPPENS NEXT</p>
            <div className="mt-8 space-y-7">{[['01','People & visitors','Build your church directory and visitor journey.'],['02','Command Center','See ministry priorities and tasks in one place.'],['03','Giving & finance','Track contributions, funds and financial health.'],['04','Ecclesia AI','Receive an intelligent daily church operations briefing.']].map(([n,title,body])=><div key={n} className="flex gap-4"><span className="text-sm font-bold text-[#e1c66f]">{n}</span><div><b>{title}</b><p className="mt-1 text-sm leading-6 text-white/60">{body}</p></div></div>)}</div>
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm font-semibold text-[#e1c66f]">Built for trust</p><p className="mt-2 text-sm leading-6 text-white/60">Each church workspace is isolated at the database level with role-based access controls.</p></div>
          </aside>
        </div>
      </div>
    </main>
  )
}
