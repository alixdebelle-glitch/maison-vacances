'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { PropertyFile } from '@/types'
import { Paperclip, Trash2, Download, Loader2, FileText, FileImage, File } from 'lucide-react'

function FileIcon({ type }: { type: string | null }) {
  if (!type) return <File className="w-5 h-5 text-stone-400" />
  if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-400" />
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-400" />
  return <File className="w-5 h-5 text-stone-400" />
}

export default function PropertyFiles({ propertyId, initialFiles }: {
  propertyId: string
  initialFiles: PropertyFile[]
}) {
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return
    setUploading(true)

    for (const file of Array.from(selectedFiles)) {
      const filename = `${propertyId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('property-files').upload(filename, file)
      if (error) continue

      const { data: { publicUrl } } = supabase.storage.from('property-files').getPublicUrl(filename)
      const { data: fileRecord } = await supabase.from('property_files').insert({
        property_id: propertyId,
        url: publicUrl,
        filename: file.name,
        file_type: file.type,
      }).select().single()

      if (fileRecord) setFiles(prev => [...prev, fileRecord as PropertyFile])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(file: PropertyFile) {
    const path = file.url.split('/property-files/')[1]
    await supabase.storage.from('property-files').remove([path])
    await supabase.from('property_files').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif text-stone-700">Fichiers attachés</h2>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          Ajouter un fichier
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
      </div>

      {files.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-6">Aucun fichier attaché</p>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
              <FileIcon type={file.file_type} />
              <span className="flex-1 text-sm text-stone-700 truncate">{file.filename}</span>
              <a href={file.url} download className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors">
                <Download className="w-4 h-4" />
              </a>
              <button onClick={() => handleDelete(file)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
