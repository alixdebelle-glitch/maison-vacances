'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Agency, AgencyContact } from '@/types'
import { Plus, Pencil, Trash2, Check, X, Phone, Smartphone, Mail, Globe, ChevronDown, ChevronRight, Building2 } from 'lucide-react'

function AgencyForm({ initial, onSave, onCancel }: {
  initial?: Partial<Agency>
  onSave: (data: Partial<Agency>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [website, setWebsite] = useState(initial?.website || '')
  const [address, setAddress] = useState(initial?.address || '')
  const [notes, setNotes] = useState(initial?.notes || '')

  return (
    <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nom de l&apos;agence *</label>
          <input className="input" placeholder="Immovar Uzès" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Téléphone fixe agence</label>
          <input className="input" placeholder="04 66 00 00 00" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Site web</label>
          <input className="input" placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
        <div>
          <label className="label">Adresse</label>
          <input className="input" placeholder="12 rue de la Paix, Uzès" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} placeholder="Notes libres sur cette agence…" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ name, phone: phone || null, website: website || null, address: address || null, notes: notes || null })}
          disabled={!name.trim()} className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50">
          <Check className="w-4 h-4" /> Enregistrer
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm flex items-center gap-1.5">
          <X className="w-4 h-4" /> Annuler
        </button>
      </div>
    </div>
  )
}

function ContactForm({ agencyId, initial, onSave, onCancel }: {
  agencyId: string
  initial?: Partial<AgencyContact>
  onSave: (data: Partial<AgencyContact>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [role, setRole] = useState(initial?.role || '')
  const [phoneMobile, setPhoneMobile] = useState(initial?.phone_mobile || '')
  const [email, setEmail] = useState(initial?.email || '')

  return (
    <div className="space-y-3 p-3 bg-white rounded-xl border border-stone-200 ml-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nom du contact *</label>
          <input className="input" placeholder="Jean Martin" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Rôle / Fonction</label>
          <input className="input" placeholder="Négociateur, Directrice…" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div>
          <label className="label">Mobile</label>
          <input className="input" placeholder="06 12 34 56 78" value={phoneMobile} onChange={e => setPhoneMobile(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" placeholder="jean@agence.fr" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ agency_id: agencyId, name, role: role || null, phone_mobile: phoneMobile || null, email: email || null })}
          disabled={!name.trim()} className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50">
          <Check className="w-4 h-4" /> Enregistrer
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm flex items-center gap-1.5">
          <X className="w-4 h-4" /> Annuler
        </button>
      </div>
    </div>
  )
}

export default function AgencesClient({ initialAgencies, initialContacts }: {
  initialAgencies: Agency[]
  initialContacts: AgencyContact[]
}) {
  const [agencies, setAgencies] = useState(initialAgencies)
  const [contacts, setContacts] = useState(initialContacts)
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set(initialAgencies.map(a => a.id)))
  const [editingAgency, setEditingAgency] = useState<string | null>(null)
  const [addingAgency, setAddingAgency] = useState(false)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [addingContactFor, setAddingContactFor] = useState<string | null>(null)
  const supabase = createClient()

  function toggleExpand(id: string) {
    setExpandedAgencies(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function saveAgency(data: Partial<Agency>, id?: string) {
    if (id) {
      const { data: updated } = await supabase.from('agencies').update(data).eq('id', id).select().single()
      if (updated) setAgencies(prev => prev.map(a => a.id === id ? updated as Agency : a))
      setEditingAgency(null)
    } else {
      const { data: created } = await supabase.from('agencies').insert(data).select().single()
      if (created) {
        setAgencies(prev => [...prev, created as Agency])
        setExpandedAgencies(prev => new Set(Array.from(prev).concat((created as Agency).id)))
      }
      setAddingAgency(false)
    }
  }

  async function deleteAgency(id: string) {
    if (!confirm('Supprimer cette agence et tous ses contacts ?')) return
    await supabase.from('agencies').delete().eq('id', id)
    setAgencies(prev => prev.filter(a => a.id !== id))
    setContacts(prev => prev.filter(c => c.agency_id !== id))
  }

  async function saveContact(data: Partial<AgencyContact>, id?: string) {
    if (id) {
      const { data: updated } = await supabase.from('agency_contacts').update(data).eq('id', id).select().single()
      if (updated) setContacts(prev => prev.map(c => c.id === id ? updated as AgencyContact : c))
      setEditingContact(null)
    } else {
      const { data: created } = await supabase.from('agency_contacts').insert(data).select().single()
      if (created) setContacts(prev => [...prev, created as AgencyContact])
      setAddingContactFor(null)
    }
  }

  async function deleteContact(id: string) {
    if (!confirm('Supprimer ce contact ?')) return
    await supabase.from('agency_contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-4">
      {agencies.map(agency => {
        const agencyContacts = contacts.filter(c => c.agency_id === agency.id)
        const isExpanded = expandedAgencies.has(agency.id)

        return (
          <div key={agency.id} className="card p-0 overflow-hidden">
            {editingAgency === agency.id ? (
              <div className="p-4">
                <AgencyForm initial={agency} onSave={data => saveAgency(data, agency.id)} onCancel={() => setEditingAgency(null)} />
              </div>
            ) : (
              <>
                {/* En-tête agence */}
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50 transition-colors"
                  onClick={() => toggleExpand(agency.id)}>
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800">{agency.name}</p>
                    <div className="flex items-center gap-3 text-xs text-stone-400 mt-0.5 flex-wrap">
                      {agency.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agency.phone}</span>}
                      {agency.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{agency.website}</span>}
                      <span>{agencyContacts.length} contact{agencyContacts.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); setEditingAgency(agency.id) }}
                      className="p-2 text-stone-400 hover:text-stone-700 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteAgency(agency.id) }}
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                {/* Contacts */}
                {isExpanded && (
                  <div className="border-t border-stone-100 px-5 py-3 space-y-2 bg-stone-50">
                    {agencyContacts.map(contact => (
                      <div key={contact.id}>
                        {editingContact === contact.id ? (
                          <ContactForm agencyId={agency.id} initial={contact}
                            onSave={data => saveContact(data, contact.id)} onCancel={() => setEditingContact(null)} />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100">
                            <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-stone-600">
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-stone-800 text-sm">
                                {contact.name}
                                {contact.role && <span className="text-stone-400 font-normal ml-1.5 text-xs">· {contact.role}</span>}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-stone-400 mt-0.5 flex-wrap">
                                {contact.phone_mobile && (
                                  <a href={`tel:${contact.phone_mobile}`} onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-1 hover:text-orange-600 transition-colors">
                                    <Smartphone className="w-3 h-3" />{contact.phone_mobile}
                                  </a>
                                )}
                                {contact.email && (
                                  <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-1 hover:text-orange-600 transition-colors">
                                    <Mail className="w-3 h-3" />{contact.email}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => setEditingContact(contact.id)}
                                className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteContact(contact.id)}
                                className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {addingContactFor === agency.id ? (
                      <ContactForm agencyId={agency.id}
                        onSave={data => saveContact(data)} onCancel={() => setAddingContactFor(null)} />
                    ) : (
                      <button onClick={() => setAddingContactFor(agency.id)}
                        className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium py-1 transition-colors">
                        <Plus className="w-4 h-4" /> Ajouter un contact
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      {/* Nouvelle agence */}
      {addingAgency ? (
        <div className="card">
          <AgencyForm onSave={data => saveAgency(data)} onCancel={() => setAddingAgency(false)} />
        </div>
      ) : (
        <button onClick={() => setAddingAgency(true)}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle agence
        </button>
      )}
    </div>
  )
}
