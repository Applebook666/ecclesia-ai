"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const nextStage = { new:"contacted", contacted:"connected", connected:"returning", returning:"member_path", member_path:"closed" } as const;

export async function advanceVisitor(journeyId: string, personId: string, currentStage: keyof typeof nextStage) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("church_id").eq("user_id", user.id).eq("status","active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");
  const target = nextStage[currentStage];
  const update: { stage: typeof target; last_contact_at: string; next_follow_up_at: string | null; contact_attempts?: number } = { stage: target, last_contact_at: new Date().toISOString(), next_follow_up_at: target === "closed" ? null : new Date(Date.now() + 3 * 86400000).toISOString() };
  const { data: journey } = await supabase.from("visitor_journeys").select("contact_attempts").eq("id",journeyId).eq("church_id",membership.church_id).eq("person_id",personId).maybeSingle();
  if (!journey) redirect("/visitors");
  update.contact_attempts = journey.contact_attempts + 1;
  await supabase.from("visitor_journeys").update(update).eq("id",journeyId).eq("church_id",membership.church_id);
  if (target === "member_path") await supabase.from("people").update({ status:"regular_attender" }).eq("id",personId).eq("church_id",membership.church_id);
  revalidatePath("/visitors");
  revalidatePath("/command-center");
}