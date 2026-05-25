export type PropertyStatus =
  | 'a_visiter'
  | 'visite_1'
  | 'visite_2'
  | 'visite_3'
  | 'offre_faite'
  | 'compromis'
  | 'acte'
  | 'elimine'

export type NoteCategory =
  | 'memo'
  | 'criteres_recherche'
  | 'template_agence'
  | 'budget'
  | 'autre'

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  created_at: string
}

export interface Criteria {
  id: string
  name: string
  weight: number
  position: number
  created_at: string
}

export interface Property {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  distance_suresnes_km: number | null
  distance_suresnes_drive: string | null
  price: number | null
  agency_fees: number | null
  agency_fees_pct: number | null
  land_tax: number | null
  housing_tax: number | null
  nickname: string | null
  surface: number | null
  rooms: number | null
  annonce_url: string | null
  agency_name: string | null
  agency_contact: string | null
  agency_phone: string | null
  agency_email: string | null
  description_libre: string | null
  description_technique: string | null
  description_travaux: string | null
  status: PropertyStatus
}

export interface PropertyPhoto {
  id: string
  property_id: string
  url: string
  filename: string | null
  position: number
  created_at: string
}

export interface PropertyFile {
  id: string
  property_id: string
  url: string
  filename: string
  file_type: string | null
  created_at: string
}

export interface Score {
  id: string
  property_id: string
  user_id: string
  criteria_id: string
  score: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  title: string
  content: string | null
  category: NoteCategory
}

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  a_visiter: 'À visiter',
  visite_1: 'Visite 1',
  visite_2: 'Visite 2',
  visite_3: 'Visite 3',
  offre_faite: 'Offre faite',
  compromis: 'Compromis',
  acte: 'Acte notarié',
  elimine: 'Éliminé',
}

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  a_visiter: 'bg-blue-100 text-blue-800 border-blue-200',
  visite_1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  visite_2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  visite_3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  offre_faite: 'bg-orange-100 text-orange-800 border-orange-200',
  compromis: 'bg-orange-100 text-orange-800 border-orange-200',
  acte: 'bg-green-100 text-green-800 border-green-200',
  elimine: 'bg-gray-100 text-gray-600 border-gray-200',
}

export const NOTE_CATEGORIES: Record<NoteCategory, { label: string; color: string; emoji: string }> = {
  memo: { label: 'Mémo général', color: 'bg-gray-100 text-gray-700', emoji: '📝' },
  criteres_recherche: { label: 'Critères de recherche', color: 'bg-blue-100 text-blue-700', emoji: '🔍' },
  template_agence: { label: 'Template agence', color: 'bg-terracotta-100 text-terracotta-700', emoji: '📨' },
  budget: { label: 'Budget', color: 'bg-green-100 text-green-700', emoji: '💰' },
  autre: { label: 'Autre', color: 'bg-yellow-100 text-yellow-700', emoji: '📌' },
}
