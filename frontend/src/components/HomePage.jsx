import { useState, useEffect } from 'react'

// Intel RealSense D435 Kamera SVG Logo
const PostureIcon = () => (
  <svg viewBox="0 0 280 200" className="w-72 h-52 animate-float">
    <defs>
      {/* Gradient'ler */}
      <linearGradient id="cameraBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#f5f5f5' }} />
        <stop offset="50%" style={{ stopColor: '#e8e8e8' }} />
        <stop offset="100%" style={{ stopColor: '#d0d0d0' }} />
      </linearGradient>
      <linearGradient id="cameraSideGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#c8c8c8' }} />
        <stop offset="100%" style={{ stopColor: '#e0e0e0' }} />
      </linearGradient>
      <linearGradient id="lensGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#1a1a2e' }} />
        <stop offset="50%" style={{ stopColor: '#16213e' }} />
        <stop offset="100%" style={{ stopColor: '#0f0f1a' }} />
      </linearGradient>
      <linearGradient id="tripodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#a8a8a8' }} />
        <stop offset="100%" style={{ stopColor: '#888888' }} />
      </linearGradient>
      <linearGradient id="ledGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#00ff88' }} />
        <stop offset="100%" style={{ stopColor: '#00cc66' }} />
      </linearGradient>
      {/* Efektler */}
      <filter id="cameraShadow">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.2"/>
      </filter>
      <filter id="ledGlowEffect">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="glassReflect">
        <feGaussianBlur stdDeviation="1"/>
      </filter>
    </defs>
    
    {/* Tripod Standı */}
    {/* Tripod başlığı */}
    <ellipse cx="140" cy="125" rx="12" ry="6" fill="url(#tripodGrad)" />
    <rect x="134" y="125" width="12" height="20" fill="url(#tripodGrad)" rx="2" />
    
    {/* Tripod bacakları */}
    <line x1="140" y1="145" x2="100" y2="190" stroke="url(#tripodGrad)" strokeWidth="5" strokeLinecap="round" />
    <line x1="140" y1="145" x2="140" y2="195" stroke="url(#tripodGrad)" strokeWidth="5" strokeLinecap="round" />
    <line x1="140" y1="145" x2="180" y2="190" stroke="url(#tripodGrad)" strokeWidth="5" strokeLinecap="round" />
    
    {/* Tripod ayak uçları */}
    <circle cx="100" cy="190" r="4" fill="#666" />
    <circle cx="140" cy="195" r="4" fill="#666" />
    <circle cx="180" cy="190" r="4" fill="#666" />
    
    {/* Kamera Gövdesi */}
    {/* Ana gövde - oval/kapsül şekli */}
    <rect x="30" y="70" width="220" height="50" rx="25" ry="25" 
          fill="url(#cameraBodyGrad)" 
          stroke="#c0c0c0" 
          strokeWidth="1"
          filter="url(#cameraShadow)" />
    
    {/* Üst kenar vurgu */}
    <rect x="35" y="73" width="210" height="8" rx="4" 
          fill="rgba(255,255,255,0.6)" />
    
    {/* Lens/Sensör Alanı (siyah ön yüz) */}
    <rect x="45" y="78" width="190" height="35" rx="17" ry="17" 
          fill="url(#lensGrad)" />
    
    {/* Cam yansıma efekti */}
    <rect x="50" y="80" width="180" height="10" rx="5" 
          fill="rgba(255,255,255,0.1)" />
    
    {/* Sol IR sensör */}
    <circle cx="75" cy="95" r="10" fill="#0a0a15" stroke="#333" strokeWidth="1" />
    <circle cx="75" cy="95" r="6" fill="#1a1a2e" />
    <circle cx="73" cy="93" r="2" fill="rgba(255,255,255,0.3)" />
    
    {/* RGB Kamera (ortada) */}
    <circle cx="140" cy="95" r="12" fill="#0a0a15" stroke="#333" strokeWidth="1" />
    <circle cx="140" cy="95" r="8" fill="#1a1a2e" />
    <circle cx="140" cy="95" r="4" fill="#2a2a4e" />
    <circle cx="137" cy="92" r="2" fill="rgba(255,255,255,0.4)" />
    
    {/* Sağ IR sensör */}
    <circle cx="205" cy="95" r="10" fill="#0a0a15" stroke="#333" strokeWidth="1" />
    <circle cx="205" cy="95" r="6" fill="#1a1a2e" />
    <circle cx="203" cy="93" r="2" fill="rgba(255,255,255,0.3)" />
    
    {/* IR projektör noktaları */}
    <circle cx="105" cy="95" r="3" fill="#1a0a0a" />
    <circle cx="175" cy="95" r="3" fill="#1a0a0a" />
    
    {/* LED Göstergesi (yeşil - aktif) */}
    <circle cx="140" cy="115" r="3" fill="url(#ledGlow)" filter="url(#ledGlowEffect)" />
    
    {/* Intel RealSense yazısı simülasyonu (küçük noktalar) */}
    <rect x="115" y="108" width="50" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
    
    {/* Dekoratif parıltılar */}
    <circle cx="60" cy="65" r="3" fill="#7C83FD" opacity="0.4" className="animate-pulse" />
    <circle cx="220" cy="65" r="3" fill="#96E6A1" opacity="0.4" className="animate-pulse" />
    <circle cx="140" cy="55" r="2" fill="#FFE066" opacity="0.5" />
  </svg>
)

// İstatistik kartı
const StatCard = ({ icon, label, value, color }) => (
  <div className={`glass rounded-2xl p-4 card-hover ${color}`}>
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
)

export default function HomePage({ onStartClick }) {
  const [stats, setStats] = useState({
    totalSessions: 0,
    bestStreak: 0,
    totalTime: 0
  })

  // LocalStorage'dan istatistikleri yükle
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('postur_stats')
      if (savedStats) {
        setStats(JSON.parse(savedStats))
      }
    } catch (e) {
      console.log('İstatistikler yüklenemedi')
    }
  }, [])

  // Toplam süreyi formatlı göster
  const formatTotalTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}s ${minutes}dk`
    }
    return `${minutes} dk`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Ana içerik */}
      <div className="text-center animate-fade-in">
        {/* Logo/İkon */}
        <div className="mb-6">
          <PostureIcon />
        </div>

        {/* Başlık */}
        <h1 className="font-display text-5xl md:text-6xl font-extrabold mb-4">
          <span className="gradient-text">Postür Antrenörün</span>
        </h1>

        {/* Açıklama */}
        <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-md mx-auto">
          Sağlıklı duruş için yanındayım! 🌟
          <br />
          <span className="text-sm text-gray-500">
            Omuzlarını geri at, göğsünü aç, harika görünüyorsun!
          </span>
        </p>

        {/* Başlat butonu */}
        <button
          onClick={onStartClick}
          className="btn-gradient text-white font-bold text-xl px-12 py-5 rounded-full shadow-lg 
                     hover:shadow-glow transition-all duration-300 mb-12
                     flex items-center gap-3 mx-auto group"
        >
          <span className="text-3xl group-hover:animate-bounce-slow">🎯</span>
          <span>Tespite Başla</span>
          <span className="text-3xl group-hover:animate-bounce-slow">✨</span>
        </button>

        {/* İstatistik kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <StatCard 
            icon="📊" 
            label="Toplam Oturum" 
            value={stats.totalSessions}
            color="hover:bg-candy-sky/30"
          />
          <StatCard 
            icon="🏆" 
            label="En İyi Skor" 
            value={`${stats.bestStreak}%`}
            color="hover:bg-candy-mint/30"
          />
          <StatCard 
            icon="⏱️" 
            label="Toplam Çalışma" 
            value={formatTotalTime(stats.totalTime)}
            color="hover:bg-candy-lavender/30"
          />
        </div>
      </div>

      {/* Alt bilgi */}
      <div className="absolute bottom-4 text-center text-gray-400 text-sm">
        <p>Intel RealSense D435i + MediaPipe ile güçlendirildi 💪</p>
      </div>
    </div>
  )
}

