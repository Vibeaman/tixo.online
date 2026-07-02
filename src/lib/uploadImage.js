import { supabase } from './supabase'

export async function uploadEventImage(file) {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `events/${fileName}`

  const { data, error } = await supabase.storage
    .from('event-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
