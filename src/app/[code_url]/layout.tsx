import type { Metadata } from 'next'
import { getDraftByCodeUrl } from '@/lib/db'

export async function generateMetadata({ params }: { params: Promise<{ code_url: string }> }): Promise<Metadata> {
  const { code_url } = await params

  let name_a = 'Team A'
  let name_b = 'Team B'

  try {
    const draft = getDraftByCodeUrl(code_url)
    if (draft) {
      name_a = draft.name_a
      name_b = draft.name_b
    }
  } catch {}

  const title = `${name_a} vs ${name_b}`
  const description = `Live draft - ${name_a} vs ${name_b} on Deadlock Draft`
  const coverUrl = `/${code_url}/cover`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: coverUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverUrl],
    },
  }
}

export default function StreamLayout({ children }: { children: React.ReactNode }) {
  return children
}
