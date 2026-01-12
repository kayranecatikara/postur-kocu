import { useState, useEffect, useCallback, useRef } from 'react'

const WS_URL = 'ws://localhost:8000/ws/posture'
const RECONNECT_INTERVAL = 3000

export default function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const shouldReconnectRef = useRef(true)

  // WebSocket bağlantısı kur
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      console.log('🔌 WebSocket bağlanıyor...')
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('✅ WebSocket bağlandı')
        setIsConnected(true)
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
        } catch (e) {
          console.error('JSON parse hatası:', e)
        }
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket kapandı:', event.code, event.reason)
        setIsConnected(false)
        
        // Otomatik yeniden bağlan
        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, RECONNECT_INTERVAL)
        }
      }

      ws.onerror = (event) => {
        console.error('❌ WebSocket hatası:', event)
        setError('Bağlantı hatası oluştu')
        setIsConnected(false)
      }

      wsRef.current = ws
    } catch (e) {
      console.error('WebSocket oluşturma hatası:', e)
      setError('Bağlantı kurulamadı')
    }
  }, [])

  // Bağlantıyı kapat
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  // Component mount olduğunda bağlan
  useEffect(() => {
    shouldReconnectRef.current = true
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    error,
    connect,
    disconnect
  }
}

