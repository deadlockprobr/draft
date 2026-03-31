'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export interface DraftState {
  id: number
  code_url: string
  code_a: string
  code_b: string
  name_a: string
  name_b: string
  sort: string
  stream: boolean
  ready_a: boolean
  ready_b: boolean
  items: any[]
  steps: any[]
  timer: number | null
  timer_seconds: number
  status: 'waiting' | 'active' | 'finished'
}

export function useDraftWs(codeUrl: string) {
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io({ path: '/ws' })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('subscribe', codeUrl)
    })

    socket.on('draft:update', (data) => {
      setDraft(data)
    })

    socket.on('draft:timer', (data) => {
      setDraft((prev) => prev ? { ...prev, timer: data.remaining } : prev)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [codeUrl])

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data)
  }

  return { draft, connected, emit }
}
