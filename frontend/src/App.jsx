import { useState, useCallback } from 'react'
import HomePage from './components/HomePage'
import TimerModal from './components/TimerModal'
import AnalysisScreen from './components/AnalysisScreen'
import ResultScreen from './components/ResultScreen'

// Sayfa durumları
const PAGES = {
  HOME: 'home',
  ANALYSIS: 'analysis',
  RESULT: 'result'
}

function App() {
  const [currentPage, setCurrentPage] = useState(PAGES.HOME)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(25) // dakika
  const [sessionResult, setSessionResult] = useState(null)

  // Tespite başla butonuna tıklandığında
  const handleStartClick = useCallback(() => {
    setShowTimerModal(true)
  }, [])

  // Modal'dan süre seçildiğinde
  const handleTimerSelect = useCallback((duration) => {
    setSessionDuration(duration)
    setShowTimerModal(false)
    setCurrentPage(PAGES.ANALYSIS)
  }, [])

  // Analiz tamamlandığında
  const handleAnalysisComplete = useCallback((result) => {
    setSessionResult(result)
    setCurrentPage(PAGES.RESULT)
  }, [])

  // Analiz iptal edildiğinde
  const handleAnalysisCancel = useCallback(() => {
    setCurrentPage(PAGES.HOME)
  }, [])

  // Ana sayfaya dön
  const handleGoHome = useCallback(() => {
    setSessionResult(null)
    setCurrentPage(PAGES.HOME)
  }, [])

  // Yeni çalışma başlat
  const handleNewSession = useCallback(() => {
    setSessionResult(null)
    setShowTimerModal(true)
    setCurrentPage(PAGES.HOME)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Arka plan dekorasyonları */}
      <div className="bg-decoration bg-decoration-1"></div>
      <div className="bg-decoration bg-decoration-2"></div>
      <div className="bg-decoration bg-decoration-3"></div>

      {/* Sayfalar */}
      {currentPage === PAGES.HOME && (
        <HomePage onStartClick={handleStartClick} />
      )}

      {currentPage === PAGES.ANALYSIS && (
        <AnalysisScreen 
          duration={sessionDuration}
          onComplete={handleAnalysisComplete}
          onCancel={handleAnalysisCancel}
        />
      )}

      {currentPage === PAGES.RESULT && sessionResult && (
        <ResultScreen 
          result={sessionResult}
          onGoHome={handleGoHome}
          onNewSession={handleNewSession}
        />
      )}

      {/* Süre Seçim Modalı */}
      <TimerModal 
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        onSelect={handleTimerSelect}
      />
    </div>
  )
}

export default App

