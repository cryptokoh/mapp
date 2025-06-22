import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { testNeynarConnection, getNeynarStatus, quickNeynarTest } from './lib/neynar'
import { getEmbedConfigFromURL, updateEmbed } from './lib/embeds'
import { ShareButton, QuickShareButtons } from './components/ShareButton'
import { StremeGame } from './components/StremeGame'
import { SplashScreen } from './components/SplashScreen'
import { SettingsPanel } from './components/SettingsPanel'
import './App.css'

function App() {
  const [neynarStatus, setNeynarStatus] = useState<string>('Testing...')
  const [neynarDetails, setNeynarDetails] = useState<any>(null)
  const [currentState, setCurrentState] = useState<string>('default')
  const [userFid, setUserFid] = useState<number | null>(null)
  const [showSplash, setShowSplash] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Expose test function to window for debugging
    (window as any).testNeynar = quickNeynarTest;

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

    // Test Neynar connection with enhanced error handling
    const testConnection = async () => {
      try {
        setNeynarStatus('🔍 Testing connection...')
        const result = await testNeynarConnection()
        
        if (result.success) {
          setNeynarStatus('✅ Connected')
          setNeynarDetails(result.details)
        } else {
          setNeynarStatus(`❌ ${result.message}`)
          setNeynarDetails(result.details)
        }
      } catch (error) {
        setNeynarStatus('❌ Error')
        setNeynarDetails({ error: error })
        console.error('Neynar connection error:', error)
      }
    }

    testConnection()
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    setCurrentState('game')
  }

  const renderStateContent = () => {
    switch (currentState) {
      case 'game':
        return <StremeGame />
      
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
              <div className="feature-card">
                <h3>🎮 Stremeinu's Adventure</h3>
                <p>Fun game featuring trending Streme tokens from Streme.Fun API</p>
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
              
              {/* Configuration Details */}
              <div className="config-details">
                <h4>Configuration:</h4>
                <div className="config-grid">
                  <div className="config-item">
                    <span>API Key:</span>
                    <span className={neynarDetails?.hasApiKey ? 'success' : 'error'}>
                      {neynarDetails?.hasApiKey ? '✅ Configured' : '❌ Not set'}
                    </span>
                  </div>
                  <div className="config-item">
                    <span>Client ID:</span>
                    <span className={neynarDetails?.hasClientId ? 'success' : 'error'}>
                      {neynarDetails?.hasClientId ? '✅ Configured' : '❌ Not set'}
                    </span>
                  </div>
                </div>
                
                {neynarDetails?.testUser && (
                  <div className="test-result">
                    <h4>✅ Test Result:</h4>
                    <p>Successfully fetched user: <strong>{neynarDetails.testUser}</strong></p>
                  </div>
                )}
                
                {!neynarDetails?.hasApiKey && (
                  <div className="setup-instructions">
                    <h4>🔧 Setup Instructions:</h4>
                    <ol>
                      <li>Get your API key from <a href="https://neynar.com/" target="_blank" rel="noopener noreferrer">Neynar</a></li>
                      <li>Create a <code>.env</code> file in your project root</li>
                      <li>Add: <code>VITE_NEYNAR_API_KEY=your_api_key_here</code></li>
                      <li>Restart your development server</li>
                    </ol>
                  </div>
                )}
              </div>
              
              {/* Debug Section */}
              <div className="debug-section">
                <h4>🔧 Debug Tools:</h4>
                <p>Open browser console and run: <code>testNeynar()</code></p>
                <button 
                  onClick={async () => {
                    console.log('🧪 Manual test triggered...');
                    const result = await quickNeynarTest();
                    console.log('🧪 Manual test result:', result);
                  }}
                  className="debug-button"
                >
                  🧪 Test Now
                </button>
              </div>
            </div>
            <div className="neynar-info">
              <p>With Neynar, you can:</p>
              <ul>
                <li>Fetch user data and profiles</li>
                <li>Get user followers and following</li>
                <li>Validate Farcaster frames</li>
                <li>Access real-time Farcaster data</li>
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
              {neynarDetails && !neynarDetails.hasApiKey && (
                <p className="setup-hint">
                  💡 <strong>Tip:</strong> Add your Neynar API key to enable full functionality
                </p>
              )}
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
              <ShareButton variant={currentState as any} />
              <button 
                className="settings-button"
                onClick={() => setShowSettings(true)}
                title="Settings & Debug"
              >
                ⚙️
              </button>
            </div>
          </header>
          
          <main className="app-main">
            {renderStateContent()}
          </main>
          
          <footer className="app-footer">
            <QuickShareButtons />
            <div className="app-info">
              <p>Built with ❤️ using React, TypeScript, and the Farcaster SDK</p>
              <p>Deployed on Netlify • Powered by Neynar • Game powered by <a href="https://streme.fun" target="_blank" rel="noopener noreferrer">Streme.Fun</a></p>
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
