"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCareCase(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");
  if (!["owner","pastor","administrator"].includes(membership.role)) redirect("/command-center");
  const title = String(formData.get("title") ?? "").trim();
  const personId = String(formData.get("person_id") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal") as "normal"|"high"|"urgent";
  const nextDate = String(formData.get("next_follow_up") ?? "").trim();
  if (title.length < 2) redirect("/care?error=Please+enter+a+care+case+title");
  const { error } = await supabase.from("care_cases").insert({ church_id:membership.church_id, person_id:personId || null, title, category:category || null, summary:summary || null, priority, created_by:user.id, assigned_to:user.id, confidential:true, next_follow_up_at:nextDate ? `${nextDate}T12:00:00` : null });
  if (error) redirect("/care?error=Unable+to+create+care+case");
  revalidatePath("/care"); revalidatePath("/command-center"); redirect("/care?message=Care+case+created");
}
