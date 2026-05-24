'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Criteria, Score } from '@/types'
import { Star } from 'lucide-react'

interface MemberScore {
  userId: string
  name: string
  total: number
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hover || value) ? 'fill-orange-400 text-orange-400' : 'text-stone-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function PropertyScoring({ propertyId, currentUserId, initialScores, criteria, memberScores, profiles: _profiles }: {
  propertyId: string
  currentUserId: string
  initialScores: Score[]
  criteria: Criteria[]
  memberScores: MemberScore[]
  profiles: any[]
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(
      initialScores
        .filter(s => s.user_id === currentUserId)
        .map(s => [s.criteria_id, s.score])
    )
  )
  const supabase = createClient()

  const myTotal = criteria.reduce((sum, c) => {
    return sum + ((scores[c.id] || 0) * c.weight) / 100
  }, 0)

  const familyAvg = memberScores.length > 0
    ? memberScores.reduce((sum, m) => sum + m.total, 0) / memberScores.length
    : null

  async function handleScore(criteriaId: string, score: number) {
    setScores(prev => ({ ...prev, [criteriaId]: score }))

    await supabase.from('scores').upsert({
      property_id: propertyId,
      user_id: currentUserId,
      criteria_id: criteriaId,
      score,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'property_id,user_id,criteria_id' })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-serif text-stone-700">Scoring</h2>
        <div className="flex items-center gap-4">
          {Object.keys(scores).length > 0 && (
            <div className="text-sm">
              <span className="text-stone-400">Mon score : </span>
              <span className="font-semibold text-orange-600">{myTotal.toFixed(1)}/5</span>
            </div>
          )}
          {familyAvg !== null && (
            <div className="text-sm bg-orange-50 px-3 py-1 rounded-full">
              <span className="text-stone-400">Famille : </span>
              <span className="font-semibold text-orange-600">{familyAvg.toFixed(1)}/5</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {criteria.map(crit => (
          <div key={crit.id} className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-stone-700">{crit.name}</span>
                <span className="text-xs text-stone-400">{crit.weight}%</span>
              </div>
              <StarRating value={scores[crit.id] || 0} onChange={v => handleScore(crit.id, v)} />
            </div>
          </div>
        ))}
      </div>

      {memberScores.length > 0 && (
        <div className="mt-6 pt-6 border-t border-stone-100">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Scores de la famille</h3>
          <div className="space-y-2">
            {memberScores.map(m => (
              <div key={m.userId} className="flex items-center justify-between">
                <span className="text-sm text-stone-700">{m.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${(m.total / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-stone-700 w-8 text-right">{m.total.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
