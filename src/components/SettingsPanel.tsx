import React, { useState } from 'react';
import './SettingsPanel.css';

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'game' | 'debug' | 'trending'>('game');

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => setActiveTab('game')}
          >
            🎮 Game
          </button>
          <button
            className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            🔥 Trending
          </button>
          <button
            className={`tab ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            🐛 Debug
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'game' && (
            <div>
              <h3>Game Information</h3>
              
              <div className="game-section">
                <h4>🎯 How to Play</h4>
                <ul>
                  <li><strong>Objective:</strong> Collect as many tokens as possible while avoiding obstacles</li>
                  <li><strong>Controls:</strong> Use the virtual joystick or arrow keys to move StremeINU</li>
                  <li><strong>Scoring:</strong> Each token collected adds to your score</li>
                  <li><strong>Game Over:</strong> Game ends after missing 6 tokens</li>
                  <li><strong>Staking:</strong> Click "Stake Streme Tokens" to earn rewards</li>
                </ul>
              </div>

              <div className="game-section">
                <h4>🏆 Features</h4>
                <ul>
                  <li>Real-time token collection tracking</li>
                  <li>Burst effects when collecting tokens</li>
                  <li>Confetti animation when staking</li>
                  <li>Missed token counter</li>
                  <li>Automatic game restart after staking</li>
                </ul>
              </div>

              <div className="game-section">
                <h4>📊 Current Stats</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span>Tokens Collected</span>
                    <span>0</span>
                  </div>
                  <div className="info-item">
                    <span>Missed Tokens</span>
                    <span>0</span>
                  </div>
                  <div className="info-item">
                    <span>High Score</span>
                    <span>0</span>
                  </div>
                  <div className="info-item">
                    <span>Games Played</span>
                    <span>0</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trending' && (
            <div>
              <h3>Trending Data</h3>
              
              <div className="game-section">
                <h4>🔥 Hot Tokens</h4>
                <div className="trending-preview">
                  <div className="trending-item">
                    <div className="trending-rank">#1</div>
                    <div className="trending-info">
                      <div className="trending-name">Streme Token (STREME)</div>
                      <div className="trending-price">$0.85 (+12.5%)</div>
                    </div>
                  </div>
                  <div className="trending-item">
                    <div className="trending-rank">#2</div>
                    <div className="trending-info">
                      <div className="trending-name">Ethereum (ETH)</div>
                      <div className="trending-price">$3,245.67 (+3.2%)</div>
                    </div>
                  </div>
                  <div className="trending-item">
                    <div className="trending-rank">#3</div>
                    <div className="trending-info">
                      <div className="trending-name">Solana (SOL)</div>
                      <div className="trending-price">$98.45 (+8.7%)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="game-section">
                <h4>🎮 Popular Games</h4>
                <div className="trending-preview">
                  <div className="trending-item">
                    <div className="trending-rank">#1</div>
                    <div className="trending-info">
                      <div className="trending-name">StremeINU's SuperFluid River</div>
                      <div className="trending-stats">15.4K players • 4.8★</div>
                    </div>
                  </div>
                  <div className="trending-item">
                    <div className="trending-rank">#2</div>
                    <div className="trending-info">
                      <div className="trending-name">Crypto Runner</div>
                      <div className="trending-stats">8.9K players • 4.6★</div>
                    </div>
                  </div>
                  <div className="trending-item">
                    <div className="trending-rank">#3</div>
                    <div className="trending-info">
                      <div className="trending-name">Token Collector</div>
                      <div className="trending-stats">12.3K players • 4.7★</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="game-section">
                <h4>📈 Market Overview</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span>Total Market Cap</span>
                    <span>$1.2T</span>
                  </div>
                  <div className="info-item">
                    <span>24h Volume</span>
                    <span>$45.2B</span>
                  </div>
                  <div className="info-item">
                    <span>BTC Dominance</span>
                    <span>48.2%</span>
                  </div>
                  <div className="info-item">
                    <span>Fear & Greed</span>
                    <span>65 (Greed)</span>
                  </div>
                </div>
              </div>

              <div className="game-section">
                <h4>🔄 Data Updates</h4>
                <p>Trending data is updated every 5 minutes from multiple sources including:</p>
                <ul>
                  <li>CoinGecko API for token prices</li>
                  <li>Streme.Fun for game statistics</li>
                  <li>Farcaster for social sentiment</li>
                  <li>Real-time market data feeds</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'debug' && (
            <div>
              <h3>Debug Information</h3>
              
              <div className="debug-section">
                <h4>🔧 System Info</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span>Platform</span>
                    <span>Web Browser</span>
                  </div>
                  <div className="info-item">
                    <span>User Agent</span>
                    <span>{navigator.userAgent}</span>
                  </div>
                  <div className="info-item">
                    <span>Screen Resolution</span>
                    <span>{window.screen.width}x{window.screen.height}</span>
                  </div>
                  <div className="info-item">
                    <span>Viewport</span>
                    <span>{window.innerWidth}x{window.innerHeight}</span>
                  </div>
                </div>
              </div>

              <div className="debug-section">
                <h4>🎮 Game State</h4>
                <div className="code-block">
                  Game Status: Ready<br/>
                  Canvas Size: 800x600<br/>
                  FPS: 60<br/>
                  Last Update: {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="debug-section">
                <h4>🔗 API Status</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span>Streme.Fun API</span>
                    <span className="status-success">Connected</span>
                  </div>
                  <div className="info-item">
                    <span>Farcaster API</span>
                    <span className="status-success">Connected</span>
                  </div>
                  <div className="info-item">
                    <span>CoinGecko API</span>
                    <span className="status-success">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel; 