export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ChurchRole = "owner" | "pastor" | "administrator" | "staff" | "finance" | "ministry_leader" | "volunteer"
export type MembershipStatus = "invited" | "active" | "suspended"
export type PersonStatus = "visitor" | "regular_attender" | "member" | "inactive"
export type TaskPriority = "low" | "normal" | "high" | "urgent"
export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled"

export type Database = {
  public: {
    Tables: {
      churches: { Row: { id:string; name:string; slug:string; timezone:string; phone:string|null; email:string|null; website:string|null; created_at:string; updated_at:string }; Insert: { id?:string; name:string; slug:string; timezone?:string; phone?:string|null; email?:string|null; website?:string|null; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["churches"]["Insert"]> }
      church_memberships: { Row: { id:string; church_id:string; user_id:string; role:ChurchRole; status:MembershipStatus; created_at:string; updated_at:string }; Insert: { id?:string; church_id:string; user_id:string; role?:ChurchRole; status?:MembershipStatus; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["church_memberships"]["Insert"]> }
      people: { Row: { id:string; church_id:string; household_id:string|null; first_name:string; last_name:string; preferred_name:string|null; email:string|null; phone:string|null; status:PersonStatus; first_visit_date:string|null; member_since:string|null; date_of_birth:string|null; notes:string|null; created_at:string; updated_at:string }; Insert: { id?:string; church_id:string; household_id?:string|null; first_name:string; last_name:string; preferred_name?:string|null; email?:string|null; phone?:string|null; status?:PersonStatus; first_visit_date?:string|null; member_since?:string|null; date_of_birth?:string|null; notes?:string|null; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["people"]["Insert"]> }
      tasks: { Row: { id:string; church_id:string; title:string; description:string|null; status:TaskStatus; priority:TaskPriority; due_at:string|null; assigned_to:string|null; related_person_id:string|null; created_by:string|null; created_at:string; updated_at:string }; Insert: { id?:string; church_id:string; title:string; description?:string|null; status?:TaskStatus; priority?:TaskPriority; due_at?:string|null; assigned_to?:string|null; related_person_id?:string|null; created_by?:string|null; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]> }
      profiles: { Row: { id:string; full_name:string|null; avatar_url:string|null; phone:string|null; created_at:string; updated_at:string }; Insert: { id:string; full_name?:string|null; avatar_url?:string|null; phone?:string|null; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]> }
      households: { Row: { id:string; church_id:string; household_name:string; address_line1:string|null; address_line2:string|null; city:string|null; state:string|null; postal_code:string|null; country:string; created_at:string; updated_at:string }; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      audit_logs: { Row: { id:number; church_id:string|null; actor_user_id:string|null; action:string; entity_type:string; entity_id:string|null; metadata:Json; created_at:string }; Insert: Record<string, unknown>; Update: Record<string, unknown> }
    }
    Views: Record<string, never>
    Functions: { create_church_for_current_user: { Args: { church_name:string; church_slug:string; church_timezone?:string }; Returns:string } }
    Enums: { church_role:ChurchRole; membership_status:MembershipStatus; person_status:PersonStatus; task_priority:TaskPriority; task_status:TaskStatus }
    CompositeTypes: Record<string, never>
  }
}
