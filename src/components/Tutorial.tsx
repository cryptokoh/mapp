import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../services/notificationService';
import './Tutorial.css';

interface TutorialStep {
  id: number;
  title: string;
  message: string;
  highlight?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    element?: string;
  };
  action?: string;
}

interface TutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  gameContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to SuperInu River! 🌊",
    message: "Help SuperInu collect valuable tokens while swimming upstream!",
    action: "next"
  },
  {
    id: 2,
    title: "How to Move 🎮",
    message: "Tap/click to move incrementally, or use Arrow/WASD keys. Hold down to keep moving!",
    highlight: { element: "game-area" },
    action: "try"
  },
  {
    id: 3,
    title: "Hold for Bonus! ✋",
    message: "Hold down anywhere for continuous movement. Every 2 seconds of holding gives you +1 bonus point!",
    highlight: { element: "game-area" },
    action: "next"
  },
  {
    id: 4,
    title: "Collect Tokens 🪙",
    message: "Swim into the floating tokens to collect them. Each token has different values based on market cap!",
    highlight: { element: "token-example" },
    action: "next"
  },
  {
    id: 5,
    title: "Speed Boosts! ⚡",
    message: "Golden orbs with ⚡X2 give you double speed for 5 seconds! They appear every 15-25 seconds.",
    highlight: { element: "game-area" },
    action: "next"
  },
  {
    id: 6,
    title: "Avoid Rocks! 🪨",
    message: "Dangerous rocks appear in the river (max 3 at once). Swim around them or you'll lose a life!",
    highlight: { element: "rock-example" },
    action: "next"
  },
  {
    id: 7,
    title: "Stay Updated! 🔔",
    message: "Get notified about special blue boxes, rare tokens, and leaderboard updates! Enable notifications to never miss exciting events.",
    action: "notification"
  },
  {
    id: 8,
    title: "Watch Out! ⚠️",
    message: "Don't miss too many tokens! If you miss 10, the game ends.",
    highlight: { element: "missed-counter" },
    action: "next"
  },
  {
    id: 9,
    title: "Ready to Play! 🎮",
    message: "Collect tokens, grab speed boosts, avoid rocks, and hold for bonus points! Good luck!",
    action: "start"
  }
];

export function Tutorial({ isOpen, onComplete, gameContainerRef }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'pending' | 'granted' | 'denied' | 'unsupported'>('pending');

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setHasInteracted(false);
      
      // Check notification support and permission status
      if (!notificationService.isSupported()) {
        setNotificationStatus('unsupported');
      } else {
        const permission = notificationService.checkPermission();
        if (permission === 'granted') {
          setNotificationStatus('granted');
        } else if (permission === 'denied') {
          setNotificationStatus('denied');
        } else {
          setNotificationStatus('pending');
        }
      }
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setHasInteracted(false);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleTryInteraction = () => {
    setHasInteracted(true);
    // Auto-advance after trying
    setTimeout(() => {
      handleNext();
    }, 1500);
  };


  const handleNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
    
    // Auto-advance after a short delay
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const getHighlightPosition = (highlight?: TutorialStep['highlight']) => {
    if (!highlight || !gameContainerRef?.current) return null;

    // Since we're using absolute positioning within the game container,
    // we need positions relative to the container itself, not the viewport
    const containerWidth = 424; // Fixed width for Farcaster Mini App
    
    // Calculate positions based on element type
    switch (highlight.element) {
      case 'game-area':
        return {
          left: 0,
          top: 0,
          width: containerWidth,
          height: '100%',
          borderRadius: '16px'
        };
      case 'token-example':
        return {
          left: containerWidth / 2 - 40,
          top: '33%',
          width: 80,
          height: 80,
          borderRadius: '50%'
        };
      case 'rock-example':
        return {
          left: containerWidth / 2 - 50,
          top: '50%',
          width: 100,
          height: 80,
          borderRadius: '35% 45% 40% 35%'
        };
      case 'missed-counter':
        return {
          left: containerWidth / 2 + 20,
          top: 20,
          width: 100,
          height: 60,
          borderRadius: '20px'
        };
      default:
        return null;
    }
  };

  const currentStepData = tutorialSteps[currentStep];
  const highlightStyle = getHighlightPosition(currentStepData.highlight);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Dark overlay with cutout for highlight */}
        <div className="tutorial-backdrop">
          {highlightStyle && (
            <motion.div
              className="tutorial-highlight"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={highlightStyle}
            >
              <div className="highlight-pulse" />
              {currentStepData.action === 'try' && !hasInteracted && (
                <div className="tap-here-indicator">
                  <span>👆 Tap here!</span>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Tutorial message */}
        <motion.div
          className="tutorial-message"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="tutorial-content">
            <h3>{currentStepData.title}</h3>
            <p>{currentStepData.message}</p>
            
            <div className="tutorial-progress">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`progress-dot ${index <= currentStep ? 'active' : ''}`}
                />
              ))}
            </div>

            <div className="tutorial-actions">
              {currentStepData.action === 'try' && !hasInteracted ? (
                <button 
                  className="tutorial-button primary"
                  onClick={handleTryInteraction}
                >
                  Let me try! 🎯
                </button>
              ) : currentStepData.action === 'notification' ? (
                <>
                  {notificationStatus === 'pending' && (
                    <button 
                      className="tutorial-button primary"
                      onClick={handleNotificationPermission}
                    >
                      Enable Notifications 🔔
                    </button>
                  )}
                  {notificationStatus === 'granted' && (
                    <button 
                      className="tutorial-button primary success"
                      onClick={handleNext}
                    >
                      ✅ Notifications Enabled!
                    </button>
                  )}
                  {notificationStatus === 'denied' && (
                    <button 
                      className="tutorial-button primary"
                      onClick={handleNext}
                    >
                      Continue Without Notifications →
                    </button>
                  )}
                  {notificationStatus === 'unsupported' && (
                    <button 
                      className="tutorial-button primary"
                      onClick={handleNext}
                    >
                      Continue →
                    </button>
                  )}
                </>
              ) : currentStepData.action === 'start' ? (
                <button 
                  className="tutorial-button primary large"
                  onClick={onComplete}
                >
                  Start Playing! 🎮
                </button>
              ) : (
                <button 
                  className="tutorial-button primary"
                  onClick={handleNext}
                >
                  Next →
                </button>
              )}
              
              {currentStep < tutorialSteps.length - 1 && (
                <button 
                  className="tutorial-button secondary"
                  onClick={handleSkip}
                >
                  Skip Tutorial
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Interactive hints */}
        {currentStepData.action === 'try' && hasInteracted && (
          <motion.div
            className="interaction-feedback"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            Perfect! 🎯
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}