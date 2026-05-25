'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { Property } from '@/types'
import KanbanBoard from './KanbanBoard'
import ListView from './ListView'

type ViewMode = 'kanban' | 'liste'

export default function DashboardClient({ initialProperties, familyScores, photosMap }: {
  initialProperties: Property[]
  familyScores: Record<string, number>
  photosMap: Record<string, string>
}) {
  const [view, setView] = useState<ViewMode>('kanban')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-stone-800">Tableau de bord</h1>
          <p className="text-stone-500 mt-1">{initialProperties.length} bien(s) suivi(s)</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle vue */}
          <div className="flex items-center bg-stone-100 rounded-xl p-1">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'kanban' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </button>
            <button
              onClick={() => setView('liste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'liste' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <List className="w-4 h-4" /> Liste
            </button>
          </div>

          <Link href="/biens/nouveau" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un bien
          </Link>
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard
          initialProperties={initialProperties}
          familyScores={familyScores}
          photosMap={photosMap}
        />
      ) : (
        <ListView
          properties={initialProperties}
          familyScores={familyScores}
          photosMap={photosMap}
        />
      )}
    </div>
  )
}
