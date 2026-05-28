import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your environment variables.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Auth functions
export const authService = {
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// Conversion tracking functions
export const conversionService = {
  async createConversion(userId, fileName, status = 'processing') {
    const { data, error } = await supabase
      .from('conversions')
      .insert([
        {
          user_id: userId,
          file_name: fileName,
          status,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateConversionStatus(conversionId, status, outputUrl = null) {
    const updateData = { status, updated_at: new Date().toISOString() }
    if (outputUrl) {
      updateData.output_url = outputUrl
    }

    const { data, error } = await supabase
      .from('conversions')
      .update(updateData)
      .eq('id', conversionId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserConversions(userId) {
    const { data, error } = await supabase
      .from('conversions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getConversionCount(userId) {
    const { count, error } = await supabase
      .from('conversions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (error) throw error
    return count || 0
  },

  async getTotalConversionsCount() {
    const { count, error } = await supabase
      .from('conversions')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count || 0
  },
}

// User profile functions
export const profileService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateMarketingConsent(userId, consent) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ marketing_consent: consent })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
}

// Marketing functions (for admin use with service role key)
export const marketingService = {
  async getMarketingList() {
    const { data, error } = await supabase
      .from('marketing_list')
      .select('*')
    
    if (error) throw error
    return data
  },

  async getMarketingStats() {
    const { data, error } = await supabase
      .rpc('get_marketing_stats')
    
    if (error) throw error
    return data
  },

  async getAllUserEmails() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, marketing_consent, email_verified, created_at')
      .eq('marketing_consent', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async exportEmailsAsCSV() {
    const users = await this.getAllUserEmails()
    
    // Create CSV content
    const headers = ['Email', 'Full Name', 'Email Verified', 'Created At', 'Total Conversions']
    const csvRows = [headers.join(',')]
    
    for (const user of users) {
      const row = [
        user.email,
        user.full_name || '',
        user.email_verified ? 'Yes' : 'No',
        new Date(user.created_at).toLocaleDateString(),
        user.total_conversions || 0
      ]
      csvRows.push(row.map(val => `"${val}"`).join(','))
    }
    
    return csvRows.join('\n')
  },
}

export default supabase
