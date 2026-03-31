import type { Metadata } from 'next'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { I18nProvider } from '@/i18n/context'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: 'Deadlock Draft - Pick & Ban Tool',
    template: '%s - Deadlock Draft',
  },
  description: 'Real-time pick & ban draft tool for Deadlock competitive matches. Stream-friendly, customizable formats, and auto-timers.',
  icons: {
    icon: '/images/favicon.png',
  },
  openGraph: {
    title: 'Deadlock Draft - Pick & Ban Tool',
    description: 'Real-time pick & ban draft tool for Deadlock competitive matches.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={cn("dark", "font-sans", geist.variable)}>
      <body className="min-h-screen antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
