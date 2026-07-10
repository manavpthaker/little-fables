import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listActualTables() {
  console.log('🔍 Finding actual tables in database...\n')

  // Let's try the Supabase API directly to get table info
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('API Response:', data)
    }
  } catch (e) {
    console.log('Direct API call failed')
  }

  // Let's check if we can access the built-in auth tables
  console.log('Checking auth.users...')
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) {
      console.log('Auth admin access:', error.message)
    } else {
      console.log('Auth users found:', data.users.length)
    }
  } catch (e) {
    console.log('Cannot access auth admin functions')
  }

  // Try the stories table in detail
  console.log('\nTrying stories table...')
  try {
    const { data, error, count } = await supabase
      .from('stories')
      .select('*', { count: 'exact' })
      .limit(0)

    if (error) {
      console.log('Stories error:', error)
    } else {
      console.log('Stories table exists, count:', count)
      
      // Try to insert a test record to see the structure
      const { data: insertData, error: insertError } = await supabase
        .from('stories')
        .insert({ title: 'Test Story' })
        .select()

      if (insertError) {
        console.log('Insert error (this shows required columns):', insertError.message)
      } else {
        console.log('Insert successful:', insertData)
        
        // Clean up
        if (insertData && insertData[0]) {
          await supabase.from('stories').delete().eq('id', insertData[0].id)
        }
      }
    }
  } catch (e) {
    console.log('Stories table error:', e)
  }

  // Try characters table
  console.log('\nTrying characters table...')
  try {
    const { data, error, count } = await supabase
      .from('characters')
      .select('*', { count: 'exact' })
      .limit(0)

    if (error) {
      console.log('Characters error:', error)
    } else {
      console.log('Characters table exists, count:', count)
    }
  } catch (e) {
    console.log('Characters table error:', e)
  }
}

listActualTables()