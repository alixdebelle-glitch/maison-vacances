import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const SURESNES_LAT = 48.8698
export const SURESNES_LNG = 2.2190

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

export async function getDrivingInfo(
  lat: number, lng: number
): Promise<{ km: number; duration: string } | null> {
  try {
    // OSRM public API — gratuit, pas de clé requise (lon,lat ordre inversé)
    const url = `https://router.project-osrm.org/route/v1/driving/${SURESNES_LNG},${SURESNES_LAT};${lng},${lat}?overview=false`
    const res = await fetch(url)
    const data = await res.json()
    if (data.code === 'Ok' && data.routes?.length > 0) {
      const route = data.routes[0]
      const km = Math.round(route.distance / 100) / 10
      const duration = formatDuration(route.duration)
      return { km, duration }
    }
  } catch {}
  return null
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { 'User-Agent': 'maison-vacances-app' } }
    )
    const data = await res.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch {}
  return null
}

export function getPropertyName(property: { nickname?: string | null; city?: string | null; postal_code?: string | null }): string {
  if (property.nickname?.trim()) return property.nickname.trim()
  if (property.city?.trim()) return property.city.trim()
  return 'Bien sans nom'
}

export function formatPrice(price: number | null | undefined): string {
  if (!price) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—'
  return score.toFixed(1)
}
