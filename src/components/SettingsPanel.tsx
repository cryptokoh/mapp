import { useState } from 'react';
import { testNeynarConnection, quickNeynarTest, getNeynarStatus } from '../lib/neynar';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('debug');
  const [neynarStatus, setNeynarStatus] = useState<string>('Ready to test');
  const [neynarDetails, setNeynarDetails] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleNeynarTest = async () => {
    setIsTesting(true);
    setNeynarStatus('Testing...');
    
    try {
      const result = await testNeynarConnection();
      setNeynarStatus(result.success ? '✅ Connected' : `❌ ${result.message}`);
      setNeynarDetails(result.details);
    } catch (error) {
      setNeynarStatus('❌ Error');
      setNeynarDetails({ error });
    } finally {
      setIsTesting(false);
    }
  };

  const handleQuickTest = async () => {
    console.log('🧪 Quick test triggered...');
    const result = await quickNeynarTest();
    console.log('🧪 Quick test result:', result);
  };

  const neynarConfig = getNeynarStatus();

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="settings-overlay" onClick={onClose} />}
      
      {/* Settings Panel */}
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>⚙️ Settings & Debug</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            🐛 Debug
          </button>
          <button 
            className={`tab ${activeTab === 'neynar' ? 'active' : ''}`}
            onClick={() => setActiveTab('neynar')}
          >
            🔗 Neynar
          </button>
          <button 
            className={`tab ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => setActiveTab('game')}
          >
            🎮 Game
          </button>
        </div>

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="tab-content">
            <h3>🐛 Debug Tools</h3>
            
            <div className="debug-section">
              <h4>Console Commands</h4>
              <p>Open browser console and run:</p>
              <div className="code-block">
                <code>testNeynar()</code> - Quick Neynar test
              </div>
              <div className="code-block">
                <code>console.log('Game state:', window.gameState)</code> - View game state
              </div>
            </div>

            <div className="debug-section">
              <h4>Manual Tests</h4>
              <button 
                onClick={handleQuickTest}
                className="debug-button"
                disabled={isTesting}
              >
                🧪 Quick Neynar Test
              </button>
            </div>

            <div className="debug-section">
              <h4>Environment Info</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span>Environment:</span>
                  <span>{import.meta.env.MODE}</span>
                </div>
                <div className="info-item">
                  <span>Base URL:</span>
                  <span>{import.meta.env.BASE_URL}</span>
                </div>
                <div className="info-item">
                  <span>Vite Version:</span>
                  <span>{import.meta.env.VITE_VERSION || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Neynar Tab */}
        {activeTab === 'neynar' && (
          <div className="tab-content">
            <h3>🔗 Neynar Configuration</h3>
            
            <div className="config-section">
              <h4>Connection Status</h4>
              <p className={`status ${neynarStatus.includes('✅') ? 'success' : 'error'}`}>
                {neynarStatus}
              </p>
              
              <button 
                onClick={handleNeynarTest}
                className="test-button"
                disabled={isTesting}
              >
                {isTesting ? '🔄 Testing...' : '🧪 Test Connection'}
              </button>
            </div>

            <div className="config-section">
              <h4>Configuration</h4>
              <div className="config-grid">
                <div className="config-item">
                  <span>API Key:</span>
                  <span className={neynarConfig.hasApiKey ? 'success' : 'error'}>
                    {neynarConfig.hasApiKey ? '✅ Configured' : '❌ Not set'}
                  </span>
                </div>
                <div className="config-item">
                  <span>Client ID:</span>
                  <span className={neynarConfig.hasClientId ? 'success' : 'error'}>
                    {neynarConfig.hasClientId ? '✅ Configured' : '❌ Not set'}
                  </span>
                </div>
              </div>
            </div>

            {neynarDetails?.testUser && (
              <div className="config-section">
                <h4>✅ Test Result</h4>
                <p>Successfully fetched user: <strong>{neynarDetails.testUser}</strong></p>
              </div>
            )}

            {!neynarConfig.hasApiKey && (
              <div className="config-section">
                <h4>🔧 Setup Instructions</h4>
                <ol>
                  <li>Get your API key from <a href="https://neynar.com/" target="_blank" rel="noopener noreferrer">Neynar</a></li>
                  <li>Create a <code>.env</code> file in your project root</li>
                  <li>Add: <code>VITE_NEYNAR_API_KEY=your_api_key_here</code></li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Game Tab */}
        {activeTab === 'game' && (
          <div className="tab-content">
            <h3>🎮 Game Settings</h3>
            
            <div className="game-section">
              <h4>Controls</h4>
              <ul>
                <li><strong>Arrow Keys</strong> or <strong>W/S</strong> - Move up/down</li>
                <li><strong>Space</strong> - Pause game</li>
                <li><strong>R</strong> - Restart game</li>
              </ul>
            </div>

            <div className="game-section">
              <h4>Game Features</h4>
              <ul>
                <li>🌊 River current animation</li>
                <li>🎯 Real-time trending tokens</li>
                <li>📊 Market data display</li>
                <li>🏆 Progressive difficulty</li>
                <li>💎 Score tracking</li>
              </ul>
            </div>

            <div className="game-section">
              <h4>API Integration</h4>
              <p>Game fetches trending tokens from <a href="https://api.streme.fun/api/tokens/trending" target="_blank" rel="noopener noreferrer">Streme.Fun API</a></p>
              <p>Updates every 30 seconds with fresh market data</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 