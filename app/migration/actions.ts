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

const allowedUploadTypes=new Map([
 ["text/csv","csv"],["application/csv","csv"],["application/vnd.ms-excel","csv"],
 ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","xlsx"],
]);

export async function uploadMigrationFile(formData:FormData){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:m}=await supabase.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
 if(!m)redirect("/onboarding");
 if(!["owner","pastor","administrator"].includes(m.role))redirect("/command-center");
 const jobId=String(formData.get("job_id")??"");
 const file=formData.get("file");
 if(!(file instanceof File)||file.size===0||file.size>10485760)redirect("/migration?error=Choose+a+file+under+10MB");
 const kind=allowedUploadTypes.get(file.type);
 if(!kind)redirect("/migration?error=Only+CSV+or+XLSX+files+are+allowed");
 const {data:job}=await supabase.from("migration_jobs").select("id,status,source_type").eq("id",jobId).eq("church_id",m.church_id).maybeSingle();
 if(!job||job.status!=="draft"||!["csv","xlsx"].includes(job.source_type))redirect("/migration?error=This+migration+job+cannot+accept+files");
 if(job.source_type!==kind)redirect("/migration?error=File+type+does+not+match+migration+source");
 const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-120)||"import";
 const path=`${m.church_id}/${job.id}/${crypto.randomUUID()}-${safeName}`;
 const bytes=await file.arrayBuffer();
 const {error:uploadError}=await supabase.storage.from("migration-imports").upload(path,bytes,{contentType:file.type,upsert:false});
 if(uploadError)redirect("/migration?error=Secure+file+upload+failed");
 const {error:metaError}=await supabase.from("migration_files").insert({church_id:m.church_id,migration_job_id:job.id,original_name:file.name.slice(0,255),storage_path:path,mime_type:file.type,byte_size:file.size});
 if(metaError){await supabase.storage.from("migration-imports").remove([path]);redirect("/migration?error=Could+not+register+migration+file");}
 const {error:stateError}=await supabase.from("migration_jobs").update({status:"analyzing",started_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",job.id).eq("church_id",m.church_id).eq("status","draft");
 if(stateError)redirect("/migration?error=File+stored+but+analysis+could+not+start");
 redirect("/migration?message=File+secured+and+ready+for+analysis");
}
