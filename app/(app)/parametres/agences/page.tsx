import { createClient } from '@/lib/supabase-server'
import AgencesClient from './AgencesClient'

export default async function AgencesPage() {
  const supabase = createClient()
  const [{ data: agencies }, { data: contacts }] = await Promise.all([
    supabase.from('agencies').select('*').order('name'),
    supabase.from('agency_contacts').select('*').order('name'),
  ])
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-serif text-stone-800 mb-2">Agences & Contacts</h1>
      <p className="text-stone-500 mb-8">Gérez vos interlocuteurs pour les sélectionner rapidement sur chaque bien</p>
      <AgencesClient initialAgencies={(agencies || []) as any} initialContacts={(contacts || []) as any} />
    </div>
  )
}
