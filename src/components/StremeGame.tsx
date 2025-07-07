import { useEffect, useState, useRef, useCallback } from 'react';
import './StremeGame.css';
import { ShareButton } from './ShareButton';

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
  const [burstEffects, setBurstEffects] = useState<BurstEffect[]>([]);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isStaking, setIsStaking] = useState(false);
  const [wireframeGrid, setWireframeGrid] = useState<Array<{id: string, x: number, y: number, size: number, opacity: number, pulse: number}>>([]);
  const [electricityNodes, setElectricityNodes] = useState<Array<{id: string, x: number, y: number, connections: string[], pulse: number}>>([]);
  const [touchTarget, setTouchTarget] = useState<{ x: number; y: number } | null>(null);
  const [isTouchHeld, setIsTouchHeld] = useState(false);
  const [rippleCount, setRippleCount] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastObstacleTime = useRef<number>(0);
  const lastTokenFetch = useRef<number>(0);
  const lastParticleTime = useRef<number>(0);
  const burstCounter = useRef<number>(0);
  const wireframeCounter = useRef<number>(0);
  const electricityCounter = useRef<number>(0);
  const lastCountdownTime = useRef<number>(0);
  const obstacleCounter = useRef<number>(0);
  const baseSpeed = 3;
  const obstacleSpawnInterval = 2000; // Spawn obstacles every 2 seconds

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

  // Utility function to calculate centered character position
  const calculateCharacterPosition = useCallback(() => {
    const gameContainer = gameRef.current;
    const containerWidth = gameContainer?.clientWidth || 800;
    const containerHeight = gameContainer?.clientHeight || 600;
    
    const characterWidth = 60;
    const characterHeight = 60;
    
    // Calculate center position
    const centerX = (containerWidth - characterWidth) / 2;
    const centerY = (containerHeight - characterHeight) / 2;
    
    // Add gameplay offset (15% to the left for better token collection)
    const gameplayOffsetX = Math.max(0, containerWidth * 0.15);
    
    // Final position with boundaries
    const finalX = Math.max(25, centerX - gameplayOffsetX);
    const finalY = Math.max(25, Math.min(containerHeight - characterHeight - 25, centerY));
    
    return { x: finalX, y: finalY };
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
    console.log('🎮 Start game function called!');
    
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
    
    // Use utility function to calculate character position
    const position = calculateCharacterPosition();
    console.log('🎮 Character positioned at:', position);
    setStremeinu(position);
    
    setObstacles([]);
    setRiverFlow(0);
    setParticles([]);
  }, [calculateCharacterPosition]);

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
        const gameContainer = gameRef.current;
        const containerWidth = gameContainer?.clientWidth || 800;
        const containerHeight = gameContainer?.clientHeight || 600;
        
        const piece: ConfettiPiece = {
          id: `confetti-${Date.now()}-${Math.random()}`,
          x: Math.random() * containerWidth, // Random starting position
          y: containerHeight, // Start from bottom
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
      const gameContainer = gameRef.current;
      const containerHeight = gameContainer?.clientHeight || 600;
      
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
        })).filter(piece => piece.y < containerHeight + 100) // Remove pieces that fall off screen
      );
    };
    
    const confettiInterval = setInterval(animateConfetti, 50);
    
    // Stop confetti and restart game after 3 seconds
    setTimeout(() => {
      clearInterval(confettiInterval);
      setConfetti([]);
      setIsStaking(false);
      // Restart the game with proper character positioning
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
      
      // Use utility function for consistent positioning
      const position = calculateCharacterPosition();
      setStremeinu(position);
      setObstacles([]);
      setRiverFlow(0);
      setParticles([]);
    }, 3000);
  }, [gameState.collectedTokens]);

  // Add touch event listeners
  useEffect(() => {
    const gameContainer = gameRef.current;
    if (!gameContainer) return;

    const handleTouchStart = (e: TouchEvent | MouseEvent) => {
      // Don't prevent default if clicking on a button
      const target = e.target as HTMLElement;
      if (target.closest('button')) {
        return;
      }
      
      e.preventDefault();
      const rect = gameContainer.getBoundingClientRect();
      if (!rect) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      setTouchTarget({ x, y });
      setIsTouchHeld(true);
      setRippleCount(prev => prev + 1);
      setIsMoving(true);
    };

    const handleTouchMove = (e: TouchEvent | MouseEvent) => {
      // Don't prevent default if clicking on a button
      const target = e.target as HTMLElement;
      if (target.closest('button')) {
        return;
      }
      
      e.preventDefault();
      const rect = gameContainer.getBoundingClientRect();
      if (!rect) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      setTouchTarget({ x, y });
    };

    const handleTouchEnd = () => {
      setIsTouchHeld(false);
      setIsMoving(false);
      setTimeout(() => {
        setTouchTarget(null);
        setRippleCount(0);
      }, 1200); // Keep showing effects for a bit after release
    };

    // Mouse events
    gameContainer.addEventListener('mousedown', handleTouchStart);
    document.addEventListener('mousemove', handleTouchMove);
    document.addEventListener('mouseup', handleTouchEnd);

    // Touch events
    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      gameContainer.removeEventListener('mousedown', handleTouchStart);
      document.removeEventListener('mousemove', handleTouchMove);
      document.removeEventListener('mouseup', handleTouchEnd);
      gameContainer.removeEventListener('touchstart', handleTouchStart);
      gameContainer.removeEventListener('touchmove', handleTouchMove);
      gameContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Handle continuous ripple generation when touch is held
  useEffect(() => {
    let rippleInterval: NodeJS.Timeout | null = null;
    
    if (isTouchHeld) {
      rippleInterval = setInterval(() => {
        setRippleCount(prev => prev + 1);
      }, 300);
    }

    return () => {
      if (rippleInterval) {
        clearInterval(rippleInterval);
      }
    };
  }, [isTouchHeld]);

  // Create wireframe grid effect
  const createWireframeGrid = useCallback(() => {
    const gameContainer = gameRef.current;
    const containerWidth = gameContainer?.clientWidth || 800;
    const containerHeight = gameContainer?.clientHeight || 600;
    
    const newGrid = {
      id: `wireframe-${wireframeCounter.current++}`,
      x: Math.random() * containerWidth,
      y: Math.random() * containerHeight,
      size: 20 + Math.random() * 40,
      opacity: 0.1 + Math.random() * 0.3,
      pulse: Math.random() * 2 * Math.PI
    };
    
    setWireframeGrid(prev => [...prev, newGrid]);
    
    // Remove old grids after 5 seconds
    setTimeout(() => {
      setWireframeGrid(prev => prev.filter(grid => grid.id !== newGrid.id));
    }, 5000);
  }, []);

  // Create electricity nodes
  const createElectricityNodes = useCallback(() => {
    const nodeCount = 3 + Math.floor(Math.random() * 3);
    const nodes: Array<{id: string, x: number, y: number, connections: string[], pulse: number}> = [];
    
    for (let i = 0; i < nodeCount; i++) {
      const node = {
        id: `electricity-${electricityCounter.current++}`,
        x: Math.random() * 800,
        y: Math.random() * 600,
        connections: [] as string[],
        pulse: Math.random() * 2 * Math.PI
      };
      nodes.push(node);
    }
    
    // Create connections between nodes
    nodes.forEach((node, index) => {
      if (index < nodes.length - 1) {
        node.connections.push(nodes[index + 1].id);
      }
    });
    
    setElectricityNodes(prev => [...prev, ...nodes]);
    
    // Remove nodes after animation
    setTimeout(() => {
      setElectricityNodes(prev => prev.filter(node => !nodes.find(n => n.id === node.id)));
    }, 4000);
  }, []);

  // Generate wireframe and electricity effects periodically
  useEffect(() => {
    const wireframeInterval = setInterval(() => {
      if (gameState.isPlaying) {
        createWireframeGrid();
      }
    }, 1000);

    const electricityInterval = setInterval(() => {
      if (gameState.isPlaying) {
        createElectricityNodes();
      }
    }, 2000);

    return () => {
      clearInterval(wireframeInterval);
      clearInterval(electricityInterval);
    };
  }, [gameState.isPlaying, createWireframeGrid, createElectricityNodes]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isPlaying || gameState.isPaused) return;
      
      // Get current container dimensions for dynamic boundaries
      const gameContainer = gameRef.current;
      const containerHeight = gameContainer?.clientHeight || 600;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setStremeinu(prev => ({ 
            ...prev, 
            y: Math.max(25, prev.y - 50) 
          }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setStremeinu(prev => ({ 
            ...prev, 
            y: Math.min(containerHeight - 85, prev.y + 50) 
          }));
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

  // Handle Stremeinu movement towards touch target
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || !touchTarget || !isMoving) return;

    const moveInterval = setInterval(() => {
      setStremeinu(prev => {
        // Get current container dimensions for dynamic boundaries
        const gameContainer = gameRef.current;
        const containerWidth = gameContainer?.clientWidth || 800;
        const containerHeight = gameContainer?.clientHeight || 600;
        
        const dx = touchTarget.x - prev.x;
        const dy = touchTarget.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
          // Close enough to target, stop moving
          return prev;
        }
        
        const moveSpeed = 8;
        const moveX = (dx / distance) * moveSpeed;
        const moveY = (dy / distance) * moveSpeed;
        
        // Use dynamic boundaries based on container size
        const minX = 25;
        const maxX = containerWidth - 85; // Account for character width (60px) + padding
        const minY = 25;
        const maxY = containerHeight - 85; // Account for character height (60px) + padding
        
        const newX = Math.max(minX, Math.min(maxX, prev.x + moveX));
        const newY = Math.max(minY, Math.min(maxY, prev.y + moveY));
        
        // Debug logging for boundary issues
        if (newX !== prev.x + moveX || newY !== prev.y + moveY) {
          console.log('🎮 Character boundary correction:', {
            oldPos: { x: prev.x, y: prev.y },
            attemptedMove: { x: prev.x + moveX, y: prev.y + moveY },
            newPos: { x: newX, y: newY },
            boundaries: { minX, maxX, minY, maxY },
            containerSize: { width: containerWidth, height: containerHeight }
          });
        }
        
        return {
          x: newX,
          y: newY
        };
      });
    }, 16); // ~60 FPS

    return () => clearInterval(moveInterval);
  }, [gameState.isPlaying, gameState.isPaused, touchTarget, isMoving]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      return;
    }

    const gameLoop = (timestamp: number) => {
      // Get current container dimensions
      const gameContainer = gameRef.current;
      const containerWidth = gameContainer?.clientWidth || 800;
      const containerHeight = gameContainer?.clientHeight || 600;
      
      // Debug logging
      if (timestamp % 1000 < 16) { // Log roughly once per second
        console.log('🎮 Game loop running:', {
          isPlaying: gameState.isPlaying,
          containerWidth,
          containerHeight,
          stremeinu,
          obstaclesCount: obstacles.length,
          particlesCount: particles.length
        });
      }
      
      // Update river flow
      setRiverFlow(prev => (prev + 1) % 360);
      
      // Spawn particles
      if (timestamp - lastParticleTime.current > 100) {
        setParticles(prev => {
          const newParticle = {
            id: timestamp,
            x: Math.random() * containerWidth,
            y: containerHeight,
            speed: 2 + Math.random() * 3
          };
          return [...prev.slice(-19), newParticle];
        });
        lastParticleTime.current = timestamp;
      }
      
      // Spawn new obstacles only if tokens are available
      if (timestamp - lastObstacleTime.current > obstacleSpawnInterval && trendingTokens.length > 0) {
        // Calculate spawn area based on game container width
        const spawnAreaWidth = Math.min(200, containerWidth * 0.25); // 25% of game width, max 200px
        const spawnAreaStart = (containerWidth - spawnAreaWidth) / 2; // Center the spawn area
        const spawnAreaEnd = spawnAreaStart + spawnAreaWidth;
        
        // Ensure spawn area is within bounds
        const minX = Math.max(50, spawnAreaStart);
        const maxX = Math.min(containerWidth - 110, spawnAreaEnd);
        
        const newObstacle: GameObject = {
          id: `obstacle-${obstacleCounter.current++}`,
          x: minX + Math.random() * (maxX - minX), // Spawn within the narrow area
          y: containerHeight, // Start from bottom
          width: 60,
          height: 60,
          speed: baseSpeed + (gameState.level * 0.5),
          token: trendingTokens[Math.floor(Math.random() * trendingTokens.length)],
          rotation: Math.random() * 360,
          scale: 0.8 + Math.random() * 0.4,
        };
        setObstacles(prev => [...prev, newObstacle]);
        lastObstacleTime.current = timestamp;
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

      // Check game over with countdown
      if (gameState.lives <= 0) {
        setGameState(prev => ({
          ...prev,
          isPlaying: false,
          gameOver: true,
        }));
        return;
      }

      // Handle missed tokens countdown
      if (gameState.missedTokens >= 6) {
        if (countdown === null) {
          setCountdown(3);
        } else if (countdown > 0) {
          // Continue countdown
          if (timestamp - lastCountdownTime.current > 1000) {
            setCountdown(prev => prev! - 1);
            lastCountdownTime.current = timestamp;
          }
        } else {
          // Countdown finished - game over
          setGameState(prev => ({
            ...prev,
            isPlaying: false,
            gameOver: true,
          }));
          setCountdown(null);
          return;
        }
      } else {
        // Reset countdown if missed tokens go below 6
        setCountdown(null);
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

  // Debug log for game loop useEffect
  useEffect(() => {
    console.log('🎮 Game loop useEffect triggered:', {
      isPlaying: gameState.isPlaying,
      isPaused: gameState.isPaused,
      lives: gameState.lives,
      score: gameState.score,
      level: gameState.level
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.lives, gameState.score, gameState.level]);

  // Initial token fetch
  useEffect(() => {
    fetchTrendingTokens();
    
    // Fallback timeout to ensure loading state is cleared
    const loadingTimeout = setTimeout(() => {
      console.log('🎮 Loading timeout - clearing loading state');
      setGameState(prev => ({ ...prev, isLoading: false }));
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [fetchTrendingTokens]);

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

  // Stats update effect - fixed to prevent infinite loop
  useEffect(() => {
    if (onStatsUpdate) {
      const totalTokensCollected = Object.values(gameState.collectedTokens).reduce((sum, { count }) => sum + count, 0);
      onStatsUpdate({
        tokensCollected: totalTokensCollected,
        missedTokens: gameState.missedTokens,
        score: gameState.score,
        lives: gameState.lives,
        level: gameState.level,
      });
    }
  }, [gameState.collectedTokens, gameState.missedTokens, gameState.score, gameState.lives, gameState.level, onStatsUpdate]);

  // Debug effect for start screen
  useEffect(() => {
    if (!gameState.isLoading && !gameState.isPlaying && !gameState.gameOver) {
      console.log('🎮 Start screen should be visible, gameState:', gameState);
    }
  }, [gameState.isLoading, gameState.isPlaying, gameState.gameOver]);

  // Debug effect for game state changes
  useEffect(() => {
    console.log('🎮 Game state changed:', {
      isLoading: gameState.isLoading,
      isPlaying: gameState.isPlaying,
      gameOver: gameState.gameOver,
      score: gameState.score,
      lives: gameState.lives
    });
  }, [gameState.isLoading, gameState.isPlaying, gameState.gameOver, gameState.score, gameState.lives]);

  // Debug effect for game rendering
  useEffect(() => {
    if (gameState.isPlaying) {
      console.log('🎮 Game should be rendering, stremeinu:', stremeinu, 'obstacles:', obstacles.length);
    }
  }, [gameState.isPlaying, stremeinu, obstacles.length]);

  return (
    <div className="streme-game">
      <div className="game-container" ref={gameRef}>
        {/* Loading Screen */}
        {gameState.isLoading && (
          <div className="game-loading">
            <div className="loading-content">
              <div className="loading-logo">
                <img src="/stremeinu.png" alt="Stremeinu" />
              </div>
              <h3>🌊 Loading StremeINU's SuperFluid River</h3>
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
            <h3>Ready to StremeWiFINU?</h3>
            <p>Help StremeINU navigate the river of trending tokens!</p>
            <p>👆 Touch in the direction to move our Inu friend</p>
            
            {/* Show character on start screen */}
            <div
              className="stremeinu-character"
              style={{
                position: 'relative',
                margin: '20px auto',
                display: 'block',
                zIndex: 5,
              }}
            >
              <img 
                src="/stremeinu.png" 
                alt="Stremeinu" 
                onError={(e) => {
                  console.log('Start screen character image failed to load, using fallback');
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="character-fallback hidden">🐕</div>
            </div>
            
            <button 
              onClick={() => {
                console.log('🎯 Start button clicked!');
                startGame();
              }} 
              className="start-button"
            >
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
            
            {/* Share Button */}
            <div className="game-over-share">
              <ShareButton />
            </div>
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
            
            {/* Spawn Area Indicator */}
            <div className="spawn-area-indicator">
              <div className="spawn-area-line spawn-area-left"></div>
              <div className="spawn-area-line spawn-area-right"></div>
            </div>
            
            {/* Wireframe Grid Effects */}
            {wireframeGrid.map(grid => (
              <div
                key={grid.id}
                className="wireframe-grid"
                style={{
                  left: `${grid.x}px`,
                  top: `${grid.y}px`,
                  width: `${grid.size}px`,
                  height: `${grid.size}px`,
                  opacity: grid.opacity,
                  '--pulse': grid.pulse,
                } as React.CSSProperties}
              />
            ))}
            
            {/* Electricity Nodes and Connections */}
            {electricityNodes.map(node => (
              <div
                key={node.id}
                className="electricity-node"
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  '--pulse': node.pulse,
                } as React.CSSProperties}
              >
                {node.connections.map(connectionId => {
                  const connectedNode = electricityNodes.find(n => n.id === connectionId);
                  if (!connectedNode) return null;
                  
                  const deltaX = connectedNode.x - node.x;
                  const deltaY = connectedNode.y - node.y;
                  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                  
                  return (
                    <div
                      key={connectionId}
                      className="electricity-connection"
                      style={{
                        width: `${distance}px`,
                        transform: `rotate(${angle}deg)`,
                        '--pulse': node.pulse,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </div>
            ))}
            
            {/* Touch Movement Indicator */}
            {touchTarget && gameState.isPlaying && (
              <div
                className="touch-indicator"
                style={{
                  left: `${touchTarget.x}px`,
                  top: `${touchTarget.y}px`,
                }}
              >
                {/* Multiple ripple instances for held effect */}
                {Array.from({ length: Math.min(rippleCount, 5) }, (_, index) => (
                  <div key={index} className={`touch-ripple ripple-${(index % 3) + 1}`} 
                       style={{ animationDelay: `${index * 0.1}s` }}></div>
                ))}
                <div className="water-droplet"></div>
                <div className="touch-glow"></div>
                <div className="touch-center"></div>
                
                {/* Additional held effects */}
                {isTouchHeld && (
                  <>
                    <div className="held-ripple held-1"></div>
                    <div className="held-ripple held-2"></div>
                    <div className="held-pulse"></div>
                  </>
                )}
              </div>
            )}

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
            
            {/* Touch to Move Instruction */}
            <div className="touch-instruction">
              <p>👆 Touch to move</p>
            </div>
            
            {/* Stremeinu character */}
            <div
              className="stremeinu-character"
              style={{
                left: `${stremeinu.x}px`,
                top: `${stremeinu.y}px`,
              }}
            >
              <img 
                src="/stremeinu.png" 
                alt="Stremeinu" 
                onError={(e) => {
                  console.log('Character image failed to load, using fallback');
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="character-fallback hidden">🐕</div>
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
      </div>
    </div>
  );
} 