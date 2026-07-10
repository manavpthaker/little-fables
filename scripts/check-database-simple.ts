import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Connecting to Supabase:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDatabase() {
  console.log('\nChecking Supabase database...\n')

  // Try to list some common tables that might exist
  const commonTables = [
    'profiles',
    'users',
    'stories',
    'story',
    'characters',
    'assets',
    'templates',
    'organizations',
    'auth.users'
  ]

  console.log('Checking for common tables:')
  
  for (const tableName of commonTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (!error) {
        console.log(`✓ ${tableName} exists`)
        
        // Get a sample record to see the structure
        const { data: sample } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
          
        if (sample && sample.length > 0) {
          console.log(`  Columns: ${Object.keys(sample[0]).join(', ')}`)
        }
      } else if (error.code === '42P01') {
        // Table doesn't exist
        console.log(`✗ ${tableName} does not exist`)
      } else {
        // Other error (like permissions)
        console.log(`? ${tableName} - ${error.message}`)
      }
    } catch (e) {
      console.log(`✗ ${tableName} - error checking`)
    }
  }

  // Check auth status
  console.log('\nChecking auth configuration:')
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError) {
    console.log('Auth check: Not authenticated')
  } else if (user) {
    console.log(`Auth check: Authenticated as ${user.email}`)
  } else {
    console.log('Auth check: Anonymous access enabled')
  }
}

checkDatabase()