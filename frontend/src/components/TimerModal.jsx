import { useState } from 'react'

// Timer ikonu
const TimerIcon = () => (
  <svg viewBox="0 0 100 100" className="w-20 h-20 animate-pulse-slow">
    <defs>
      <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#7C83FD' }} />
        <stop offset="100%" style={{ stopColor: '#96E6A1' }} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#timerGrad)" strokeWidth="6" />
    <circle cx="50" cy="50" r="38" fill="rgba(124, 131, 253, 0.1)" />
    <line x1="50" y1="50" x2="50" y2="25" stroke="#7C83FD" strokeWidth="4" strokeLinecap="round" />
    <line x1="50" y1="50" x2="65" y2="50" stroke="#96E6A1" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="50" r="4" fill="#7C83FD" />
  </svg>
)

// Hazır süre seçenekleri
const PRESET_DURATIONS = [
  { value: 15, label: '15 dk', icon: '☕', desc: 'Kısa mola' },
  { value: 25, label: '25 dk', icon: '🍅', desc: 'Pomodoro' },
  { value: 45, label: '45 dk', icon: '📚', desc: 'Ders saati' },
  { value: 60, label: '60 dk', icon: '💼', desc: 'Uzun çalışma' },
]

export default function TimerModal({ isOpen, onClose, onSelect }) {
  const [customDuration, setCustomDuration] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)

  if (!isOpen) return null

  const handlePresetClick = (duration) => {
    setSelectedPreset(duration)
    setCustomDuration('')
  }

  const handleCustomChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    setCustomDuration(value)
    setSelectedPreset(null)
  }

  const handleStart = () => {
    const duration = selectedPreset || parseInt(customDuration) || 25
    if (duration > 0 && duration <= 180) {
      onSelect(duration)
    }
  }

  const getDuration = () => {
    return selectedPreset || parseInt(customDuration) || 0
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative glass rounded-3xl p-8 max-w-lg w-full shadow-glass animate-scale-in">
        {/* Kapat butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 
                     flex items-center justify-center transition-colors"
        >
          <span className="text-xl text-gray-500">✕</span>
        </button>

        {/* Timer ikonu */}
        <div className="flex justify-center mb-6">
          <TimerIcon />
        </div>

        {/* Başlık */}
        <h2 className="font-display text-3xl font-bold text-center mb-2 gradient-text">
          Çalışma Süresini Seç
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Ne kadar çalışmak istiyorsun? ⏰
        </p>

        {/* Hazır seçenekler */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {PRESET_DURATIONS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`p-4 rounded-2xl transition-all duration-200 card-hover
                ${selectedPreset === preset.value 
                  ? 'bg-gradient-to-br from-postur-primary to-postur-secondary text-white shadow-glow' 
                  : 'bg-white/50 hover:bg-white/80 text-gray-700'
                }`}
            >
              <span className="text-2xl block mb-1">{preset.icon}</span>
              <span className="font-bold text-lg block">{preset.label}</span>
              <span className={`text-xs ${selectedPreset === preset.value ? 'text-white/80' : 'text-gray-500'}`}>
                {preset.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Özel süre */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Özel Süre (dakika)
          </label>
          <div className="relative">
            <input
              type="text"
              value={customDuration}
              onChange={handleCustomChange}
              placeholder="Örn: 30"
              maxLength={3}
              className={`w-full px-5 py-4 rounded-xl border-2 transition-all
                ${customDuration 
                  ? 'border-postur-primary bg-postur-primary/5' 
                  : 'border-gray-200 bg-white/50'
                }
                focus:outline-none focus:border-postur-primary focus:bg-white
                text-lg font-medium text-center`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              dakika
            </span>
          </div>
          {customDuration && parseInt(customDuration) > 180 && (
            <p className="text-red-400 text-sm mt-1">Maksimum 180 dakika seçebilirsin</p>
          )}
        </div>

        {/* Başlat butonu */}
        <button
          onClick={handleStart}
          disabled={getDuration() === 0 || getDuration() > 180}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all
            ${getDuration() > 0 && getDuration() <= 180
              ? 'btn-gradient text-white shadow-lg hover:shadow-glow'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
            flex items-center justify-center gap-2`}
        >
          <span>🚀</span>
          <span>
            {getDuration() > 0 
              ? `${getDuration()} Dakika Başlat` 
              : 'Süre Seç'
            }
          </span>
        </button>

        {/* Alt bilgi */}
        <p className="text-center text-gray-400 text-sm mt-4">
          Kötü postürde 7 saniye kalırsan uyarı alırsın! ⚠️
        </p>
      </div>
    </div>
  )
}

