import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Draft',
  description: 'Create a new pick & ban draft session for Deadlock competitive matches.',
}

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return children
}
