'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import Link from 'next/link'
import { Property, PropertyStatus, STATUS_LABELS } from '@/types'
import { createClient } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'

// Colonnes actives dans le kanban principal (sans "éliminé")
const ACTIVE_COLUMNS: PropertyStatus[] = [
  'a_visiter', 'visite_1', 'visite_2', 'visite_3',
  'offre_faite', 'compromis', 'acte',
]

const ALL_STATUSES: PropertyStatus[] = [...ACTIVE_COLUMNS, 'elimine']

const COLUMN_COLORS: Record<PropertyStatus, string> = {
  a_visiter: 'border-t-blue-400',
  visite_1: 'border-t-yellow-400',
  visite_2: 'border-t-yellow-500',
  visite_3: 'border-t-amber-500',
  offre_faite: 'border-t-orange-400',
  compromis: 'border-t-orange-500',
  acte: 'border-t-green-500',
  elimine: 'border-t-gray-400',
}

function PropertyCard({ property, familyScore, photoUrl }: {
  property: Property
  familyScore?: number
  photoUrl?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: property.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      {photoUrl && (
        <div className="h-28 rounded-t-xl overflow-hidden">
          <img src={photoUrl} alt={property.city || ''} className="w-full h-full object-cover" />
        </div>
      )}
      <Link href={`/biens/${property.id}`} onClick={e => e.stopPropagation()}>
        <div className="p-3 space-y-1">
          <p className="font-semibold text-stone-800 text-sm">
            {property.city || 'Ville inconnue'}
            {property.postal_code && <span className="text-stone-400 font-normal"> {property.postal_code}</span>}
          </p>
          {property.price && (
            <p className="text-orange-600 font-medium text-sm">{formatPrice(property.price)}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {property.surface && <span>{property.surface} m²</span>}
            {property.rooms && <span>· {property.rooms} pièces</span>}
          </div>
          {familyScore !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-stone-400">Score famille :</span>
              <span className="text-xs font-semibold text-orange-600">{familyScore.toFixed(1)}/5</span>
            </div>
          )}
          {property.distance_suresnes_km && (
            <p className="text-xs text-stone-400">
              {property.distance_suresnes_km} km
              {property.distance_suresnes_drive && ` · ${property.distance_suresnes_drive}`}
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}

function KanbanColumn({ status, properties, familyScores, photosMap }: {
  status: PropertyStatus
  properties: Property[]
  familyScores: Record<string, number>
  photosMap: Record<string, string>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className={`flex-shrink-0 w-60 bg-stone-50 rounded-2xl border-t-4 ${COLUMN_COLORS[status]} border border-stone-100 flex flex-col`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-stone-700 text-sm">{STATUS_LABELS[status]}</h3>
        <span className="text-xs bg-white text-stone-500 px-2 py-0.5 rounded-full border border-stone-200">
          {properties.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 min-h-24 rounded-b-2xl transition-colors ${isOver ? 'bg-orange-50' : ''}`}
      >
        <SortableContext items={properties.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {properties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              familyScore={familyScores[property.id]}
              photoUrl={photosMap[property.id]}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

function EliminatedSection({ properties, familyScores, photosMap, onRestore }: {
  properties: Property[]
  familyScores: Record<string, number>
  photosMap: Record<string, string>
  onRestore: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: 'elimine' })

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-3 px-5 py-3 rounded-2xl border w-full text-left transition-colors
          ${isOver ? 'bg-red-50 border-red-300' : 'bg-stone-100 border-stone-200 hover:bg-stone-200'}`}
        ref={setNodeRef}
      >
        <Trash2 className="w-4 h-4 text-stone-400 flex-shrink-0" />
        <span className="font-semibold text-stone-600">Biens éliminés</span>
        <span className="text-xs bg-white text-stone-500 px-2 py-0.5 rounded-full border border-stone-300 ml-1">
          {properties.length}
        </span>
        <span className="ml-auto text-stone-400">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        {isOver && (
          <span className="text-xs text-red-500 font-medium">Déposer ici pour éliminer</span>
        )}
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {properties.length === 0 ? (
            <p className="col-span-full text-stone-400 text-sm text-center py-6">
              Aucun bien éliminé pour l&apos;instant
            </p>
          ) : (
            properties.map(property => (
              <div key={property.id} className="bg-white rounded-xl border border-stone-100 shadow-sm opacity-70 hover:opacity-100 transition-opacity">
                {photosMap[property.id] && (
                  <div className="h-24 rounded-t-xl overflow-hidden">
                    <img src={photosMap[property.id]} alt="" className="w-full h-full object-cover grayscale" />
                  </div>
                )}
                <div className="p-3">
                  <Link href={`/biens/${property.id}`} className="font-semibold text-stone-700 text-sm hover:text-orange-600 transition-colors block">
                    {property.city || 'Ville inconnue'}
                    {property.postal_code && <span className="text-stone-400 font-normal"> {property.postal_code}</span>}
                  </Link>
                  {property.price && (
                    <p className="text-stone-500 text-sm">{formatPrice(property.price)}</p>
                  )}
                  {familyScores[property.id] !== undefined && (
                    <p className="text-xs text-stone-400 mt-1">
                      Score : <span className="font-medium">{familyScores[property.id].toFixed(1)}/5</span>
                    </p>
                  )}
                  <button
                    onClick={() => onRestore(property.id)}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    ↩ Remettre en liste
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function KanbanBoard({ initialProperties, familyScores, photosMap }: {
  initialProperties: Property[]
  familyScores: Record<string, number>
  photosMap: Record<string, string>
}) {
  const [properties, setProperties] = useState(initialProperties)
  const [activeId, setActiveId] = useState<string | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeProperty = activeId ? properties.find(p => p.id === activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const propertyId = active.id as string
    const newStatus = over.id as PropertyStatus

    if (!ALL_STATUSES.includes(newStatus)) return

    const property = properties.find(p => p.id === propertyId)
    if (!property || property.status === newStatus) return

    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, status: newStatus } : p)
    )

    await supabase
      .from('properties')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', propertyId)
  }

  async function handleRestore(propertyId: string) {
    setProperties(prev =>
      prev.map(p => p.id === propertyId ? { ...p, status: 'a_visiter' as PropertyStatus } : p)
    )
    await supabase
      .from('properties')
      .update({ status: 'a_visiter', updated_at: new Date().toISOString() })
      .eq('id', propertyId)
  }

  const activeProperties = properties.filter(p => p.status !== 'elimine')
  const eliminatedProperties = properties.filter(p => p.status === 'elimine')

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ACTIVE_COLUMNS.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            properties={activeProperties.filter(p => p.status === status)}
            familyScores={familyScores}
            photosMap={photosMap}
          />
        ))}
      </div>

      <EliminatedSection
        properties={eliminatedProperties}
        familyScores={familyScores}
        photosMap={photosMap}
        onRestore={handleRestore}
      />

      <DragOverlay>
        {activeProperty && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl p-3 w-60 opacity-95">
            <p className="font-semibold text-stone-800 text-sm">{activeProperty.city || 'Ville inconnue'}</p>
            {activeProperty.price && (
              <p className="text-orange-600 font-medium text-sm">{formatPrice(activeProperty.price)}</p>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
