import { supabase } from '../lib/supabase'

const UserService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async uploadAvatar(userId, file) {
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${ext}`

    // Upload (upsert to replace existing)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Add cache buster
    const url = `${publicUrl}?t=${Date.now()}`

    // Save to profile
    await UserService.updateProfile(userId, { avatar_url: url })
    return url
  }
}

export default UserService
