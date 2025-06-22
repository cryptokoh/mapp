import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { ShareButton, QuickShareButtons } from './components/ShareButton'
import { StremeGame } from './components/StremeGame'
import { SplashScreen } from './components/SplashScreen'
import { SettingsPanel } from './components/SettingsPanel'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Get user context
    const initializeApp = async () => {
      try {
        const context = await sdk.context
        const user = context.user
        // User context available if needed for future features
        console.log('User context:', user)
      } catch (error) {
        console.error('Error initializing app:', error)
      }
    }

    initializeApp()
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  return (
    <>
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* Main App */}
      {!showSplash && (
        <div className="app-container">
          <header className="app-header">
            <h1>🎮 Stremeinu's Adventure</h1>
            <div className="header-actions">
              <ShareButton />
              <button 
                className="settings-button"
                onClick={() => setShowSettings(true)}
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          </header>
          
          <main className="app-main">
            <StremeGame />
          </main>
          
          <footer className="app-footer">
            <QuickShareButtons />
            <div className="app-info">
              <p>Built with ❤️ using React, TypeScript, and the Farcaster SDK</p>
              <p>Game powered by <a href="https://streme.fun" target="_blank" rel="noopener noreferrer">Streme.Fun</a></p>
            </div>
          </footer>
        </div>
      )}

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  )
}

export default App
