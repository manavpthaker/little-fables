'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/shared/MainLayout'
import { useAuth } from '@/lib/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Database, Table, Users, BookOpen } from 'lucide-react'

interface TableInfo {
  name: string
  count: number
  accessible: boolean
  error?: string
  sample?: any
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [tableInfo, setTableInfo] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      exploreDatabase()
    }
  }, [user])

  const exploreDatabase = async () => {
    setLoading(true)
    const tables = ['stories', 'characters', 'profiles', 'users', 'assets', 'templates']
    const results: TableInfo[] = []

    for (const tableName of tables) {
      try {
        // Try to count rows
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          results.push({
            name: tableName,
            count: 0,
            accessible: false,
            error: error.message
          })
        } else {
          // Try to get a sample record
          const { data: sample } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          results.push({
            name: tableName,
            count: count || 0,
            accessible: true,
            sample: sample?.[0]
          })
        }
      } catch (e) {
        results.push({
          name: tableName,
          count: 0,
          accessible: false,
          error: 'Unknown error'
        })
      }
    }

    setTableInfo(results)
    setLoading(false)
  }

  const createTestStory = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          title: 'My First Little Fable',
          content: 'Once upon a time...',
          created_by: user?.id
        })
        .select()

      if (error) {
        alert(`Error creating story: ${error.message}`)
      } else {
        alert('Story created successfully!')
        exploreDatabase() // Refresh the data
      }
    } catch (e) {
      alert('Failed to create test story')
    }
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          <Button onClick={exploreDatabase} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>

        {/* Database Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>
              Current database structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Exploring database...</span>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tableInfo.map((table) => (
                  <div
                    key={table.name}
                    className="p-4 border rounded"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{table.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {table.accessible ? 'Accessible' : 'Blocked'}
                      </span>
                    </div>
                    
                    {table.accessible ? (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {table.count} record{table.count !== 1 ? 's' : ''}
                        </p>
                        {table.sample && (
                          <div className="text-xs">
                            <p className="font-medium mb-1">Columns:</p>
                            <p className="text-muted-foreground">
                              {Object.keys(table.sample).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-destructive">
                        {table.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Story Creation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={createTestStory} className="w-full">
                Create Test Story
              </Button>
              <p className="text-sm text-muted-foreground">
                Test database access
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Email:</strong> {user?.email}</div>
              <div><strong>Name:</strong> {user?.user_metadata?.full_name || 'Not set'}</div>
              <div><strong>ID:</strong> {user?.id?.slice(0, 8)}...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}