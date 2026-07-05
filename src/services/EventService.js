import { supabase } from '../lib/supabase'

const EventService = {
  async getAll() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or('status.eq.published,status.is.null')
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
      .or('status.eq.published,status.is.null')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getByCategory(category) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or('status.eq.published,status.is.null')
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
      .or('status.eq.published,status.is.null')
      .order('watchers', { ascending: false })
      .limit(4)
    if (error) throw error
    return data
  },

  async create(eventData) {
    const { data, error } = await supabase
      .from('events')
      .insert([{ ...eventData, status: eventData.status || 'published' }])
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
  },

  // Publish a draft event
  async publish(id) {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'published' })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async searchAdvanced({ query, category, location, dateFrom, dateTo, eventType }) {
    let q = supabase.from('events').select('*').or('status.eq.published,status.is.null')
    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
    if (category && category !== 'All') q = q.ilike('category', category)
    if (location) q = q.ilike('location', `%${location}%`)
    if (dateFrom) q = q.gte('date', dateFrom)
    if (dateTo) q = q.lte('date', dateTo)
    if (eventType && eventType !== 'all') q = q.eq('event_type', eventType)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getRecurringEvents(organizerId) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizerId)
      .eq('is_recurring', true)
      .order('date', { ascending: true })
    if (error) throw error
    return data
  },

  async getUpcoming(limit = 12) {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or('status.eq.published,status.is.null')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(limit)
    if (error) throw error
    return data
  },

  async getEventStats(organizerId) {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, watchers, demand')
      .eq('organizer_id', organizerId)
      .order('watchers', { ascending: false })
    if (error) throw error
    return data || []
  }
}

export default EventService
