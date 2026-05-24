'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import { Property, PropertyStatus, STATUS_LABELS } from '@/types'
import { formatPrice } from '@/lib/utils'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_MARKER_COLORS: Record<PropertyStatus, string> = {
  a_visiter: '#3b82f6',
  visite_1: '#eab308',
  visite_2: '#f59e0b',
  visite_3: '#f97316',
  offre_faite: '#f97316',
  compromis: '#ea580c',
  acte: '#22c55e',
  elimine: '#6b7280',
}

function createColoredIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

export default function MapView({ properties, familyScores, photosMap }: {
  properties: Property[]
  familyScores: Record<string, number>
  photosMap: Record<string, string>
}) {
  const center = useMemo(() => {
    if (properties.length === 0) return [46.2276, 2.2137] as [number, number]
    const lat = properties.reduce((sum, p) => sum + (p.latitude || 0), 0) / properties.length
    const lng = properties.reduce((sum, p) => sum + (p.longitude || 0), 0) / properties.length
    return [lat, lng] as [number, number]
  }, [properties])

  const statusGroups = Object.entries(STATUS_LABELS) as [PropertyStatus, string][]

  return (
    <div className="space-y-4">
      {/* Légende */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          {statusGroups.map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_MARKER_COLORS[status] }} />
              <span className="text-xs text-stone-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="card text-center py-16 text-stone-400">
          <p>Aucun bien géolocalisé pour l&apos;instant.</p>
          <p className="text-sm mt-1">Ajoutez des biens avec une adresse pour les voir sur la carte.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm" style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}>
          <MapContainer center={center} zoom={properties.length === 1 ? 12 : 7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {properties.map(property => (
              <Marker
                key={property.id}
                position={[property.latitude!, property.longitude!]}
                icon={createColoredIcon(STATUS_MARKER_COLORS[property.status])}
              >
                <Popup>
                  <div className="w-52 p-1">
                    {photosMap[property.id] && (
                      <img src={photosMap[property.id]} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                    )}
                    <p className="font-semibold text-stone-800 text-sm">
                      {property.city || 'Bien'} {property.postal_code && `(${property.postal_code})`}
                    </p>
                    {property.price && (
                      <p className="text-orange-600 font-medium text-sm">{formatPrice(property.price)}</p>
                    )}
                    {familyScores[property.id] !== undefined && (
                      <p className="text-xs text-stone-500">Score famille : <span className="font-semibold text-orange-600">{familyScores[property.id].toFixed(1)}/5</span></p>
                    )}
                    <Link href={`/biens/${property.id}`} className="text-xs text-blue-600 hover:underline block mt-1">
                      Voir la fiche →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}
