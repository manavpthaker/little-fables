import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Card = {
  icon: LucideIcon
  image?: string
  heading: string
  description: string
  cta?: { title: string; href: string }
}

type Props = {
  tagline: string
  heading: string
  description: string
  cards: Card[]
}

export function Features({ tagline, heading, description, cards }: Props) {
  return (
    <section className="bg-muted/30 px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container mx-auto">
        <div className="mb-12 md:mb-16 lg:mb-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 font-semibold text-primary md:mb-4">{tagline}</p>
            <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground md:mb-6 md:text-4xl lg:text-5xl">
              {heading}
            </h2>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
          {cards.map((card, i) => (
            <FeatureCard key={i} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, image, heading, description, cta }: Card) {
  return (
    <div
      className={
        'relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-lg md:p-8 ' +
        (image ? 'min-h-[22rem]' : 'bg-card')
      }
    >
      {image ? (
        <>
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
        </>
      ) : null}
      <div className={'relative z-10 ' + (image ? 'text-white' : 'text-foreground')}>
        <div className="mb-5 md:mb-6">
          <Icon className="size-10" />
        </div>
        <h3 className="mb-3 text-xl font-bold md:mb-4 md:text-2xl">{heading}</h3>
        <p className={image ? 'text-white/90' : 'text-muted-foreground'}>{description}</p>
        {cta ? (
          <div className="mt-5 md:mt-6">
            <Link
              href={cta.href}
              className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
            >
              {cta.title}
              <ChevronRight className="size-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
