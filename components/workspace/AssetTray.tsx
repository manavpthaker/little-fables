'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Search,
  X,
  Users,
  Image,
  Palette,
  Music,
  FileText,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  type: 'character' | 'background' | 'prop' | 'audio' | 'template'
  thumbnail: string
  category?: string
}

interface AssetTrayProps {
  onAssetSelect?: (asset: Asset) => void
  onClose?: () => void
  className?: string
}

const mockAssets: Asset[] = [
  { id: '1', name: 'Happy Bear', type: 'character', thumbnail: '🐻', category: 'Animals' },
  { id: '2', name: 'Brave Knight', type: 'character', thumbnail: '🦸', category: 'Heroes' },
  { id: '3', name: 'Magic Forest', type: 'background', thumbnail: '🌲', category: 'Nature' },
  { id: '4', name: 'Castle', type: 'background', thumbnail: '🏰', category: 'Buildings' },
  { id: '5', name: 'Magic Wand', type: 'prop', thumbnail: '🪄', category: 'Magic' },
  { id: '6', name: 'Treasure Chest', type: 'prop', thumbnail: '📦', category: 'Items' },
  { id: '7', name: 'Happy Melody', type: 'audio', thumbnail: '🎵', category: 'Music' },
  { id: '8', name: 'Adventure Template', type: 'template', thumbnail: '📖', category: 'Stories' },
]

const categories = [
  { id: 'characters', label: 'Characters', icon: Users, color: 'text-blue-500' },
  { id: 'backgrounds', label: 'Backgrounds', icon: Image, color: 'text-green-500' },
  { id: 'props', label: 'Props', icon: Palette, color: 'text-purple-500' },
  { id: 'audio', label: 'Audio', icon: Music, color: 'text-orange-500' },
  { id: 'templates', label: 'Templates', icon: FileText, color: 'text-pink-500' },
  { id: 'ai', label: 'AI Generate', icon: Sparkles, color: 'text-yellow-500' },
]

export function AssetTray({ onAssetSelect, onClose, className }: AssetTrayProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [assets] = useState<Asset[]>(mockAssets)

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || 
      (selectedCategory === 'characters' && asset.type === 'character') ||
      (selectedCategory === 'backgrounds' && asset.type === 'background') ||
      (selectedCategory === 'props' && asset.type === 'prop') ||
      (selectedCategory === 'audio' && asset.type === 'audio') ||
      (selectedCategory === 'templates' && asset.type === 'template')
    
    return matchesSearch && matchesCategory
  })

  const handleAssetClick = (asset: Asset) => {
    onAssetSelect?.(asset)
    onClose?.()
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <h3 className="text-lg font-semibold">Assets Library</h3>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Categories */}
      <ScrollArea className="mt-4" orientation="horizontal">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="shrink-0"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="shrink-0"
            >
              <category.icon className={cn("h-4 w-4 mr-1", category.color)} />
              {category.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Assets Grid */}
      <ScrollArea className="flex-1 mt-4">
        {selectedCategory === 'ai' ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <Sparkles className="h-12 w-12 text-yellow-500" />
            <div>
              <h4 className="font-medium">AI Asset Generation</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Describe what you need and AI will create it
              </p>
            </div>
            <div className="w-full max-w-sm">
              <Input
                placeholder="A friendly dragon with purple scales..."
                className="w-full"
              />
              <Button className="w-full mt-2">
                Generate Asset
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 pb-4">
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleAssetClick(asset)}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "p-4 rounded-lg border-2 border-transparent",
                  "hover:bg-accent hover:border-accent-foreground/20",
                  "transition-all duration-200",
                  "cursor-grab active:cursor-grabbing",
                  "group"
                )}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('asset', JSON.stringify(asset))
                }}
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {asset.thumbnail}
                </div>
                <span className="text-xs text-center line-clamp-2">
                  {asset.name}
                </span>
                {asset.category && (
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {asset.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {filteredAssets.length === 0 && selectedCategory !== 'ai' && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-muted-foreground">
              No assets found matching your search
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Upload Section */}
      <div className="pt-4 border-t">
        <Button variant="outline" className="w-full">
          <Image className="h-4 w-4 mr-2" />
          Upload Your Own Assets
        </Button>
      </div>
    </div>
  )
}