import { supabase } from '../lib/supabase'

const EventService = {
  async getAll() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error

    // Fetch organizer avatar
    if (data?.organizer_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', data.organizer_id)
        .single()
      if (profile?.avatar_url) {
        data.organizer_avatar = profile.avatar_url
      }
    }

    return data
  },

  async search(query) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getByCategory(category) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .ilike('category', category)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getFeatured() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_featured', true)
      .order('watchers', { ascending: false })
      .limit(4)
    if (error) throw error
    return data
  },

  async create(eventData) {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getByOrganizer(userId) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
}

export default EventService
