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
      <h1>Farcaster Mini App Starter</h1>
      <p>
        Your app is running! 🎉<br />
        Edit <code>src/App.tsx</code> to start building your Farcaster Mini App.
      </p>
      <div className="placeholder">
        {/* Future Farcaster features will go here */}
      </div>
    </div>
  )
}

export default App
