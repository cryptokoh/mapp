import { useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import './App.css'

function App() {
  useEffect(() => {
    // Hide the splash screen as soon as the UI is ready
    sdk.actions.ready()
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
      </div>
    </div>
  )
}

export default App
