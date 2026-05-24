'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Note, NoteCategory, NOTE_CATEGORIES } from '@/types'
import { Plus, Trash2, Save, Loader2, X } from 'lucide-react'

const CATEGORY_OPTIONS = Object.entries(NOTE_CATEGORIES) as [NoteCategory, typeof NOTE_CATEGORIES[NoteCategory]][]

function NoteCard({ note, profile, onEdit, onDelete }: {
  note: Note
  profile?: any
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}) {
  const cat = NOTE_CATEGORIES[note.category]
  return (
    <div
      className="card cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onEdit(note)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(note.id) }}
          className="p-1 text-stone-300 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <h3 className="font-serif font-semibold text-stone-800 mb-1">{note.title}</h3>
      {note.content && (
        <p className="text-stone-500 text-sm line-clamp-2 whitespace-pre-wrap">{note.content}</p>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
        <span>{profile?.first_name || 'Membre'}</span>
        <span>·</span>
        <span>{new Date(note.updated_at).toLocaleDateString('fr-FR')}</span>
      </div>
    </div>
  )
}

function NoteEditor({ note, currentUserId, onSave, onClose }: {
  note: Partial<Note> | null
  currentUserId: string
  onSave: (note: Note) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [category, setCategory] = useState<NoteCategory>(note?.category || 'memo')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)

    const payload = {
      title: title.trim(),
      content: content || null,
      category,
      updated_at: new Date().toISOString(),
    }

    let result
    if (note?.id) {
      result = await supabase.from('notes').update(payload).eq('id', note.id).select().single()
    } else {
      result = await supabase.from('notes').insert({ ...payload, created_by: currentUserId }).select().single()
    }

    if (result.data) onSave(result.data as Note)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-lg font-serif text-stone-800">{note?.id ? 'Modifier la note' : 'Nouvelle note'}</h2>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(([value, cat]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                    category === value ? cat.color + ' border-current' : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Titre</label>
            <input
              type="text"
              className="input"
              placeholder="Titre de la note"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Contenu</label>
            <textarea
              className="input min-h-48 resize-y"
              placeholder="Contenu de la note..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={handleSave} disabled={saving || !title.trim()} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
          <button onClick={onClose} className="btn-secondary">Annuler</button>
        </div>
      </div>
    </div>
  )
}

export default function NotesClient({ initialNotes, profiles, currentUserId }: {
  initialNotes: Note[]
  profiles: any[]
  currentUserId: string
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [filter, setFilter] = useState<NoteCategory | 'all'>('all')
  const [editing, setEditing] = useState<Partial<Note> | null>(null)
  const supabase = createClient()

  const filtered = filter === 'all' ? notes : notes.filter(n => n.category === filter)

  function handleEdit(note: Note) {
    setEditing(note)
  }

  function handleNew() {
    setEditing({})
  }

  function handleSave(saved: Note) {
    setNotes(prev => {
      const exists = prev.find(n => n.id === saved.id)
      if (exists) return prev.map(n => n.id === saved.id ? saved : n)
      return [saved, ...prev]
    })
    setEditing(null)
  }

  async function handleDelete(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-stone-800">Notes & Mémos</h1>
          <p className="text-stone-500 mt-1">Espace collaboratif famille</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle note
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`text-sm px-4 py-2 rounded-full border transition-all ${
            filter === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-500 hover:border-stone-300'
          }`}
        >
          Toutes
        </button>
        {CATEGORY_OPTIONS.map(([value, cat]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`text-sm px-4 py-2 rounded-full border transition-all ${
              filter === value ? cat.color + ' border-current' : 'border-stone-200 text-stone-500 hover:border-stone-300'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg mb-2">Aucune note</p>
          <p className="text-sm">Créez votre première note pour partager des informations avec la famille</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              profile={profiles.find(p => p.id === note.created_by)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <NoteEditor
          note={editing}
          currentUserId={currentUserId}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
