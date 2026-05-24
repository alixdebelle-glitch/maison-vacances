'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Criteria } from '@/types'
import { Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function CriteresClient({ initialCriteria }: { initialCriteria: Criteria[] }) {
  const [criteria, setCriteria] = useState(initialCriteria)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
  const isValid = Math.round(totalWeight) === 100

  function updateCriteria(id: string, field: keyof Criteria, value: string | number) {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  function addCriteria() {
    const tempId = `temp-${Date.now()}`
    setCriteria(prev => [...prev, {
      id: tempId,
      name: '',
      weight: 0,
      position: prev.length,
      created_at: new Date().toISOString(),
    }])
  }

  function removeCriteria(id: string) {
    setCriteria(prev => prev.filter(c => c.id !== id))
  }

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    setMessage(null)

    const existing = criteria.filter(c => !c.id.startsWith('temp-'))
    const newOnes = criteria.filter(c => c.id.startsWith('temp-'))

    const errors: any[] = []

    for (const c of existing) {
      const { error } = await supabase.from('criteria').update({
        name: c.name,
        weight: c.weight,
        position: c.position,
      }).eq('id', c.id)
      if (error) errors.push(error)
    }

    for (const c of newOnes) {
      if (!c.name.trim()) continue
      const { data, error } = await supabase.from('criteria').insert({
        name: c.name,
        weight: c.weight,
        position: c.position,
      }).select().single()
      if (error) errors.push(error)
      else if (data) {
        setCriteria(prev => prev.map(cr => cr.id === c.id ? data as Criteria : cr))
      }
    }

    // Delete removed criteria
    const currentIds = existing.map(c => c.id)
    const initialIds = initialCriteria.map(c => c.id)
    const toDelete = initialIds.filter(id => !currentIds.includes(id))
    for (const id of toDelete) {
      await supabase.from('criteria').delete().eq('id', id)
    }

    if (errors.length > 0) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } else {
      setMessage({ type: 'success', text: 'Critères enregistrés avec succès' })
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="space-y-3">
          {criteria.map((crit, index) => (
            <div key={crit.id} className="flex items-center gap-3">
              <span className="text-xs text-stone-400 w-5 text-right">{index + 1}</span>
              <input
                type="text"
                className="input flex-1"
                placeholder="Nom du critère"
                value={crit.name}
                onChange={e => updateCriteria(crit.id, 'name', e.target.value)}
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  className="input w-20 text-center"
                  min="0"
                  max="100"
                  value={crit.weight}
                  onChange={e => updateCriteria(crit.id, 'weight', parseFloat(e.target.value) || 0)}
                />
                <span className="text-stone-400 text-sm">%</span>
              </div>
              <button
                onClick={() => removeCriteria(crit.id)}
                className="p-2 text-stone-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addCriteria}
          className="mt-4 btn-ghost flex items-center gap-2 text-sm text-stone-500"
        >
          <Plus className="w-4 h-4" /> Ajouter un critère
        </button>
      </div>

      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
        isValid ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
      }`}>
        {isValid
          ? <><CheckCircle className="w-4 h-4" /> Total : 100% — Correct !</>
          : <><AlertCircle className="w-4 h-4" /> Total : {totalWeight}% — Doit être égal à 100%</>
        }
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !isValid}
        className="btn-primary flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        Enregistrer les critères
      </button>
    </div>
  )
}
