import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { testNeynarConnection } from './lib/neynar'
import { getEmbedConfigFromURL, updateEmbed } from './lib/embeds'
import { ShareButton, QuickShareButtons } from './components/ShareButton'
import './App.css'

function App() {
  const [neynarStatus, setNeynarStatus] = useState<string>('Testing...')
  const [currentState, setCurrentState] = useState<string>('default')
  const [userFid, setUserFid] = useState<number | null>(null)

  useEffect(() => {
    // Hide the splash screen as soon as the UI is ready
    sdk.actions.ready()

    // Get user context and handle URL parameters
    const initializeApp = async () => {
      try {
        const context = await sdk.context
        const user = context.user
        if (user?.fid) {
          setUserFid(user.fid)
        }

        // Handle URL parameters and update embed accordingly
        const urlParams = new URLSearchParams(window.location.search)
        const state = urlParams.get('state')
        const embed = urlParams.get('embed')
        
        if (state || embed) {
          const embedConfig = getEmbedConfigFromURL()
          updateEmbed(embedConfig)
          setCurrentState(state || 'custom')
        }
      } catch (error) {
        console.error('Error initializing app:', error)
      }
    }

    initializeApp()

    // Test Neynar connection
    const testConnection = async () => {
      try {
        const isConnected = await testNeynarConnection()
        setNeynarStatus(isConnected ? '✅ Connected' : '❌ Failed')
      } catch (error) {
        setNeynarStatus('❌ Error')
        console.error('Neynar connection error:', error)
      }
    }

    testConnection()
  }, [])

  const renderStateContent = () => {
    switch (currentState) {
      case 'success':
        return (
          <div className="state-content success">
            <h2>🎉 Success!</h2>
            <p>Your Farcaster Mini App is working perfectly!</p>
            <div className="success-features">
              <div className="feature">
                <span>✅</span>
                <span>React + TypeScript</span>
              </div>
              <div className="feature">
                <span>✅</span>
                <span>Farcaster SDK</span>
              </div>
              <div className="feature">
                <span>✅</span>
                <span>Neynar Integration</span>
              </div>
              <div className="feature">
                <span>✅</span>
                <span>Beautiful UI</span>
              </div>
            </div>
          </div>
        )
      
      case 'features':
        return (
          <div className="state-content features">
            <h2>✨ Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>🚀 Modern Stack</h3>
                <p>Built with React, TypeScript, and Vite for optimal performance</p>
              </div>
              <div className="feature-card">
                <h3>🔗 Farcaster SDK</h3>
                <p>Full integration with Farcaster Mini App capabilities</p>
              </div>
              <div className="feature-card">
                <h3>📡 Neynar API</h3>
                <p>Connected to Neynar for enhanced Farcaster functionality</p>
              </div>
              <div className="feature-card">
                <h3>🎨 Beautiful Design</h3>
                <p>Stunning purple gradient theme with smooth animations</p>
              </div>
            </div>
          </div>
        )
      
      case 'neynar':
        return (
          <div className="state-content neynar">
            <h2>🔗 Neynar Integration</h2>
            <p>Your app is connected to Neynar's powerful Farcaster API</p>
            <div className="neynar-status">
              <h3>Connection Status:</h3>
              <p className={`status ${neynarStatus.includes('✅') ? 'success' : 'error'}`}>
                {neynarStatus}
              </p>
            </div>
            <div className="neynar-info">
              <p>With Neynar, you can:</p>
              <ul>
                <li>Fetch user data and casts</li>
                <li>Interact with the Farcaster protocol</li>
                <li>Build powerful social features</li>
                <li>Access real-time updates</li>
              </ul>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="state-content default">
            <h2>🚀 Welcome to Your Farcaster Mini App!</h2>
            <p>
              Your app is running successfully! 🎉<br />
              Ready for deployment at: <strong>fcmapp.netlify.app</strong>
            </p>
            <div className="placeholder">
              <p>✨ Next: Add Farcaster features like authentication, wallet integration, and more!</p>
              <p>🔗 Neynar API: {neynarStatus}</p>
            </div>
            {userFid && (
              <div className="user-info">
                <p>👋 Welcome, FID: {userFid}</p>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚀 Farcaster Mini App</h1>
        <ShareButton variant={currentState as any} />
      </header>
      
      <main className="app-main">
        {renderStateContent()}
      </main>
      
      <footer className="app-footer">
        <QuickShareButtons />
        <div className="app-info">
          <p>Built with ❤️ using React, TypeScript, and the Farcaster SDK</p>
          <p>Deployed on Netlify • Powered by Neynar</p>
        </div>
      </footer>
    </div>
  )
}

export default App
