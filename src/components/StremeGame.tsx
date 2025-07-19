import { useEffect, useState, useRef, useCallback } from 'react';
import './StremeGame.css';
import { ShareButton } from './ShareButton';
import { Leaderboard } from './Leaderboard';
import { serverLeaderboardService } from '../services/serverLeaderboard';
import { useFarcaster } from '../hooks/useFarcaster';
import { tokenService, type StremeToken } from '../services/tokenService';
import { TokenCollectedPopup } from './TokenCollectedPopup';
import { Tutorial } from './Tutorial';
import { DonationButton } from './DonationButton';

// Game constants
const MAX_CONTAINER_WIDTH = 424;
const CHARACTER_SIZE = 60;
const TOKEN_SIZE = 50;
const ROCK_MIN_SIZE = 60;
const ROCK_MAX_SIZE = 100;

// StremeToken interface is imported from tokenService

interface GameState {
  isPlaying: boolean;
  score: number;
  lives: number;
  gameOver: boolean;
  level: number;
  tokensCollected: number;
  missedTokens: number;
}

interface CollectedTokenPopup {
  id: string;
  token: StremeToken;
  value: number;
  x: number;
  y: number;
}

interface GameObject {
  id: string;
  x: number;
  y: number;
  speed: number;
  token: StremeToken;
}

interface TouchRipple {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

interface Rock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  variant: number; // For visual variety (1-3)
}

interface CharacterPosition {
  x: number;
  y: number;
}

interface StremeGameProps {
  onStatsUpdate?: (stats: {
    tokensCollected: number;
    missedTokens: number;
    score: number;
    lives: number;
    level: number;
  }) => void;
}

export function StremeGame({ onStatsUpdate }: StremeGameProps) {
  console.log('🎮 StremeGame initializing...');

  // Farcaster integration
  const { user } = useFarcaster();

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    lives: 3,
    gameOver: false,
    level: 1,
    tokensCollected: 0,
    missedTokens: 0,
  });
  
  // Rock warning state
  const [showRockWarning, setShowRockWarning] = useState(false);

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Character position and movement
  const [character, setCharacter] = useState<CharacterPosition>({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState<CharacterPosition>({ x: 0, y: 0 });
  
  // Game objects
  const [tokens, setTokens] = useState<GameObject[]>([]);
  const [rocks, setRocks] = useState<Rock[]>([]);
  
  // Touch feedback
  const [touchRipples, setTouchRipples] = useState<TouchRipple[]>([]);
  
  // Available tokens for spawning (fetched from Streme.fun API)
  const [availableTokens, setAvailableTokens] = useState<StremeToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  
  // Token collection tracking
  const [collectedTokenPopups, setCollectedTokenPopups] = useState<CollectedTokenPopup[]>([]);
  const [tokenStats, setTokenStats] = useState<Record<string, { count: number; totalValue: number; name: string; img_url: string; contract_address: string }>>({});

  // Refs
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTokenSpawn = useRef<number>(0);
  const lastRockSpawn = useRef<number>(0);
  const tokenCounter = useRef<number>(0);
  const rockCounter = useRef<number>(0);

  // Calculate container dimensions
  const getGameDimensions = useCallback(() => {
    const container = gameRef.current;
    const width = Math.min(container?.clientWidth || MAX_CONTAINER_WIDTH, MAX_CONTAINER_WIDTH);
    const height = container?.clientHeight || 695; // Default to mobile app height
    console.log('🎮 Game dimensions:', { width, height });
    return { width, height };
  }, []);

  // Calculate character center position
  const getCharacterCenterPosition = useCallback(() => {
    const { width, height } = getGameDimensions();
    const centerX = (width - CHARACTER_SIZE) / 2;
    const centerY = (height - CHARACTER_SIZE) / 2;
    return { x: centerX, y: centerY };
  }, [getGameDimensions]);

  // Fetch trending tokens from Streme.fun API
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setTokensLoading(true);
        const trendingTokens = await tokenService.getTrendingTokens();
        setAvailableTokens(trendingTokens);
        console.log('🪙 Loaded trending tokens for game:', trendingTokens.length);
      } catch (error) {
        console.error('❌ Failed to load tokens:', error);
        // Fallback tokens will be used by the service
        const fallbackTokens = await tokenService.getTrendingTokens();
        setAvailableTokens(fallbackTokens);
      } finally {
        setTokensLoading(false);
      }
    };

    loadTokens();
  }, []);

  // Initialize character position and check tutorial
  useEffect(() => {
    const centerPos = getCharacterCenterPosition();
    setCharacter(centerPos);
    setTargetPosition(centerPos);
    console.log('🎮 Character positioned at center:', centerPos);
    console.log('🎮 Available tokens:', availableTokens.length);
    
    // Check if user has seen tutorial
    const tutorialSeen = localStorage.getItem('superinu-tutorial-seen');
    if (!tutorialSeen) {
      setHasSeenTutorial(false);
    } else {
      setHasSeenTutorial(true);
    }
  }, [getCharacterCenterPosition, availableTokens.length]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const centerPos = getCharacterCenterPosition();
      setCharacter(centerPos);
      setTargetPosition(centerPos);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getCharacterCenterPosition]);

  // Mobile-first tap-to-move controls
  useEffect(() => {
    const gameContainer = gameRef.current;
    if (!gameContainer) return;

    const handleTapMove = (clientX: number, clientY: number) => {
      if (!gameState.isPlaying) return;

      const rect = gameContainer.getBoundingClientRect();
      const { width, height } = getGameDimensions();
      
      // Calculate tap position relative to container
      const tapX = clientX - rect.left;
      const tapY = clientY - rect.top;
      
      // Add touch ripple effect
      const ripple: TouchRipple = {
        id: `ripple-${Date.now()}`,
        x: tapX,
        y: tapY,
        timestamp: Date.now()
      };
      setTouchRipples(prev => [...prev, ripple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setTouchRipples(prev => prev.filter(r => r.id !== ripple.id));
      }, 600);
      
      // Calculate target position (center character on tap point)
      const targetX = tapX - CHARACTER_SIZE / 2;
      const targetY = tapY - CHARACTER_SIZE / 2;
      
      // Clamp to boundaries and set target
      const clampedX = Math.max(0, Math.min(targetX, width - CHARACTER_SIZE));
      const clampedY = Math.max(0, Math.min(targetY, height - CHARACTER_SIZE));
      
      setTargetPosition({ x: clampedX, y: clampedY });
      
      // Haptic feedback if available
      if ('vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(10);
      }
    };

    const handleTouch = (e: TouchEvent) => {
      // Only handle touch if we're playing and not touching a button
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.share-container') || target.closest('.game-start') || target.closest('.game-over')) {
        return; // Let buttons handle their own events
      }
      
      e.preventDefault();
      if (e.touches.length > 0) {
        handleTapMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Only handle click if we're playing and not clicking a button
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.share-container') || target.closest('.game-start') || target.closest('.game-over')) {
        return; // Let buttons handle their own events
      }
      
      handleTapMove(e.clientX, e.clientY);
    };

    // Only add touch listeners when actively playing
    if (gameState.isPlaying) {
      gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
      gameContainer.addEventListener('touchmove', handleTouch, { passive: false });
      gameContainer.addEventListener('click', handleClick);
    }

    return () => {
      gameContainer.removeEventListener('touchstart', handleTouch);
      gameContainer.removeEventListener('touchmove', handleTouch);
      gameContainer.removeEventListener('click', handleClick);
    };
  }, [gameState.isPlaying, getGameDimensions]);

  // Spawn tokens
  const spawnToken = useCallback(() => {
    if (availableTokens.length === 0) {
      console.log('⏳ No tokens available yet, skipping spawn');
      return;
    }

    const { width, height } = getGameDimensions();
    const selectedToken = tokenService.getRandomToken(availableTokens);
    
    const newToken: GameObject = {
      id: `token-${tokenCounter.current++}`,
      x: Math.random() * (width - TOKEN_SIZE),
      y: height, // Start from bottom
      speed: 2 + Math.random() * 2, // Random speed between 2-4
      token: selectedToken,
    };

    setTokens(prev => [...prev, newToken]);
    console.log('🪙 Spawned token:', selectedToken.symbol, '- Market Cap:', selectedToken.marketData.marketCap);
  }, [availableTokens, getGameDimensions]);

  // Spawn rocks
  const spawnRock = useCallback(() => {
    const { width, height } = getGameDimensions();
    const rockSize = ROCK_MIN_SIZE + Math.random() * (ROCK_MAX_SIZE - ROCK_MIN_SIZE);
    
    // Check if there's enough space from other rocks
    const minDistance = 150; // Minimum distance between rocks
    let x = Math.random() * (width - rockSize);
    let attempts = 0;
    
    // Try to find a good position that doesn't overlap with existing rocks
    while (attempts < 10) {
      let validPosition = true;
      for (const rock of rocks) {
        const distance = Math.abs(rock.x - x);
        if (distance < minDistance && Math.abs(rock.y - height) < 100) {
          validPosition = false;
          break;
        }
      }
      if (validPosition) break;
      x = Math.random() * (width - rockSize);
      attempts++;
    }
    
    const newRock: Rock = {
      id: `rock-${rockCounter.current++}`,
      x: x,
      y: height + rockSize, // Start from bottom
      width: rockSize,
      height: rockSize * 0.8, // Slightly flattened
      speed: 1.5 + Math.random() * 1.5, // Slower than tokens
      variant: Math.floor(Math.random() * 3) + 1, // 1-3 for visual variety
    };

    setRocks(prev => [...prev, newRock]);
    console.log('🪨 Spawned rock:', newRock.id);
  }, [getGameDimensions, rocks]);

  // Check collision between character and token
  const checkCollision = useCallback((char: CharacterPosition, token: GameObject) => {
    return (
      char.x < token.x + TOKEN_SIZE &&
      char.x + CHARACTER_SIZE > token.x &&
      char.y < token.y + TOKEN_SIZE &&
      char.y + CHARACTER_SIZE > token.y
    );
  }, []);

  // Check collision between character and rock
  const checkRockCollision = useCallback((char: CharacterPosition, rock: Rock) => {
    // More forgiving collision for rocks (smaller hit box)
    const padding = 10; // Make hitbox slightly smaller for better gameplay
    return (
      char.x + padding < rock.x + rock.width &&
      char.x + CHARACTER_SIZE - padding > rock.x &&
      char.y + padding < rock.y + rock.height &&
      char.y + CHARACTER_SIZE - padding > rock.y
    );
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const gameLoop = (timestamp: number) => {
      // Smooth character movement toward target
      setCharacter(prev => {
        const deltaX = targetPosition.x - prev.x;
        const deltaY = targetPosition.y - prev.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 2) {
          return targetPosition;
        }
        
        // Ultra-fast movement - nearly instant
        const speed = Math.min(distance * 0.5, 30); // Even faster: 0.5 interpolation, max speed 30
        const moveX = prev.x + (deltaX / distance) * speed;
        const moveY = prev.y + (deltaY / distance) * speed;
        
        // If very close, just snap to position
        if (distance < 10) {
          return targetPosition;
        }
        
        return { x: moveX, y: moveY };
      });

      // Spawn tokens periodically (wait for rock warning to disappear)
      if (!showRockWarning && timestamp - lastTokenSpawn.current > 2000) { // Every 2 seconds
        spawnToken();
        lastTokenSpawn.current = timestamp;
      }

      // Spawn rocks periodically with difficulty progression (wait for rock warning)
      const rockSpawnInterval = Math.max(2000, 3500 - (gameState.level - 1) * 200); // Gets faster with levels
      if (!showRockWarning && timestamp - lastRockSpawn.current > rockSpawnInterval) {
        spawnRock();
        // Sometimes spawn 2 rocks at higher levels
        if (gameState.level >= 3 && Math.random() < 0.3) {
          setTimeout(() => spawnRock(), 300);
        }
        lastRockSpawn.current = timestamp;
      }

      // Update tokens
      setTokens(prevTokens => {
        const updatedTokens = prevTokens
          .map(token => ({
            ...token,
            y: token.y - token.speed, // Move upward
          }))
          .filter(token => {
            // Remove tokens that went off screen
            if (token.y < -TOKEN_SIZE) {
              setGameState(prev => ({
                ...prev,
                missedTokens: prev.missedTokens + 1,
              }));
              console.log('🎮 Token missed:', token.token.symbol);
              return false;
            }
            return true;
          });

        // Check collisions
        updatedTokens.forEach((token, index) => {
          if (checkCollision(character, token)) {
            const tokenValue = tokenService.getTokenValue(token.token);
            console.log('🪙 Token collected:', token.token.symbol, `(${tokenValue} points, MC: ${token.token.marketData.marketCap})`);
            
            // Update game state
            setGameState(prev => ({
              ...prev,
              tokensCollected: prev.tokensCollected + 1,
              score: prev.score + tokenValue,
            }));

            // Track token collection stats
            setTokenStats(prev => ({
              ...prev,
              [token.token.symbol]: {
                count: (prev[token.token.symbol]?.count || 0) + 1,
                totalValue: (prev[token.token.symbol]?.totalValue || 0) + tokenValue,
                name: token.token.name,
                img_url: token.token.img_url,
                contract_address: token.token.contract_address,
              }
            }));

            // Show collection popup immediately
            const popup: CollectedTokenPopup = {
              id: `popup-${Date.now()}-${Math.random()}`,
              token: token.token,
              value: tokenValue,
              x: token.x + TOKEN_SIZE / 2,
              y: token.y + TOKEN_SIZE / 2,
            };
            setCollectedTokenPopups(prev => [...prev, popup]);
            
            // Haptic feedback for collection
            if ('vibrate' in navigator && navigator.vibrate) {
              navigator.vibrate(30);
            }

            // Remove collected token
            updatedTokens.splice(index, 1);
          }
        });

        return updatedTokens;
      });

      // Update rocks
      setRocks(prevRocks => {
        const updatedRocks = prevRocks
          .map(rock => ({
            ...rock,
            y: rock.y - rock.speed, // Move upward
          }))
          .filter(rock => rock.y > -rock.height); // Remove off-screen rocks

        // Check collision with character
        updatedRocks.forEach(rock => {
          if (checkRockCollision(character, rock)) {
            // Rock collision - lose a life or end game
            setGameState(prev => ({
              ...prev,
              lives: prev.lives - 1,
              missedTokens: prev.missedTokens + 3, // Hitting a rock counts as missing 3 tokens
            }));
            
            // Remove the rock after collision
            setRocks(current => current.filter(r => r.id !== rock.id));
            
            // Haptic feedback for collision
            if ('vibrate' in navigator && navigator.vibrate) {
              navigator.vibrate([50, 50, 50]); // Pattern vibration
            }
            
            console.log('💥 Hit a rock!');
          }
        });

        return updatedRocks;
      });

      // Update score and level progression
      setGameState(prev => {
        const newScore = prev.score + 1;
        // Level up every 500 points
        const newLevel = Math.floor(newScore / 500) + 1;
        return {
          ...prev,
          score: newScore,
          level: newLevel,
        };
      });

      // Check game over condition
      setGameState(prev => {
        if (prev.missedTokens >= 10) {
          console.log('🎮 Game Over - too many missed tokens');
          
          // Submit score to server leaderboard (Farcaster users only)
          if (user && prev.score > 0) {
            // Calculate favorite token
            const favoriteTokenSymbol = Object.entries(tokenStats).reduce((max, [symbol, stats]) => 
              stats.count > (tokenStats[max]?.count || 0) ? symbol : max, 
              Object.keys(tokenStats)[0]
            );
            const favoriteToken = favoriteTokenSymbol ? {
              symbol: favoriteTokenSymbol,
              name: tokenStats[favoriteTokenSymbol].name,
              count: tokenStats[favoriteTokenSymbol].count,
              img_url: tokenStats[favoriteTokenSymbol].img_url,
            } : undefined;

            serverLeaderboardService.submitScore({
              fid: user.fid,
              username: user.username,
              displayName: user.displayName,
              pfpUrl: user.pfpUrl,
              score: prev.score,
              tokensCollected: prev.tokensCollected,
              level: prev.level,
              favoriteToken,
              tokenStats,
            }).then(leaderboardEntry => {
              console.log('🏆 Score submitted to server:', leaderboardEntry);
            }).catch(error => {
              console.error('❌ Failed to submit score:', error);
              if (error.message.includes('Only Farcaster users')) {
                console.log('ℹ️ Demo users cannot submit to leaderboard - connect with real Farcaster account');
              }
            });
          }
          
          return {
            ...prev,
            isPlaying: false,
            gameOver: true,
          };
        }
        return prev;
      });

      if (gameState.isPlaying) {
        animationRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.isPlaying, character, targetPosition, spawnToken, spawnRock, checkCollision, checkRockCollision, getGameDimensions, showRockWarning, tokenStats]);

  // Start game
  const startGame = useCallback(() => {
    console.log('🎮 Starting game...');
    
    // Show tutorial for first-time players
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      return;
    }
    
    const centerPos = getCharacterCenterPosition();
    setCharacter(centerPos);
    setTargetPosition(centerPos);
    setTokens([]);
    setRocks([]);
    setCollectedTokenPopups([]);
    setTokenStats({});
    setTouchRipples([]);
    setGameState({
      isPlaying: true,
      score: 0,
      lives: 3,
      gameOver: false,
      level: 1,
      tokensCollected: 0,
      missedTokens: 0,
    });
    lastTokenSpawn.current = 0;
    lastRockSpawn.current = 0;
    
    // Show rock warning for 3 seconds
    setShowRockWarning(true);
    setTimeout(() => {
      setShowRockWarning(false);
    }, 3000);
  }, [getCharacterCenterPosition, hasSeenTutorial]);

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('superinu-tutorial-seen', 'true');
    
    // Actually start the game
    const centerPos = getCharacterCenterPosition();
    setCharacter(centerPos);
    setTargetPosition(centerPos);
    setTokens([]);
    setRocks([]);
    setCollectedTokenPopups([]);
    setTokenStats({});
    setTouchRipples([]);
    setGameState({
      isPlaying: true,
      score: 0,
      lives: 3,
      gameOver: false,
      level: 1,
      tokensCollected: 0,
      missedTokens: 0,
    });
    lastTokenSpawn.current = 0;
    lastRockSpawn.current = 0;
    
    // Show rock warning for 3 seconds
    setShowRockWarning(true);
    setTimeout(() => {
      setShowRockWarning(false);
    }, 3000);
  }, [getCharacterCenterPosition]);

  // Update parent stats
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate({
        tokensCollected: gameState.tokensCollected,
        missedTokens: gameState.missedTokens,
        score: gameState.score,
        lives: gameState.lives,
        level: gameState.level,
      });
    }
  }, [gameState, onStatsUpdate]);

  return (
    <div className="streme-game">
      <div className="game-container" ref={gameRef}>
        
        {/* Start Screen */}
        {!gameState.isPlaying && !gameState.gameOver && (
          <div className="game-start">
            <h3>🌊 SuperInu River</h3>
            <p>Guide SuperInu to catch streaming SuperFluid tokens!</p>
            <p>👆 Tap where you want SuperInu to swim</p>
            
            {tokensLoading && (
              <div style={{ margin: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                🔄 Loading SuperFluid tokens...
              </div>
            )}
            
            {!tokensLoading && availableTokens.length > 0 && (
              <div style={{ margin: '12px 0', color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
                ✨ {availableTokens.length} SuperFluid tokens ready!
              </div>
            )}
            
            <div className="preview-character">
              <img 
                src="/superinu.png" 
                alt="SuperInu Preview" 
                onLoad={() => console.log('🎮 Preview image loaded')}
                onError={(e) => {
                  console.log('🎮 Preview image failed, using fallback');
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                }}
              />
              <div className="character-fallback hidden">🐕</div>
            </div>
            
            <button 
              onClick={startGame} 
              className="start-button"
              disabled={tokensLoading}
              style={tokensLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              {tokensLoading ? '🔄 Loading...' : '🎮 Start Game'}
            </button>
            
            <button onClick={() => setShowLeaderboard(true)} className="start-button" style={{marginTop: '8px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'}}>
              🏆 Leaderboard
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.gameOver && (
          <div className="game-over">
            <h3>🎮 Game Over!</h3>
            <p>Final Score: {gameState.score}</p>
            <p>Tokens Collected: {gameState.tokensCollected}</p>
            <p>Tokens Missed: {gameState.missedTokens}</p>
            
            {/* Top Token Collected */}
            {Object.keys(tokenStats).length > 0 && (() => {
              const topToken = Object.entries(tokenStats)
                .sort(([, a], [, b]) => b.count - a.count)[0];
              if (topToken) {
                const [symbol, stats] = topToken;
                return (
                  <div className="top-token-collected">
                    <p className="top-token-label">Top Token Collected:</p>
                    <a 
                      href={`https://streme.fun/token/${stats.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="top-token-link"
                    >
                      <div className="top-token-display">
                        <img src={stats.img_url} alt={stats.name} />
                        <div className="top-token-info">
                          <span className="top-token-symbol">{symbol}</span>
                          <span className="top-token-count">{stats.count}x collected</span>
                        </div>
                      </div>
                    </a>
                  </div>
                );
              }
              return null;
            })()}
            
            <button onClick={startGame} className="restart-button">
              🔄 Play Again
            </button>
            
            <button onClick={() => setShowLeaderboard(true)} className="restart-button" style={{marginTop: '8px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100())'}}>
              🏆 View Leaderboard
            </button>
            
            <div className="game-over-share">
              <ShareButton 
                gameData={{
                  score: gameState.score,
                  tokensCollected: gameState.tokensCollected,
                  level: gameState.level,
                  rank: undefined, // Will be fetched from server
                }}
              />
              <DonationButton />
            </div>
          </div>
        )}

        {/* Game Playing */}
        {gameState.isPlaying && (
          <>
            {/* River Background */}
            <div className="river-background">
              <div className="river-flow"></div>
            </div>

            {/* Character */}
            <div
              className="superinu-character"
              style={{
                left: `${character.x}px`,
                top: `${character.y}px`,
                width: `${CHARACTER_SIZE}px`,
                height: `${CHARACTER_SIZE}px`,
              }}
            >
              <img 
                src="/superinu.png" 
                alt="SuperInu" 
                onLoad={() => console.log('🎮 Character image loaded')}
                onError={(e) => {
                  console.log('🎮 Character image failed, using fallback');
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                }}
              />
              <div className="character-fallback hidden">🐕</div>
            </div>

            {/* Tokens */}
            {tokens.map(token => {
              // Check if character is approaching this token
              const distance = Math.sqrt(
                Math.pow(character.x + CHARACTER_SIZE/2 - (token.x + TOKEN_SIZE/2), 2) +
                Math.pow(character.y + CHARACTER_SIZE/2 - (token.y + TOKEN_SIZE/2), 2)
              );
              const isApproaching = distance < 100; // Show preview when within 100px
              const tokenValue = tokenService.getTokenValue(token.token);
              
              return (
                <div
                  key={token.id}
                  className={`token-obstacle ${isApproaching ? 'token-approaching' : ''}`}
                  style={{
                    left: `${token.x}px`,
                    top: `${token.y}px`,
                    width: `${TOKEN_SIZE}px`,
                    height: `${TOKEN_SIZE}px`,
                  }}
                >
                  {isApproaching && (
                    <div className="token-value-preview">
                      +{tokenValue} pts
                    </div>
                  )}
                  <div className="token-content">
                    <img 
                      src={token.token.img_url} 
                      alt={token.token.name}
                      onError={(e) => {
                        e.currentTarget.src = '/superinu.png';
                      }}
                    />
                    <span className="token-symbol">{token.token.symbol}</span>
                  </div>
                </div>
              );
            })}

            {/* Rocks */}
            {rocks.map(rock => (
              <div
                key={rock.id}
                className={`river-rock rock-variant-${rock.variant}`}
                style={{
                  left: `${rock.x}px`,
                  top: `${rock.y}px`,
                  width: `${rock.width}px`,
                  height: `${rock.height}px`,
                }}
              >
                <div className="rock-shadow" />
                <div className="water-splash" />
              </div>
            ))}

            {/* Touch Ripples */}
            {touchRipples.map(ripple => (
              <div
                key={ripple.id}
                className="touch-indicator"
                style={{
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                }}
              />
            ))}

            {/* Simplified Game Stats with Danger Indicator */}
            <div className="game-stats-enhanced">
              <div className="primary-score">
                <span className="score-label">SCORE</span>
                <span className="score-value">{gameState.score.toLocaleString()}</span>
              </div>
              <div className="level-indicator">
                <span className="level-label">LEVEL</span>
                <span className="level-value">{gameState.level}</span>
              </div>
              <div className={`danger-indicator ${gameState.missedTokens >= 7 ? 'danger-zone' : ''}`}>
                <span className="missed-label">MISSED</span>
                <span className="missed-count">{gameState.missedTokens}/10</span>
                <div className="danger-bar">
                  <div 
                    className="danger-fill" 
                    style={{width: `${(gameState.missedTokens/10)*100}%`}}
                  />
                </div>
              </div>
            </div>

            {/* Token Collection Popups */}
            {collectedTokenPopups.map(popup => (
              <TokenCollectedPopup
                key={popup.id}
                token={popup.token}
                value={popup.value}
                x={popup.x}
                y={popup.y}
                onComplete={() => {
                  setCollectedTokenPopups(prev => prev.filter(p => p.id !== popup.id));
                }}
              />
            ))}

            {/* Rock Warning */}
            {showRockWarning && (
              <div className="rock-warning">
                <span className="warning-icon">🪨</span>
                <span className="warning-text">WATCH OUT FOR ROCKS!</span>
                <span className="warning-icon">🪨</span>
              </div>
            )}
            
            {/* Game Instructions */}
            <div className="game-instructions">
              <p>🏊‍♂️ Tap to swim • 🪙 Catch SuperFluid tokens • 🪨 Avoid rocks • ❌ Don't miss 10!</p>
            </div>
            
            {/* End Adventure Button */}
            <button 
              className="end-adventure-button"
              onClick={() => {
                // End the game gracefully
                setGameState(prev => ({
                  ...prev,
                  isPlaying: false,
                  gameOver: true,
                }));
              }}
            >
              🏁 End Adventure
            </button>
          </>
        )}
      </div>
      
      {/* Leaderboard Modal */}
      <Leaderboard 
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUserScore={gameState.gameOver ? gameState.score : undefined}
      />
      
      {/* Tutorial */}
      <Tutorial 
        isOpen={showTutorial}
        onComplete={handleTutorialComplete}
        gameContainerRef={gameRef}
      />
    </div>
  );
}