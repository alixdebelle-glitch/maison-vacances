import { createClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()

  const [{ data: properties }, { data: photos }, { data: scores }, { data: criteria }] = await Promise.all([
    supabase.from('properties').select('*').order('created_at', { ascending: false }),
    supabase.from('property_photos').select('*').order('position'),
    supabase.from('scores').select('*'),
    supabase.from('criteria').select('*').order('position'),
  ])

  const familyScores: Record<string, number> = {}
  if (scores && criteria && properties) {
    const propertyIds = Array.from(new Set(scores.map((s: any) => s.property_id)))
    for (const propId of propertyIds) {
      const propScores = scores.filter((s: any) => s.property_id === propId)
      const userIds = Array.from(new Set(propScores.map((s: any) => s.user_id)))
      const memberScores: number[] = []
      for (const userId of userIds) {
        const userScores = propScores.filter((s: any) => s.user_id === userId)
        if (userScores.length === 0) continue
        const total = userScores.reduce((sum: number, s: any) => {
          const crit = criteria.find((c: any) => c.id === s.criteria_id)
          return sum + (s.score * (crit?.weight || 0)) / 100
        }, 0)
        memberScores.push(total)
      }
      if (memberScores.length > 0) {
        familyScores[propId] = memberScores.reduce((a, b) => a + b, 0) / memberScores.length
      }
    }
  }

  const photosMap: Record<string, string> = {}
  if (photos) {
    for (const photo of photos as any[]) {
      if (!photosMap[photo.property_id]) {
        photosMap[photo.property_id] = photo.url
      }
    }
  }

  return (
    <DashboardClient
      initialProperties={(properties || []) as any}
      familyScores={familyScores}
      photosMap={photosMap}
    />
  )
}
