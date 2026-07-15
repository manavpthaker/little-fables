import type { ReactNode } from 'react'

type Props = {
  heading: string
  description: string
  actions: ReactNode
  image?: { src: string; alt?: string }
}

export function Hero({ heading, description, actions, image }: Props) {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="px-[5%] pt-16 pb-8 md:pt-24 md:pb-12 lg:pt-28">
        <div className="container mx-auto">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h1 className="mb-5 text-4xl font-bold tracking-tight text-foreground md:mb-6 md:text-5xl lg:text-6xl">
              {heading}
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">{description}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-10">
              {actions}
            </div>
          </div>
        </div>
      </div>
      {image ? (
        <div className="px-[5%] pb-16 md:pb-24 lg:pb-28">
          <div className="container mx-auto">
            <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border shadow-xl">
              <img
                src={image.src}
                alt={image.alt ?? ''}
                className="aspect-video size-full object-cover"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
