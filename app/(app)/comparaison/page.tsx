import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Criteria, Profile } from '@/types'

export default async function ComparaisonPage() {
  const supabase = createClient()

  const [{ data: properties }, { data: scores }, { data: criteria }, { data: profiles }] = await Promise.all([
    supabase.from('properties').select('*').in('status', ['visite_1', 'visite_2', 'visite_3']),
    supabase.from('scores').select('*'),
    supabase.from('criteria').select('*').order('position'),
    supabase.from('profiles').select('*'),
  ])

  if (!properties || properties.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-serif text-stone-800 mb-4">Comparaison</h1>
        <div className="card text-center py-16 text-stone-400">
          <p>Aucun bien visité pour le moment.</p>
          <p className="text-sm mt-1">Les biens avec le statut Visite 1, 2 ou 3 apparaîtront ici.</p>
        </div>
      </div>
    )
  }

  // Calculate scores
  const memberIds = Array.from(new Set((scores || []).map((s: any) => s.user_id)))

  const memberScoresByProperty: Record<string, Record<string, number>> = {}
  for (const property of properties) {
    memberScoresByProperty[property.id] = {}
    for (const userId of memberIds) {
      const userScores = (scores || []).filter((s: any) => s.property_id === property.id && s.user_id === userId)
      if (userScores.length === 0) continue
      const total = userScores.reduce((sum: number, s: any) => {
        const crit = (criteria || []).find((c: any) => c.id === s.criteria_id)
        return sum + (s.score * (crit?.weight || 0)) / 100
      }, 0)
      memberScoresByProperty[property.id][userId] = total
    }
  }

  const familyScores: Record<string, number> = {}
  for (const property of properties) {
    const memberTotals = Object.values(memberScoresByProperty[property.id] || {})
    if (memberTotals.length > 0) {
      familyScores[property.id] = memberTotals.reduce((a, b) => a + b, 0) / memberTotals.length
    }
  }

  const sortedProperties = [...properties].sort((a, b) =>
    (familyScores[b.id] || 0) - (familyScores[a.id] || 0)
  )

  const criteriaScoresByProperty: Record<string, Record<string, number>> = {}
  for (const property of properties) {
    criteriaScoresByProperty[property.id] = {}
    for (const crit of (criteria || [])) {
      const critScores = (scores || []).filter((s: any) => s.property_id === property.id && s.criteria_id === crit.id)
      if (critScores.length > 0) {
        criteriaScoresByProperty[property.id][crit.id] = critScores.reduce((sum: number, s: any) => sum + s.score, 0) / critScores.length
      }
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-serif text-stone-800 mb-6">Comparaison</h1>
      <p className="text-stone-500 mb-6">{sortedProperties.length} bien(s) visité(s) — classés par score famille décroissant</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-stone-200">
              <th className="text-left py-3 px-4 text-stone-500 font-medium min-w-36 sticky left-0 bg-stone-50">Critère</th>
              {sortedProperties.map((p, i) => (
                <th key={p.id} className="text-center py-3 px-4 min-w-36">
                  <div className="flex flex-col items-center gap-1">
                    {i === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🏆 N°1</span>}
                    <Link href={`/biens/${p.id}`} className="font-serif font-semibold text-stone-800 hover:text-orange-600 transition-colors">
                      {p.city || 'Ville ?'}
                    </Link>
                    {p.price && <span className="text-xs text-orange-600 font-medium">{formatPrice(p.price)}</span>}
                    {p.surface && <span className="text-xs text-stone-400">{p.surface} m²</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(criteria || []).map((crit: Criteria) => (
              <tr key={crit.id} className="border-b border-stone-100 hover:bg-stone-50">
                <td className="py-3 px-4 text-stone-700 sticky left-0 bg-white hover:bg-stone-50">
                  {crit.name}
                  <span className="text-xs text-stone-400 ml-1">({crit.weight}%)</span>
                </td>
                {sortedProperties.map(p => {
                  const avg = criteriaScoresByProperty[p.id]?.[crit.id]
                  return (
                    <td key={p.id} className="py-3 px-4 text-center">
                      {avg !== undefined ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium text-stone-800">{avg.toFixed(1)}</span>
                          <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Scores par membre */}
            {memberIds.map(userId => {
              const profile = (profiles || []).find((p: Profile) => p.id === userId)
              return (
                <tr key={userId} className="border-b border-stone-200 bg-stone-50">
                  <td className="py-3 px-4 font-semibold text-stone-700 sticky left-0 bg-stone-50">
                    {profile?.first_name || 'Membre'}
                  </td>
                  {sortedProperties.map(p => {
                    const score = memberScoresByProperty[p.id]?.[userId]
                    return (
                      <td key={p.id} className="py-3 px-4 text-center">
                        {score !== undefined ? (
                          <span className="font-semibold text-stone-700">{score.toFixed(1)}</span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {/* Moyenne famille */}
            <tr className="border-t-2 border-stone-300 bg-orange-50">
              <td className="py-4 px-4 font-bold text-stone-800 sticky left-0 bg-orange-50">Score famille</td>
              {sortedProperties.map((p, i) => (
                <td key={p.id} className="py-4 px-4 text-center">
                  {familyScores[p.id] !== undefined ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xl font-bold ${i === 0 ? 'text-orange-600' : 'text-stone-700'}`}>
                        {familyScores[p.id].toFixed(1)}
                      </span>
                      <span className="text-xs text-stone-400">/5</span>
                    </div>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
