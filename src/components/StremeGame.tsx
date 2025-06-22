import { useEffect, useState, useRef, useCallback } from 'react';
import { sdk } from '@farcaster/frame-sdk';
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
}

export function StremeGame() {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    lives: 3,
    gameOver: false,
    level: 1,
    isPaused: false,
  });
  
  const [stremeinu, setStremeinu] = useState({ x: 100, y: 300 });
  const [obstacles, setObstacles] = useState<GameObject[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<StremeToken[]>([]);
  const [current, setCurrent] = useState(0);
  const [riverFlow, setRiverFlow] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, speed: number}>>([]);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastObstacleTime = useRef<number>(0);
  const lastTokenFetch = useRef<number>(0);
  const lastParticleTime = useRef<number>(0);

  // Fetch trending tokens from Streme.Fun API
  const fetchTrendingTokens = useCallback(async () => {
    try {
      const response = await fetch('https://api.streme.fun/api/tokens/trending');
      if (response.ok) {
        const tokens: StremeToken[] = await response.json();
        setTrendingTokens(tokens.slice(0, 20)); // Use first 20 tokens
        console.log('🎮 Fetched trending tokens:', tokens.length);
      }
    } catch (error) {
      console.error('❌ Error fetching trending tokens:', error);
      // Fallback tokens if API fails
      setTrendingTokens([
        { id: 1, name: 'Streme', symbol: 'STREME', img_url: '/stremeinu.png', username: 'streme', marketData: { price: 0.0001, priceChange24h: 5.2, volume24h: 1000 } },
        { id: 2, name: 'Farcaster', symbol: 'FARC', img_url: '/stremeinu.png', username: 'farcaster', marketData: { price: 0.0002, priceChange24h: -2.1, volume24h: 800 } },
      ]);
    }
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
    });
    setStremeinu({ x: 100, y: 300 });
    setObstacles([]);
    setCurrent(0);
    setRiverFlow(0);
    setParticles([]);
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

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const gameLoop = (timestamp: number) => {
      // Update river flow
      setRiverFlow(prev => (prev + 1) % 360);
      
      // Update current flow
      setCurrent(prev => (prev + 1) % 360);
      
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
            x: 800,
            y: Math.random() * 500 + 50,
            width: 60,
            height: 60,
            speed: 3 + gameState.level * 0.5,
            token: randomToken,
            rotation: Math.random() * 360,
            scale: 0.8 + Math.random() * 0.4,
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
            x: obstacle.x - obstacle.speed,
            rotation: obstacle.rotation + 2,
          }))
          .filter(obstacle => obstacle.x > -100);

        // Check collisions
        updated.forEach(obstacle => {
          if (
            stremeinu.x < obstacle.x + obstacle.width &&
            stremeinu.x + 60 > obstacle.x &&
            stremeinu.y < obstacle.y + obstacle.height &&
            stremeinu.y + 60 > obstacle.y
          ) {
            // Collision detected
            setGameState(prev => ({
              ...prev,
              lives: prev.lives - 1,
            }));
          }
        });

        return updated;
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
      if (gameState.lives <= 0) {
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
  }, [gameState.isPlaying, gameState.isPaused, gameState.lives, gameState.score, gameState.level, stremeinu, trendingTokens]);

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
          <span>Lives: {'❤️'.repeat(gameState.lives)}</span>
          <span>Level: {gameState.level}</span>
        </div>
      </div>

      <div className="game-container" ref={gameRef}>
        {!gameState.isPlaying && !gameState.gameOver && (
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
            <button onClick={startGame} className="restart-button">
              🔄 Play Again
            </button>
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
          </>
        )}
      </div>

      <div className="game-instructions">
        <h4>🎯 How to Play:</h4>
        <ul>
          <li>Use <strong>Arrow Keys</strong> or <strong>W/S</strong> to move Stremeinu up and down</li>
          <li>Dodge the trending Streme tokens floating down the river</li>
          <li>Each token shows real market data from <a href="https://streme.fun" target="_blank" rel="noopener noreferrer">Streme.Fun</a></li>
          <li>Press <strong>Space</strong> to pause, <strong>R</strong> to restart</li>
          <li>Survive as long as possible and beat your high score!</li>
        </ul>
      </div>
    </div>
  );
} 