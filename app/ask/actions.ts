"use server";
import { createClient } from "@/lib/supabase/server";

type AssistantAnswer={answer:string;links:{label:string;href:string}[]};
type VolunteerRow={id:string;person_id:string;people:{first_name:string|null;last_name:string|null}|{first_name:string|null;last_name:string|null}[]|null};
type AssignmentRow={id:string;status:string;starts_at:string;ends_at:string|null;role_name:string;service_id:string|null;service_position_id:string|null;volunteer_id:string};

const nameOf=(v:VolunteerRow|undefined)=>{const p=Array.isArray(v?.people)?v?.people[0]:v?.people;return [p?.first_name,p?.last_name].filter(Boolean).join(" ")||"Unnamed volunteer";};
const plural=(n:number,one:string,many=one+"s")=>`${n} ${n===1?one:many}`;

export async function askEcclesia(question:string):Promise<AssistantAnswer>{
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return{answer:"Please sign in to use Ecclesia AI.",links:[{label:"Sign in",href:"/login"}]};
  const {data:membership}=await supabase.from("church_memberships").select("church_id,role").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
  if(!membership)return{answer:"Create your church workspace before using the assistant.",links:[{label:"Set up church",href:"/onboarding"}]};

  const churchId=membership.church_id,q=question.toLowerCase().trim(),now=new Date().toISOString();
  const [{count:activePeople},{data:visitors},{data:tasks},{data:journeys},{count:volunteerCount},{count:ministries},{data:services},{data:volunteerRows},{data:futureAssignments}]=await Promise.all([
    supabase.from("people").select("id",{count:"exact",head:true}).eq("church_id",churchId).neq("status","inactive"),
    supabase.from("people").select("id").eq("church_id",churchId).eq("status","visitor"),
    supabase.from("tasks").select("id,title,priority,due_at").eq("church_id",churchId).in("status",["open","in_progress"]),
    supabase.from("visitor_journeys").select("person_id,stage,next_follow_up_at").eq("church_id",churchId).neq("stage","closed"),
    supabase.from("volunteers").select("id",{count:"exact",head:true}).eq("church_id",churchId).eq("status","active"),
    supabase.from("ministries").select("id",{count:"exact",head:true}).eq("church_id",churchId).eq("active",true),
    supabase.from("services").select("id,name,starts_at,ends_at,status").eq("church_id",churchId).gte("starts_at",now).neq("status","cancelled").order("starts_at").limit(12),
    supabase.from("volunteers").select("id,person_id,people(first_name,last_name)").eq("church_id",churchId).eq("status","active"),
    supabase.from("service_assignments").select("id,status,starts_at,ends_at,role_name,service_id,service_position_id,volunteer_id").eq("church_id",churchId).gte("starts_at",now).neq("status","declined").order("starts_at")
  ]);

  const serviceIds=(services??[]).map(s=>s.id);
  const [{data:positions},{data:serviceAssignments}]=serviceIds.length?await Promise.all([
    supabase.from("service_positions").select("id,service_id,role_name,required_count").eq("church_id",churchId).in("service_id",serviceIds),
    supabase.from("service_assignments").select("id,status,starts_at,ends_at,role_name,service_id,service_position_id,volunteer_id").eq("church_id",churchId).in("service_id",serviceIds).order("starts_at")
  ]):[{data:[]},{data:[]}];

  const assignments=(serviceAssignments??[]) as AssignmentRow[];
  const volunteers=(volunteerRows??[]) as unknown as VolunteerRow[];
  const volunteerById=new Map(volunteers.map(v=>[v.id,v]));
  const overdueTasks=(tasks??[]).filter(t=>t.due_at&&t.due_at<now),urgentTasks=(tasks??[]).filter(t=>t.priority==="urgent"),overdueVisitors=(journeys??[]).filter(j=>j.next_follow_up_at&&j.next_follow_up_at<now);
  const scheduled=assignments.filter(a=>a.status==="scheduled"),confirmed=assignments.filter(a=>a.status==="confirmed"),declined=assignments.filter(a=>a.status==="declined");
  const required=(positions??[]).reduce((sum,p)=>sum+(p.required_count??0),0);
  const filled=assignments.filter(a=>a.service_position_id&&(a.status==="scheduled"||a.status==="confirmed")).length;
  const vacant=Math.max(0,required-filled),staffingPct=required?Math.min(100,Math.round((filled/required)*100)):100;

  const filledByPosition=new Map<string,number>();
  for(const a of assignments)if(a.service_position_id&&(a.status==="scheduled"||a.status==="confirmed"))filledByPosition.set(a.service_position_id,(filledByPosition.get(a.service_position_id)??0)+1);
  const openPositions=(positions??[]).map(p=>({...p,vacant:Math.max(0,(p.required_count??0)-(filledByPosition.get(p.id)??0))})).filter(p=>p.vacant>0);

  const future=((futureAssignments??[]) as AssignmentRow[]).filter(a=>a.status==="scheduled"||a.status==="confirmed").sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
  const byVolunteer=new Map<string,AssignmentRow[]>();
  for(const a of future)byVolunteer.set(a.volunteer_id,[...(byVolunteer.get(a.volunteer_id)??[]),a]);
  const conflictVolunteerIds=new Set<string>();
  for(const [volunteerId,list] of byVolunteer){for(let i=0;i<list.length-1;i++){const current=list[i],next=list[i+1];const currentEnd=current.ends_at??new Date(new Date(current.starts_at).getTime()+7200000).toISOString();if(next.starts_at<currentEnd){conflictVolunteerIds.add(volunteerId);break;}}}

  const asksVacancies=q.includes("vacant")||q.includes("unfilled")||q.includes("open position")||q.includes("positions open");
  const asksUnconfirmed=q.includes("hasn't confirmed")||q.includes("has not confirmed")||q.includes("not confirmed")||q.includes("awaiting confirmation")||q.includes("who hasn")||q.includes("who hasn't");
  const asksConflicts=q.includes("double-book")||q.includes("double book")||q.includes("conflict")||q.includes("overlap");
  const asksReadiness=q.includes("ready for sunday")||q.includes("sunday readiness")||q.includes("fully staffed")||q.includes("staffing readiness");

  if(asksVacancies){
    const details=openPositions.slice(0,8).map(p=>`${p.role_name} (${p.vacant} open)`);
    return{answer:openPositions.length?`There are ${vacant} unfilled service positions across upcoming services: ${details.join(", ")}${openPositions.length>8?" and more.":"."}`:"All required positions in the upcoming service plans are currently filled.",links:[{label:"Open Service Planning",href:"/serve"}]};
  }
  if(asksUnconfirmed){
    const names=scheduled.slice(0,8).map(a=>`${nameOf(volunteerById.get(a.volunteer_id))} — ${a.role_name}`);
    return{answer:scheduled.length?`${plural(scheduled.length,"volunteer assignment")} ${scheduled.length===1?"is":"are"} awaiting confirmation: ${names.join(", ")}${scheduled.length>8?" and more.":"."}`:"There are no upcoming service assignments awaiting confirmation.",links:[{label:"Open Serve Scheduler",href:"/serve"}]};
  }
  if(asksConflicts){
    const names=[...conflictVolunteerIds].slice(0,8).map(id=>nameOf(volunteerById.get(id)));
    return{answer:conflictVolunteerIds.size?`I found ${plural(conflictVolunteerIds.size,"volunteer")} with overlapping upcoming assignments: ${names.join(", ")}${conflictVolunteerIds.size>8?" and more.":"."} Please review these schedules before the services.`:"I did not find any overlapping upcoming volunteer assignments.",links:[{label:"Review Serve Scheduler",href:"/serve"}]};
  }
  if(asksReadiness){
    const nextService=services?.[0];
    return{answer:`${nextService?`For upcoming service planning beginning with ${nextService.name}, `:"For upcoming service planning, "}${filled} of ${required} required positions are filled (${staffingPct}% readiness). ${vacant} positions remain vacant, ${scheduled.length} assignments are awaiting confirmation, ${confirmed.length} are confirmed, and ${declined.length} have been declined.`,links:[{label:"Open Sunday Readiness",href:"/serve"},{label:"Command Center",href:"/command-center"}]};
  }
  if(q.includes("serve")||q.includes("volunteer")||q.includes("ministry")||q.includes("sunday")||q.includes("schedule")){
    return{answer:`Serve currently has ${volunteerCount??0} active volunteers across ${ministries??0} active ministries. Upcoming service plans require ${required} positions: ${filled} are filled, ${vacant} are vacant, ${confirmed.length} are confirmed and ${scheduled.length} are awaiting confirmation. ${declined.length} declined assignment${declined.length===1?" needs":"s need"} review.`,links:[{label:"Open Serve Scheduler",href:"/serve"}]};
  }
  if(q.includes("visitor")||q.includes("follow up")||q.includes("follow-up"))return{answer:`You currently have ${visitors?.length??0} visitors in People and ${journeys?.length??0} active visitor journeys. ${overdueVisitors.length} visitor follow-up${overdueVisitors.length===1?" is":"s are"} overdue.`,links:[{label:"Open Visitor Journey",href:"/visitors"}]};
  if(q.includes("overdue")||q.includes("task"))return{answer:`There are ${tasks?.length??0} open ministry tasks. ${overdueTasks.length} are overdue and ${urgentTasks.length} are marked urgent.`,links:[{label:"Open Follow-Up Queue",href:"/tasks"}]};
  if(q.includes("attention")||q.includes("today"))return{answer:`Your current operational attention list includes ${plural(overdueTasks.length,"overdue task")}, ${plural(urgentTasks.length,"urgent task")}, ${plural(overdueVisitors.length,"overdue visitor follow-up")}, ${plural(vacant,"vacant service position")}, ${plural(scheduled.length,"Serve assignment")} awaiting confirmation, and ${plural(declined.length,"declined Serve assignment")}.`,links:[{label:"Command Center",href:"/command-center"},{label:"Serve Scheduler",href:"/serve"},{label:"Tasks",href:"/tasks"}]};
  if(q.includes("people")||q.includes("member")||q.includes("attendance"))return{answer:`ECCLESIA currently has ${activePeople??0} active people records and ${visitors?.length??0} people marked as visitors.`,links:[{label:"Open People CRM",href:"/people"}]};
  return{answer:`Your church workspace has ${activePeople??0} active people, ${visitors?.length??0} visitors, ${tasks?.length??0} open tasks, and ${vacant} vacant positions across upcoming service plans. Ask what needs attention today, whether Sunday is fully staffed, which roles are vacant, who has not confirmed, or whether anyone is double-booked.`,links:[{label:"Command Center",href:"/command-center"}]};
}
