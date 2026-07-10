import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function exploreCharacters() {
  console.log('🔍 Exploring characters table...\n')

  // Try to insert a test character to see the structure
  const testCharacter = {
    name: 'Test Character',
    description: 'A test character',
    type: 'protagonist'
  }

  const { data: insertData, error: insertError } = await supabase
    .from('characters')
    .insert(testCharacter)
    .select()

  if (insertError) {
    console.log('❌ Insert error reveals schema requirements:')
    console.log(insertError.message)
    console.log('\nThis tells us about required columns and constraints.')
  } else {
    console.log('✅ Insert successful! Character structure:')
    console.log(insertData)
    
    // Clean up the test record
    if (insertData && insertData[0]) {
      await supabase.from('characters').delete().eq('id', insertData[0].id)
      console.log('🧹 Test record cleaned up')
    }
  }

  // Try different variations to understand the schema
  const variations = [
    { name: 'Test' },
    { name: 'Test', age: 10 },
    { name: 'Test', image_url: 'https://example.com/image.png' },
    { name: 'Test', personality: ['friendly', 'brave'] }
  ]

  console.log('\n🧪 Testing different column combinations...')
  
  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i]
    const { error } = await supabase
      .from('characters')
      .insert(variation)
      .select()

    if (error) {
      console.log(`❌ Variation ${i + 1} (${Object.keys(variation).join(', ')}): ${error.message}`)
    } else {
      console.log(`✅ Variation ${i + 1} (${Object.keys(variation).join(', ')}): Success`)
      // Clean up
      await supabase.from('characters').delete().eq('name', variation.name)
    }
  }
}

exploreCharacters()