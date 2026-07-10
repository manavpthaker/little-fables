'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Send,
  X,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Palette,
  RefreshCw,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface AIChatProps {
  onClose?: () => void
  onSuggestionApplied?: () => void
  initialContext?: string
  className?: string
}

const quickPrompts = [
  { icon: BookOpen, label: 'Continue story', prompt: 'What happens next in the story?' },
  { icon: Palette, label: 'Add description', prompt: 'Add more vivid descriptions to this scene' },
  { icon: RefreshCw, label: 'Rewrite for age', prompt: 'Rewrite this for a 5-year-old reader' },
  { icon: Sparkles, label: 'Add magic', prompt: 'Add a magical element to the story' },
]

export function AIChat({ 
  onClose, 
  onSuggestionApplied,
  initialContext,
  className 
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI story assistant. I can help you write, rewrite, or enhance your story. What would you like to work on?",
      timestamp: new Date(),
      suggestions: [
        'Help me start a new story',
        'Suggest character names',
        'Create a plot twist',
        'Make it more age-appropriate'
      ]
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll help you with: "${input}". Here's a suggestion for your story...`,
        timestamp: new Date(),
        suggestions: [
          'Apply this suggestion',
          'Try a different approach',
          'Expand on this idea'
        ]
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === 'Apply this suggestion') {
      onSuggestionApplied?.()
    }
    setInput(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Story Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by AI</p>
          </div>
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

      {/* Quick Prompts */}
      <div className="p-4 border-b">
        <ScrollArea orientation="horizontal">
          <div className="flex gap-2">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt(prompt.prompt)}
                className="shrink-0"
              >
                <prompt.icon className="h-4 w-4 mr-1" />
                {prompt.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                message.role === 'assistant' ? "bg-primary/10" : "bg-accent"
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              
              <div className={cn(
                "flex flex-col gap-2 max-w-[80%]",
                message.role === 'user' && "items-end"
              )}>
                <div className={cn(
                  "rounded-2xl px-4 py-2",
                  message.role === 'assistant' 
                    ? "bg-muted text-foreground" 
                    : "bg-primary text-primary-foreground"
                )}>
                  <p className="text-sm">{message.content}</p>
                </div>
                
                {message.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="h-auto py-1 px-2 text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
                
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Context Card */}
      {initialContext && (
        <div className="mx-4 p-3 bg-accent/50 rounded-lg border">
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-accent-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium">Current Context</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {initialContext}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask anything about your story..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI can make mistakes. Review suggestions before applying.
        </p>
      </div>
    </div>
  )
}