import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analyzeTable(tableName: string) {
  try {
    console.log(`\n📋 ${tableName.toUpperCase()}`)
    console.log('=' .repeat(50))
    
    // Get sample data to understand structure
    const { data: sample, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(3)
    
    if (error) {
      console.log(`❌ Error: ${error.message}`)
      return
    }

    if (!sample || sample.length === 0) {
      console.log('📭 No data found')
      return
    }

    console.log(`📊 Records found: ${sample.length} (showing max 3)`)
    console.log('\n🔍 Sample data:')
    
    sample.forEach((record, index) => {
      console.log(`\n--- Record ${index + 1} ---`)
      Object.entries(record).forEach(([key, value]) => {
        const displayValue = typeof value === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value
        console.log(`  ${key}: ${displayValue}`)
      })
    })

    // Show columns
    console.log('\n📝 Columns:')
    const firstRecord = sample[0]
    Object.keys(firstRecord).forEach(key => {
      const value = firstRecord[key]
      const type = value === null ? 'null' : typeof value
      console.log(`  • ${key} (${type})`)
    })

  } catch (error) {
    console.log(`❌ Error analyzing ${tableName}:`, error)
  }
}

async function analyzeDatabase() {
  console.log('🔍 LITTLE FABLES DATABASE ANALYSIS')
  console.log('==================================')

  const tables = [
    'profiles',
    'users', 
    'stories',
    'story',
    'characters',
    'assets',
    'templates',
    'organizations'
  ]

  for (const table of tables) {
    await analyzeTable(table)
    console.log('\n' + '-'.repeat(80))
  }

  console.log('\n✅ Analysis complete!')
}

analyzeDatabase()