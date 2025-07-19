import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFarcaster } from '../hooks/useFarcaster';
import './DonationButton.css';

// Supported tokens for donation
const DONATION_TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, color: '#2775CA', address: '' },
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, color: '#627EEA', address: '' },
  { symbol: 'DEGEN', name: 'Degen', decimals: 18, color: '#8B5CF6', address: '' },
  { symbol: 'CUSTOM', name: 'Custom Token', decimals: 18, color: '#EC4899', address: '' },
];

export function DonationButton() {
  const { user } = useFarcaster();
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('1');
  const [selectedToken, setSelectedToken] = useState(DONATION_TOKENS[0]);
  const [customAddress, setCustomAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
        {showModal && (
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
              <h3>Support DevNeeds AI 🤖</h3>

              <div className="donation-form">
                <div className="amount-input-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.1"
                    step="0.1"
                    placeholder="1"
                  />
                </div>

                <div className="token-selector">
                  <label>Select Token</label>
                  <div className="token-options">
                    {DONATION_TOKENS.map((token) => (
                      <button
                        key={token.symbol}
                        className={`token-option ${selectedToken.symbol === token.symbol ? 'selected' : ''}`}
                        onClick={() => setSelectedToken(token)}
                        style={{ '--token-color': token.color } as React.CSSProperties}
                      >
                        <span className="token-symbol">{token.symbol === 'CUSTOM' ? '📝' : token.symbol}</span>
                        <span className="token-name">{token.name}</span>
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
                  <p>You're donating:</p>
                  <div className="donation-amount">
                    {amount || '0'} {selectedToken.symbol}
                  </div>
                  <p className="donation-recipient">to @koh on Farcaster</p>
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
          </motion.div>
        )}
        
        {showSuccess && (
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}