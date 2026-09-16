"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
  if (!membership) redirect("/onboarding");
  return { supabase,user,membership };
}

export async function addCareNote(caseId:string, formData:FormData) {
  const {supabase,user,membership}=await context();
  const note=String(formData.get("note")??"").trim();
  if(!note) redirect(`/care/${caseId}?error=Please+enter+a+note`);
  const {error}=await supabase.from("care_notes").insert({church_id:membership.church_id,care_case_id:caseId,author_user_id:user.id,note});
  if(error) redirect(`/care/${caseId}?error=Unable+to+save+care+note`);
  revalidatePath(`/care/${caseId}`); redirect(`/care/${caseId}?message=Confidential+note+saved`);
}

export async function resolveCareCase(caseId:string) {
  const {supabase,membership}=await context();
  await supabase.from("care_cases").update({status:"resolved",resolved_at:new Date().toISOString()}).eq("id",caseId).eq("church_id",membership.church_id);
  revalidatePath("/care"); revalidatePath(`/care/${caseId}`); revalidatePath("/command-center");
}
