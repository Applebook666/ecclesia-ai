import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AskClient from "./ask-client";

export default async function AskPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");
  return <main className="min-h-screen bg-[#f4f5f2] text-[#1d2923]"><header className="border-b border-white/10 bg-[#13271f] px-6 py-5 text-white"><div className="mx-auto flex max-w-4xl items-center justify-between"><Link href="/command-center" className="font-bold tracking-wide">✦ ECCLESIA AI</Link><Link href="/command-center" className="text-sm text-white/70">← Command Center</Link></div></header><AskClient /></main>;
}