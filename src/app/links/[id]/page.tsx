'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useI18n } from '@/i18n/context'
import { Navbar } from '@/components/navbar'
import { SortChips } from '@/components/draft/sort-chips'
import { parseSortSteps } from '@/lib/draft'

interface DraftData {
  id: number
  code_url: string
  code_a: string
  code_b: string
  name_a: string
  name_b: string
  stream: boolean
  sort: string
  timer_seconds: number
  status: string
}

const TEAM_A = { color: '#c4862e', bg: 'rgba(141,105,50,0.06)', border: 'rgba(141,105,50,0.20)', faction: '/images/hidden-king-logo.png' }
const TEAM_B = { color: '#6688cc', bg: 'rgba(55,79,153,0.06)', border: 'rgba(55,79,153,0.20)', faction: '/images/archmother-logo.png' }

export default function LinksPage() {
  const params = useParams<{ id: string }>()
  const { t } = useI18n()
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/internal/draft/by-admin/${params.id}`)
      .then((r) => r.json())
      .then(({ data }) => setDraft(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin w-8 h-8 text-muted-foreground" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
          </svg>
        </div>
      </div>
    )
  }

  if (!draft) return null

  const teamAUrl = `${origin}/${draft.code_url}/${draft.code_a}`
  const teamBUrl = `${origin}/${draft.code_url}/${draft.code_b}`
  const streamUrl = `${origin}/${draft.code_url}`
  const masked = `${origin}/●●●●●●●●/●●●●●●●●`
  const maskedStream = `${origin}/●●●●●●●●`

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 pt-12">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-center gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full" style={{ background: TEAM_A.color }} />
              <span className="font-bold text-xl" style={{ color: TEAM_A.color }}>{draft.name_a}</span>
            </div>
            <span className="text-sm text-muted-foreground uppercase tracking-widest font-medium">vs</span>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-xl" style={{ color: TEAM_B.color }}>{draft.name_b}</span>
              <div className="w-3 h-3 rounded-full" style={{ background: TEAM_B.color }} />
            </div>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TeamLinkCard
              name={draft.name_a}
              url={teamAUrl}
              maskedUrl={masked}
              masked={draft.stream}
              team={TEAM_A}
              copied={copied}
              onCopy={copy}
              copyLabel={t('links_copy')}
              copiedLabel={t('links_copied')}
              linkLabel={t('links_link')}
            />
            <TeamLinkCard
              name={draft.name_b}
              url={teamBUrl}
              maskedUrl={masked}
              masked={draft.stream}
              team={TEAM_B}
              copied={copied}
              onCopy={copy}
              copyLabel={t('links_copy')}
              copiedLabel={t('links_copied')}
              linkLabel={t('links_link')}
            />
          </div>

          {/* Stream & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stream URL */}
            <div className="rounded-xl border p-4 space-y-3" style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.20)' }}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" style={{ color: '#a78bfa' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: '#a78bfa' }}>{t('links_stream')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('links_obs_hint')} <code className="px-1 py-0.5 rounded bg-secondary text-[10px]">?bg=chromakey</code>
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(124,58,237,0.05)' }}>
                <span className="flex-1 text-[11px] font-mono truncate text-muted-foreground">
                  {draft.stream ? maskedStream : streamUrl}
                </span>
                <CopyButton url={streamUrl} copied={copied} onCopy={copy} label={t('links_copy')} />
              </div>
            </div>

            {/* Draft info */}
            <div className="rounded-xl border border-border p-4 space-y-3 bg-card/30">
              <span className="text-sm font-semibold">{t('links_draft_info')}</span>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-muted-foreground">{t('links_status')}</span>
                    <p className="font-medium mt-0.5">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{
                          background: draft.status === 'finished' ? 'rgba(74,222,128,0.15)' : draft.status === 'active' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)',
                          color: draft.status === 'finished' ? '#4ade80' : draft.status === 'active' ? '#60a5fa' : 'var(--muted-foreground)',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{
                          background: draft.status === 'finished' ? '#4ade80' : draft.status === 'active' ? '#60a5fa' : 'var(--muted-foreground)',
                        }} />
                        {draft.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('links_timer')}</span>
                    <p className="font-medium mt-0.5">{draft.timer_seconds > 0 ? `${draft.timer_seconds}s` : t('links_timer_off')}</p>
                  </div>
                  {draft.timer_seconds > 0 && (
                    <div>
                      <span className="text-muted-foreground">{t('links_est_duration')}</span>
                      <p className="font-medium mt-0.5">{(() => {
                        const steps = parseSortSteps(draft.sort).length
                        const totalSec = steps * draft.timer_seconds
                        const mins = Math.ceil(totalSec / 60)
                        return `~${mins} min`
                      })()}</p>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">{t('links_format')}</span>
                  <div className="mt-1">
                    <SortChips sortString={draft.sort} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Streamer mode notice */}
          {draft.stream && (
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground px-4 py-2.5 rounded-lg bg-card/30 border border-border/50">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              {t('links_streamer_info')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamLinkCard({ name, url, maskedUrl, masked, team, copied, onCopy, copyLabel, copiedLabel, linkLabel }: {
  name: string
  url: string
  maskedUrl: string
  masked: boolean
  team: typeof TEAM_A
  copied: string | null
  onCopy: (url: string) => void
  copyLabel: string
  copiedLabel: string
  linkLabel: string
}) {
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: team.bg, borderColor: team.border }}>
      {/* Faction logo */}
      <div className="flex justify-center">
        <div
          className="h-7 opacity-30"
          style={{
            backgroundColor: team.color,
            maskImage: `url(${team.faction})`,
            WebkitMaskImage: `url(${team.faction})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            aspectRatio: '4/1',
          }}
        />
      </div>

      {/* Team name */}
      <p className="text-center font-bold text-lg" style={{ color: team.color }}>{name}</p>

      {/* URL + copy */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{linkLabel}</span>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: team.border, background: `${team.bg}` }}>
          <span className="flex-1 text-[11px] font-mono truncate text-muted-foreground">
            {masked ? maskedUrl : url}
          </span>
          <CopyButton url={url} copied={copied} onCopy={onCopy} label={copyLabel} copiedLabel={copiedLabel} size="lg" />
        </div>
      </div>
    </div>
  )
}

function CopyButton({ url, copied, onCopy, label, copiedLabel, size = 'sm' }: {
  url: string
  copied: string | null
  onCopy: (url: string) => void
  label: string
  copiedLabel?: string
  size?: 'sm' | 'lg'
}) {
  const isCopied = copied === url

  if (size === 'lg') {
    return (
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0"
        style={{
          background: isCopied ? 'rgba(74,222,128,0.15)' : 'var(--secondary)',
          color: isCopied ? '#4ade80' : 'var(--muted-foreground)',
        }}
        onClick={() => onCopy(url)}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          {isCopied ? (
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          ) : (
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
          )}
        </svg>
        {isCopied ? (copiedLabel ?? 'Copied!') : label}
      </button>
    )
  }

  return (
    <button
      className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0 cursor-pointer"
      title={label}
      onClick={() => onCopy(url)}
    >
      <svg
        className="w-4 h-4 transition-colors"
        style={{ color: isCopied ? '#4ade80' : '#8ba5a8' }}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        {isCopied ? (
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        ) : (
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        )}
      </svg>
    </button>
  )
}
