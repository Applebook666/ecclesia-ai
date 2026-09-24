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
 const lowerName=file.name.toLowerCase();
 const extensionKind=lowerName.endsWith(".csv")?"csv":lowerName.endsWith(".xlsx")?"xlsx":null;
 if(!extensionKind||extensionKind!==kind)redirect("/migration?error=File+extension+and+content+type+must+match");
 const {data:job}=await supabase.from("migration_jobs").select("id,status,source_type").eq("id",jobId).eq("church_id",m.church_id).maybeSingle();
 if(!job||job.status!=="draft"||!["csv","xlsx"].includes(job.source_type))redirect("/migration?error=This+migration+job+cannot+accept+files");
 if(job.source_type!==kind)redirect("/migration?error=File+type+does+not+match+migration+source");
 const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-120)||"import";
 const path=`${m.church_id}/${job.id}/${crypto.randomUUID()}-${safeName}`;
 const bytes=await file.arrayBuffer();
 const head=new Uint8Array(bytes.slice(0,8));
 if(kind==="xlsx"&&!(head[0]===0x50&&head[1]===0x4b))redirect("/migration?error=Invalid+Excel+file");
 if(kind==="csv"){
  const sample=new Uint8Array(bytes.slice(0,Math.min(bytes.byteLength,4096)));
  if(sample.some(b=>b===0))redirect("/migration?error=Invalid+CSV+file");
 }
 const {error:uploadError}=await supabase.storage.from("migration-imports").upload(path,bytes,{contentType:file.type,upsert:false});
 if(uploadError)redirect("/migration?error=Secure+file+upload+failed");
 const {error:metaError}=await supabase.from("migration_files").insert({church_id:m.church_id,migration_job_id:job.id,original_name:file.name.slice(0,255),storage_path:path,mime_type:file.type,byte_size:file.size});
 if(metaError){await supabase.storage.from("migration-imports").remove([path]);redirect("/migration?error=Could+not+register+migration+file");}
 const {error:stateError}=await supabase.from("migration_jobs").update({status:"analyzing",started_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",job.id).eq("church_id",m.church_id).eq("status","draft");
 if(stateError)redirect("/migration?error=File+stored+but+analysis+could+not+start");
 redirect("/migration?message=File+secured+and+ready+for+analysis");
}

const peopleTargets:Record<string,string>={firstname:"first_name",first_name:"first_name",first:"first_name",lastname:"last_name",last_name:"last_name",last:"last_name",email:"email",emailaddress:"email",email_address:"email",phone:"phone",phonenumber:"phone",phone_number:"phone",mobile:"phone"};

function csvRows(text:string){
 const rows:string[][]=[]; let row:string[]=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];
  if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(ch===","&&!quoted){row.push(cell);cell="";}
  else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(cell);cell="";if(row.some(v=>v.trim()))rows.push(row);row=[];}
  else cell+=ch;
 }
 row.push(cell); if(row.some(v=>v.trim()))rows.push(row); return rows;
}
function normHeader(v:string){return v.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");}

export async function analyzeCsvMigration(formData:FormData){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:m}=await supabase.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
 if(!m)redirect("/onboarding"); if(!["owner","pastor","administrator"].includes(m.role))redirect("/command-center");
 const jobId=String(formData.get("job_id")??"");
 const {data:job}=await supabase.from("migration_jobs").select("id,status,source_type").eq("id",jobId).eq("church_id",m.church_id).maybeSingle();
 if(!job||job.status!=="analyzing"||job.source_type!=="csv")redirect(`/migration/${jobId}?error=CSV+analysis+is+not+available`);
 const {data:file}=await supabase.from("migration_files").select("id,storage_path").eq("church_id",m.church_id).eq("migration_job_id",jobId).order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(!file)redirect(`/migration/${jobId}?error=No+source+file+found`);
 const {data:blob,error:downloadError}=await supabase.storage.from("migration-imports").download(file.storage_path);
 if(downloadError||!blob)redirect(`/migration/${jobId}?error=Could+not+read+source+file`);
 const text=await blob.text(); const rows=csvRows(text);
 if(rows.length<2||rows.length>5001)redirect(`/migration/${jobId}?error=CSV+must+contain+1+to+5000+data+rows`);
 const headers=rows[0].map(normHeader); if(headers.some((h,i)=>!h||headers.indexOf(h)!==i))redirect(`/migration/${jobId}?error=CSV+headers+must+be+unique+and+non-empty`);
 const mappings=headers.map(h=>({church_id:m.church_id,migration_job_id:jobId,source_entity:"people",source_field:h,target_entity:"people",target_field:peopleTargets[h]??"",confidence:peopleTargets[h]?0.95:0.25}));
 const records=rows.slice(1).map((r,i)=>{const raw=Object.fromEntries(headers.map((h,x)=>[h,(r[x]??"").trim()]));const normalized=Object.fromEntries(headers.filter(h=>peopleTargets[h]).map(h=>[peopleTargets[h],raw[h]]));return {church_id:m.church_id,migration_job_id:jobId,source_entity:"people",source_record_key:String(i+2),raw_data:raw,normalized_data:normalized,status:Object.keys(normalized).length?"ready":"needs_review",review_reason:Object.keys(normalized).length?null:"No recognized People fields"};});
 const {error:mapError}=await supabase.from("migration_mappings").insert(mappings); if(mapError)redirect(`/migration/${jobId}?error=Could+not+stage+field+mappings`);
 const {error:recordError}=await supabase.from("migration_records").insert(records);
 if(recordError){await supabase.from("migration_mappings").delete().eq("church_id",m.church_id).eq("migration_job_id",jobId);redirect(`/migration/${jobId}?error=Could+not+stage+records`);}
 const ready=records.filter(r=>r.status==="ready").length, review=records.length-ready;
 const {error:updateError}=await supabase.from("migration_jobs").update({status:"mapping",total_records:records.length,ready_records:ready,review_records:review,updated_at:new Date().toISOString()}).eq("id",jobId).eq("church_id",m.church_id).eq("status","analyzing");
 if(updateError)redirect(`/migration/${jobId}?error=Records+staged+but+job+state+could+not+advance`);
 redirect(`/migration/${jobId}?message=CSV+analyzed+and+staged+for+mapping`);
}

export async function approveMigrationMappings(formData:FormData){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:m}=await supabase.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
 if(!m)redirect("/onboarding"); if(!["owner","pastor","administrator"].includes(m.role))redirect("/command-center");
 const jobId=String(formData.get("job_id")??"");
 const {data:job}=await supabase.from("migration_jobs").select("id,status").eq("id",jobId).eq("church_id",m.church_id).maybeSingle();
 if(!job||job.status!=="mapping")redirect(`/migration/${jobId}?error=Job+is+not+ready+for+mapping+approval`);
 const {data:maps}=await supabase.from("migration_mappings").select("id,target_field,confidence").eq("church_id",m.church_id).eq("migration_job_id",jobId);
 if(!maps?.length)redirect(`/migration/${jobId}?error=No+field+mappings+found`);
 if(maps.some(x=>!x.target_field||Number(x.confidence??0)<0.5))redirect(`/migration/${jobId}?error=Uncertain+fields+must+be+reviewed+before+approval`);
 const now=new Date().toISOString();
 const {error}=await supabase.from("migration_mappings").update({approved_by:user.id,approved_at:now}).eq("church_id",m.church_id).eq("migration_job_id",jobId);
 if(error)redirect(`/migration/${jobId}?error=Could+not+approve+field+mappings`);
 const {error:stateError}=await supabase.from("migration_jobs").update({status:"review",updated_at:now}).eq("id",jobId).eq("church_id",m.church_id).eq("status","mapping");
 if(stateError)redirect(`/migration/${jobId}?error=Mappings+approved+but+review+could+not+start`);
 redirect(`/migration/${jobId}?message=Mappings+approved.+Exception+review+is+now+required`);
}

function canonicalPhone(v:string){return v.replace(/\D/g,"").slice(-10);}
export async function detectMigrationDuplicates(formData:FormData){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:m}=await supabase.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
 if(!m)redirect("/onboarding"); if(!["owner","pastor","administrator"].includes(m.role))redirect("/command-center");
 const jobId=String(formData.get("job_id")??"");
 const {data:job}=await supabase.from("migration_jobs").select("id,status").eq("id",jobId).eq("church_id",m.church_id).maybeSingle();
 if(!job||job.status!=="review")redirect(`/migration/${jobId}?error=Job+is+not+ready+for+duplicate+review`);
 const {data:records}=await supabase.from("migration_records").select("id,normalized_data,status").eq("church_id",m.church_id).eq("migration_job_id",jobId).in("status",["ready","needs_review"]);
 if(!records)redirect(`/migration/${jobId}?error=Could+not+load+staged+records`);
 const {data:people}=await supabase.from("people").select("id,email,phone").eq("church_id",m.church_id);
 const emailMap=new Map((people??[]).filter(p=>p.email).map(p=>[String(p.email).trim().toLowerCase(),p.id]));
 const phoneMap=new Map<string,string>((people??[]).filter(p=>p.phone).map(p=>[canonicalPhone(String(p.phone)),String(p.id)] as [string,string]).filter(([k])=>k.length>=7));
 let duplicates=0;
 for(const r of records){const d=(r.normalized_data??{}) as Record<string,unknown>;const email=String(d.email??"").trim().toLowerCase();const phone=canonicalPhone(String(d.phone??""));const match=(email&&emailMap.get(email))||(phone.length>=7&&phoneMap.get(phone));
  if(match){const {error}=await supabase.from("migration_records").update({status:"duplicate",matched_record_id:match,review_reason:email&&emailMap.has(email)?"Existing person has same email":"Existing person has same phone"}).eq("id",r.id).eq("church_id",m.church_id).eq("migration_job_id",jobId);if(error)redirect(`/migration/${jobId}?error=Duplicate+review+could+not+complete`);duplicates++;}
 }
 const {count:review}=await supabase.from("migration_records").select("id",{count:"exact",head:true}).eq("church_id",m.church_id).eq("migration_job_id",jobId).in("status",["needs_review","duplicate"]);
 const {count:ready}=await supabase.from("migration_records").select("id",{count:"exact",head:true}).eq("church_id",m.church_id).eq("migration_job_id",jobId).eq("status","ready");
 await supabase.from("migration_jobs").update({ready_records:ready??0,review_records:review??0,updated_at:new Date().toISOString()}).eq("id",jobId).eq("church_id",m.church_id);
 redirect(`/migration/${jobId}?message=Duplicate+scan+complete.+${duplicates}+possible+duplicates+flagged`);
}
