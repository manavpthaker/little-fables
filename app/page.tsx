'use client'

import { Button } from '@/components/ui/button'
import { MainLayout } from '@/components/shared/MainLayout'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Sparkles, BookOpen, Palette, Users, Settings } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
          
          <h1 className="text-4xl md:text-5xl font-bold">
            Create Stories for Little Ones
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered story creation platform for parents and teachers.
          </p>

          {/* Centerpiece: the interactive reader app */}
          <Link
            href="/read"
            className="block max-w-xl mx-auto rounded-3xl p-8 text-white text-center shadow-xl hover:scale-[1.02] transition-transform"
            style={{ background: 'linear-gradient(135deg,#4338ca,#7c3aed,#db2777)' }}
          >
            <span className="text-5xl block mb-2">📚✨</span>
            <span className="text-2xl font-bold block">Open the Story World</span>
            <span className="text-white/80">Interactive read-aloud stories with voice — made for your child</span>
          </Link>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {!loading && (
              user ? (
                <>
                  <Button asChild>
                    <Link href="/story/create">Start Creating</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </>
              )
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="p-4 border rounded">
            <Sparkles className="w-6 h-6 mb-2" />
            <h3 className="font-semibold mb-1">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Create stories with AI assistance
            </p>
          </div>

          <div className="p-4 border rounded">
            <Palette className="w-6 h-6 mb-2" />
            <h3 className="font-semibold mb-1">Visual Canvas</h3>
            <p className="text-sm text-muted-foreground">
              Design with drag-and-drop tools
            </p>
          </div>

          <div className="p-4 border rounded">
            <Users className="w-6 h-6 mb-2" />
            <h3 className="font-semibold mb-1">Share & Collaborate</h3>
            <p className="text-sm text-muted-foreground">
              Work together on stories
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}