"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

const allowedSources=new Set(["csv","xlsx","api","manual","concierge"]);

export async function createMigrationJob(formData:FormData){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:m}=await supabase.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
 if(!m)redirect("/onboarding");
 if(!["owner","pastor","administrator"].includes(m.role))redirect("/command-center");
 const sourceName=String(formData.get("source_name")??"").trim();
 const sourceType=String(formData.get("source_type")??"").trim();
 if(sourceName.length<2||sourceName.length>120||!allowedSources.has(sourceType))redirect("/migration?error=Invalid+migration+source");
 const {error}=await supabase.from("migration_jobs").insert({church_id:m.church_id,source_name:sourceName,source_type:sourceType,status:"draft",created_by:user.id});
 if(error)redirect("/migration?error=Could+not+create+migration+job");
 redirect("/migration?message=Migration+job+created");
}
