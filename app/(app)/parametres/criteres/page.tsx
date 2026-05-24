import { createClient } from '@/lib/supabase-server'
import CriteresClient from './CriteresClient'

export default async function CriteresPage() {
  const supabase = createClient()
  const { data: criteria } = await supabase.from('criteria').select('*').order('position')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-serif text-stone-800 mb-2">Critères de scoring</h1>
      <p className="text-stone-500 mb-8">La somme des poids doit toujours être égale à 100%</p>
      <CriteresClient initialCriteria={(criteria || []) as any} />
    </div>
  )
}
