'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function credentials(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || password.length < 8) redirect('/login?error=Please+enter+a+valid+email+and+an+8%2B+character+password')
  return { email, password }
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(credentials(formData))
  if (error) redirect('/login?error=Unable+to+sign+in')
  revalidatePath('/', 'layout')
  redirect('/command-center')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const data = credentials(formData)
  const fullName = String(formData.get('full_name') ?? '').trim()
  const { error } = await supabase.auth.signUp({ ...data, options: { data: { full_name: fullName || 'Church Leader' } } })
  if (error) redirect('/login?error=Unable+to+create+account')
  redirect('/login?message=Check+your+email+to+confirm+your+account')
}
