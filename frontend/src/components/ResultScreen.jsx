import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import confetti from 'canvas-confetti'

// Konfeti efekti
const fireConfetti = () => {
  const duration = 3000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#7C83FD', '#96E6A1', '#FFB5C5', '#FFE066']
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#7C83FD', '#96E6A1', '#FFB5C5', '#FFE066']
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

// Sonuç kartı
const ResultCard = ({ icon, label, value, subValue, gradient }) => (
  <div className={`${gradient} rounded-2xl p-5 text-white card-hover shadow-lg`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/80 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold font-display">{value}</p>
        {subValue && <p className="text-white/70 text-sm mt-1">{subValue}</p>}
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
)

// Skor göstergesi
const ScoreGauge = ({ score }) => {
  const getScoreColor = (s) => {
    if (s >= 80) return '#6BCB77'
    if (s >= 60) return '#96E6A1'
    if (s >= 40) return '#FFE066'
    return '#FF6B6B'
  }

  const getScoreEmoji = (s) => {
    if (s >= 90) return '🏆'
    if (s >= 80) return '🌟'
    if (s >= 70) return '👍'
    if (s >= 60) return '😊'
    if (s >= 40) return '💪'
    return '🎯'
  }

  const getScoreMessage = (s) => {
    if (s >= 90) return 'Mükemmel! Şampiyon gibisin!'
    if (s >= 80) return 'Harika! Çok iyi gidiyorsun!'
    if (s >= 70) return 'İyi! Biraz daha dikkat et.'
    if (s >= 60) return 'Fena değil, gelişebilirsin!'
    if (s >= 40) return 'Daha fazla dikkat etmelisin.'
    return 'Duruşuna dikkat etmelisin!'
  }

  return (
    <div className="glass rounded-3xl p-8 text-center">
      <div className="relative w-48 h-48 mx-auto mb-4">
        {/* Arka plan çember */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="8"
            strokeDasharray={`${score * 2.83} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>
        {/* Ortadaki skor */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl mb-1">{getScoreEmoji(score)}</span>
          <span className="text-4xl font-bold font-display" style={{ color: getScoreColor(score) }}>
            {score}
          </span>
          <span className="text-gray-500 text-sm">/ 100</span>
        </div>
      </div>
      <h3 className="font-display font-bold text-xl text-gray-800">Postür Skoru</h3>
      <p className="text-gray-600 mt-1">{getScoreMessage(score)}</p>
    </div>
  )
}

// Süre formatla
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins} dk ${secs} sn`
}

export default function ResultScreen({ result, onGoHome, onNewSession }) {
  const [isAnimated, setIsAnimated] = useState(false)

  // Konfeti efekti
  useEffect(() => {
    if (result?.posture_score >= 60) {
      fireConfetti()
    }
    
    // Animasyonu başlat
    setTimeout(() => setIsAnimated(true), 100)

    // LocalStorage'a kaydet
    try {
      const savedStats = JSON.parse(localStorage.getItem('postur_stats') || '{}')
      const newStats = {
        totalSessions: (savedStats.totalSessions || 0) + 1,
        bestStreak: Math.max(savedStats.bestStreak || 0, result?.posture_score || 0),
        totalTime: (savedStats.totalTime || 0) + (result?.total_duration || 0)
      }
      localStorage.setItem('postur_stats', JSON.stringify(newStats))
    } catch (e) {
      console.log('İstatistik kaydedilemedi')
    }
  }, [result])

  // Pasta grafiği verisi
  const pieData = [
    { name: 'Düzgün', value: result?.good_posture_time || 0, color: '#6BCB77' },
    { name: 'Bozuk', value: result?.bad_posture_time || 0, color: '#FF6B6B' }
  ]

  // Timeline verisi
  const timelineData = (result?.timeline || []).map((item, index) => ({
    time: Math.floor(item.time / 60),
    value: item.status === 'IYI' ? 1 : item.status === 'KOTU' ? -1 : 0,
    status: item.status
  }))

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Başlık */}
        <div className={`text-center mb-8 transition-all duration-700 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="text-6xl block mb-4 animate-bounce-slow">🎉</span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-2">
            <span className="gradient-text">Çalışma Tamamlandı!</span>
          </h1>
          <p className="text-gray-600">Harika iş çıkardın! İşte sonuçların:</p>
        </div>

        {/* Skor ve özet */}
        <div className={`grid md:grid-cols-2 gap-6 mb-8 transition-all duration-700 delay-100 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Skor */}
          <ScoreGauge score={result?.posture_score || 0} />

          {/* Pasta grafiği */}
          <div className="glass rounded-3xl p-6">
            <h3 className="font-display font-bold text-lg mb-4 text-center">Süre Dağılımı</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatDuration(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* İstatistik kartları */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-200 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <ResultCard
            icon="⏱️"
            label="Toplam Süre"
            value={formatDuration(result?.total_duration || 0)}
            gradient="bg-gradient-to-br from-postur-primary to-blue-400"
          />
          <ResultCard
            icon="✅"
            label="Düzgün Postür"
            value={formatDuration(result?.good_posture_time || 0)}
            subValue={`%${result?.good_percentage?.toFixed(0) || 0}`}
            gradient="bg-gradient-to-br from-green-500 to-emerald-400"
          />
          <ResultCard
            icon="❌"
            label="Bozuk Postür"
            value={formatDuration(result?.bad_posture_time || 0)}
            subValue={`%${result?.bad_percentage?.toFixed(0) || 0}`}
            gradient="bg-gradient-to-br from-red-400 to-orange-400"
          />
          <ResultCard
            icon="⚠️"
            label="Uyarı Sayısı"
            value={`${result?.warning_count || 0} kez`}
            gradient="bg-gradient-to-br from-yellow-400 to-amber-400"
          />
        </div>

        {/* Timeline grafiği */}
        {timelineData.length > 2 && (
          <div className={`glass rounded-3xl p-6 mb-8 transition-all duration-700 delay-300 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h3 className="font-display font-bold text-lg mb-4">📈 Postür Zaman Çizelgesi</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorGood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6BCB77" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6BCB77" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={(value) => `${value}dk`}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[-1.5, 1.5]} 
                    ticks={[-1, 0, 1]}
                    tickFormatter={(value) => value === 1 ? 'İyi' : value === -1 ? 'Kötü' : ''}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => `${value}. dakika`}
                    formatter={(value) => [value === 1 ? 'İyi Postür' : 'Kötü Postür', 'Durum']}
                  />
                  <Area 
                    type="stepAfter" 
                    dataKey="value" 
                    stroke="#6BCB77" 
                    fill="url(#colorGood)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-gray-500 text-sm mt-2">
              Çalışma boyunca postür durumunuz
            </p>
          </div>
        )}

        {/* Butonlar */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-400 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={onGoHome}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-gray-100 hover:bg-gray-200 
                       text-gray-700 transition-all flex items-center justify-center gap-2"
          >
            <span>🏠</span>
            <span>Ana Sayfaya Dön</span>
          </button>
          <button
            onClick={onNewSession}
            className="btn-gradient px-8 py-4 rounded-xl font-bold text-lg text-white 
                       shadow-lg hover:shadow-glow transition-all flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>Yeni Çalışma Başlat</span>
          </button>
        </div>

        {/* Motivasyon mesajı */}
        <div className={`text-center mt-8 transition-all duration-700 delay-500 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-gray-500 text-sm">
            {result?.posture_score >= 80 
              ? '🌟 Muhteşem! Bu şekilde devam et, sırtın sana teşekkür ediyor!'
              : result?.posture_score >= 60
              ? '💪 İyi gidiyorsun! Biraz daha pratikle mükemmel olacaksın!'
              : '🎯 Her çalışma bir adım ileri! Gelecek sefer daha iyi olacak!'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

