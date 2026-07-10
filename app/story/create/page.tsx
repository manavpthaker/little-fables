'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TabletFirstLayout } from '@/components/shared/TabletFirstLayout'
import { StoryCanvas } from '@/components/workspace/StoryCanvas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings,
  Wand2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CreateStoryPage() {
  const router = useRouter()
  const [storyTitle, setStoryTitle] = useState('Untitled Story')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const collaborators = [
    { id: '1', name: 'Sarah M.', avatar: '' },
    { id: '2', name: 'Mike T.', avatar: '' }
  ]

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const handleAddPage = () => {
    setTotalPages(prev => prev + 1)
    setCurrentPage(totalPages + 1)
  }

  return (
    <TabletFirstLayout
      storyId="new"
      currentPage={currentPage}
      totalPages={totalPages}
      collaborators={collaborators}
    >
      <div className="h-full flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            {isEditingTitle ? (
              <Input
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="h-8 w-48"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-sm font-medium hover:bg-accent px-2 py-1 rounded transition-colors"
              >
                {storyTitle}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex"
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-muted/30">
          <StoryCanvas
            onAddComment={(position) => {
              console.log('Add comment at:', position)
            }}
            onElementsChange={(elements) => {
              console.log('Elements changed:', elements)
            }}
          />
        </div>

        {/* Quick Actions (Mobile) */}
        <div className="md:hidden fixed bottom-20 left-4 flex flex-col gap-2">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
            variant="secondary"
          >
            <Wand2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </TabletFirstLayout>
  )
}