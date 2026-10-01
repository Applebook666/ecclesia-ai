"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { askEcclesia } from "./actions";

type Message = { role: "user" | "assistant"; text: string; links?: { label: string; href: string }[] };

const leadershipPrompts = ["What is our operational health score?", "Give me our top three priorities.", "What should I focus on first?", "What needs my attention today?"];
const ministryPrompts = ["Is Sunday fully staffed?", "Which visitor follow-ups are overdue?", "Is anyone double-booked?", "Give me a people overview."];

export default function AskClient() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "I’m ECCLESIA. I can read your church’s permitted operational workspace, explain your operational health, identify priorities, and recommend a next step. I’ll stay grounded in church data and leave decisions and actions with your leadership team." }]);

  async function submit(text: string) {
    const clean = text.trim(); if (!clean || loading) return;
    setQuestion(""); setLoading(true); setMessages(m => [...m, { role:"user", text:clean }]);
    try {
      const result = await askEcclesia(clean);
      setMessages(m => [...m, { role:"assistant", text:result.answer, links:result.links }]);
    } catch {
      setMessages(m => [...m, { role:"assistant", text:"I couldn’t complete that workspace check. No church records were changed. Please try again." }]);
    } finally { setLoading(false); }
  }

  return <div className="flex min-h-[calc(100vh-73px)] flex-col"><div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-5 sm:p-8"><div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">GROUNDED LEADERSHIP ASSISTANT</p><h1 className="mt-2 text-4xl font-semibold">Ask ECCLESIA</h1><p className="mt-2 text-[#69736c]">Church-specific operational answers, health, priorities and recommendations — grounded in your workspace.</p></div><Link href="/insights" className="shrink-0 rounded-xl border border-[#d9c98e] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#755d20]">Leadership Insights →</Link></div><div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#e0e3de] bg-white p-3"><b className="text-xs text-[#526159]">1 · OBSERVE</b><p className="mt-1 text-xs leading-5 text-[#7a847d]">Reads permitted operational signals.</p></div><div className="rounded-xl border border-[#e0e3de] bg-white p-3"><b className="text-xs text-[#526159]">2 · RECOMMEND</b><p className="mt-1 text-xs leading-5 text-[#7a847d]">Explains priorities and a next step.</p></div><div className="rounded-xl border border-[#e0e3de] bg-white p-3"><b className="text-xs text-[#526159]">3 · HUMAN DECIDES</b><p className="mt-1 text-xs leading-5 text-[#7a847d]">ECCLESIA does not execute sensitive actions.</p></div></div><div className="flex-1 space-y-4 rounded-2xl border border-[#e0e3de] bg-white p-5 sm:p-7">{messages.map((m,i)=><div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-[#173329] text-white" : "bg-[#f5f1e6] text-[#344139]"}`}><p className="leading-7">{m.text}</p>{m.links && <div className="mt-3 flex flex-wrap gap-2">{m.links.map(link=><Link key={`${link.href}-${link.label}`} href={link.href} className="rounded-lg border border-[#d9c98e] bg-white px-3 py-1.5 text-xs font-semibold text-[#755d20]">{link.label} →</Link>)}</div>}</div></div>)}{loading && <div className="flex items-center gap-2 text-sm text-[#7a847d]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#9a7b29]"/>ECCLESIA is checking permitted church data…</div>}</div><div className="mt-4 rounded-xl border border-[#e2d7b8] bg-[#fffaf0] p-4"><p className="text-xs font-bold tracking-[.12em] text-[#9a7b29]">LEADERSHIP QUESTIONS</p><div className="mt-3 flex flex-wrap gap-2">{leadershipPrompts.map(p=><button key={p} disabled={loading} onClick={()=>submit(p)} className="rounded-full border border-[#d9c98e] bg-white px-3 py-2 text-xs font-medium text-[#59645d] disabled:opacity-50">{p}</button>)}</div></div><div className="mt-3"><p className="mb-2 text-xs font-bold tracking-[.12em] text-[#7a847d]">MINISTRY WORKFLOWS</p><div className="flex flex-wrap gap-2">{ministryPrompts.map(p=><button key={p} disabled={loading} onClick={()=>submit(p)} className="rounded-full border border-[#d9ddd8] bg-white px-3 py-2 text-xs text-[#59645d] disabled:opacity-50">{p}</button>)}</div></div><form onSubmit={(e:FormEvent)=>{e.preventDefault();submit(question)}} className="mt-4 flex gap-3"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about operational health, priorities, Sunday readiness, people, visitors or tasks…" className="flex-1 rounded-xl border border-[#ccd2cc] bg-white px-4 py-3 outline-none focus:border-[#9a7b29]"/><button disabled={loading||!question.trim()} className="rounded-xl bg-[#173329] px-5 py-3 font-semibold text-white disabled:opacity-50">Ask</button></form><p className="mt-3 text-center text-xs leading-5 text-[#8a938d]">Operational health reflects observable workflow conditions only. ECCLESIA does not judge spiritual health, send messages, move money, infer personal motives, or change sensitive records from this assistant.</p></div></div>;
}