'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookOpen,
  Sparkles,
  Palette,
  Bot,
  ChevronLeft,
  Plus,
  Search,
  Clock,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeftSidebarProps {
  className?: string
}

export function LeftSidebar({ className }: LeftSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      label: 'My Stories',
      icon: BookOpen,
      badge: '12',
      items: [
        { label: 'The Magic Garden', time: '2 hours ago', starred: true },
        { label: 'Dragon\'s Adventure', time: 'Yesterday', starred: false },
        { label: 'Space Explorer', time: '3 days ago', starred: false },
      ]
    },
    {
      label: 'Quick Start',
      icon: Sparkles,
      action: 'new'
    },
    {
      label: 'Assets',
      icon: Palette,
      action: 'assets'
    },
    {
      label: 'AI Assistant',
      icon: Bot,
      action: 'assistant'
    }
  ]

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-72",
        className
      )}
    >
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronLeft className={cn("h-3 w-3 transition-transform", isCollapsed && "rotate-180")} />
      </Button>

      {/* Header */}
      <div className="p-4 border-b">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Library</h2>
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" className="w-full">
            <BookOpen className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stories..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-muted/50 rounded-md outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

      {/* Menu Items */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {menuItems.map((item, index) => (
            <div key={index} className="mb-4">
              {item.items ? (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start mb-2",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && (
                      <>
                        <span className="ml-2 flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                  
                  {!isCollapsed && (
                    <div className="ml-6 space-y-1">
                      {item.items.map((subItem, subIndex) => (
                        <Button
                          key={subIndex}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm h-auto py-2"
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-1">
                                {subItem.starred && <Star className="h-3 w-3 fill-accent-yellow text-accent-yellow" />}
                                <span className="font-medium">{subItem.label}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Clock className="h-3 w-3" />
                                {subItem.time}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">{item.label}</span>}
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            <div>Storage: 245 MB / 1 GB</div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '24.5%' }} />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}