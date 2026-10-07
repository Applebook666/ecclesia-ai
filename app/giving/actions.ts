"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
const allowed=["owner","administrator","finance"];
async function financialContext(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/login");const {data:m}=await s.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();if(!m||!allowed.includes(m.role))redirect("/command-center");return {s,user,m};}
export async function addContribution(formData:FormData){
 const {s,user,m}=await financialContext();
 const amount=Number(formData.get("amount")); const person=String(formData.get("person_id")||""); const fund=String(formData.get("fund_id")||"");
 if(!Number.isFinite(amount)||amount<=0)redirect("/giving?error=Enter+a+valid+positive+amount");
 const {error}=await s.from("contributions").insert({church_id:m.church_id,person_id:person||null,fund_id:fund,amount,contributed_at:String(formData.get("contributed_at")),payment_method:String(formData.get("payment_method")||"unknown"),reference:String(formData.get("reference")||"")||null,created_by:user.id});
 if(error)redirect("/giving?error=Contribution+could+not+be+recorded"); redirect("/giving?message=Contribution+recorded");
}
export async function addGivingFund(formData:FormData){const {s,m}=await financialContext();const name=String(formData.get("name")||"").trim();if(name.length<2||name.length>80)redirect("/giving?error=Fund+name+must+be+2+to+80+characters");const {error}=await s.from("giving_funds").insert({church_id:m.church_id,name,description:String(formData.get("description")||"").trim()||null});if(error)redirect("/giving?error=Fund+could+not+be+created");redirect("/giving?message=Giving+fund+created");}
export async function correctContribution(formData:FormData){const {s}=await financialContext();const id=String(formData.get("contribution_id")||"");const status=String(formData.get("new_status")||"");const reason=String(formData.get("reason")||"").trim();if(!["refunded","voided"].includes(status)||!reason)redirect("/giving?error=Choose+a+valid+correction+and+enter+a+reason");const {error}=await s.rpc("correct_contribution_status",{target_contribution_id:id,new_status:status,reason});if(error)redirect("/giving?error=Contribution+correction+was+rejected");redirect("/giving?message=Contribution+corrected+with+audit+history");}
