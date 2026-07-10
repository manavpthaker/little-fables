'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  X,
  Send,
  MessageSquare,
  Bot,
  MoreVertical,
  Reply,
  Heart,
  MapPin,
  Check,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  content: string
  timestamp: Date
  position?: { x: number; y: number; page: number }
  resolved: boolean
  replies: Comment[]
  isAI?: boolean
  reactions?: { [key: string]: string[] }
}

interface CommentPanelProps {
  storyId?: string
  onClose?: () => void
  className?: string
}

const mockComments: Comment[] = [
  {
    id: '1',
    author: { id: '1', name: 'Sarah M.', avatar: '' },
    content: 'Love the opening! Maybe we could add more description of the forest?',
    timestamp: new Date(Date.now() - 3600000),
    position: { x: 100, y: 200, page: 1 },
    resolved: false,
    replies: [
      {
        id: '2',
        author: { id: 'ai', name: 'AI Assistant' },
        content: 'I can help with that! How about: "The ancient forest whispered secrets through rustling leaves, while golden sunlight danced between towering oak trees."',
        timestamp: new Date(Date.now() - 1800000),
        resolved: false,
        replies: [],
        isAI: true
      }
    ]
  },
  {
    id: '3',
    author: { id: '2', name: 'Mike T.', avatar: '' },
    content: 'Should we make this dialogue more age-appropriate for 5-year-olds?',
    timestamp: new Date(Date.now() - 7200000),
    position: { x: 300, y: 400, page: 2 },
    resolved: true,
    replies: []
  }
]

export function CommentPanel({ storyId, onClose, className }: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>(mockComments)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all')

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true
    if (filter === 'unresolved') return !comment.resolved
    if (filter === 'resolved') return comment.resolved
    return true
  })

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: { id: 'current', name: 'You' },
      content: newComment,
      timestamp: new Date(),
      resolved: false,
      replies: []
    }

    if (replyingTo) {
      const updateComments = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.id === replyingTo) {
            return { ...c, replies: [...c.replies, comment] }
          }
          if (c.replies.length > 0) {
            return { ...c, replies: updateComments(c.replies) }
          }
          return c
        })
      }
      setComments(updateComments(comments))
      setReplyingTo(null)
    } else {
      setComments([comment, ...comments])
    }

    setNewComment('')
  }

  const toggleResolved = (commentId: string) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    ))
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn(
        "group",
        isReply && "ml-8 mt-3"
      )}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback className={cn(
            comment.isAI && "bg-primary/10"
          )}>
            {comment.isAI ? (
              <Bot className="h-4 w-4 text-primary" />
            ) : (
              comment.author.name.slice(0, 2).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author.name}</span>
            {comment.isAI && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                AI
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {comment.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {comment.resolved && (
              <span className="text-xs bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Check className="h-3 w-3" />
                Resolved
              </span>
            )}
          </div>

          <p className="text-sm text-foreground/90">{comment.content}</p>

          {comment.position && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Page {comment.position.page} • Position ({comment.position.x}, {comment.position.y})
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setReplyingTo(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            
            {!isReply && !comment.resolved && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => toggleResolved(comment.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                Resolve
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100"
            >
              <Heart className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">Comments</h3>
          <p className="text-xs text-muted-foreground">
            {comments.length} comments • {comments.filter(c => !c.resolved).length} unresolved
          </p>
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

      {/* Filter Tabs */}
      <div className="flex gap-1 p-2 border-b">
        {(['all', 'unresolved', 'resolved'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(f)}
            className="flex-1 capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {filteredComments.length > 0 ? (
            filteredComments.map(comment => renderComment(comment))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {filter === 'resolved' 
                  ? 'No resolved comments' 
                  : 'No comments yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Double-tap on the canvas to add a comment
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-accent/50 border-t flex items-center justify-between">
          <span className="text-xs">
            Replying to comment...
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setReplyingTo(null)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            <Bot className="h-3 w-3 mr-1" />
            Ask AI to join
          </Button>
        </div>
      </div>
    </div>
  )
}