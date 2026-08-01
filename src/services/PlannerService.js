import { supabase } from '../lib/supabase'

const PlannerService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('planner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async saveProfile({ userId, accountName, bankName, accountNumber, bvn, nin, disclaimerAccepted }) {
    const { data, error } = await supabase
      .from('planner_profiles')
      .upsert(
        {
          user_id: userId,
          account_name: accountName,
          bank_name: bankName,
          account_number: accountNumber,
          bvn,
          nin,
          disclaimer_accepted: disclaimerAccepted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },
}

export default PlannerService
