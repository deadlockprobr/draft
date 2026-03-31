'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export interface SiteStats {
  created24h: number
  totalFinished: number
  usersOnline: number
}

export function useStats() {
  const [stats, setStats] = useState<SiteStats | null>(null)

  useEffect(() => {
    const socket = io({ path: '/ws' })

    socket.on('stats', (data: SiteStats) => {
      setStats(data)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return stats
}
