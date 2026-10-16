'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createChurch(formData: FormData) {
  const churchName = String(formData.get('churchName') ?? '').trim()
  const timezone = String(formData.get('timezone') ?? 'America/Chicago').trim()
  const slug = slugify(String(formData.get('slug') ?? churchName))

  if (churchName.length < 2) redirect('/onboarding?error=Please+enter+your+church+name')
  if (slug.length < 3) redirect('/onboarding?error=Please+enter+a+longer+church+URL')

  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  if (claimsError || !claimsData?.claims) redirect('/login?message=Please+sign+in+to+continue')

  const { error } = await supabase.rpc('create_church_for_current_user', {
    church_name: churchName,
    church_slug: slug,
    church_timezone: timezone || 'America/Chicago',
  })

  if (error) {
    const message = error.message.includes('duplicate key')
      ? 'That church URL is already in use. Please choose another.'
      : error.message.includes('already belongs')
        ? 'Your account already belongs to a church.'
        : 'We could not create the church. Please check the details and try again.'
    redirect(`/onboarding?error=${encodeURIComponent(message)}`)
  }

  redirect('/command-center')
}
