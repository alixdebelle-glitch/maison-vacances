import { createClient } from '@/lib/supabase-server'
import PropertyForm from '../../PropertyForm'
import { notFound } from 'next/navigation'

export default async function ModifierBienPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!property) notFound()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif text-stone-800 mb-8">Modifier le bien</h1>
      <PropertyForm property={property as any} />
    </div>
  )
}
