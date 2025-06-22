import { useState } from 'react';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('game');

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="settings-overlay" onClick={onClose} />}
      
      {/* Settings Panel */}
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>⚙️ Game Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => setActiveTab('game')}
          >
            🎮 Game
          </button>
          <button 
            className={`tab ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            🐛 Debug
          </button>
        </div>

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
                <li><strong>Virtual Joystick</strong> - Mobile controls</li>
              </ul>
            </div>

            <div className="game-section">
              <h4>Game Features</h4>
              <ul>
                <li>🌊 River current animation</li>
                <li>🎯 Real-time trending tokens from Streme.Fun</li>
                <li>📊 Live market data display</li>
                <li>🏆 Progressive difficulty levels</li>
                <li>💎 Score and token collection tracking</li>
                <li>🎆 Burst effects when collecting tokens</li>
                <li>🎰 Staking simulation with confetti</li>
              </ul>
            </div>

            <div className="game-section">
              <h4>How to Play</h4>
              <ol>
                <li>Help Stremeinu navigate the river of trending tokens</li>
                <li>Touch tokens to collect them and earn points</li>
                <li>Avoid missing too many tokens (6 missed = game over)</li>
                <li>Level up every 1000 points for increased difficulty</li>
                <li>Stake your collected tokens at the end for rewards!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="tab-content">
            <h3>🐛 Debug Tools</h3>
            
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

            <div className="debug-section">
              <h4>Console Commands</h4>
              <p>Open browser console and run:</p>
              <div className="code-block">
                <code>console.log('Game state:', window.gameState)</code> - View game state
              </div>
            </div>

            <div className="debug-section">
              <h4>About</h4>
              <p>Stremeinu's River Adventure is a fun game featuring real trending tokens from the Streme.Fun API.</p>
              <p>Built with React, TypeScript, and the Farcaster SDK.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 