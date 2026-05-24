'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { geocodeAddress, getDrivingInfo } from '@/lib/utils'
import { Property, PropertyStatus, STATUS_LABELS } from '@/types'
import { MapPin, Euro, Home, Building2, FileText, Loader2 } from 'lucide-react'

interface PropertyFormProps {
  property?: Property
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    address: property?.address || '',
    city: property?.city || '',
    postal_code: property?.postal_code || '',
    latitude: property?.latitude?.toString() || '',
    longitude: property?.longitude?.toString() || '',
    distance_suresnes_km: property?.distance_suresnes_km?.toString() || '',
    distance_suresnes_drive: property?.distance_suresnes_drive || '',
    price: property?.price?.toString() || '',
    agency_fees: property?.agency_fees?.toString() || '',
    agency_fees_pct: property?.agency_fees_pct?.toString() || '',
    land_tax: property?.land_tax?.toString() || '',
    housing_tax: property?.housing_tax?.toString() || '',
    surface: property?.surface?.toString() || '',
    rooms: property?.rooms?.toString() || '',
    annonce_url: property?.annonce_url || '',
    agency_name: property?.agency_name || '',
    agency_contact: property?.agency_contact || '',
    agency_phone: property?.agency_phone || '',
    agency_email: property?.agency_email || '',
    description_libre: property?.description_libre || '',
    description_technique: property?.description_technique || '',
    description_travaux: property?.description_travaux || '',
    status: (property?.status || 'a_visiter') as PropertyStatus,
  })

  async function handleGeocode() {
    const fullAddress = [form.address, form.city, form.postal_code].filter(Boolean).join(', ')
    if (!fullAddress) return
    setGeocoding(true)
    const coords = await geocodeAddress(fullAddress)
    if (coords) {
      const driving = await getDrivingInfo(coords.lat, coords.lng)
      setForm(f => ({
        ...f,
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        distance_suresnes_km: driving ? driving.km.toString() : '',
        distance_suresnes_drive: driving ? driving.duration : '',
      }))
    }
    setGeocoding(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload: any = {
      address: form.address || null,
      city: form.city || null,
      postal_code: form.postal_code || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      distance_suresnes_km: form.distance_suresnes_km ? parseFloat(form.distance_suresnes_km) : null,
      distance_suresnes_drive: form.distance_suresnes_drive || null,
      price: form.price ? parseFloat(form.price) : null,
      agency_fees: form.agency_fees ? parseFloat(form.agency_fees) : null,
      agency_fees_pct: form.agency_fees_pct ? parseFloat(form.agency_fees_pct) : null,
      land_tax: form.land_tax ? parseFloat(form.land_tax) : null,
      housing_tax: form.housing_tax ? parseFloat(form.housing_tax) : null,
      surface: form.surface ? parseFloat(form.surface) : null,
      rooms: form.rooms ? parseInt(form.rooms) : null,
      annonce_url: form.annonce_url || null,
      agency_name: form.agency_name || null,
      agency_contact: form.agency_contact || null,
      agency_phone: form.agency_phone || null,
      agency_email: form.agency_email || null,
      description_libre: form.description_libre || null,
      description_technique: form.description_technique || null,
      description_travaux: form.description_travaux || null,
      status: form.status,
      updated_at: new Date().toISOString(),
    }

    let result
    if (property) {
      result = await supabase.from('properties').update(payload).eq('id', property.id).select().single()
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      payload.created_by = user?.id
      result = await supabase.from('properties').insert(payload).select().single()
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      router.push(`/biens/${result.data.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Statut */}
      <div className="card">
        <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-orange-500" /> Statut
        </h2>
        <Field label="Pipeline">
          <select
            className="input"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as PropertyStatus }))}
          >
            {(Object.entries(STATUS_LABELS) as [PropertyStatus, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Localisation */}
      <div className="card">
        <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" /> Localisation
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Adresse">
            <input type="text" className="input" placeholder="12 rue des Oliviers" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ville">
              <input type="text" className="input" placeholder="Uzès" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </Field>
            <Field label="Code postal">
              <input type="text" className="input" placeholder="30700" value={form.postal_code}
                onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} />
            </Field>
          </div>
          <button type="button" onClick={handleGeocode} disabled={geocoding}
            className="btn-secondary flex items-center gap-2 w-fit">
            {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {geocoding ? 'Géocodage...' : 'Géocoder l\'adresse'}
          </button>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Latitude">
              <input type="text" className="input" placeholder="43.92" value={form.latitude}
                onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} />
            </Field>
            <Field label="Longitude">
              <input type="text" className="input" placeholder="4.42" value={form.longitude}
                onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} />
            </Field>
            <Field label="Distance Suresnes (km, voiture)">
              <input type="text" className="input" placeholder="auto-calculé" value={form.distance_suresnes_km}
                onChange={e => setForm(f => ({ ...f, distance_suresnes_km: e.target.value }))} />
            </Field>
          </div>
          <Field label="Temps de trajet en voiture (ex: 2h15)">
            <input type="text" className="input" placeholder="auto-calculé" value={form.distance_suresnes_drive}
              onChange={e => setForm(f => ({ ...f, distance_suresnes_drive: e.target.value }))} />
          </Field>
        </div>
      </div>

      {/* Prix */}
      <div className="card">
        <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
          <Euro className="w-5 h-5 text-orange-500" /> Prix & Taxes
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prix de vente (€)">
            <input type="number" className="input" placeholder="350000" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </Field>
          <Field label="Honoraires agence (€)">
            <input type="number" className="input" placeholder="15000" value={form.agency_fees}
              onChange={e => setForm(f => ({ ...f, agency_fees: e.target.value }))} />
          </Field>
          <Field label="Honoraires agence (%)">
            <input type="number" className="input" placeholder="4.5" step="0.1" value={form.agency_fees_pct}
              onChange={e => setForm(f => ({ ...f, agency_fees_pct: e.target.value }))} />
          </Field>
          <Field label="Taxe foncière annuelle (€)">
            <input type="number" className="input" placeholder="1200" value={form.land_tax}
              onChange={e => setForm(f => ({ ...f, land_tax: e.target.value }))} />
          </Field>
          <Field label="Taxe d'habitation annuelle (€)">
            <input type="number" className="input" placeholder="800" value={form.housing_tax}
              onChange={e => setForm(f => ({ ...f, housing_tax: e.target.value }))} />
          </Field>
        </div>
      </div>

      {/* Caractéristiques */}
      <div className="card">
        <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-orange-500" /> Caractéristiques
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Surface (m²)">
            <input type="number" className="input" placeholder="120" value={form.surface}
              onChange={e => setForm(f => ({ ...f, surface: e.target.value }))} />
          </Field>
          <Field label="Pièces">
            <input type="number" className="input" placeholder="5" value={form.rooms}
              onChange={e => setForm(f => ({ ...f, rooms: e.target.value }))} />
          </Field>
          <Field label="URL annonce">
            <input type="url" className="input" placeholder="https://..." value={form.annonce_url}
              onChange={e => setForm(f => ({ ...f, annonce_url: e.target.value }))} />
          </Field>
        </div>
      </div>

      {/* Agence */}
      <div className="card">
        <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-orange-500" /> Agence
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nom de l'agence">
            <input type="text" className="input" placeholder="Immobilier Provence" value={form.agency_name}
              onChange={e => setForm(f => ({ ...f, agency_name: e.target.value }))} />
          </Field>
          <Field label="Contact">
            <input type="text" className="input" placeholder="Jean Martin" value={form.agency_contact}
              onChange={e => setForm(f => ({ ...f, agency_contact: e.target.value }))} />
          </Field>
          <Field label="Téléphone">
            <input type="tel" className="input" placeholder="04 66 00 00 00" value={form.agency_phone}
              onChange={e => setForm(f => ({ ...f, agency_phone: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input type="email" className="input" placeholder="contact@agence.fr" value={form.agency_email}
              onChange={e => setForm(f => ({ ...f, agency_email: e.target.value }))} />
          </Field>
        </div>
      </div>

      {/* Descriptions */}
      <div className="card">
        <h2 className="text-lg font-serif text-stone-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" /> Descriptions
        </h2>
        <div className="space-y-4">
          <Field label="Description libre">
            <textarea className="input min-h-24 resize-y" placeholder="Impressions générales, coup de cœur, ressentis..." value={form.description_libre}
              onChange={e => setForm(f => ({ ...f, description_libre: e.target.value }))} />
          </Field>
          <Field label="Description technique">
            <textarea className="input min-h-24 resize-y" placeholder="Matériaux, installation, chauffage, isolation..." value={form.description_technique}
              onChange={e => setForm(f => ({ ...f, description_technique: e.target.value }))} />
          </Field>
          <Field label="Travaux à prévoir">
            <textarea className="input min-h-24 resize-y" placeholder="Liste des travaux identifiés, estimation du coût..." value={form.description_travaux}
              onChange={e => setForm(f => ({ ...f, description_travaux: e.target.value }))} />
          </Field>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="flex gap-4">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {property ? 'Enregistrer les modifications' : 'Créer le bien'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  )
}
