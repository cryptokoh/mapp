import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { neynarUtils } from './utils/neynar'
import './App.css'

function App() {
  const [neynarStatus, setNeynarStatus] = useState<string>('Testing...')

  useEffect(() => {
    // Hide the splash screen as soon as the UI is ready
    sdk.actions.ready()
    
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
    
    testNeynar()
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
