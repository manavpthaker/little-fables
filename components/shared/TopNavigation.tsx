'use client'

import { Logo } from './Logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Save, Share2, Eye, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import Link from 'next/link'

interface TopNavigationProps {
  storyTitle?: string
  onSave?: () => void
  onShare?: () => void
  onPreview?: () => void
  showStoryControls?: boolean
}

export function TopNavigation({
  storyTitle = 'Untitled Story',
  onSave,
  onShare,
  onPreview,
  showStoryControls = false
}: TopNavigationProps) {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-6">
          <Logo />
          {showStoryControls && (
            <>
              <div className="h-6 w-px bg-border" />
              <input
                type="text"
                value={storyTitle}
                className="text-lg font-medium bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1"
                placeholder="Untitled Story"
              />
              <span className="text-sm text-muted-foreground">Auto-saved</span>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {showStoryControls && (
            <>
              <Button variant="ghost" size="sm" onClick={onSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="default" size="sm" onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <div className="h-6 w-px bg-border mx-2" />
            </>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user.user_metadata?.full_name 
                        ? getInitials(user.user_metadata.full_name)
                        : user.email?.[0].toUpperCase() || 'U'
                      }
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}