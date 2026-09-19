"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { askEcclesia } from "./actions";

type Message = { role: "user" | "assistant"; text: string; links?: { label: string; href: string }[] };

const prompts = ["What needs my attention today?", "Which visitor follow-ups are overdue?", "How many open ministry tasks do we have?", "Give me a people overview."];

export default function AskClient() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "I’m Ecclesia. I can read your church’s operational data and help you understand what needs attention. I’ll only answer from information available in your church workspace." }]);

  async function submit(text: string) {
    const clean = text.trim(); if (!clean || loading) return;
    setQuestion(""); setLoading(true); setMessages(m => [...m, { role:"user", text:clean }]);
    const result = await askEcclesia(clean);
    setMessages(m => [...m, { role:"assistant", text:result.answer, links:result.links }]); setLoading(false);
  }

  return <div className="flex min-h-[calc(100vh-73px)] flex-col"><div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-5 sm:p-8"><div className="mb-6"><p className="text-xs font-bold tracking-[.18em] text-[#9a7b29]">GROUNDED CHURCH ASSISTANT</p><h1 className="mt-2 text-4xl font-semibold">Ask ECCLESIA</h1><p className="mt-2 text-[#69736c]">Operational answers based on your church workspace — not guesses.</p></div><div className="flex-1 space-y-4 rounded-2xl border border-[#e0e3de] bg-white p-5 sm:p-7">{messages.map((m,i)=><div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-[#173329] text-white" : "bg-[#f5f1e6] text-[#344139]"}`}><p className="leading-7">{m.text}</p>{m.links && <div className="mt-3 flex flex-wrap gap-2">{m.links.map(link=><Link key={link.href} href={link.href} className="rounded-lg border border-[#d9c98e] bg-white px-3 py-1.5 text-xs font-semibold text-[#755d20]">{link.label} →</Link>)}</div>}</div></div>)}{loading && <div className="text-sm text-[#7a847d]">ECCLESIA is checking your church data…</div>}</div><div className="mt-4 flex flex-wrap gap-2">{prompts.map(p=><button key={p} onClick={()=>submit(p)} className="rounded-full border border-[#d9ddd8] bg-white px-3 py-2 text-xs text-[#59645d]">{p}</button>)}</div><form onSubmit={(e:FormEvent)=>{e.preventDefault();submit(question)}} className="mt-4 flex gap-3"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about visitors, people, tasks or follow-up…" className="flex-1 rounded-xl border border-[#ccd2cc] bg-white px-4 py-3 outline-none focus:border-[#9a7b29]"/><button disabled={loading} className="rounded-xl bg-[#173329] px-5 py-3 font-semibold text-white disabled:opacity-50">Ask</button></form><p className="mt-3 text-center text-xs text-[#8a938d]">ECCLESIA does not send messages, move money, or change sensitive records from this assistant.</p></div></div>;
}