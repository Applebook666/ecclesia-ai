export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#18251f]">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-8 py-20">
        <div className="max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#d9cfb2] bg-white px-4 py-2 text-sm font-semibold tracking-wide text-[#806b32]">
            <span>✦</span> ECCLESIA AI
          </div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#9a7f38]">The AI Operating System for Churches</p>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Lead people. Strengthen ministry. Let AI handle the operations.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5d675f]">ECCLESIA AI brings people, pastoral care, volunteers, events, communications, tasks and church intelligence into one secure command center.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="/command-center" className="rounded-xl bg-[#172d25] px-6 py-3.5 font-semibold text-white shadow-sm">Open Command Center</a>
            <a href="#platform" className="rounded-xl border border-[#d8d4c8] bg-white px-6 py-3.5 font-semibold">Explore Platform</a>
          </div>
          <div id="platform" className="mt-14 grid gap-3 sm:grid-cols-3">
            {[['People','Members, visitors & households'],['Care','Pastoral follow-up & needs'],['Serve','Volunteers & ministry teams']].map(([title,desc]) => <div key={title} className="rounded-2xl border border-[#e3dfd4] bg-white p-5"><b>{title}</b><p className="mt-1 text-sm text-[#6b746d]">{desc}</p></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}
