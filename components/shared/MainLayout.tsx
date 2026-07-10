import { TopNavigation } from './TopNavigation'
import { LeftSidebar } from './LeftSidebar'

interface MainLayoutProps {
  children: React.ReactNode
  showStoryControls?: boolean
  storyTitle?: string
  onSave?: () => void
  onShare?: () => void
  onPreview?: () => void
}

export function MainLayout({
  children,
  showStoryControls = false,
  storyTitle,
  onSave,
  onShare,
  onPreview
}: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <TopNavigation
        showStoryControls={showStoryControls}
        storyTitle={storyTitle}
        onSave={onSave}
        onShare={onShare}
        onPreview={onPreview}
      />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}