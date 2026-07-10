'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Copy,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Layers,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Page {
  id: string
  number: number
  thumbnail?: string
  title?: string
  isSpread?: boolean
}

interface PageNavigatorProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  onAddPage?: () => void
  onDeletePage?: (page: number) => void
  onDuplicatePage?: (page: number) => void
  onClose?: () => void
  className?: string
}

export function PageNavigator({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onClose,
  className
}: PageNavigatorProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'spread'>('grid')
  const [pages] = useState<Page[]>(
    Array.from({ length: totalPages }, (_, i) => ({
      id: `page-${i + 1}`,
      number: i + 1,
      title: i === 0 ? 'Cover' : i === totalPages - 1 ? 'Back Cover' : undefined,
      isSpread: i > 0 && i < totalPages - 1 && i % 2 === 1
    }))
  )

  const handlePageClick = (page: number) => {
    onPageChange?.(page)
    onClose?.()
  }

  const renderGridView = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
      {pages.map((page) => (
        <div
          key={page.id}
          className={cn(
            "relative group cursor-pointer",
            page.number === currentPage && "ring-2 ring-primary"
          )}
          onClick={() => handlePageClick(page.number)}
        >
          <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            {page.thumbnail ? (
              <img src={page.thumbnail} alt={`Page ${page.number}`} className="object-cover" />
            ) : (
              <div className="text-2xl text-muted-foreground">{page.number}</div>
            )}
            
            {/* Page Actions */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-xs font-medium">
              {page.title || `Page ${page.number}`}
            </p>
            {page.number === currentPage && (
              <p className="text-xs text-primary">Current</p>
            )}
          </div>
        </div>
      ))}
      
      {/* Add Page Button */}
      <div
        className="aspect-[3/4] bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted hover:border-muted-foreground/50 transition-colors"
        onClick={() => onAddPage?.()}
      >
        <div className="text-center">
          <Plus className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground mt-2">Add Page</p>
        </div>
      </div>
    </div>
  )

  const renderSpreadView = () => (
    <div className="space-y-6">
      {/* Cover */}
      <div className="flex justify-center">
        <div
          className={cn(
            "w-32 md:w-40 aspect-[3/4] bg-muted rounded-lg flex items-center justify-center cursor-pointer",
            currentPage === 1 && "ring-2 ring-primary"
          )}
          onClick={() => handlePageClick(1)}
        >
          <div className="text-center">
            <div className="text-2xl text-muted-foreground mb-2">1</div>
            <p className="text-xs">Cover</p>
          </div>
        </div>
      </div>

      {/* Spreads */}
      {Array.from({ length: Math.floor((totalPages - 2) / 2) }, (_, i) => {
        const leftPage = i * 2 + 2
        const rightPage = i * 2 + 3
        
        return (
          <div key={`spread-${i}`} className="flex justify-center gap-1">
            <div
              className={cn(
                "w-32 md:w-40 aspect-[3/4] bg-muted rounded-l-lg flex items-center justify-center cursor-pointer",
                currentPage === leftPage && "ring-2 ring-primary"
              )}
              onClick={() => handlePageClick(leftPage)}
            >
              <div className="text-2xl text-muted-foreground">{leftPage}</div>
            </div>
            <div
              className={cn(
                "w-32 md:w-40 aspect-[3/4] bg-muted rounded-r-lg flex items-center justify-center cursor-pointer",
                currentPage === rightPage && "ring-2 ring-primary"
              )}
              onClick={() => handlePageClick(rightPage)}
            >
              <div className="text-2xl text-muted-foreground">{rightPage}</div>
            </div>
          </div>
        )
      })}

      {/* Back Cover */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div
            className={cn(
              "w-32 md:w-40 aspect-[3/4] bg-muted rounded-lg flex items-center justify-center cursor-pointer",
              currentPage === totalPages && "ring-2 ring-primary"
            )}
            onClick={() => handlePageClick(totalPages)}
          >
            <div className="text-center">
              <div className="text-2xl text-muted-foreground mb-2">{totalPages}</div>
              <p className="text-xs">Back Cover</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h3 className="text-lg font-semibold">Pages</h3>
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              className="h-7 px-2"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'spread' ? 'secondary' : 'ghost'}
              className="h-7 px-2"
              onClick={() => setViewMode('spread')}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between py-3 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageClick(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDuplicatePage?.(currentPage)}
            title="Duplicate current page"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDeletePage?.(currentPage)}
            disabled={totalPages === 1}
            title="Delete current page"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageClick(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Pages View */}
      <ScrollArea className="flex-1 p-4">
        {viewMode === 'grid' ? renderGridView() : renderSpreadView()}
      </ScrollArea>

      {/* Quick Actions */}
      <div className="pt-4 border-t">
        <Button 
          className="w-full"
          onClick={() => onAddPage?.()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Page
        </Button>
      </div>
    </div>
  )
}