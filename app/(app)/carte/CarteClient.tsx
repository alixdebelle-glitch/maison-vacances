'use client'

import dynamic from 'next/dynamic'
import { Property } from '@/types'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

export default function CarteClient({ properties, familyScores, photosMap }: {
  properties: Property[]
  familyScores: Record<string, number>
  photosMap: Record<string, string>
}) {
  return <MapView properties={properties} familyScores={familyScores} photosMap={photosMap} />
}
