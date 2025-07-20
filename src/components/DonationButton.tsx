import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useFarcaster } from '../hooks/useFarcaster';
import { tokenService } from '../services/tokenService';
import './DonationButton.css';

// Default tokens for donation
const DEFAULT_TOKENS = [
  { 
    symbol: 'USDC', 
    name: 'USD Coin', 
    decimals: 6, 
    color: '#2775CA', 
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 
    img_url: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    isDefault: true 
  },
  { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    decimals: 18, 
    color: '#627EEA', 
    address: '0x0000000000000000000000000000000000000000', 
    img_url: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    isDefault: true 
  },
  { 
    symbol: 'DEGEN', 
    name: 'Degen', 
    decimals: 18, 
    color: '#8B5CF6', 
    address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', 
    img_url: 'https://assets.coingecko.com/coins/images/34515/large/android-chrome-512x512.png',
    isDefault: true 
  },
];

interface DonationToken {
  symbol: string;
  name: string;
  decimals: number;
  color: string;
  address: string;
  img_url: string;
  isDefault?: boolean;
  marketData?: {
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
  };
}

export function DonationButton() {
  const { user } = useFarcaster();
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('1');
  const [selectedToken, setSelectedToken] = useState<DonationToken>(DEFAULT_TOKENS[0]);
  const [availableTokens, setAvailableTokens] = useState<DonationToken[]>(DEFAULT_TOKENS);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [gameContainer, setGameContainer] = useState<HTMLElement | null>(null);

  // Find game container on mount
  useEffect(() => {
    const container = document.querySelector('.game-container');
    if (container) {
      setGameContainer(container as HTMLElement);
    }
  }, []);

  // Fetch trending tokens when modal opens
  useEffect(() => {
    if (showModal && availableTokens.length === DEFAULT_TOKENS.length) {
      fetchTrendingTokens();
    }
  }, [showModal]);

  const fetchTrendingTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const trendingTokens = await tokenService.getTrendingTokens();
      const donationTokens = trendingTokens.slice(0, 10).map(token => ({
        symbol: token.symbol,
        name: token.name,
        decimals: 18,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        address: token.contract_address,
        img_url: token.img_url || token.pfp_url || 'https://api.streme.fun/images/streme-icon.png',
        marketData: {
          marketCap: token.marketData.marketCap,
          volume24h: token.marketData.volume24h,
          priceChange24h: token.marketData.priceChange24h
        }
      }));
      
      setAvailableTokens([...DEFAULT_TOKENS, ...donationTokens]);
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const handleDonate = async () => {
    if (!user) {
      alert('Please connect with Farcaster to donate');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create the donation URL for Farcaster frame
      const tokenToUse = selectedToken.symbol === 'CUSTOM' ? 
        `${amount} tokens (${customAddress.slice(0, 6)}...${customAddress.slice(-4)})` : 
        `${amount} ${selectedToken.symbol}`;
      
      const donationText = `I'm supporting @koh with ${tokenToUse} for DevNeeds AI! 🤖💜`;
      const frameUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(donationText)}&embeds[]=${encodeURIComponent('https://superinu.river.game')}`;
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Open in new window for desktop or same window for mobile
      if (window.innerWidth > 768) {
        window.open(frameUrl, '_blank');
      } else {
        window.location.href = frameUrl;
      }
      
      setShowModal(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error processing donation:', error);
      alert('Failed to process donation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button 
        className="donation-button"
        onClick={() => setShowModal(true)}
        title="Support DevNeeds AI"
      >
        <span className="donation-icon">🤖</span>
        <span className="donation-text">DevNeeds AI TOKENS</span>
      </button>

      <AnimatePresence>
        {showModal && gameContainer && createPortal(
          <motion.div
            className="donation-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="donation-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="donation-header">
                <h3>Support DevNeeds AI 🤖</h3>
                <p className="donation-subtitle">Help me keep building awesome open source tools!</p>
              </div>

              <div className="donation-form">
                <div className="token-selector-container">
                  <div className="selected-token-display" onClick={() => setShowTokenDropdown(!showTokenDropdown)}>
                    <div className="token-info">
                      <img src={selectedToken.img_url} alt={selectedToken.symbol} className="token-image" />
                      <div className="token-details">
                        <span className="token-symbol-large">{selectedToken.symbol}</span>
                        <span className="token-name-small">{selectedToken.name}</span>
                      </div>
                    </div>
                    <div className="dropdown-arrow">{showTokenDropdown ? '▲' : '▼'}</div>
                  </div>

                  <AnimatePresence>
                    {showTokenDropdown && (
                    <motion.div 
                      className="token-dropdown"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="dropdown-header">
                        <span>Select Token</span>
                        {isLoadingTokens && <span className="loading-indicator">Loading...</span>}
                      </div>
                      
                      <div className="dropdown-section">
                        <span className="section-title">Popular Tokens</span>
                        {DEFAULT_TOKENS.map((token) => (
                          <div
                            key={token.address}
                            className={`token-dropdown-item ${selectedToken.address === token.address ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedToken(token);
                              setShowTokenDropdown(false);
                            }}
                          >
                            <img src={token.img_url} alt={token.symbol} className="token-dropdown-image" />
                            <div className="token-dropdown-info">
                              <span className="token-dropdown-symbol">{token.symbol}</span>
                              <span className="token-dropdown-name">{token.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {availableTokens.filter(t => !t.isDefault).length > 0 && (
                        <div className="dropdown-section">
                          <span className="section-title">🔥 Trending on Streme</span>
                          {availableTokens.filter(t => !t.isDefault).map((token) => (
                            <div
                              key={token.address}
                              className={`token-dropdown-item ${selectedToken.address === token.address ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedToken(token);
                                setShowTokenDropdown(false);
                              }}
                            >
                              <img src={token.img_url} alt={token.symbol} className="token-dropdown-image" />
                              <div className="token-dropdown-info">
                                <span className="token-dropdown-symbol">{token.symbol}</span>
                                <span className="token-dropdown-name">{token.name}</span>
                              </div>
                              {token.marketData && (
                                <div className="token-market-info">
                                  <span className={`price-change ${token.marketData.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                                    {token.marketData.priceChange24h >= 0 ? '+' : ''}{token.marketData.priceChange24h.toFixed(1)}%
                                  </span>
                                  <span className="market-cap">${formatNumber(token.marketData.marketCap)}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div
                        className="token-dropdown-item custom-token"
                        onClick={() => {
                          setSelectedToken({
                            symbol: 'CUSTOM',
                            name: 'Custom Token',
                            decimals: 18,
                            color: '#9CA3AF',
                            address: '',
                            img_url: 'https://api.streme.fun/images/streme-icon.png'
                          });
                          setShowTokenDropdown(false);
                        }}
                      >
                        <span className="custom-token-icon">📝</span>
                        <div className="token-dropdown-info">
                          <span className="token-dropdown-symbol">CUSTOM</span>
                          <span className="token-dropdown-name">Enter Contract Address</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>

                <div className="amount-input-wrapper">
                  <label>Amount to Donate</label>
                  <div className="amount-input-container">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0.1"
                      step="0.1"
                      placeholder="Enter amount"
                      className="amount-input"
                    />
                    <span className="amount-token-label">{selectedToken.symbol}</span>
                  </div>
                  
                  <div className="quick-amounts">
                    {['1', '5', '10', '25'].map(quickAmount => (
                      <button
                        key={quickAmount}
                        className="quick-amount-btn"
                        onClick={() => setAmount(quickAmount)}
                      >
                        {quickAmount}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedToken.symbol === 'CUSTOM' && (
                  <div className="custom-token-input">
                    <label>Token Contract Address</label>
                    <input
                      type="text"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                )}

                <div className="donation-summary">
                  <div className="summary-header">You're donating</div>
                  <div className="donation-amount-display">
                    <img src={selectedToken.img_url} alt={selectedToken.symbol} className="summary-token-image" />
                    <span className="summary-amount">{amount || '0'}</span>
                    <span className="summary-symbol">{selectedToken.symbol}</span>
                  </div>
                  <div className="donation-recipient">to <span className="recipient-handle">@koh</span> on Farcaster</div>
                </div>

                <div className="donation-actions">
                  <button
                    className="donate-confirm-button"
                    onClick={handleDonate}
                    disabled={!amount || parseFloat(amount) <= 0 || isProcessing || (selectedToken.symbol === 'CUSTOM' && !customAddress)}
                  >
                    {isProcessing ? 'Processing...' : `Donate ${amount || '0'} ${selectedToken.symbol}`}
                  </button>
                  <button
                    className="donate-cancel-button"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {!user && (
                <p className="donation-warning">
                  ⚠️ Please connect with Farcaster to donate
                </p>
              )}
            </motion.div>
          </motion.div>,
          gameContainer
        )}
        
        {showSuccess && gameContainer && createPortal(
          <motion.div
            className="donation-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              className="donation-success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3>Thank You! 🎉</h3>
              <p>Your support means everything!</p>
              
              <button
                className="share-success-button"
                onClick={() => {
                  const shareText = "I tipped the StremeInu dev! Let's keep open source alive! https://farcaster.xyz/miniapps/UnoOnG81fzr4/stremeinu-superfluid-river";
                  const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
                  
                  if (window.innerWidth > 768) {
                    window.open(shareUrl, '_blank');
                  } else {
                    window.location.href = shareUrl;
                  }
                  
                  setShowSuccess(false);
                }}
              >
                📢 Share Your Support!
              </button>
              
              <button
                className="close-success-button"
                onClick={() => setShowSuccess(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>,
          gameContainer
        )}
      </AnimatePresence>
    </>
  );
}