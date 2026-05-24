'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { PropertyPhoto } from '@/types'
import { ImagePlus, Trash2, Loader2 } from 'lucide-react'

export default function PropertyPhotos({ propertyId, initialPhotos }: {
  propertyId: string
  initialPhotos: PropertyPhoto[]
}) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const filename = `${propertyId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('property-photos').upload(filename, file)
      if (error) continue

      const { data: { publicUrl } } = supabase.storage.from('property-photos').getPublicUrl(filename)
      const { data: photo } = await supabase.from('property_photos').insert({
        property_id: propertyId,
        url: publicUrl,
        filename: file.name,
        position: photos.length,
      }).select().single()

      if (photo) setPhotos(prev => [...prev, photo as PropertyPhoto])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(photo: PropertyPhoto) {
    const path = photo.url.split('/property-photos/')[1]
    await supabase.storage.from('property-photos').remove([path])
    await supabase.from('property_photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif text-stone-700">Photos</h2>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          Ajouter des photos
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      </div>

      {photos.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-8">Aucune photo pour ce bien</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-video">
              <img src={photo.url} alt={photo.filename || ''} className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(photo)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
