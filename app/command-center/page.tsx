const metrics = [
  { label: "Active people", value: "312", note: "+8 this month" },
  { label: "First-time visitors", value: "14", note: "4 need follow-up" },
  { label: "Volunteer openings", value: "6", note: "Sunday services" },
  { label: "Open care items", value: "9", note: "2 high priority" },
];

const priorities = [
  ["Follow up with 4 new visitors", "People · Today"],
  ["Review 2 high-priority care requests", "Care · Today"],
  ["Fill 2 nursery volunteer openings", "Serve · Before Sunday"],
  ["Approve Wednesday announcement", "Connect · Tomorrow"],
];

export default function CommandCenter() {
  return <main className="min-h-screen bg-[#f4f5f2] text-[#1d2923] lg:flex">
    <aside className="w-full bg-[#13271f] p-6 text-white lg:min-h-screen lg:w-64">
      <div className="mb-10"><b className="text-xl tracking-wide">✦ ECCLESIA AI</b><p className="mt-1 text-xs text-white/55">Church Operating System</p></div>
      <nav className="grid grid-cols-2 gap-1 text-sm lg:grid-cols-1">{["Command Center","People","Care","Serve","Events","Connect","Give","Insights","Documents","Tasks","Settings"].map((item,i)=><a key={item} href="#" className={`rounded-lg px-3 py-2.5 ${i===0?'bg-white/12 text-[#e9ce7c]':'text-white/70 hover:bg-white/5'}`}>{item}</a>)}</nav>
    </aside>
    <section className="flex-1 p-6 sm:p-10">
      <header className="flex flex-col justify-between gap-5 sm:flex-row"><div><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">MORNING BRIEFING</p><h1 className="mt-2 text-4xl font-semibold">Good morning.</h1><p className="mt-2 text-[#667068]">Here’s what needs attention at Grace Community Church.</p></div><button className="h-fit rounded-xl bg-[#173329] px-5 py-3 font-semibold text-white">Ask Ecclesia AI ✦</button></header>
      <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#e2d7b8] bg-[#fffaf0] p-6 sm:flex-row"><span className="text-2xl text-[#a9862f]">✦</span><div className="flex-1"><b>Ecclesia AI Briefing</b><p className="mt-1 leading-7 text-[#626a64]">Your church is in good shape. Today’s priorities are visitor follow-up, two pastoral care items and Sunday volunteer coverage.</p></div><a href="#" className="font-semibold text-[#80651e]">Full briefing →</a></section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(m=><article key={m.label} className="rounded-2xl border border-[#e0e3de] bg-white p-5"><p className="text-sm text-[#69736c]">{m.label}</p><strong className="mt-2 block text-3xl">{m.value}</strong><small className="mt-2 block text-[#8b948d]">{m.note}</small></article>)}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-[#e0e3de] bg-white p-6"><h2 className="text-xl font-semibold">Needs attention</h2><p className="text-sm text-[#7b847e]">Prioritized by Ecclesia AI</p><div className="mt-5 divide-y divide-[#eceeea]">{priorities.map(([title,note])=><div key={title} className="flex items-center gap-4 py-4"><span className="h-2.5 w-2.5 rounded-full bg-[#bd8c2d]"/><div className="flex-1"><b className="text-sm">{title}</b><small className="block text-[#89918c]">{note}</small></div><button className="rounded-lg border border-[#dde1dc] px-3 py-1.5 text-sm">Open</button></div>)}</div></section>
        <section className="rounded-2xl border border-[#e0e3de] bg-white p-6"><h2 className="text-xl font-semibold">Upcoming</h2><p className="text-sm text-[#7b847e]">Next 7 days</p><div className="mt-5 space-y-5">{[["WED","Midweek Gathering","6:30 PM"],["SAT","Community Food Drive","9:00 AM"],["SUN","Sunday Services","9:00 & 11:00 AM"]].map(([day,event,time])=><div className="flex gap-4" key={event}><b className="w-10 text-xs text-[#9a7b29]">{day}</b><div><strong className="text-sm">{event}</strong><small className="block text-[#89918c]">{time}</small></div></div>)}</div></section>
      </div>
    </section>
  </main>;
}
