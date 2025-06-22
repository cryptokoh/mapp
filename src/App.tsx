import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { testNeynarConnection } from './lib/neynar'
import './App.css'

function App() {
  const [neynarStatus, setNeynarStatus] = useState<string>('Testing...')

  useEffect(() => {
    // Hide the splash screen as soon as the UI is ready
    sdk.actions.ready()

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
      </div>
    </div>
  )
}

export default App
