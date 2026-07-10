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
  console.log('Checking Supabase database schema...\n')

  try {
    // Get all tables using direct SQL query
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables', {})

    if (tablesError) {
      console.error('Error fetching tables:', tablesError)
      return
    }

    console.log('Existing tables:')
    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
    } else {
      console.log('  No tables found in public schema')
    }

    // For each table, get columns
    if (tables && tables.length > 0) {
      console.log('\nTable schemas:')
      
      for (const table of tables) {
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position')

        if (!columnsError && columns) {
          console.log(`\n${table.table_name}:`)
          columns.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'nullable' : 'required'
            const defaultVal = col.column_default ? ` (default: ${col.column_default})` : ''
            console.log(`  - ${col.column_name}: ${col.data_type} [${nullable}]${defaultVal}`)
          })
        }
      }
    }

    // Check for RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd')
      .eq('schemaname', 'public')

    if (!policiesError && policies && policies.length > 0) {
      console.log('\nRLS Policies:')
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
      })
    }

  } catch (error) {
    console.error('Error checking database:', error)
  }
}

checkDatabase()