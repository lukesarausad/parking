import { useState, useEffect, useRef, useCallback } from 'react'
import { LiveUpdate } from '@seattle-parking/shared'

interface UseWebSocketResult {
  lastUpdate: LiveUpdate | null
  isConnected: boolean
  reconnect: () => void
}

export function useWebSocket(): UseWebSocketResult {
  const [lastUpdate, setLastUpdate] = useState<LiveUpdate | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/live-updates`

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle connection confirmation
          if (data.type === 'connected') {
            console.log('WebSocket connection confirmed:', data.message)
            return
          }

          // Parse timestamp if present
          if (data.timestamp) {
            data.timestamp = new Date(data.timestamp)
          }

          // Parse nested timestamps
          if (data.data?.timestamp) {
            data.data.timestamp = new Date(data.data.timestamp)
          }
          if (data.data?.lastSeen) {
            data.data.lastSeen = new Date(data.data.lastSeen)
          }

          setLastUpdate(data as LiveUpdate)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Attempting to reconnect in ${delay}ms...`)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          console.log('Max reconnection attempts reached')
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setIsConnected(false)
    }
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { lastUpdate, isConnected, reconnect }
}
