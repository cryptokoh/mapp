import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { StremeGame } from './components/StremeGame'
import { ShareButton } from './components/ShareButton'
import { SplashScreen } from './components/SplashScreen'
import TrendingScreen from './components/TrendingScreen'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [showTrending, setShowTrending] = useState(false)

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

  if (showSplash) {
    return <SplashScreen onComplete={handleCloseSplash} />
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎮 Stremeinu's Adventure</h1>
        <div className="header-actions">
          <button 
            className="trending-button"
            onClick={() => setShowTrending(true)}
            title="Show Trending"
          >
            🔥 Trending
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <StremeGame />
      </main>

      {showTrending && (
        <TrendingScreen onClose={() => setShowTrending(false)} />
      )}
    </div>
  )
}

export default App
