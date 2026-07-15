'use client'

import Link from 'next/link'
import { BookOpen, Sparkles, Palette, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Hero } from '@/components/relume/Hero'
import { Features } from '@/components/relume/Features'
import { Footer } from '@/components/relume/Footer'

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav user={user} loading={loading} />

      <Hero
        heading="Bedtime stories that paint themselves."
        description="AI-illustrated read-aloud tales made for little listeners. Watch each page bloom into a watercolor scene as the story unfolds."
        image={{ src: '/illustration/jujy-cover.jpg', alt: 'A Little Fables story cover' }}
        actions={
          <>
            <Button size="lg" asChild>
              <Link href="/read">
                <BookOpen className="size-5" />
                Open the Story World
              </Link>
            </Button>
            {!loading &&
              (user ? (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/story/create">Create a story</Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/signup">Get started</Link>
                </Button>
              ))}
          </>
        }
      />

      <Features
        tagline="What makes Little Fables different"
        heading="Stories that come alive as you read."
        description="Every page paints itself in soft watercolor while your child listens. Made for parents, teachers, and the tiny humans they love."
        cards={[
          {
            icon: Sparkles,
            image: '/illustration/azi-kitchen.jpg',
            heading: 'Read-aloud, illustrated',
            description:
              'Warm narration and hand-painted-looking scenes turn every book into a bedtime moment.',
            cta: { title: 'Open the reader', href: '/read' },
          },
          {
            icon: Palette,
            image: '/illustration/azi-scene-03.jpg',
            heading: 'Paints as you read',
            description:
              'Each page reveals its watercolor illustration mid-sentence — a little magic, every turn.',
            cta: { title: 'See the effect', href: '/read' },
          },
          {
            icon: Users,
            heading: 'Make your own',
            description:
              'Write a story with your child as the hero. Little Fables illustrates the whole thing.',
            cta: { title: 'Start creating', href: user ? '/story/create' : '/auth/signup' },
          },
        ]}
      />

      <Footer />
    </div>
  )
}

function MarketingNav({
  user,
  loading,
}: {
  user: ReturnType<typeof useAuth>['user']
  loading: boolean
}) {
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-[5%]">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <BookOpen className="size-5" />
          Little Fables
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/read">Read</Link>
          </Button>
          {!loading &&
            (user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Get started</Link>
                </Button>
              </>
            ))}
        </div>
      </div>
    </nav>
  )
}
