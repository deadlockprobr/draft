import { ImageResponse } from '@vercel/og'
import { getDraftByCodeUrl } from '@/lib/db'
import { HEROES_API_URL } from '@/lib/draft'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const WIDTH = 1200
const HEIGHT = 630

interface HeroData {
  id: number
  name: string
  images?: {
    top_bar_vertical_image?: string
    hero_card_critical?: string
  }
}

function getHeroImage(hero?: HeroData, banned = false) {
  if (!hero?.images) return null
  if (banned) return hero.images.hero_card_critical ?? hero.images.top_bar_vertical_image ?? null
  return hero.images.top_bar_vertical_image ?? null
}

function loadLogoBase64(filename: string): string {
  try {
    const buf = readFileSync(join(process.cwd(), 'public/images', filename))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch { return '' }
}

const hiddenKingLogo = loadLogoBase64('hidden-king-logo.png')
const archmotherLogo = loadLogoBase64('archmother-logo.png')

export async function GET(_req: Request, { params }: { params: Promise<{ code_url: string }> }) {
  const { code_url } = await params

  let name_a = 'Team A'
  let name_b = 'Team B'
  let status = 'waiting'
  let items: any[] = []

  try {
    const draft = getDraftByCodeUrl(code_url)
    if (draft) {
      name_a = draft.name_a
      name_b = draft.name_b
      status = draft.status
      items = JSON.parse(draft.items || '[]')
    }
  } catch {}

  const heroMap = new Map<number, HeroData>()
  try {
    const res = await fetch(HEROES_API_URL, { next: { revalidate: 3600 } })
    const heroes: HeroData[] = await res.json()
    heroes.forEach(h => heroMap.set(h.id, h))
  } catch {}

  const picksA = items.filter((i: any) => i.team === 'a' && i.type === 'pick')
  const picksB = items.filter((i: any) => i.team === 'b' && i.type === 'pick')

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0c0e15', fontFamily: 'system-ui, sans-serif' }}>
        {/* Top color bar */}
        <div style={{ display: 'flex', height: 4 }}>
          <div style={{ flex: 1, background: '#c4862e' }} />
          <div style={{ flex: 1, background: '#6688cc' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', padding: '20px 40px' }}>
          {/* Team A */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {hiddenKingLogo && (
              <img src={hiddenKingLogo} height={60} style={{ opacity: 0.25 }} />
            )}
            <span style={{ fontSize: 32, fontWeight: 800, color: '#c4862e' }}>{name_a}</span>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {picksA.map((item: any, i: number) => {
                const hero = heroMap.get(item.hero?.key)
                const img = getHeroImage(hero)
                return (
                  <div key={i} style={{ width: 80, height: 120, borderRadius: 8, overflow: 'hidden', background: '#1a1d2e', border: '2px solid rgba(196,134,46,0.35)', display: 'flex', position: 'relative' }}>
                    {img ? <img src={img} width={80} height={120} style={{ objectFit: 'cover' }} /> : null}
                    {hero && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 4px 5px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', display: 'flex', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>{hero.name}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 60, gap: 8 }}>
            <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#444', letterSpacing: 3 }}>VS</span>
            <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Team B */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {archmotherLogo && (
              <img src={archmotherLogo} height={60} style={{ opacity: 0.25 }} />
            )}
            <span style={{ fontSize: 32, fontWeight: 800, color: '#6688cc' }}>{name_b}</span>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {picksB.map((item: any, i: number) => {
                const hero = heroMap.get(item.hero?.key)
                const img = getHeroImage(hero)
                return (
                  <div key={i} style={{ width: 80, height: 120, borderRadius: 8, overflow: 'hidden', background: '#1a1d2e', border: '2px solid rgba(102,136,204,0.35)', display: 'flex', position: 'relative' }}>
                    {img ? <img src={img} width={80} height={120} style={{ objectFit: 'cover' }} /> : null}
                    {hero && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 4px 5px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', display: 'flex', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>{hero.name}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#555', letterSpacing: 1 }}>draft.deadlock.pro.br</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  )
}
