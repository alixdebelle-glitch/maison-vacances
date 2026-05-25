'use client'

import Link from 'next/link'
import { Property, STATUS_LABELS, STATUS_COLORS } from '@/types'
import { formatPrice, getPropertyName } from '@/lib/utils'
import { useState } from 'react'
import { ArrowUpDown, ExternalLink } from 'lucide-react'

type SortKey = 'name' | 'price' | 'surface' | 'score' | 'status' | 'distance'

export default function ListView({ properties, familyScores, photosMap }: {
  properties: Property[]
  familyScores: Record<string, number>
  photosMap: Record<string, string>
}) {
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [sortAsc, setSortAsc] = useState(true)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = [...properties].sort((a, b) => {
    let va: any, vb: any
    if (sortKey === 'name') { va = getPropertyName(a); vb = getPropertyName(b) }
    else if (sortKey === 'price') { va = a.price ?? 0; vb = b.price ?? 0 }
    else if (sortKey === 'surface') { va = a.surface ?? 0; vb = b.surface ?? 0 }
    else if (sortKey === 'score') { va = familyScores[a.id] ?? -1; vb = familyScores[b.id] ?? -1 }
    else if (sortKey === 'distance') { va = a.distance_suresnes_km ?? 9999; vb = b.distance_suresnes_km ?? 9999 }
    else { va = a.status; vb = b.status }
    if (va < vb) return sortAsc ? -1 : 1
    if (va > vb) return sortAsc ? 1 : -1
    return 0
  })

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide hover:text-orange-600 transition-colors ${sortKey === k ? 'text-orange-600' : 'text-stone-400'}`}
      >
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </button>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="card text-center py-16 text-stone-400">
        <p>Aucun bien pour l&apos;instant.</p>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 border-b border-stone-100">
          <tr>
            <th className="text-left px-4 py-3"><SortBtn k="name" label="Bien" /></th>
            <th className="text-left px-4 py-3"><SortBtn k="status" label="Statut" /></th>
            <th className="text-right px-4 py-3"><SortBtn k="price" label="Prix" /></th>
            <th className="text-right px-4 py-3"><SortBtn k="surface" label="Surface" /></th>
            <th className="text-right px-4 py-3"><SortBtn k="distance" label="Distance" /></th>
            <th className="text-right px-4 py-3"><SortBtn k="score" label="Score" /></th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {sorted.map(property => {
            const score = familyScores[property.id]
            const photo = photosMap[property.id]
            const name = getPropertyName(property)
            return (
              <tr key={property.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {photo ? (
                      <img src={photo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0" />
                    )}
                    <div>
                      <Link href={`/biens/${property.id}`} className="font-semibold text-stone-800 hover:text-orange-600 transition-colors">
                        {name}
                      </Link>
                      {property.city && property.nickname && (
                        <p className="text-xs text-stone-400">{property.city} {property.postal_code}</p>
                      )}
                      {!property.nickname && property.postal_code && (
                        <p className="text-xs text-stone-400">{property.postal_code}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[property.status]}`}>
                    {STATUS_LABELS[property.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-stone-700">
                  {formatPrice(property.price)}
                </td>
                <td className="px-4 py-3 text-right text-stone-500">
                  {property.surface ? `${property.surface} m²` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-stone-500">
                  {property.distance_suresnes_km ? (
                    <span>{property.distance_suresnes_km} km{property.distance_suresnes_drive ? ` · ${property.distance_suresnes_drive}` : ''}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {score !== undefined ? (
                    <span className="font-semibold text-orange-600">{score.toFixed(1)}</span>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {property.annonce_url && (
                    <a href={property.annonce_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-stone-300 hover:text-orange-500 transition-colors inline-block">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
