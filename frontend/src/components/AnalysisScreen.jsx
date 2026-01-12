import { useState, useEffect, useCallback, useRef } from 'react'
import useWebSocket from '../hooks/useWebSocket'
import { playWarningWithCooldown, playCompleteSound } from '../utils/audio'

// Circular Progress Bar
const CircularProgress = ({ value, max, size = 180, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.max(0, Math.min(1, value / max))
  const offset = circumference - progress * circumference
  
  // Kalan süreyi formatla
  const remaining = Math.max(0, max - value)
  const minutes = Math.floor(remaining / 60)
  const seconds = Math.floor(remaining % 60)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="circular-progress" width={size} height={size}>
        {/* Arka plan çember */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={strokeWidth}
        />
        {/* İlerleme çemberi */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300"
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C83FD" />
            <stop offset="100%" stopColor="#96E6A1" />
          </linearGradient>
        </defs>
      </svg>
      {/* Ortadaki süre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white font-display">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-white/70 text-sm">kalan süre</span>
      </div>
    </div>
  )
}

// Durum kartı
const StatusCard = ({ status, depthDiff }) => {
  const isGood = status === 'IYI'
  
  return (
    <div className={`glass rounded-2xl p-4 transition-all duration-300 ${
      isGood 
        ? 'border-2 border-green-400 bg-green-50/50' 
        : 'border-2 border-orange-400 bg-orange-50/50 animate-pulse'
    }`}>
      <div className="text-center">
        <span className="text-3xl mb-1 block">
          {isGood ? '✅' : '⚠️'}
        </span>
        <p className={`font-bold text-lg ${isGood ? 'text-green-600' : 'text-orange-600'}`}>
          POSTÜR: {status || '...'}
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Fark: <span className="font-mono font-bold">{depthDiff?.toFixed(1) || 0}mm</span>
        </p>
      </div>
    </div>
  )
}

// İstatistik göstergesi
const StatIndicator = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2">
    <span className="text-xl">{icon}</span>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-bold ${color}`}>{value}</p>
    </div>
  </div>
)

// Süre formatla
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins > 0) {
    return `${mins}dk ${secs}sn`
  }
  return `${secs}sn`
}

export default function AnalysisScreen({ duration, onComplete, onCancel }) {
  const { isConnected, lastMessage, error } = useWebSocket()
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [frameImage, setFrameImage] = useState(null)
  const [showWarning, setShowWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const hasCompletedRef = useRef(false)

  // Oturumu başlat
  useEffect(() => {
    const startSession = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration_minutes: duration,
            warning_threshold: 7.0
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          console.log('✅ Oturum başlatıldı:', data.session_id)
          setSessionStarted(true)
        } else {
          console.error('❌ Oturum başlatılamadı:', data.message)
          alert(data.message)
          onCancel()
        }
      } catch (e) {
        console.error('❌ API hatası:', e)
        alert('Sunucuya bağlanılamadı. Backend çalışıyor mu?')
        onCancel()
      } finally {
        setIsLoading(false)
      }
    }

    startSession()

    // Cleanup
    return () => {
      // Component unmount olurken oturumu durdur
      if (sessionStarted && !hasCompletedRef.current) {
        fetch('/api/session/stop', { method: 'POST' }).catch(() => {})
      }
    }
  }, [duration, onCancel])

  // WebSocket mesajlarını işle
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'frame') {
      // Frame verisi
      setSessionData({
        status: lastMessage.status,
        depthDiff: lastMessage.depth_diff,
        leftShoulderDepth: lastMessage.left_shoulder_depth,
        rightShoulderDepth: lastMessage.right_shoulder_depth,
        chestDepth: lastMessage.chest_depth,
        warningActive: lastMessage.warning_active,
        badPostureSeconds: lastMessage.bad_posture_seconds,
        elapsedTime: lastMessage.elapsed_time,
        remainingTime: lastMessage.remaining_time,
        stats: lastMessage.stats
      })

      // Frame görüntüsü
      if (lastMessage.frame_base64) {
        setFrameImage(`data:image/jpeg;base64,${lastMessage.frame_base64}`)
      }

      // Uyarı kontrolü
      if (lastMessage.warning_active) {
        setShowWarning(true)
        playWarningWithCooldown()
      } else {
        setShowWarning(false)
      }
    } else if (lastMessage.type === 'completed') {
      // Oturum tamamlandı
      hasCompletedRef.current = true
      playCompleteSound()
      onComplete(lastMessage.result)
    } else if (lastMessage.type === 'error') {
      console.error('WebSocket hatası:', lastMessage.message)
    }
  }, [lastMessage, onComplete])

  // Oturumu bitir
  const handleStop = async () => {
    try {
      const response = await fetch('/api/session/stop', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        hasCompletedRef.current = true
        playCompleteSound()
        onComplete(data.result)
      }
    } catch (e) {
      console.error('Durdurma hatası:', e)
      onCancel()
    }
  }

  // Yükleniyor ekranı
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-postur-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Kamera başlatılıyor...</p>
        </div>
      </div>
    )
  }

  // Bağlantı bekleniyor
  if (!isConnected && sessionStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-postur-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Kameraya bağlanılıyor...</p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    )
  }

  const totalSeconds = duration * 60
  const elapsedTime = sessionData?.elapsedTime || 0

  return (
    <div className="min-h-screen relative">
      {/* Uyarı overlay */}
      {showWarning && (
        <div className="fixed inset-0 bg-red-500/30 warning-overlay z-40 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass-dark rounded-3xl p-8 text-center animate-shake">
              <span className="text-6xl block mb-4">⚠️</span>
              <h2 className="text-white text-3xl font-bold mb-2 animate-pulse">
                Duruşunu Düzelt!
              </h2>
              <p className="text-white/80">
                {sessionData?.badPostureSeconds?.toFixed(1)}s kötü postürdesin
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ana içerik */}
      <div className="container mx-auto px-4 py-6">
        {/* Üst bar - Timer */}
        <div className="flex justify-center mb-6">
          <div className="glass rounded-3xl p-4 shadow-glass">
            <CircularProgress 
              value={elapsedTime} 
              max={totalSeconds} 
            />
          </div>
        </div>

        {/* Ortadaki içerik */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol panel - İstatistikler */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                <span>📊</span> Canlı İstatistikler
              </h3>
              <div className="space-y-3">
                <StatIndicator 
                  icon="✅" 
                  label="Düzgün Süre" 
                  value={formatTime(sessionData?.stats?.good_posture_time || 0)}
                  color="text-green-600"
                />
                <StatIndicator 
                  icon="❌" 
                  label="Bozuk Süre" 
                  value={formatTime(sessionData?.stats?.bad_posture_time || 0)}
                  color="text-red-500"
                />
                <StatIndicator 
                  icon="⚠️" 
                  label="Uyarı Sayısı" 
                  value={`${sessionData?.stats?.warning_count || 0} kez`}
                  color="text-orange-500"
                />
              </div>
            </div>

            {/* Uyarı geri sayım */}
            {sessionData?.status === 'KOTU' && !sessionData?.warningActive && (
              <div className="glass rounded-2xl p-4 border-2 border-orange-300 bg-orange-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="text-sm text-gray-600">Uyarıya kalan</p>
                    <p className="font-bold text-orange-600 text-xl">
                      {Math.max(0, 7 - (sessionData?.badPostureSeconds || 0)).toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Orta - Kamera görüntüsü */}
          <div className="lg:col-span-1">
            <div className="glass rounded-3xl overflow-hidden shadow-glass">
              {frameImage ? (
                <img 
                  src={frameImage} 
                  alt="Kamera görüntüsü"
                  className="w-full h-auto"
                />
              ) : (
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <span className="text-4xl block mb-2">📷</span>
                    <p>Kamera bekleniyor...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Derinlik değerleri */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="glass rounded-xl p-2 text-center">
                <span className="text-blue-500 text-sm font-medium">Sol Omuz</span>
                <p className="font-mono font-bold">{sessionData?.leftShoulderDepth || 0}mm</p>
              </div>
              <div className="glass rounded-xl p-2 text-center">
                <span className="text-orange-500 text-sm font-medium">Göğüs</span>
                <p className="font-mono font-bold">{sessionData?.chestDepth || 0}mm</p>
              </div>
              <div className="glass rounded-xl p-2 text-center">
                <span className="text-blue-500 text-sm font-medium">Sağ Omuz</span>
                <p className="font-mono font-bold">{sessionData?.rightShoulderDepth || 0}mm</p>
              </div>
            </div>
          </div>

          {/* Sağ panel - Durum */}
          <div className="space-y-4">
            <StatusCard 
              status={sessionData?.status} 
              depthDiff={sessionData?.depthDiff}
            />

            {/* İpucu */}
            <div className="glass rounded-2xl p-4">
              <h3 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
                <span>💡</span> İpucu
              </h3>
              <p className="text-gray-600 text-sm">
                {sessionData?.status === 'IYI' 
                  ? 'Harika gidiyorsun! Omuzların güzelce arkada. 💪'
                  : 'Omuzlarını geriye çek ve göğsünü öne aç. Sandalyene yaslan! 🪑'
                }
              </p>
            </div>

            {/* Bitir butonu */}
            <button
              onClick={handleStop}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gray-100 hover:bg-gray-200 
                         text-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <span>🛑</span>
              <span>Çalışmayı Bitir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bağlantı durumu */}
      <div className="fixed bottom-4 right-4">
        <div className={`glass rounded-full px-4 py-2 flex items-center gap-2 text-sm ${
          isConnected ? 'text-green-600' : 'text-red-500'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
          {isConnected ? 'Bağlı' : 'Bağlantı kesildi'}
        </div>
      </div>
    </div>
  )
}

