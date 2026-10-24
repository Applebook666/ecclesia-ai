"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createFollowUp(personId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase.from("church_memberships").select("church_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");

  const { data: person } = await supabase.from("people").select("id,first_name,last_name").eq("id", personId).eq("church_id", membership.church_id).maybeSingle();
  if (!person) redirect("/people?error=Person+not+found");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal") as "low" | "normal" | "high" | "urgent";
  if (!title) redirect(`/people/${personId}?error=Follow-up+title+is+required`);

  const { error } = await supabase.from("tasks").insert({
    church_id: membership.church_id,
    title,
    description: description || null,
    priority,
    due_at: dueDate ? `${dueDate}T12:00:00` : null,
    related_person_id: personId,
    assigned_to: user.id,
    created_by: user.id,
  });

  if (error) redirect(`/people/${personId}?error=Unable+to+create+follow-up`);
  revalidatePath(`/people/${personId}`);
  revalidatePath("/command-center");
  redirect(`/people/${personId}?message=Follow-up+created`);
}

export async function completeTask(personId: string, taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("church_id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");

  await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId).eq("church_id", membership.church_id).eq("related_person_id", personId);
  revalidatePath(`/people/${personId}`);
  revalidatePath("/command-center");
}