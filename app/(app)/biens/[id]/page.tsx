import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, ExternalLink, MapPin, Navigation, Euro, Home, Building2 } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS } from '@/types'
import { formatPrice } from '@/lib/utils'
import PropertyPhotos from './PropertyPhotos'
import PropertyFiles from './PropertyFiles'
import PropertyScoring from './PropertyScoring'
import PropertyMap from './PropertyMap'

export default async function BienDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: property }, { data: photos }, { data: files }, { data: scores }, { data: criteria }, { data: profiles }, { data: { user } }] = await Promise.all([
    supabase.from('properties').select('*').eq('id', params.id).single(),
    supabase.from('property_photos').select('*').eq('property_id', params.id).order('position'),
    supabase.from('property_files').select('*').eq('property_id', params.id).order('created_at'),
    supabase.from('scores').select('*').eq('property_id', params.id),
    supabase.from('criteria').select('*').order('position'),
    supabase.from('profiles').select('*'),
    supabase.auth.getUser(),
  ])

  if (!property) notFound()

  const netPrice = property.price && property.agency_fees ? property.price - property.agency_fees : null
  const annualCost = (property.land_tax || 0) + (property.housing_tax || 0)

  // Calculate scores per member
  const memberScores: { userId: string; name: string; total: number }[] = []
  if (scores && criteria && profiles) {
    const userIds = Array.from(new Set((scores as any[]).map((s: any) => s.user_id)))
    for (const userId of userIds) {
      const userScores = (scores as any[]).filter((s: any) => s.user_id === userId)
      const total = userScores.reduce((sum: number, s: any) => {
        const crit = (criteria as any[]).find((c: any) => c.id === s.criteria_id)
        return sum + (s.score * (crit?.weight || 0)) / 100
      }, 0)
      const profile = (profiles as any[]).find((p: any) => p.id === userId)
      memberScores.push({
        userId,
        name: profile?.first_name || 'Membre',
        total,
      })
    }
  }

  const familyAvg = memberScores.length > 0
    ? memberScores.reduce((sum, m) => sum + m.total, 0) / memberScores.length
    : null

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${STATUS_COLORS[property.status as keyof typeof STATUS_COLORS]}`}>
              {STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]}
            </span>
            {familyAvg !== null && (
              <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Score famille : {familyAvg.toFixed(1)}/5
              </span>
            )}
          </div>
          <h1 className="text-3xl font-serif text-stone-800">
            {property.city || 'Bien sans ville'}
            {property.postal_code && <span className="text-stone-400 text-xl ml-2">{property.postal_code}</span>}
          </h1>
          {property.address && (
            <p className="text-stone-500 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {property.address}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {property.annonce_url && (
            <a href={property.annonce_url} target="_blank" rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Voir l&apos;annonce
            </a>
          )}
          <Link href={`/biens/${params.id}/modifier`} className="btn-primary flex items-center gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </Link>
        </div>
      </div>

      {/* Prix */}
      <div className="card">
        <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
          <Euro className="w-5 h-5 text-orange-500" /> Prix & finances
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {property.price && (
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 mb-1">Prix affiché</p>
              <p className="text-xl font-semibold text-stone-800">{formatPrice(property.price)}</p>
            </div>
          )}
          {netPrice && (
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 mb-1">Prix net vendeur</p>
              <p className="text-xl font-semibold text-orange-700">{formatPrice(netPrice)}</p>
            </div>
          )}
          {property.agency_fees && (
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 mb-1">Honoraires agence</p>
              <p className="text-xl font-semibold text-stone-800">{formatPrice(property.agency_fees)}</p>
              {property.agency_fees_pct && <p className="text-xs text-stone-400">{property.agency_fees_pct}%</p>}
            </div>
          )}
          {annualCost > 0 && (
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 mb-1">Coût annuel détention</p>
              <p className="text-xl font-semibold text-stone-800">{formatPrice(annualCost)}</p>
              <p className="text-xs text-stone-400">foncier + habitation/an</p>
            </div>
          )}
        </div>
      </div>

      {/* Caractéristiques */}
      <div className="card">
        <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-orange-500" /> Caractéristiques
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {property.surface && <div><span className="text-stone-400">Surface :</span> <span className="font-medium">{property.surface} m²</span></div>}
          {property.rooms && <div><span className="text-stone-400">Pièces :</span> <span className="font-medium">{property.rooms}</span></div>}
        </div>
      </div>

      {/* Agence */}
      {(property.agency_name || property.agency_contact) && (
        <div className="card">
          <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" /> Agence
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {property.agency_name && <div><span className="text-stone-400">Agence :</span> <span className="font-medium">{property.agency_name}</span></div>}
            {property.agency_contact && <div><span className="text-stone-400">Contact :</span> <span className="font-medium">{property.agency_contact}</span></div>}
            {property.agency_phone && <div><span className="text-stone-400">Téléphone :</span> <a href={`tel:${property.agency_phone}`} className="font-medium text-orange-600">{property.agency_phone}</a></div>}
            {property.agency_email && <div><span className="text-stone-400">Email :</span> <a href={`mailto:${property.agency_email}`} className="font-medium text-orange-600">{property.agency_email}</a></div>}
          </div>
        </div>
      )}

      {/* Descriptions */}
      {(property.description_libre || property.description_technique || property.description_travaux) && (
        <div className="card space-y-6">
          <h2 className="text-lg font-serif text-stone-700 flex items-center gap-2">
            Descriptions
          </h2>
          {property.description_libre && (
            <div>
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">Description générale</h3>
              <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{property.description_libre}</p>
            </div>
          )}
          {property.description_technique && (
            <div>
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">Description technique</h3>
              <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{property.description_technique}</p>
            </div>
          )}
          {property.description_travaux && (
            <div>
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">Travaux à prévoir</h3>
              <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{property.description_travaux}</p>
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      <PropertyPhotos propertyId={params.id} initialPhotos={(photos || []) as any} />

      {/* Fichiers */}
      <PropertyFiles propertyId={params.id} initialFiles={(files || []) as any} />

      {/* Scoring */}
      <PropertyScoring
        propertyId={params.id}
        currentUserId={user?.id || ''}
        initialScores={(scores || []) as any}
        criteria={(criteria || []) as any}
        memberScores={memberScores}
        profiles={(profiles || []) as any}
      />

      {/* Map + Distance */}
      {(property.latitude && property.longitude) && (
        <div className="card">
          <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-orange-500" /> Distance depuis Suresnes
          </h2>
          <div className="flex items-center gap-6 mb-4">
            {property.distance_suresnes_km && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-stone-800">{property.distance_suresnes_km} km</p>
                <p className="text-xs text-stone-400">en voiture</p>
              </div>
            )}
            {property.distance_suresnes_drive && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-stone-800">{property.distance_suresnes_drive}</p>
                <p className="text-xs text-stone-400">temps de trajet</p>
              </div>
            )}
          </div>
          <PropertyMap lat={property.latitude} lng={property.longitude} city={property.city} />
        </div>
      )}
    </div>
  )
}
