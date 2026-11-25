"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
const allowed=["owner","administrator","finance"];
async function financialContext(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/login");const {data:m,error:membershipError}=await s.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();if(membershipError||!m||!allowed.includes(m.role))redirect("/command-center");return {s,user,m};}
export async function addContribution(formData:FormData){
 const {s,user,m}=await financialContext();
 const rawAmount=String(formData.get("amount")??"").trim();
 const person=String(formData.get("person_id")??"").trim();
 const fund=String(formData.get("fund_id")??"").trim();
 const date=String(formData.get("contributed_at")??"").trim();
 const method=String(formData.get("payment_method")??"").trim();
 const reference=String(formData.get("reference")??"").trim();
 // Require decimal currency, never silently round amounts with fractional cents.
 if(!/^(?:0|[1-9]\\d{0,9})(?:\\.\\d{1,2})?$/.test(rawAmount)||Number(rawAmount)<=0)
  redirect("/giving?error=Enter+a+valid+amount+with+up+to+two+decimal+places");
 const amount=Number(rawAmount);
 if(!fund)redirect("/giving?error=Select+a+giving+fund");
 if(!["cash","check","card","ach","other"].includes(method))
  redirect("/giving?error=Select+a+valid+payment+method");
 // Reject impossible calendar dates rather than allowing normalization.
 const calendarDate=new Date(date+":00Z");
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)||!Number.isFinite(calendarDate.getTime())||calendarDate.toISOString().slice(0,16)!==date||date.startsWith("0000-"))
  redirect("/giving?error=Enter+a+valid+contribution+date");
 const {data:validFund,error:fundError}=await s.from("giving_funds").select("id").eq("church_id",m.church_id).eq("id",fund).eq("is_active",true).maybeSingle();
 if(fundError||!validFund)redirect("/giving?error=Selected+fund+is+not+available");
 if(person){
  const {data:validPerson,error:personError}=await s.from("people").select("id").eq("church_id",m.church_id).eq("id",person).maybeSingle();
  if(personError||!validPerson)redirect("/giving?error=Selected+donor+is+not+available");
 }
 const {error}=await s.from("contributions").insert({church_id:m.church_id,person_id:person||null,fund_id:fund,amount,contributed_at:date,payment_method:method,reference:reference||null,created_by:user.id});
 if(error)redirect("/giving?error=Contribution+could+not+be+recorded");
 redirect("/giving?message=Contribution+recorded");
}
export async function addGivingFund(formData:FormData){const {s,m}=await financialContext();const name=String(formData.get("name")||"").trim();if(name.length<2||name.length>80)redirect("/giving?error=Fund+name+must+be+2+to+80+characters");const {error}=await s.from("giving_funds").insert({church_id:m.church_id,name,description:String(formData.get("description")||"").trim()||null});if(error)redirect("/giving?error=Fund+could+not+be+created");redirect("/giving?message=Giving+fund+created");}
export async function correctContribution(formData:FormData){const {s}=await financialContext();const id=String(formData.get("contribution_id")||"");const status=String(formData.get("new_status")||"");const reason=String(formData.get("reason")||"").trim();if(!["refunded","voided"].includes(status)||!reason)redirect("/giving?error=Choose+a+valid+correction+and+enter+a+reason");const {error}=await s.rpc("correct_contribution_status",{target_contribution_id:id,new_status:status,reason});if(error)redirect("/giving?error=Contribution+correction+was+rejected");redirect("/giving?message=Contribution+corrected+with+audit+history");}
