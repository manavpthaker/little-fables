import Link from 'next/link'
import { Instagram, Youtube, Twitter } from 'lucide-react'

type LinkItem = { title: string; url: string }
type Social = { url: string; icon: React.ReactNode; label: string }

type Props = {
  brand: string
  tagline: string
  contact: { label: string; email: string }
  columnLinks: { links: LinkItem[] }[]
  socials: Social[]
  footerText: string
  footerLinks: LinkItem[]
}

export function Footer(props: Partial<Props>) {
  const {
    brand,
    tagline,
    contact,
    columnLinks,
    socials,
    footerText,
    footerLinks,
  } = { ...defaults, ...props }

  return (
    <footer className="border-t bg-background px-[5%] py-12 md:py-16 lg:py-20">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-x-[4vw] gap-y-12 pb-10 md:pb-14 lg:grid-cols-[1fr_0.5fr] lg:pb-16">
          <div>
            <Link href="/" className="mb-6 inline-block text-xl font-bold md:mb-8">
              {brand}
            </Link>
            <p className="mb-6 text-sm text-muted-foreground md:mb-8 md:max-w-md">{tagline}</p>
            <div className="mb-6 flex flex-col gap-1 md:mb-8">
              <p className="text-sm font-semibold">{contact.label}</p>
              <a href={`mailto:${contact.email}`} className="text-sm underline">
                {contact.email}
              </a>
            </div>
            <div className="flex items-center gap-3">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  aria-label={s.label}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 items-start gap-x-8 gap-y-10 sm:grid-cols-2 md:gap-y-4">
            {columnLinks.map((col, i) => (
              <ul key={i}>
                {col.links.map((link, j) => (
                  <li key={j} className="py-2 text-sm font-semibold">
                    <Link href={link.url} className="hover:underline">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        <div className="h-px w-full bg-border" />
        <div className="flex flex-col-reverse items-start justify-between pt-6 pb-4 text-sm md:flex-row md:items-center md:pt-8 md:pb-0">
          <p className="mt-8 text-muted-foreground md:mt-0">{footerText}</p>
          <ul className="grid grid-cols-[max-content] gap-y-4 text-sm md:grid-flow-col md:gap-x-6 md:gap-y-0">
            {footerLinks.map((link, i) => (
              <li key={i} className="text-muted-foreground underline">
                <Link href={link.url}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

const defaults: Props = {
  brand: 'Little Fables',
  tagline: 'AI-illustrated read-aloud stories, made for little ones.',
  contact: { label: 'Say hello', email: 'hello@littlefables.ai' },
  columnLinks: [
    {
      links: [
        { title: 'Read', url: '/read' },
        { title: 'Create', url: '/story/create' },
        { title: 'Dashboard', url: '/dashboard' },
      ],
    },
    {
      links: [
        { title: 'About', url: '#' },
        { title: 'Privacy', url: '#' },
        { title: 'Terms', url: '#' },
      ],
    },
  ],
  socials: [
    { url: '#', label: 'Instagram', icon: <Instagram className="size-5" /> },
    { url: '#', label: 'YouTube', icon: <Youtube className="size-5" /> },
    { url: '#', label: 'Twitter', icon: <Twitter className="size-5" /> },
  ],
  footerText: `© ${new Date().getFullYear()} Little Fables. Made with care.`,
  footerLinks: [
    { title: 'Privacy', url: '#' },
    { title: 'Terms', url: '#' },
  ],
}
