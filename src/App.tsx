import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sdk } from '@farcaster/frame-sdk'
import { StremeGame } from './components/StremeGame'
import { SplashScreen } from './components/SplashScreen'
import TrendingScreen from './components/TrendingScreen'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [showTrending, setShowTrending] = useState(false)
  const [gameStats, setGameStats] = useState({
    tokensCollected: 0,
    missedTokens: 0,
    score: 0,
    lives: 3,
    level: 1
  })

  useEffect(() => {
    // Get user context
    const initializeApp = async () => {
      try {
        const context = await sdk.context
        if (context && context.user) {
          // User context available if needed for future features
          console.log('User context:', context.user)
        }
      } catch (error) {
        console.error('Error initializing app:', error)
        // Continue without user context - app will still work
      }
    }

    initializeApp()
  }, [])

  useEffect(() => {
    // Auto-hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleCloseSplash = () => {
    setShowSplash(false)
  }

  const handleGameStatsUpdate = useCallback((stats: any) => {
    setGameStats(stats)
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={handleCloseSplash} />
  }

  return (
    <motion.div 
      className="app-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header 
        className="app-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h1>🌊 StremeINU River</h1>
        <button 
          className="trending-button"
          onClick={() => setShowTrending(true)}
          title="Trending"
        >
          📈
        </button>
      </motion.header>
      
      <main className="app-main">
        <div className="game-container">
          {/* Overlay Counters */}
          <motion.div 
            className="counters-overlay"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="counter">
              <span className="counter-icon">💰</span>
              <span className="counter-value">{gameStats.tokensCollected}</span>
            </div>
            <div className="counter">
              <span className="counter-icon">💎</span>
              <span className="counter-value">{gameStats.score}</span>
            </div>
            <div className="counter">
              <span className="counter-icon">❤️</span>
              <span className="counter-value">{gameStats.lives}</span>
            </div>
            <div className="counter">
              <span className="counter-icon">⭐</span>
              <span className="counter-value">{gameStats.level}</span>
            </div>
            <div className="counter">
              <span className="counter-icon">❌</span>
              <span className="counter-value">{gameStats.missedTokens}/6</span>
            </div>
          </motion.div>

          {/* Game Component */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <StremeGame onStatsUpdate={handleGameStatsUpdate} />
          </motion.div>
        </div>
      </main>

      <motion.footer 
        className="app-footer"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="app-info">
          <p>🌊 SuperFluid River Adventure</p>
          <p>Collect tokens, avoid obstacles!</p>
        </div>
      </motion.footer>

      <AnimatePresence>
        {showTrending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingScreen onClose={() => setShowTrending(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default App
