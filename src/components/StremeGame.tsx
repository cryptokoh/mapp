import { useEffect, useState, useRef, useCallback } from 'react';
import './StremeGame.css';
import { ShareButton } from './ShareButton';
import { Leaderboard } from './Leaderboard';
import { serverLeaderboardService } from '../services/serverLeaderboard';
import { useFarcaster } from '../hooks/useFarcaster';
import { tokenService, type StremeToken } from '../services/tokenService';
import { TokenCollectedPopup } from './TokenCollectedPopup';

// Game constants
const MAX_CONTAINER_WIDTH = 424;
const CHARACTER_SIZE = 60;
const TOKEN_SIZE = 50;

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

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Character position and movement
  const [character, setCharacter] = useState<CharacterPosition>({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState<CharacterPosition>({ x: 0, y: 0 });
  
  // Game objects
  const [tokens, setTokens] = useState<GameObject[]>([]);
  
  // Available tokens for spawning (fetched from Streme.fun API)
  const [availableTokens, setAvailableTokens] = useState<StremeToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  
  // Token collection tracking
  const [collectedTokenPopups, setCollectedTokenPopups] = useState<CollectedTokenPopup[]>([]);
  const [tokenStats, setTokenStats] = useState<Record<string, { count: number; totalValue: number; name: string; img_url: string }>>({});

  // Refs
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTokenSpawn = useRef<number>(0);
  const tokenCounter = useRef<number>(0);

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

  // Initialize character position
  useEffect(() => {
    const centerPos = getCharacterCenterPosition();
    setCharacter(centerPos);
    setTargetPosition(centerPos);
    console.log('🎮 Character positioned at center:', centerPos);
    console.log('🎮 Available tokens:', availableTokens.length);
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
      
      // Calculate target position (center character on tap point)
      const targetX = tapX - CHARACTER_SIZE / 2;
      const targetY = tapY - CHARACTER_SIZE / 2;
      
      // Clamp to boundaries and set target
      const clampedX = Math.max(0, Math.min(targetX, width - CHARACTER_SIZE));
      const clampedY = Math.max(0, Math.min(targetY, height - CHARACTER_SIZE));
      
      setTargetPosition({ x: clampedX, y: clampedY });
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

  // Check collision between character and token
  const checkCollision = useCallback((char: CharacterPosition, token: GameObject) => {
    return (
      char.x < token.x + TOKEN_SIZE &&
      char.x + CHARACTER_SIZE > token.x &&
      char.y < token.y + TOKEN_SIZE &&
      char.y + CHARACTER_SIZE > token.y
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
        
        // Smooth swimming movement with adaptive speed
        const speed = Math.min(distance * 0.12, 6);
        const moveX = prev.x + (deltaX / distance) * speed;
        const moveY = prev.y + (deltaY / distance) * speed;
        
        return { x: moveX, y: moveY };
      });

      // Spawn tokens periodically
      if (timestamp - lastTokenSpawn.current > 2000) { // Every 2 seconds
        spawnToken();
        lastTokenSpawn.current = timestamp;
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
              }
            }));

            // Show collection popup with delay for better sync
            setTimeout(() => {
              const popup: CollectedTokenPopup = {
                id: `popup-${Date.now()}-${Math.random()}`,
                token: token.token,
                value: tokenValue,
                x: token.x + TOKEN_SIZE / 2,
                y: token.y + TOKEN_SIZE / 2,
              };
              setCollectedTokenPopups(prev => [...prev, popup]);
            }, 150); // 150ms delay for better visual sync

            // Remove collected token
            updatedTokens.splice(index, 1);
          }
        });

        return updatedTokens;
      });

      // Update score
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1, // Continuous score increase
      }));

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
  }, [gameState.isPlaying, character, targetPosition, spawnToken, checkCollision, getGameDimensions]);

  // Start game
  const startGame = useCallback(() => {
    console.log('🎮 Starting game...');
    const centerPos = getCharacterCenterPosition();
    setCharacter(centerPos);
    setTargetPosition(centerPos);
    setTokens([]);
    setCollectedTokenPopups([]);
    setTokenStats({});
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
            {tokens.map(token => (
              <div
                key={token.id}
                className="token-obstacle"
                style={{
                  left: `${token.x}px`,
                  top: `${token.y}px`,
                  width: `${TOKEN_SIZE}px`,
                  height: `${TOKEN_SIZE}px`,
                }}
              >
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
            ))}

            {/* Game Stats */}
            <div className="game-stats">
              <div className="stat">Score: {gameState.score.toLocaleString()}</div>
              <div className="stat">Tokens: {gameState.tokensCollected}</div>
              <div className="stat">Missed: {gameState.missedTokens}/10</div>
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

            {/* Game Instructions */}
            <div className="game-instructions">
              <p>🏊‍♂️ Tap to swim • 🪙 Catch SuperFluid tokens • ❌ Don't miss 10!</p>
            </div>
          </>
        )}
      </div>
      
      {/* Leaderboard Modal */}
      <Leaderboard 
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUserScore={gameState.gameOver ? gameState.score : undefined}
      />
    </div>
  );
}