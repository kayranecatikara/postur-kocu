/**
 * Web Audio API kullanarak uyarı sesi oluşturma
 */

let audioContext = null

// Audio context'i lazy initialize et
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

/**
 * Beep sesi çal
 * @param {number} frequency - Frekans (Hz)
 * @param {number} duration - Süre (ms)
 * @param {number} volume - Ses seviyesi (0-1)
 */
export function playBeep(frequency = 800, duration = 300, volume = 0.5) {
  try {
    const ctx = getAudioContext()
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    
    // Fade in/out için gain envelope
    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
    gainNode.gain.linearRampToValueAtTime(volume, now + (duration / 1000) - 0.05)
    gainNode.gain.linearRampToValueAtTime(0, now + (duration / 1000))
    
    oscillator.start(now)
    oscillator.stop(now + (duration / 1000))
  } catch (e) {
    console.log('Audio çalınamadı:', e)
  }
}

/**
 * Uyarı sesi çal (kötü postür uyarısı)
 */
export function playWarningSound() {
  playBeep(800, 400, 0.6)
  
  // İkinci beep (biraz gecikmeyle)
  setTimeout(() => {
    playBeep(600, 300, 0.4)
  }, 450)
}

/**
 * Başarı sesi çal
 */
export function playSuccessSound() {
  playBeep(523, 150, 0.3) // C5
  setTimeout(() => playBeep(659, 150, 0.3), 150) // E5
  setTimeout(() => playBeep(784, 200, 0.4), 300) // G5
}

/**
 * Tamamlandı sesi çal
 */
export function playCompleteSound() {
  playBeep(523, 200, 0.4) // C5
  setTimeout(() => playBeep(659, 200, 0.4), 200) // E5
  setTimeout(() => playBeep(784, 200, 0.4), 400) // G5
  setTimeout(() => playBeep(1047, 400, 0.5), 600) // C6
}

// Cooldown yönetimi
let lastWarningTime = 0
const WARNING_COOLDOWN = 3000 // 3 saniye

/**
 * Cooldown'lı uyarı sesi çal
 */
export function playWarningWithCooldown() {
  const now = Date.now()
  if (now - lastWarningTime >= WARNING_COOLDOWN) {
    playWarningSound()
    lastWarningTime = now
    return true
  }
  return false
}

