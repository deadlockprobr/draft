import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'API documentation for the Deadlock Draft tool. Create drafts, retrieve results, and receive webhooks.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
