'use client'

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

export default function PropertyMap({ lat, lng, city }: { lat: number; lng: number; city?: string | null }) {
  return <MapComponent lat={lat} lng={lng} city={city} />
}
