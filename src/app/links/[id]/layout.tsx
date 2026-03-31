import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Draft Links',
  description: 'Share draft links with your teams and stream.',
}

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children
}
