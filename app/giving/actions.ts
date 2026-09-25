"use server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
const allowed=["owner","administrator","finance"];
export async function addContribution(formData:FormData){
 const s=await createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)redirect("/login");
 const {data:m}=await s.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
 if(!m||!allowed.includes(m.role))redirect("/command-center");
 const amount=Number(formData.get("amount")); const person=String(formData.get("person_id")||""); const fund=String(formData.get("fund_id")||"");
 if(!Number.isFinite(amount)||amount<=0)redirect("/giving?error=Enter+a+valid+positive+amount");
 const {error}=await s.from("contributions").insert({church_id:m.church_id,person_id:person||null,fund_id:fund,amount,contributed_at:String(formData.get("contributed_at")),payment_method:String(formData.get("payment_method")||"unknown"),reference:String(formData.get("reference")||"")||null,created_by:user.id});
 if(error)redirect("/giving?error=Contribution+could+not+be+recorded"); redirect("/giving?message=Contribution+recorded");
}
