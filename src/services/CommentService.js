import { supabase } from '../lib/supabase'

const CommentService = {
  async getByEvent(eventId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async add({ eventId, userId, userName, userAvatar, content }) {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        event_id: eventId,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar,
        content
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(commentId) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
    if (error) throw error
  }
}

export default CommentService
