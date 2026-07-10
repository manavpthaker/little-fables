'use client'

import React, { useState, useRef, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Type, 
  Image, 
  Square, 
  Circle, 
  Trash2, 
  Copy, 
  RotateCw,
  Move,
  Maximize2
} from 'lucide-react'

interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'shape'
  content: string | ReactNode
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  zIndex: number
  styles?: Record<string, any>
}

interface StoryCanvasProps {
  elements?: CanvasElement[]
  onElementsChange?: (elements: CanvasElement[]) => void
  onElementSelect?: (element: CanvasElement | null) => void
  onAddComment?: (position: { x: number; y: number }) => void
  className?: string
  readOnly?: boolean
}

export function StoryCanvas({
  elements: initialElements = [],
  onElementsChange,
  onElementSelect,
  onAddComment,
  className,
  readOnly = false
}: StoryCanvasProps) {
  const [elements, setElements] = useState<CanvasElement[]>(initialElements)
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleElementMouseDown = (e: React.MouseEvent, element: CanvasElement) => {
    if (readOnly) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setSelectedElement(element)
    onElementSelect?.(element)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setElementStart({ x: element.position.x, y: element.position.y })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedElement) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const updatedElements = elements.map(el => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          position: {
            x: elementStart.x + deltaX,
            y: elementStart.y + deltaY
          }
        }
      }
      return el
    })

    setElements(updatedElements)
    onElementsChange?.(updatedElements)
  }, [isDragging, selectedElement, dragStart, elementStart, elements, onElementsChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null)
      onElementSelect?.(null)
    }
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (readOnly) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    onAddComment?.({ x, y })
  }

  const addElement = (type: CanvasElement['type']) => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'Double-click to edit' : '',
      position: { x: 100, y: 100 },
      size: { width: 200, height: type === 'text' ? 50 : 150 },
      rotation: 0,
      zIndex: elements.length
    }

    const updatedElements = [...elements, newElement]
    setElements(updatedElements)
    onElementsChange?.(updatedElements)
  }

  const deleteElement = () => {
    if (!selectedElement) return

    const updatedElements = elements.filter(el => el.id !== selectedElement.id)
    setElements(updatedElements)
    onElementsChange?.(updatedElements)
    setSelectedElement(null)
    onElementSelect?.(null)
  }

  const duplicateElement = () => {
    if (!selectedElement) return

    const newElement: CanvasElement = {
      ...selectedElement,
      id: `element-${Date.now()}`,
      position: {
        x: selectedElement.position.x + 20,
        y: selectedElement.position.y + 20
      }
    }

    const updatedElements = [...elements, newElement]
    setElements(updatedElements)
    onElementsChange?.(updatedElements)
  }

  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="absolute top-4 left-4 z-20 flex gap-2 bg-background/95 backdrop-blur-sm p-2 rounded-lg border shadow-sm">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('text')}
            title="Add Text"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('image')}
            title="Add Image"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('shape')}
            title="Add Shape"
          >
            <Square className="h-4 w-4" />
          </Button>
          
          {selectedElement && (
            <>
              <div className="w-px bg-border mx-1" />
              <Button
                size="icon"
                variant="ghost"
                onClick={duplicateElement}
                title="Duplicate"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={deleteElement}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "relative w-full h-full bg-white rounded-lg",
          "overflow-hidden touch-none",
          !readOnly && "cursor-crosshair"
        )}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Canvas Elements */}
        {elements.map((element) => (
          <div
            key={element.id}
            className={cn(
              "absolute select-none",
              "transition-shadow duration-200",
              selectedElement?.id === element.id && "ring-2 ring-primary ring-offset-2",
              !readOnly && "cursor-move hover:shadow-lg"
            )}
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              transform: `rotate(${element.rotation}deg)`,
              zIndex: element.zIndex,
              ...element.styles
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
          >
            {element.type === 'text' && (
              <div className="w-full h-full p-2 bg-background border rounded">
                <p className="text-sm">{element.content}</p>
              </div>
            )}
            
            {element.type === 'image' && (
              <div className="w-full h-full bg-muted border rounded flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            {element.type === 'shape' && (
              <div className="w-full h-full bg-accent/20 border-2 border-accent rounded" />
            )}

            {/* Resize Handles */}
            {selectedElement?.id === element.id && !readOnly && (
              <>
                <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-primary rounded-full cursor-se-resize" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full cursor-e-resize" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full cursor-s-resize" />
              </>
            )}
          </div>
        ))}

        {/* Drop Zone Indicator */}
        {!readOnly && elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Move className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Start Creating Your Story</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Add text, images, or shapes from the toolbar
                </p>
                <p className="text-sm text-muted-foreground">
                  or drag & drop elements onto the canvas
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Touch/Gesture Indicators */}
      <div className="absolute bottom-4 right-4 flex gap-2 text-xs text-muted-foreground">
        <span className="bg-background/90 px-2 py-1 rounded">Pinch to zoom</span>
        <span className="bg-background/90 px-2 py-1 rounded">Double-tap to comment</span>
      </div>
    </div>
  )
}