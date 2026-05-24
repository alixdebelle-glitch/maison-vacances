import { createClient } from '@/lib/supabase-server'
import NotesClient from './NotesClient'

export default async function NotesPage() {
  const supabase = createClient()
  const [{ data: notes }, { data: profiles }, { data: { user } }] = await Promise.all([
    supabase.from('notes').select('*').order('updated_at', { ascending: false }),
    supabase.from('profiles').select('*'),
    supabase.auth.getUser(),
  ])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <NotesClient
        initialNotes={(notes || []) as any}
        profiles={(profiles || []) as any}
        currentUserId={user?.id || ''}
      />
    </div>
  )
}
