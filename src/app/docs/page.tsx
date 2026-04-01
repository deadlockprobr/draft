'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

const SORT_FORMATS = [
  { name: 'Standard (4 bans)', value: 'a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1' },
  { name: 'Mini Tournament (2 bans)', value: 'a#-b#-a1-b2-a2-b1-b1-a2-b2-a1' },
  { name: 'Watchparty (no bans)', value: 'a1-b2-a2-b1-b1-a2-b2-a1' },
  { name: 'Simple (alternating)', value: 'a1-b1-a1-b1-a1-b1-a1-b1-a1-b1-a1-b1' },
  { name: 'Advanced (dual picks)', value: 'a1-b2-a2-b2-a2-b1-a1-b1' },
]

const URLS_INFO = [
  { name: 'Team A Draft Page', path: '/{code_url}/{code_a}', desc: 'Private URL for Team A to pick/ban' },
  { name: 'Team B Draft Page', path: '/{code_url}/{code_b}', desc: 'Private URL for Team B to pick/ban' },
  { name: 'Stream/Spectator', path: '/{code_url}', desc: 'Public view for stream overlays' },
  { name: 'Admin Links', path: '/links/{code_admin}', desc: 'Page with all URLs (only for the organizer)' },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar active="docs" />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
            <p className="text-muted-foreground">
              The Deadlock Draft API allows you to create draft sessions and retrieve results.
              When a draft finishes, the result is sent to your webhook URL automatically.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Base URL:</span>
              <code className="px-2 py-0.5 rounded bg-secondary text-xs font-mono">
                https://draft.deadlock.pro.br
              </code>
            </div>
          </div>

          {/* Rate limits & retention */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-card/50 border-b border-border/50">
                <h3 className="text-sm font-bold">Rate Limits</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Per IP address. Headers <code className="px-1 py-0.5 rounded bg-secondary text-[10px]">RateLimit-*</code> included in responses.</p>
              </div>
              <div className="divide-y divide-border/50">
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.2)', color: '#60a5fa' }}>POST</span>
                    <span className="text-sm">Create draft</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">20 req / 5 min</span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>GET</span>
                    <span className="text-sm">Read</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">120 req / min</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-card/50 border-b border-border/50">
                <h3 className="text-sm font-bold">Data Retention</h3>
              </div>
              <div className="px-4 py-4 space-y-2 text-sm text-muted-foreground">
                <p>Drafts are automatically deleted after <strong className="text-foreground">2 months</strong>.</p>
                <p>Use the webhook to persist results on your side.</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">How it works</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>You create a draft via the API, providing team names, format, and a <code className="px-1 py-0.5 rounded bg-secondary text-xs">callback_url</code>.</li>
              <li>The API returns URLs for each team, a stream view, and an admin page.</li>
              <li>Share the team URLs with the captains. They pick and ban heroes in real-time.</li>
              <li>When the draft finishes, the server sends a <strong>POST webhook</strong> to your <code className="px-1 py-0.5 rounded bg-secondary text-xs">callback_url</code> with the full result.</li>
            </ol>
          </section>

          {/* Endpoints */}
          <section className="space-y-8">
            <h2 className="text-xl font-bold">Endpoints</h2>

            {/* POST /api/draft */}
            <EndpointCard
              method="POST"
              path="/api/draft"
              title="Create a Draft"
              description="Creates a new draft session. Returns all codes needed to share with teams."
              body={`{
  "name_a": "Team Alpha",
  "name_b": "Team Bravo",
  "sort": "a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1",
  "stream": false,
  "timer_seconds": 30,
  "callback_url": "https://your-server.com/webhook/draft"
}`}
              bodyFields={[
                { name: 'name_a', type: 'string', required: true, desc: 'Name of Team A' },
                { name: 'name_b', type: 'string', required: true, desc: 'Name of Team B' },
                { name: 'sort', type: 'string', required: true, desc: 'Draft format string (see Sort Formats below)' },
                { name: 'stream', type: 'boolean', required: false, desc: 'Enable streamer mode (masks URLs). Default: false' },
                { name: 'timer_seconds', type: 'number', required: false, desc: 'Seconds per turn. 0 = no timer. Default: 30' },
                { name: 'callback_url', type: 'string', required: false, desc: 'URL to receive a POST webhook when the draft finishes' },
              ]}
              response={`{
  "data": {
    "id": 1,
    "code_url": "aB3xK9mQ",
    "code_admin": "xY7kL2nP9wRt",
    "code_a": "qW8eR5tY",
    "code_b": "uI0oP3aS",
    "name_a": "Team Alpha",
    "name_b": "Team Bravo",
    "sort": "a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1",
    "stream": false,
    "ready_a": false,
    "ready_b": false,
    "items": "[]",
    "timer_seconds": 30,
    "callback_url": "https://your-server.com/webhook/draft",
    "status": "waiting",
    "cover": "https://draft.deadlock.pro.br/aB3xK9mQ/cover"
  }
}`}
            />

            {/* GET /api/draft/:code */}
            <EndpointCard
              method="GET"
              path="/api/draft/:code_url"
              title="Get Draft by Code"
              description="Retrieve the current state of a draft using the code_url returned from creation. Sensitive fields (team codes, admin code, callback URL) are stripped from the response."
              response={`{
  "data": {
    "id": 1,
    "code_url": "aB3xK9mQ",
    "name_a": "Team Alpha",
    "name_b": "Team Bravo",
    "sort": "a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1",
    "stream": false,
    "ready_a": true,
    "ready_b": true,
    "status": "active",
    "items": [
      { "type": "ban", "team": "a", "hero": { "key": 13 }, "order": 1 },
      { "type": "ban", "team": "b", "hero": { "key": 7 }, "order": 2 },
      ...
    ],
    "timer_seconds": 30,
    "created_at": "2026-03-30 20:00:00",
    "cover": "https://draft.deadlock.pro.br/aB3xK9mQ/cover"
  }
}`}
            />
          </section>

          {/* Webhook */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Webhook</h2>
            <p className="text-sm text-muted-foreground">
              When a draft finishes (all picks and bans are completed), the server sends a <strong>POST</strong> request
              to the <code className="px-1 py-0.5 rounded bg-secondary text-xs">callback_url</code> you provided during creation.
              This happens for both manual completions and auto-picks from timer expiry.
            </p>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Webhook Payload</h4>
              <CodeBlock code={`{
  "event": "draft.finished",
  "draft": {
    "id": 1,
    "code_url": "aB3xK9mQ",
    "cover": "https://draft.deadlock.pro.br/aB3xK9mQ/cover",
    "name_a": "Team Alpha",
    "name_b": "Team Bravo",
    "sort": "a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1",
    "status": "finished",
    "items": [
      { "type": "ban", "team": "a", "hero": { "key": 13, "collection": "deadlock_heroes" }, "order": 1 },
      { "type": "ban", "team": "b", "hero": { "key": 7, "collection": "deadlock_heroes" }, "order": 2 },
      { "type": "pick", "team": "a", "hero": { "key": 1, "collection": "deadlock_heroes" }, "order": 3 },
      { "type": "pick", "team": "b", "hero": { "key": 19, "collection": "deadlock_heroes" }, "order": 4 },
      { "type": "pick", "team": "b", "hero": { "key": 35, "collection": "deadlock_heroes" }, "order": 5 },
      ...
    ],
    "created_at": "2026-03-30 20:00:00"
  }
}`} />
            </div>
            <div className="rounded-xl border border-border/50 bg-card/30 p-4 text-sm space-y-2">
              <p className="font-medium">Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Items with <code className="px-1 py-0.5 rounded bg-secondary text-xs">auto: true</code> were auto-picked by the timer.</li>
                <li>The <code className="px-1 py-0.5 rounded bg-secondary text-xs">hero.key</code> corresponds to the hero ID from the <a href="https://assets.deadlock-api.com/v2/heroes" target="_blank" className="underline">Deadlock Heroes API</a>.</li>
                <li>The webhook is fire-and-forget. If your server is down, the payload is not retried.</li>
              </ul>
            </div>
          </section>

          {/* URLs */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Draft URLs</h2>
            <p className="text-sm text-muted-foreground">
              After creating a draft, use the returned codes to build URLs:
            </p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="text-left px-4 py-2.5 font-semibold">Page</th>
                    <th className="text-left px-4 py-2.5 font-semibold">URL</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {URLS_INFO.map((u) => (
                    <tr key={u.name} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2.5 font-medium">{u.name}</td>
                      <td className="px-4 py-2.5">
                        <code className="text-xs font-mono text-muted-foreground">{u.path}</code>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{u.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sort formats */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Sort Formats</h2>
            <p className="text-sm text-muted-foreground">
              The <code className="px-1 py-0.5 rounded bg-secondary text-xs">sort</code> field
              defines the pick/ban order. Each block is separated by <code className="px-1 py-0.5 rounded bg-secondary text-xs">-</code> and
              follows the format: <code className="px-1 py-0.5 rounded bg-secondary text-xs">[team][count_or_#]</code>
            </p>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p><code className="px-1 py-0.5 rounded bg-secondary text-xs">a#</code> = Team A bans 1 hero</p>
              <p><code className="px-1 py-0.5 rounded bg-secondary text-xs">b2</code> = Team B picks 2 heroes in a row</p>
              <p><code className="px-1 py-0.5 rounded bg-secondary text-xs">a1</code> = Team A picks 1 hero</p>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="text-left px-4 py-2.5 font-semibold">Format</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Sort String</th>
                  </tr>
                </thead>
                <tbody>
                  {SORT_FORMATS.map((s) => (
                    <tr key={s.value} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2.5 font-medium">{s.name}</td>
                      <td className="px-4 py-2.5">
                        <code className="text-xs font-mono text-muted-foreground">{s.value}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Example */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Quick Example</h2>
            <CodeBlock code={`// 1. Create a draft with a webhook
const res = await fetch('https://draft.deadlock.pro.br/api/draft', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name_a: 'Team Alpha',
    name_b: 'Team Bravo',
    sort: 'a#-b#-a1-b2-a2-b1-b#-a#-b1-a2-b2-a1',
    timer_seconds: 30,
    callback_url: 'https://your-server.com/webhook/draft',
  }),
})

const { data } = await res.json()

// 2. Share the URLs with teams:
//    Team A: https://draft.deadlock.pro.br/\${data.code_url}/\${data.code_a}
//    Team B: https://draft.deadlock.pro.br/\${data.code_url}/\${data.code_b}
//    Stream: https://draft.deadlock.pro.br/\${data.code_url}

// 3. Poll the status (optional):
//    GET https://draft.deadlock.pro.br/api/draft/\${data.code_url}

// 4. When the draft finishes, your webhook receives:
//    POST https://your-server.com/webhook/draft
//    { "event": "draft.finished", "draft": { ... } }`} />
          </section>
        </div>
      </main>

      <Footer showStats />
    </div>
  )
}

function EndpointCard({ method, path, title, description, body, bodyFields, response }: {
  method: string
  path: string
  title: string
  description: string
  body?: string
  bodyFields?: { name: string; type: string; required: boolean; desc: string }[]
  response?: string
}) {
  const [expanded, setExpanded] = useState(true)
  const methodColor = { GET: '#4ade80', POST: '#60a5fa', PATCH: '#fbbf24', DELETE: '#f87171' }[method] ?? '#8ba5a8'

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer text-left"
      >
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ background: `${methodColor}20`, color: methodColor }}
        >
          {method}
        </span>
        <code className="text-sm font-mono flex-1">{path}</code>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 py-4 space-y-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">{description}</p>
          {body && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request Body</h4>
              <CodeBlock code={body} />
            </div>
          )}
          {bodyFields && (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-card/30">
                    <th className="text-left px-3 py-2 font-semibold">Field</th>
                    <th className="text-left px-3 py-2 font-semibold">Type</th>
                    <th className="text-left px-3 py-2 font-semibold">Required</th>
                    <th className="text-left px-3 py-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {bodyFields.map((f) => (
                    <tr key={f.name} className="border-b border-border/30 last:border-0">
                      <td className="px-3 py-2 font-mono">{f.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{f.type}</td>
                      <td className="px-3 py-2">{f.required ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {response && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Response</h4>
              <CodeBlock code={response} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <div className="relative group">
      <pre className="rounded-lg bg-secondary/60 border border-border/50 p-4 overflow-x-auto text-xs font-mono leading-relaxed">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/80 border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 transition-colors" style={{ color: copied ? '#4ade80' : 'var(--muted-foreground)' }} viewBox="0 0 24 24" fill="currentColor">
          {copied ? (
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          ) : (
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
          )}
        </svg>
      </button>
    </div>
  )
}

