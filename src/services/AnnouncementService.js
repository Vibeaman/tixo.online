import { supabase } from '../lib/supabase'

const AnnouncementService = {
  // Public: the single most recent active announcement in its scheduling window.
  async getActive() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  },

  // Admin: full list, newest first.
  async getAll() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create({ message, level, linkUrl, linkLabel, startsAt, endsAt, createdBy }) {
    const { error } = await supabase.from('announcements').insert({
      message,
      level: level || 'info',
      link_url: linkUrl || null,
      link_label: linkLabel || null,
      starts_at: startsAt || new Date().toISOString(),
      ends_at: endsAt || null,
      created_by: createdBy || null,
    })
    if (error) throw error
  },

  async update(id, fields) {
    const patch = { updated_at: new Date().toISOString() }
    if ('message' in fields) patch.message = fields.message
    if ('level' in fields) patch.level = fields.level
    if ('linkUrl' in fields) patch.link_url = fields.linkUrl || null
    if ('linkLabel' in fields) patch.link_label = fields.linkLabel || null
    if ('isActive' in fields) patch.is_active = fields.isActive
    if ('startsAt' in fields) patch.starts_at = fields.startsAt
    if ('endsAt' in fields) patch.ends_at = fields.endsAt || null
    const { error } = await supabase.from('announcements').update(patch).eq('id', id)
    if (error) throw error
  },

  async remove(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw error
  },
}

export default AnnouncementService
