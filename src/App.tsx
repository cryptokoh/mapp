import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { neynarUtils } from './utils/neynar'
import { fetchUserData } from './api/auth'
import './App.css'

function App() {
  const [neynarStatus, setNeynarStatus] = useState<string>('Testing...')
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState<string>('Not signed in')
  const [isMiniApp, setIsMiniApp] = useState<boolean>(false)

  useEffect(() => {
    // Check if we're in a Mini App environment
    const checkEnvironment = async () => {
      try {
        const miniAppCheck = await sdk.isInMiniApp()
        setIsMiniApp(miniAppCheck)
        
        if (miniAppCheck) {
          // Hide the splash screen only in Mini App environment
          sdk.actions.ready()
        }
      } catch (error) {
        console.log('Not in Mini App environment, running as web app')
        setIsMiniApp(false)
      }
    }
    
    // Test Neynar API connection
    const testNeynar = async () => {
      try {
        const result = await neynarUtils.testConnection()
        setNeynarStatus(result.success ? '✅ Connected' : '❌ Failed')
      } catch (error) {
        setNeynarStatus('❌ Error')
        console.error('Neynar test failed:', error)
      }
    }
    
    // Initialize authentication only in Mini App environment
    const initAuth = async () => {
      if (!isMiniApp) {
        setAuthStatus('🌐 Web Mode - Sign in available in Farcaster Mini App')
        setIsLoading(false)
        return
      }

      try {
        // Get Quick Auth token (this handles the entire auth flow)
        const { token } = await sdk.quickAuth.getToken()
        
        if (token) {
          setAuthStatus('✅ Signed in with Farcaster')
          
          // Fetch user data using the token
          const userData = await fetchUserData(token)
          if (userData.success && userData.user) {
            setUser(userData.user)
          }
          
          console.log('Quick Auth token:', token)
        } else {
          setAuthStatus('❌ Sign in failed')
        }
      } catch (error) {
        console.error('Authentication error:', error)
        setAuthStatus('❌ Sign in error')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkEnvironment()
    testNeynar()
    
    // Wait a bit for environment check to complete
    setTimeout(() => {
      initAuth()
    }, 100)
  }, [isMiniApp])

  const handleSignIn = async () => {
    if (!isMiniApp) {
      setAuthStatus('🌐 Please open this app in Farcaster to sign in')
      return
    }

    try {
      setAuthStatus('Signing in...')
      const { token } = await sdk.quickAuth.getToken()
      
      if (token) {
        setAuthStatus('✅ Signed in with Farcaster')
        
        // Fetch user data using the token
        const userData = await fetchUserData(token)
        if (userData.success && userData.user) {
          setUser(userData.user)
        }
        
        console.log('New Quick Auth token:', token)
      } else {
        setAuthStatus('❌ Sign in failed')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setAuthStatus('❌ Sign in error')
    }
  }

  const handleSignOut = () => {
    setUser(null)
    setAuthStatus(isMiniApp ? 'Not signed in' : '🌐 Web Mode - Sign in available in Farcaster Mini App')
  }

  return (
    <div className="app-container">
      <h1>🚀 Farcaster Mini App</h1>
      <p>
        Your app is running successfully! 🎉<br />
        Ready for deployment at: <strong>fcmapp.netlify.app</strong>
      </p>
      <div className="placeholder">
        <p>✨ Next: Add Farcaster features like authentication, wallet integration, and more!</p>
        <p>🔗 Neynar API: {neynarStatus}</p>
        <p>🔐 Authentication: {authStatus}</p>
        
        {!isMiniApp && (
          <div className="web-mode-notice">
            <p>🌐 You're viewing this in web mode</p>
            <p>📱 Open in Farcaster to experience the full Mini App features!</p>
          </div>
        )}
        
        {user && (
          <div className="user-info">
            <p>👤 Welcome, {user.displayName}!</p>
            <p>🆔 FID: {user.fid}</p>
            <p>📧 Username: {user.username}</p>
          </div>
        )}
        
        {!isLoading && (
          <div className="auth-buttons">
            {authStatus.includes('Signed in') ? (
              <button onClick={handleSignOut} className="auth-button sign-out">
                Sign Out
              </button>
            ) : (
              <button 
                onClick={handleSignIn} 
                className={`auth-button sign-in ${!isMiniApp ? 'disabled' : ''}`}
                disabled={!isMiniApp}
              >
                {isMiniApp ? 'Sign In with Farcaster' : '🌐 Web Mode'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
