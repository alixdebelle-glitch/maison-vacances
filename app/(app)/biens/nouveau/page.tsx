import { createClient } from '@/lib/supabase-server'
import PropertyForm from '../PropertyForm'

export default async function NouveauBienPage() {
  const supabase = createClient()
  const [{ data: agencies }, { data: contacts }] = await Promise.all([
    supabase.from('agencies').select('*').order('name'),
    supabase.from('agency_contacts').select('*').order('name'),
  ])
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif text-stone-800 mb-8">Ajouter un bien</h1>
      <PropertyForm agencies={(agencies || []) as any} agencyContacts={(contacts || []) as any} />
    </div>
  )
}
