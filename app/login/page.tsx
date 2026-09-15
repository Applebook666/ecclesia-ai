import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams
  return <main className="min-h-screen bg-[#f7f5ef] px-6 py-16 text-[#18251f]">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-[#e1ddd1] bg-white shadow-sm lg:grid-cols-2">
      <section className="bg-[#142a21] p-10 text-white sm:p-14"><p className="text-[#d7b95d]">✦ ECCLESIA AI</p><h1 className="mt-10 text-4xl font-semibold leading-tight">Your church operations, intelligently organized.</h1><p className="mt-5 leading-7 text-white/65">One secure workspace for people, care, volunteers, events, communications and the decisions that need your attention.</p><div className="mt-12 border-t border-white/10 pt-6 text-sm text-white/50">The AI Operating System for Churches</div></section>
      <section className="p-10 sm:p-14"><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">WELCOME</p><h2 className="mt-3 text-3xl font-semibold">Sign in to Ecclesia AI</h2><p className="mt-2 text-sm text-[#737c76]">Or create your church administrator account.</p>
        {params.error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
        {params.message && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{params.message}</p>}
        <form className="mt-8 space-y-4"><label className="block text-sm font-medium">Full name<input name="full_name" className="mt-1.5 w-full rounded-xl border border-[#d9ddd8] px-4 py-3 outline-none focus:border-[#9a7b29]" placeholder="Church leader name" /></label><label className="block text-sm font-medium">Email<input required name="email" type="email" className="mt-1.5 w-full rounded-xl border border-[#d9ddd8] px-4 py-3 outline-none focus:border-[#9a7b29]" placeholder="you@church.org" /></label><label className="block text-sm font-medium">Password<input required minLength={8} name="password" type="password" className="mt-1.5 w-full rounded-xl border border-[#d9ddd8] px-4 py-3 outline-none focus:border-[#9a7b29]" placeholder="8+ characters" /></label><div className="grid gap-3 pt-2 sm:grid-cols-2"><button formAction={login} className="rounded-xl bg-[#173329] px-5 py-3 font-semibold text-white">Sign in</button><button formAction={signup} className="rounded-xl border border-[#d6d9d5] px-5 py-3 font-semibold">Create account</button></div></form>
      </section>
    </div>
  </main>
}
