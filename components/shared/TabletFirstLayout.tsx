'use client'

import { useState, ReactNode } from 'react'
import { BottomNavBar } from './BottomNavBar'
import { AssetTray } from '../workspace/AssetTray'
import { AIChat } from '../chat/AIChat'
import { CommentPanel } from '../workspace/CommentPanel'
import { PageNavigator } from '../workspace/PageNavigator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface TabletFirstLayoutProps {
  children: ReactNode
  storyId?: string
  currentPage?: number
  totalPages?: number
  collaborators?: Array<{ id: string; name: string; avatar?: string }>
  className?: string
}

export function TabletFirstLayout({
  children,
  storyId,
  currentPage = 1,
  totalPages = 1,
  collaborators = [],
  className
}: TabletFirstLayoutProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [unreadComments, setUnreadComments] = useState(3)
  const [hasAISuggestions, setHasAISuggestions] = useState(true)

  const handlePanelToggle = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel)
  }

  const handleClosePanel = () => {
    setActivePanel(null)
  }

  return (
    <div className={cn("relative h-screen w-full overflow-hidden bg-background", className)}>
      {/* Main Content Area */}
      <main className="h-full w-full pb-16 md:pb-20 overflow-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar
        onAssetsClick={() => handlePanelToggle('assets')}
        onPagesClick={() => handlePanelToggle('pages')}
        onAIClick={() => handlePanelToggle('ai')}
        onCommentsClick={() => {
          handlePanelToggle('comments')
          setUnreadComments(0)
        }}
        onShareClick={() => handlePanelToggle('share')}
        collaborators={collaborators}
        unreadComments={unreadComments}
        hasAISuggestions={hasAISuggestions}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Asset Tray - Slide up from bottom */}
      <Sheet open={activePanel === 'assets'} onOpenChange={(open) => !open && handleClosePanel()}>
        <SheetContent 
          side="bottom" 
          className="h-[70vh] md:h-[60vh] rounded-t-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Assets Library</SheetTitle>
            <SheetDescription>Browse and select assets for your story</SheetDescription>
          </SheetHeader>
          <AssetTray onClose={handleClosePanel} />
        </SheetContent>
      </Sheet>

      {/* Page Navigator - Slide up from bottom */}
      <Sheet open={activePanel === 'pages'} onOpenChange={(open) => !open && handleClosePanel()}>
        <SheetContent 
          side="bottom" 
          className="h-[50vh] md:h-[40vh] rounded-t-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Page Navigator</SheetTitle>
            <SheetDescription>Navigate and manage story pages</SheetDescription>
          </SheetHeader>
          <PageNavigator 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              console.log('Navigate to page:', page)
              handleClosePanel()
            }}
            onClose={handleClosePanel}
          />
        </SheetContent>
      </Sheet>

      {/* AI Chat - Responsive panel */}
      <div className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "transform transition-transform duration-300 ease-out",
        activePanel === 'ai' ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="bg-background border-t rounded-t-2xl shadow-xl h-[80vh] md:h-[70vh] lg:max-w-3xl lg:mx-auto">
          <AIChat 
            onClose={handleClosePanel}
            onSuggestionApplied={() => setHasAISuggestions(false)}
          />
        </div>
      </div>

      {/* Comments Panel - Side panel on tablet, overlay on mobile */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-full md:w-96",
        "transform transition-transform duration-300 ease-out",
        "bg-background border-l shadow-xl",
        activePanel === 'comments' ? "translate-x-0" : "translate-x-full"
      )}>
        <CommentPanel 
          storyId={storyId}
          onClose={handleClosePanel}
        />
      </div>

      {/* Share/Export Panel */}
      <Sheet open={activePanel === 'share'} onOpenChange={(open) => !open && handleClosePanel()}>
        <SheetContent 
          side="bottom" 
          className="h-auto rounded-t-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Share & Export</SheetTitle>
            <SheetDescription>Share your story or export it in different formats</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-semibold">Share & Export</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="text-2xl mb-2">📤</div>
                <div className="text-sm font-medium">Export PDF</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="text-2xl mb-2">🔗</div>
                <div className="text-sm font-medium">Share Link</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="text-2xl mb-2">🖨️</div>
                <div className="text-sm font-medium">Print</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium">Invite Collaborators</div>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Overlay for mobile when panels are open */}
      {activePanel && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={handleClosePanel}
        />
      )}
    </div>
  )
}