"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addPerson(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase.from("church_memberships").select("church_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const status = String(formData.get("status") ?? "visitor") as "visitor" | "regular_attender" | "member" | "inactive";
  if (!firstName || !lastName) redirect("/people?error=First+and+last+name+are+required");

  const { error } = await supabase.from("people").insert({ church_id: membership.church_id, first_name: firstName, last_name: lastName, email: email || null, phone: phone || null, status, first_visit_date: status === "visitor" ? new Date().toISOString().slice(0,10) : null });
  if (error) redirect("/people?error=Unable+to+add+person");
  revalidatePath("/people");
  revalidatePath("/command-center");
  redirect("/people?message=Person+added");
}
