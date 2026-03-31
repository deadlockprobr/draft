'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SortChips } from '@/components/draft/sort-chips'
import { Navbar } from '@/components/navbar'
import { useI18n } from '@/i18n/context'
import type { TranslationKey } from '@/i18n'

const SORT_OPTIONS: { value: string; titleKey: TranslationKey; subtitleKey: TranslationKey }[] = [
  { value: 'a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1', titleKey: 'sort_standard', subtitleKey: 'sort_standard_desc' },
  { value: 'a#-b#-a1-b2-a2-b1-b1-a2-b2-a1', titleKey: 'sort_mini', subtitleKey: 'sort_mini_desc' },
  { value: 'a1-b2-a2-b1-b1-a2-b2-a1', titleKey: 'sort_watchparty', subtitleKey: 'sort_watchparty_desc' },
  { value: 'a1-b1-a1-b1-a1-b1-a1-b1-a1-b1-a1-b1', titleKey: 'sort_simple', subtitleKey: 'sort_simple_desc' },
  { value: 'a1-b2-a2-b2-a2-b1-a1-b1', titleKey: 'sort_advanced', subtitleKey: 'sort_advanced_desc' },
]

const TIMER_OPTIONS = [
  { value: 0, labelKey: 'setup_no_timer' as TranslationKey },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
]

export default function SetupPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [sort, setSort] = useState(SORT_OPTIONS[0].value)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [streamMode, setStreamMode] = useState(false)
  const [creating, setCreating] = useState(false)

  const canStart = teamA.trim() && teamB.trim() && !creating

  async function handleStart() {
    if (!canStart) return
    setCreating(true)

    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_a: teamA.trim(),
          name_b: teamB.trim(),
          sort,
          stream: streamMode,
          timer_seconds: timerSeconds,
        }),
      })
      const { data } = await res.json()
      router.push(`/links/${data.code_admin}`)
    } catch {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar active="new" />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-3">
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-border">
            {/* Left: Team inputs + timer + start */}
            <div className="p-6 flex flex-col justify-center gap-4">
              <div className="space-y-1.5">
                <Label style={{ color: 'var(--team-a)' }}>{t('setup_team_a')}</Label>
                <Input
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  placeholder={t('setup_team_a')}
                  style={{ background: 'rgba(196,134,46,0.12)', borderColor: 'rgba(196,134,46,0.3)' }}
                />
              </div>

              <div className="space-y-1.5">
                <Label style={{ color: 'var(--team-b)' }}>{t('setup_team_b')}</Label>
                <Input
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  placeholder={t('setup_team_b')}
                  style={{ background: 'rgba(102,136,204,0.12)', borderColor: 'rgba(102,136,204,0.3)' }}
                />
              </div>

              {/* Timer selector */}
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">{t('setup_timer')}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TIMER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTimerSeconds(opt.value)}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer"
                      style={{
                        background: timerSeconds === opt.value ? 'var(--primary)' : 'var(--secondary)',
                        color: timerSeconds === opt.value ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      {'labelKey' in opt ? t(opt.labelKey as TranslationKey) : opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stream toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                  style={{ background: streamMode ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}
                  onClick={() => setStreamMode(!streamMode)}
                >
                  <div
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{ transform: streamMode ? 'translateX(1rem)' : '' }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {streamMode ? t('setup_streamer_on') : t('setup_streamer_off')}
                </span>
              </label>

              <Button
                disabled={!canStart}
                onClick={handleStart}
                className="w-full"
                style={canStart ? { background: 'linear-gradient(135deg, #c4862e 0%, #6688cc 100%)', color: '#fff' } : undefined}
              >
                {creating ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                ) : t('setup_start')}
              </Button>
            </div>

            {/* Right: Sort options */}
            <div className="p-6 flex flex-col gap-2 border-t border-border md:border-t-0">
              <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: 400, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}>
                {SORT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors border"
                    style={{
                      borderColor: sort === opt.value ? 'rgba(196,134,46,0.3)' : 'transparent',
                      background: sort === opt.value ? 'rgba(255,255,255,0.06)' : '',
                    }}
                  >
                    <input
                      type="radio"
                      name="sort"
                      value={opt.value}
                      checked={sort === opt.value}
                      onChange={() => setSort(opt.value)}
                      className="sr-only"
                    />
                    <SortChips sortString={opt.value} className="w-24 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{t(opt.titleKey)}</p>
                      <p className="text-xs text-muted-foreground">{t(opt.subtitleKey)}</p>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                      style={{ borderColor: sort === opt.value ? 'var(--team-a)' : 'var(--border)' }}
                    >
                      {sort === opt.value && (
                        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--team-a)' }} />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
