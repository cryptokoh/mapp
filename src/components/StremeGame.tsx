import { useEffect, useState, useRef, useCallback } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import './StremeGame.css';

interface StremeToken {
  id: number;
  name: string;
  symbol: string;
  img_url: string;
  username: string;
  marketData: {
    price: number;
    priceChange24h: number;
    volume24h: number;
  };
}

interface GameState {
  isPlaying: boolean;
  score: number;
  lives: number;
  gameOver: boolean;
  level: number;
  isPaused: boolean;
  collectedTokens: { [tokenId: number]: { token: StremeToken; count: number } };
  missedTokens: number;
  isLoading: boolean;
}

interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  token?: StremeToken;
  rotation: number;
  scale: number;
  isCollected?: boolean;
}

interface BurstEffect {
  id: string;
  x: number;
  y: number;
  token: StremeToken;
  timestamp: number;
}

interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  rotation: number;
  velocity: { x: number; y: number };
  timestamp: number;
}

export function StremeGame() {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    lives: 3,
    gameOver: false,
    level: 1,
    isPaused: false,
    collectedTokens: {},
    missedTokens: 0,
    isLoading: true,
  });
  
  const [stremeinu, setStremeinu] = useState({ x: 100, y: 300 });
  const [obstacles, setObstacles] = useState<GameObject[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<StremeToken[]>([]);
  const [riverFlow, setRiverFlow] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, speed: number}>>([]);
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [joystickMultiplier, setJoystickMultiplier] = useState(1);
  const [burstEffects, setBurstEffects] = useState<BurstEffect[]>([]);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isStaking, setIsStaking] = useState(false);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastObstacleTime = useRef<number>(0);
  const lastTokenFetch = useRef<number>(0);
  const lastParticleTime = useRef<number>(0);
  const burstCounter = useRef<number>(0);

  // Fetch trending tokens from Streme.Fun API
  const fetchTrendingTokens = useCallback(async () => {
    try {
      const response = await fetch('https://api.streme.fun/api/tokens/trending');
      if (response.ok) {
        const tokens: StremeToken[] = await response.json();
        setTrendingTokens(tokens.slice(0, 20)); // Use first 20 tokens
        console.log('🎮 Fetched trending tokens:', tokens.length);
        // Set loading to false after tokens are loaded
        setGameState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('❌ Error fetching trending tokens:', error);
      // Fallback tokens if API fails
      setTrendingTokens([
        { id: 1, name: 'Streme', symbol: 'STREME', img_url: '/stremeinu.png', username: 'streme', marketData: { price: 0.0001, priceChange24h: 5.2, volume24h: 1000 } },
        { id: 2, name: 'Farcaster', symbol: 'FARC', img_url: '/stremeinu.png', username: 'farcaster', marketData: { price: 0.0002, priceChange24h: -2.1, volume24h: 800 } },
      ]);
      // Set loading to false even if API fails
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Handle token collection
  const collectToken = useCallback((token: StremeToken, x: number, y: number) => {
    // Create burst effect with unique key
    burstCounter.current += 1;
    const burstEffect: BurstEffect = {
      id: `burst-${Date.now()}-${burstCounter.current}`,
      x,
      y,
      token,
      timestamp: Date.now()
    };
    
    setBurstEffects(prev => [...prev, burstEffect]);
    
    // Remove burst effect after animation
    setTimeout(() => {
      setBurstEffects(prev => prev.filter(effect => effect.id !== burstEffect.id));
    }, 1000);
    
    setGameState(prev => {
      const currentCount = prev.collectedTokens[token.id]?.count || 0;
      return {
        ...prev,
        collectedTokens: {
          ...prev.collectedTokens,
          [token.id]: {
            token,
            count: currentCount + 1
          }
        },
        score: prev.score + 100 // Bonus points for collecting tokens
      };
    });
  }, []);

  // Initialize game
  const startGame = useCallback(() => {
    setGameState({
      isPlaying: true,
      score: 0,
      lives: 3,
      gameOver: false,
      level: 1,
      isPaused: false,
      collectedTokens: {},
      missedTokens: 0,
      isLoading: false,
    });
    setStremeinu({ x: 100, y: 300 });
    setObstacles([]);
    setRiverFlow(0);
    setParticles([]);
  }, []);

  // Handle staking tokens with confetti
  const handleStakeTokens = useCallback(() => {
    if (Object.keys(gameState.collectedTokens).length === 0) return;
    
    setIsStaking(true);
    
    // Create confetti pieces from collected tokens
    const confettiPieces: ConfettiPiece[] = [];
    const colors = ['#8B5CF6', '#A855F7', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
    
    Object.values(gameState.collectedTokens).forEach(({ token, count }) => {
      // Create multiple confetti pieces for each token based on count
      for (let i = 0; i < Math.min(count, 5); i++) { // Max 5 pieces per token
        const piece: ConfettiPiece = {
          id: `confetti-${Date.now()}-${Math.random()}`,
          x: Math.random() * 800, // Random starting position
          y: 600, // Start from bottom
          text: token.symbol,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          velocity: {
            x: (Math.random() - 0.5) * 8, // Random horizontal velocity
            y: -15 - Math.random() * 10 // Upward velocity with variation
          },
          timestamp: Date.now()
        };
        confettiPieces.push(piece);
      }
    });
    
    setConfetti(confettiPieces);
    
    // Animate confetti
    const animateConfetti = () => {
      setConfetti(prev => 
        prev.map(piece => ({
          ...piece,
          x: piece.x + piece.velocity.x,
          y: piece.y + piece.velocity.y,
          velocity: {
            x: piece.velocity.x * 0.99, // Air resistance
            y: piece.velocity.y + 0.5 // Gravity
          },
          rotation: piece.rotation + 2
        })).filter(piece => piece.y < 700) // Remove pieces that fall off screen
      );
    };
    
    const confettiInterval = setInterval(animateConfetti, 50);
    
    // Stop confetti and restart game after 3 seconds
    setTimeout(() => {
      clearInterval(confettiInterval);
      setConfetti([]);
      setIsStaking(false);
      startGame(); // Restart the game
    }, 3000);
  }, [gameState.collectedTokens, startGame]);

  // Handle joystick input
  const handleJoystickMove = useCallback((direction: 'up' | 'down' | 'left' | 'right' | null, multiplier: number) => {
    setJoystickDirection(direction);
    setJoystickMultiplier(multiplier);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isPlaying || gameState.isPaused) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setStremeinu(prev => ({ ...prev, y: Math.max(50, prev.y - 50) }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setStremeinu(prev => ({ ...prev, y: Math.min(550, prev.y + 50) }));
          break;
        case ' ':
          e.preventDefault();
          setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
          break;
        case 'r':
        case 'R':
          if (gameState.gameOver) {
            startGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isPlaying, gameState.isPaused, gameState.gameOver, startGame]);

  // Handle joystick movement
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || !joystickDirection) return;

    const moveInterval = setInterval(() => {
      const moveDistance = 30 * joystickMultiplier;
      
      if (joystickDirection === 'up') {
        setStremeinu(prev => ({ ...prev, y: Math.max(50, prev.y - moveDistance) }));
      } else if (joystickDirection === 'down') {
        setStremeinu(prev => ({ ...prev, y: Math.min(550, prev.y + moveDistance) }));
      } else if (joystickDirection === 'left') {
        setStremeinu(prev => ({ ...prev, x: Math.max(50, prev.x - moveDistance) }));
      } else if (joystickDirection === 'right') {
        setStremeinu(prev => ({ ...prev, x: Math.min(700, prev.x + moveDistance) }));
      }
    }, 100);

    return () => clearInterval(moveInterval);
  }, [gameState.isPlaying, gameState.isPaused, joystickDirection, joystickMultiplier]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const gameLoop = (timestamp: number) => {
      // Update river flow
      setRiverFlow(prev => (prev + 1) % 360);
      
      // Spawn particles
      if (timestamp - lastParticleTime.current > 100) {
        setParticles(prev => {
          const newParticle = {
            id: timestamp,
            x: Math.random() * 800,
            y: 600,
            speed: 2 + Math.random() * 3
          };
          return [...prev.slice(-19), newParticle];
        });
        lastParticleTime.current = timestamp;
      }
      
      // Spawn obstacles
      if (timestamp - lastObstacleTime.current > 2000 - gameState.level * 100) {
        if (trendingTokens.length > 0) {
          const randomToken = trendingTokens[Math.floor(Math.random() * trendingTokens.length)];
          const newObstacle: GameObject = {
            id: `obstacle-${timestamp}`,
            x: Math.random() * 600 + 100,
            y: 650,
            width: 60,
            height: 60,
            speed: 3 + gameState.level * 0.5,
            token: randomToken,
            rotation: Math.random() * 360,
            scale: 0.8 + Math.random() * 0.4,
            isCollected: false,
          };
          setObstacles(prev => [...prev, newObstacle]);
          lastObstacleTime.current = timestamp;
        }
      }

      // Update obstacles
      setObstacles(prev => {
        const updated = prev
          .map(obstacle => ({
            ...obstacle,
            y: obstacle.y - obstacle.speed,
            rotation: obstacle.rotation + 1,
          }))
          .filter(obstacle => {
            // Count missed tokens (tokens that go off-screen without being collected)
            if (obstacle.y < -60 && !obstacle.isCollected) {
              setGameState(prev => ({
                ...prev,
                missedTokens: prev.missedTokens + 1
              }));
              return false; // Remove from game
            }
            return obstacle.y > -60; // Keep tokens that are still on screen
          });

        // Check collisions
        updated.forEach(obstacle => {
          if (
            !obstacle.isCollected &&
            stremeinu.x < obstacle.x + obstacle.width &&
            stremeinu.x + 60 > obstacle.x &&
            stremeinu.y < obstacle.y + obstacle.height &&
            stremeinu.y + 60 > obstacle.y
          ) {
            // Collision detected - collect token if it exists
            if (obstacle.token) {
              collectToken(obstacle.token, obstacle.x, obstacle.y);
              obstacle.isCollected = true; // Mark as collected
            }
          }
        });

        return updated.filter(obstacle => !obstacle.isCollected); // Remove collected obstacles
      });

      // Update particles
      setParticles(prev => 
        prev
          .map(particle => ({
            ...particle,
            y: particle.y - particle.speed,
          }))
          .filter(particle => particle.y > -20)
      );

      // Update score
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
      }));

      // Check game over
      if (gameState.lives <= 0 || gameState.missedTokens >= 6) {
        setGameState(prev => ({
          ...prev,
          isPlaying: false,
          gameOver: true,
        }));
        return;
      }

      // Level up every 1000 points
      if (gameState.score > 0 && gameState.score % 1000 === 0) {
        setGameState(prev => ({
          ...prev,
          level: prev.level + 1,
        }));
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.lives, gameState.score, gameState.level, stremeinu, trendingTokens, collectToken]);

  // Fetch tokens periodically
  useEffect(() => {
    const fetchInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastTokenFetch.current > 30000) { // Fetch every 30 seconds
        fetchTrendingTokens();
        lastTokenFetch.current = now;
      }
    }, 5000);

    return () => clearInterval(fetchInterval);
  }, [fetchTrendingTokens]);

  return (
    <div className="streme-game">
      <div className="game-header">
        <h2>🌊 Stremeinu's River Adventure</h2>
        <div className="game-stats">
          <span>Score: {gameState.score}</span>
          <span>Lives: {'❤️'.repeat(Math.max(0, gameState.lives))}</span>
          <span>Level: {gameState.level}</span>
          <span>Missed: {gameState.missedTokens}/6</span>
        </div>
      </div>

      <div className="game-container" ref={gameRef}>
        {/* Loading Screen */}
        {gameState.isLoading && (
          <div className="game-loading">
            <div className="loading-content">
              <div className="loading-logo">
                <img src="/stremeinu.png" alt="Stremeinu" />
              </div>
              <h3>🌊 Loading Stremeinu's River Adventure</h3>
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <p>Fetching trending tokens...</p>
            </div>
          </div>
        )}

        {!gameState.isLoading && !gameState.isPlaying && !gameState.gameOver && (
          <div className="game-start">
            <h3>🚀 Ready to Float?</h3>
            <p>Help Stremeinu navigate the river of trending tokens!</p>
            <p>Use <strong>Arrow Keys</strong> or <strong>W/S</strong> to move</p>
            <p><strong>Space</strong> to pause, <strong>R</strong> to restart</p>
            <button onClick={startGame} className="start-button">
              🎮 Start Adventure
            </button>
          </div>
        )}

        {gameState.gameOver && (
          <div className="game-over">
            <h3>💥 Game Over!</h3>
            <p>Final Score: {gameState.score}</p>
            <p>Level Reached: {gameState.level}</p>
            <p>Tokens Missed: {gameState.missedTokens}/6</p>
            
            {/* Display collected tokens */}
            {Object.keys(gameState.collectedTokens).length > 0 && (
              <div className="collected-tokens">
                <h4>🎯 Tokens Collected ({Object.keys(gameState.collectedTokens).length} unique)</h4>
                <div className="token-collection-summary">
                  <span>Total collected: {Object.values(gameState.collectedTokens).reduce((sum, { count }) => sum + count, 0)}</span>
                </div>
                <div className="token-collection-list">
                  {Object.values(gameState.collectedTokens)
                    .sort((a, b) => b.count - a.count) // Sort by count descending
                    .map(({ token, count }) => (
                      <div key={token.id} className="collected-token-item">
                        <img 
                          src={token.img_url || '/stremeinu.png'} 
                          alt={token.name}
                          onError={(e) => {
                            e.currentTarget.src = '/stremeinu.png';
                          }}
                        />
                        <div className="token-collection-info">
                          <span className="token-collection-name">{token.symbol}</span>
                          <span className="token-collection-count">x{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <button onClick={startGame} className="restart-button">
              🔄 Play Again
            </button>
            
            {/* Stake Tokens Button */}
            {Object.keys(gameState.collectedTokens).length > 0 && !isStaking && (
              <button onClick={handleStakeTokens} className="stake-button">
                🎰 Stake Streme Tokens to Stream Rewards to Wallet
              </button>
            )}
          </div>
        )}

        {gameState.isPaused && (
          <div className="game-paused">
            <h3>⏸️ Game Paused</h3>
            <p>Press <strong>Space</strong> to resume</p>
          </div>
        )}

        {gameState.isPlaying && (
          <>
            {/* River Background */}
            <div className="river-background">
              <div 
                className="river-flow"
                style={{ 
                  background: `linear-gradient(${riverFlow}deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.3))` 
                }}
              />
              <div 
                className="river-flow river-flow-2"
                style={{ 
                  background: `linear-gradient(${riverFlow + 45}deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2))` 
                }}
              />
            </div>
            
            {/* Floating Particles */}
            {particles.map(particle => (
              <div
                key={particle.id}
                className="river-particle"
                style={{
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                }}
              />
            ))}
            
            {/* Stremeinu character */}
            <div
              className="stremeinu-character"
              style={{
                left: `${stremeinu.x}px`,
                top: `${stremeinu.y}px`,
              }}
            >
              <img src="/stremeinu.png" alt="Stremeinu" />
            </div>

            {/* Obstacles */}
            {obstacles.map(obstacle => (
              <div
                key={obstacle.id}
                className="obstacle"
                style={{
                  left: `${obstacle.x}px`,
                  top: `${obstacle.y}px`,
                  width: `${obstacle.width}px`,
                  height: `${obstacle.height}px`,
                  transform: `rotate(${obstacle.rotation}deg) scale(${obstacle.scale})`,
                }}
              >
                {obstacle.token && (
                  <div className="token-info">
                    <img 
                      src={obstacle.token.img_url || '/stremeinu.png'} 
                      alt={obstacle.token.name}
                      onError={(e) => {
                        e.currentTarget.src = '/stremeinu.png';
                      }}
                    />
                    <div className="token-details">
                      <span className="token-name">{obstacle.token.symbol}</span>
                      <span className={`price-change ${obstacle.token.marketData.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                        {obstacle.token.marketData.priceChange24h >= 0 ? '📈' : '📉'} 
                        {Math.abs(obstacle.token.marketData.priceChange24h).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Burst Effects */}
            {burstEffects.map(effect => (
              <div
                key={effect.id}
                className="burst-effect"
                style={{
                  left: `${effect.x}px`,
                  top: `${effect.y}px`,
                }}
              >
                <div className="burst-particles">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="burst-particle"
                      style={{
                        '--angle': `${i * 45}deg`,
                        '--delay': `${i * 0.1}s`,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
                <div className="burst-token">
                  <img 
                    src={effect.token.img_url || '/stremeinu.png'} 
                    alt={effect.token.name}
                    onError={(e) => {
                      e.currentTarget.src = '/stremeinu.png';
                    }}
                  />
                  <span className="burst-symbol">+{effect.token.symbol}</span>
                </div>
              </div>
            ))}

            {/* Confetti Effects */}
            {confetti.map(piece => (
              <div
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: `${piece.x}px`,
                  top: `${piece.y}px`,
                  transform: `rotate(${piece.rotation}deg)`,
                  color: piece.color,
                }}
              >
                {piece.text}
              </div>
            ))}
          </>
        )}
        
        {/* Virtual Joystick inside game area */}
        {gameState.isPlaying && (
          <div className="game-area-joystick">
            <VirtualJoystick 
              onMove={handleJoystickMove}
              disabled={gameState.isPaused}
            />
          </div>
        )}
      </div>

      {/* Virtual Joystick for Mobile */}
      {gameState.isPlaying && (
        <VirtualJoystick 
          onMove={handleJoystickMove}
          disabled={gameState.isPaused}
        />
      )}
    </div>
  );
} 