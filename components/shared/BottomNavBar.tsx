'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Library,
  Layers,
  Bot,
  MessageSquare,
  Share2,
  ChevronUp,
  Plus,
  Grid3x3,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface BottomNavBarProps {
  onAssetsClick?: () => void
  onPagesClick?: () => void
  onAIClick?: () => void
  onCommentsClick?: () => void
  onShareClick?: () => void
  collaborators?: Array<{ id: string; name: string; avatar?: string }>
  unreadComments?: number
  hasAISuggestions?: boolean
  currentPage?: number
  totalPages?: number
  className?: string
}

export function BottomNavBar({
  onAssetsClick,
  onPagesClick,
  onAIClick,
  onCommentsClick,
  onShareClick,
  collaborators = [],
  unreadComments = 0,
  hasAISuggestions = false,
  currentPage = 1,
  totalPages = 1,
  className
}: BottomNavBarProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleNavClick = (tab: string, callback?: () => void) => {
    setActiveTab(activeTab === tab ? null : tab)
    callback?.()
  }

  const navItems = [
    {
      id: 'assets',
      icon: Library,
      label: 'Assets',
      onClick: onAssetsClick,
      badge: null
    },
    {
      id: 'pages',
      icon: Layers,
      label: 'Pages',
      onClick: onPagesClick,
      badge: `${currentPage}/${totalPages}`,
      badgeType: 'info'
    },
    {
      id: 'ai',
      icon: Bot,
      label: 'AI Assist',
      onClick: onAIClick,
      badge: hasAISuggestions,
      badgeType: 'pulse'
    },
    {
      id: 'comments',
      icon: MessageSquare,
      label: 'Comments',
      onClick: onCommentsClick,
      badge: unreadComments > 0 ? unreadComments : null,
      badgeType: 'count'
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Share',
      onClick: onShareClick,
      badge: null
    }
  ]

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40",
          "bg-background/95 backdrop-blur-sm border-t",
          "transition-all duration-300 ease-out",
          isExpanded ? "h-20" : "h-16",
          "md:bottom-4 md:left-4 md:right-4 md:rounded-2xl md:border md:shadow-lg",
          "lg:max-w-2xl lg:mx-auto",
          className
        )}
      >
        <div className="flex items-center justify-between h-full px-2 md:px-4">
          {/* Navigation Items */}
          <div className="flex items-center justify-around flex-1 gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "relative flex flex-col items-center gap-1 h-auto py-2 px-3",
                  "hover:bg-accent transition-colors",
                  "min-w-[60px] md:min-w-[72px]"
                )}
                onClick={() => handleNavClick(item.id, item.onClick)}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                  
                  {/* Badges */}
                  {item.badge && (
                    <>
                      {item.badgeType === 'count' && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                      {item.badgeType === 'pulse' && (
                        <span className="absolute -top-1 -right-1 h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                      {item.badgeType === 'info' && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                {isExpanded && (
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    {item.label}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Collaborators Section */}
          {collaborators.length > 0 && (
            <div className="hidden md:flex items-center gap-1 ml-4 pr-2">
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map((collaborator) => (
                  <Avatar key={collaborator.id} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={collaborator.avatar} />
                    <AvatarFallback className="text-xs">
                      {collaborator.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {collaborators.length > 3 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{collaborators.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Expand/Collapse Toggle (Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronUp className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </Button>
        </div>
      </nav>

      {/* Floating Action Button (Tablet/Desktop) */}
      <Button
        className={cn(
          "fixed bottom-20 right-4 md:bottom-24 md:right-8",
          "h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90",
          "transition-all duration-300",
          "z-30"
        )}
        size="icon"
        onClick={() => onAssetsClick?.()}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </>
  )
}