import { useEffect, useState, useRef, useCallback } from 'react';
import './StremeGame.css';
import { ShareButton } from './ShareButton';
import { Leaderboard } from './Leaderboard';
import { serverLeaderboardService } from '../services/serverLeaderboard';
import { useFarcaster } from '../hooks/useFarcaster';
import { tokenService, type StremeToken } from '../services/tokenService';
import { notificationService } from '../services/notificationService';
import { TokenCollectedPopup } from './TokenCollectedPopup';
import { Tutorial } from './Tutorial';
import TrendingScreen from './TrendingScreen';

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

interface SpeedBoost {
  id: string;
  x: number;
  y: number;
  speed: number;
}

interface BlueBox {
  id: string;
  x: number;
  y: number;
  speed: number;
}

interface BlueBoxExplosion {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

interface ScorePopup {
  id: string;
  x: number;
  y: number;
  value: number;
}

interface CharacterPosition {
  x: number;
  y: number;
}

export function StremeGame() {
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
  
  // Additional game metrics
  const [gameMetrics, setGameMetrics] = useState({
    startTime: 0,
    rocksHit: 0,
    rocksSpawned: 0,
    speedBoostsCollected: 0,
    holdBonusTotal: 0,
    longestStreak: 0,
    currentStreak: 0,
    totalTokenValue: 0,
    uniqueTokenTypes: new Set<string>(),
  });
  
  // Persistent stats (stored in localStorage)
  const [persistentStats, setPersistentStats] = useState(() => {
    const stored = localStorage.getItem('streme-persistent-stats');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse persistent stats:', e);
      }
    }
    return {
      totalTimePlayed: 0, // in seconds
      gamesPlayed: 0,
      bestScore: 0,
      totalTokensCollected: 0,
    };
  });
  
  // Rock warning state
  const [showRockWarning, setShowRockWarning] = useState(false);

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  
  // Game over screen pages
  const [gameOverPage, setGameOverPage] = useState<'main' | 'stats' | 'final'>('main');

  // Easter egg state
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const lastEasterEggClick = useRef<number>(0);
  const easterEggClickCount = useRef<number>(0);

  // Character position and movement
  const [character, setCharacter] = useState<CharacterPosition>({ x: 0, y: 0 });
  const [targetPosition, setTargetPosition] = useState<CharacterPosition>({ x: 0, y: 0 });
  
  // Game objects
  const [tokens, setTokens] = useState<GameObject[]>([]);
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [speedBoosts, setSpeedBoosts] = useState<SpeedBoost[]>([]);
  const [hasSpeedBoost, setHasSpeedBoost] = useState(false);
  const [showSpeedBoostBurst, setShowSpeedBoostBurst] = useState(false);
  const [blueBoxes, setBlueBoxes] = useState<BlueBox[]>([]);
  const [blueBoxExplosions, setBlueBoxExplosions] = useState<BlueBoxExplosion[]>([]);
  const [lastBlueBoxSpawn, setLastBlueBoxSpawn] = useState(0);
  
  // Hold tracking
  const [isHolding, setIsHolding] = useState(false);
  const [holdBonusCount, setHoldBonusCount] = useState(0);
  const [showHoldBonus, setShowHoldBonus] = useState(false);
  
  // Touch feedback
  const [touchRipples, setTouchRipples] = useState<TouchRipple[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  
  // SuperInu popup easter egg
  const [showSuperinuPopup, setShowSuperinuPopup] = useState(false);
  
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
  const lastSpeedBoostSpawn = useRef<number>(0);
  const tokenCounter = useRef<number>(0);
  const rockCounter = useRef<number>(0);
  const speedBoostCounter = useRef<number>(0);
  const blueBoxCounter = useRef<number>(0);
  const holdIntervalRef = useRef<number | null>(null);
  const holdBonusIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Keyboard controls for desktop
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const { width, height } = getGameDimensions();
      const moveSpeed = 40; // Increased for more responsive keyboard movement
      
      let newX = targetPosition.x;
      let newY = targetPosition.y;
      
      switch(e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          newY = Math.max(0, targetPosition.y - moveSpeed);
          break;
        case 'arrowdown':
        case 's':
          newY = Math.min(height - CHARACTER_SIZE, targetPosition.y + moveSpeed);
          break;
        case 'arrowleft':
        case 'a':
          newX = Math.max(0, targetPosition.x - moveSpeed);
          break;
        case 'arrowright':
        case 'd':
          newX = Math.min(width - CHARACTER_SIZE, targetPosition.x + moveSpeed);
          break;
      }
      
      if (newX !== targetPosition.x || newY !== targetPosition.y) {
        setTargetPosition({ x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isPlaying, targetPosition, getGameDimensions]);

  // Mobile-first tap-to-move controls
  useEffect(() => {
    const gameContainer = gameRef.current;
    if (!gameContainer) return;

    const handleTapMove = (clientX: number, clientY: number, isInitialTap: boolean = true) => {
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
      
      // Calculate direction from character to tap point
      const currentCenterX = character.x + CHARACTER_SIZE / 2;
      const currentCenterY = character.y + CHARACTER_SIZE / 2;
      const deltaX = tapX - currentCenterX;
      const deltaY = tapY - currentCenterY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Move incrementally in the direction of the tap (smaller increments)
      const maxMoveDistance = 50; // Reduced from 100 to 50 for more controlled movement
      const moveDistance = Math.min(distance, maxMoveDistance);
      
      if (distance > 0) {
        // If we're still moving to a previous target, don't add a new one too far away
        const currentTargetDistance = Math.sqrt(
          Math.pow(targetPosition.x - character.x, 2) + 
          Math.pow(targetPosition.y - character.y, 2)
        );
        
        // Only update target if we're close to the current target or clicking in a new direction
        if (currentTargetDistance < 30 || isInitialTap) {
          const targetX = character.x + (deltaX / distance) * moveDistance;
          const targetY = character.y + (deltaY / distance) * moveDistance;
          
          // Clamp to boundaries and set target
          const clampedX = Math.max(0, Math.min(targetX, width - CHARACTER_SIZE));
          const clampedY = Math.max(0, Math.min(targetY, height - CHARACTER_SIZE));
          
          setTargetPosition({ x: clampedX, y: clampedY });
        }
      }
      
      // Haptic feedback if available
      if ('vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(10);
      }
    };

    let currentTouchX = 0;
    let currentTouchY = 0;

    const startHolding = (clientX: number, clientY: number) => {
      setIsHolding(true);
      setHoldBonusCount(0);
      
      // Initial move
      handleTapMove(clientX, clientY);
      
      // Start continuous movement
      holdIntervalRef.current = window.setInterval(() => {
        handleTapMove(clientX, clientY, false);
      }, 200); // Move every 200ms while holding
      
      // Start bonus point timer
      holdBonusIntervalRef.current = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          score: prev.score + 1
        }));
        setHoldBonusCount(prev => prev + 1);
        setGameMetrics(prev => ({
          ...prev,
          holdBonusTotal: prev.holdBonusTotal + 1,
        }));
        setShowHoldBonus(true);
        setTimeout(() => setShowHoldBonus(false), 500);
      }, 2000); // Bonus every 2 seconds
    };

    const stopHolding = () => {
      setIsHolding(false);
      setHoldBonusCount(0);
      
      if (holdIntervalRef.current) {
        window.clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
      
      if (holdBonusIntervalRef.current) {
        clearInterval(holdBonusIntervalRef.current);
        holdBonusIntervalRef.current = null;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.share-container') || target.closest('.game-start') || target.closest('.game-over')) {
        return;
      }
      
      e.preventDefault();
      if (e.touches.length > 0) {
        currentTouchX = e.touches[0].clientX;
        currentTouchY = e.touches[0].clientY;
        startHolding(currentTouchX, currentTouchY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isHolding) return;
      e.preventDefault();
      if (e.touches.length > 0) {
        currentTouchX = e.touches[0].clientX;
        currentTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopHolding();
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.share-container') || target.closest('.game-start') || target.closest('.game-over')) {
        return;
      }
      
      startHolding(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      stopHolding();
    };

    const handleMouseLeave = () => {
      stopHolding();
    };

    // Only add listeners when actively playing
    if (gameState.isPlaying) {
      gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
      gameContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });
      
      gameContainer.addEventListener('mousedown', handleMouseDown);
      gameContainer.addEventListener('mouseup', handleMouseUp);
      gameContainer.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      stopHolding(); // Clean up on unmount
      gameContainer.removeEventListener('touchstart', handleTouchStart);
      gameContainer.removeEventListener('touchmove', handleTouchMove);
      gameContainer.removeEventListener('touchend', handleTouchEnd);
      gameContainer.removeEventListener('touchcancel', handleTouchEnd);
      
      gameContainer.removeEventListener('mousedown', handleMouseDown);
      gameContainer.removeEventListener('mouseup', handleMouseUp);
      gameContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [gameState.isPlaying, getGameDimensions, character, targetPosition, isHolding]);

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
    // Limit to 3 rocks maximum on screen
    if (rocks.length >= 3) {
      console.log('🪨 Max rocks reached (3), skipping spawn');
      return;
    }
    
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
    setGameMetrics(prev => ({
      ...prev,
      rocksSpawned: prev.rocksSpawned + 1,
    }));
    console.log('🪨 Spawned rock:', newRock.id);
  }, [getGameDimensions, rocks]);

  // Spawn speed boost
  const spawnSpeedBoost = useCallback(() => {
    const { width, height } = getGameDimensions();
    
    const newSpeedBoost: SpeedBoost = {
      id: `speedboost-${speedBoostCounter.current++}`,
      x: Math.random() * (width - 60),
      y: height,
      speed: 1.5 + Math.random() * 1, // Moves slower than tokens
    };

    setSpeedBoosts(prev => [...prev, newSpeedBoost]);
    console.log('⚡ Spawned speed boost!');
  }, [getGameDimensions]);

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

  // Check collision between character and speed boost
  const checkSpeedBoostCollision = useCallback((char: CharacterPosition, boost: SpeedBoost) => {
    const boostSize = 60;
    return (
      char.x < boost.x + boostSize &&
      char.x + CHARACTER_SIZE > boost.x &&
      char.y < boost.y + boostSize &&
      char.y + CHARACTER_SIZE > boost.y
    );
  }, []);

  // Spawn blue box
  const spawnBlueBox = useCallback(() => {
    const { width, height } = getGameDimensions();
    
    const newBlueBox: BlueBox = {
      id: `bluebox-${blueBoxCounter.current++}`,
      x: Math.random() * (width - 40),
      y: height,
      speed: 4 + Math.random() * 2, // Moves fast!
    };

    setBlueBoxes(prev => [...prev, newBlueBox]);
    console.log('💙 Spawned special blue box!');
    
    // Send notification if enabled
    if (notificationService.checkPermission() === 'granted' && gameState.isPlaying) {
      notificationService.showNotification('Special Blue Box Alert! 💙', {
        body: 'A special blue box worth 500 points is in the river! Catch it before it escapes!',
        tag: 'bluebox',
        requireInteraction: false,
      });
    }
  }, [getGameDimensions, gameState.isPlaying]);

  // Check collision between character and blue box
  const checkBlueBoxCollision = useCallback((char: CharacterPosition, box: BlueBox) => {
    const boxSize = 40;
    return (
      char.x < box.x + boxSize &&
      char.x + CHARACTER_SIZE > box.x &&
      char.y < box.y + boxSize &&
      char.y + CHARACTER_SIZE > box.y
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
        
        // Instant responsive movement - no lag
        const baseSpeed = hasSpeedBoost ? 18 : 12; // Fixed speed for instant response
        const moveX = prev.x + (deltaX / distance) * baseSpeed;
        const moveY = prev.y + (deltaY / distance) * baseSpeed;
        
        // If we would overshoot, snap to target
        if (distance <= baseSpeed) {
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
      const rockSpawnInterval = Math.max(3000, 5000 - (gameState.level - 1) * 300); // Much slower rock spawning
      if (!showRockWarning && timestamp - lastRockSpawn.current > rockSpawnInterval) {
        spawnRock();
        // Sometimes spawn 2 rocks at higher levels (reduced chance)
        if (gameState.level >= 5 && Math.random() < 0.2) {
          setTimeout(() => spawnRock(), 500);
        }
        lastRockSpawn.current = timestamp;
      }

      // Spawn speed boosts occasionally
      const speedBoostInterval = 15000 + Math.random() * 10000; // Every 15-25 seconds
      if (!showRockWarning && timestamp - lastSpeedBoostSpawn.current > speedBoostInterval && !hasSpeedBoost) {
        spawnSpeedBoost();
        lastSpeedBoostSpawn.current = timestamp;
      }

      // Spawn blue boxes every 10 seconds
      if (!showRockWarning && timestamp - lastBlueBoxSpawn > 10000) {
        spawnBlueBox();
        setLastBlueBoxSpawn(timestamp);
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
              // Reset streak on missed token
              setGameMetrics(prev => ({
                ...prev,
                currentStreak: 0,
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
            
            // Update game metrics
            setGameMetrics(prev => {
              const newStreak = prev.currentStreak + 1;
              const newUniqueTokens = new Set(prev.uniqueTokenTypes);
              newUniqueTokens.add(token.token.symbol);
              
              return {
                ...prev,
                currentStreak: newStreak,
                longestStreak: Math.max(prev.longestStreak, newStreak),
                totalTokenValue: prev.totalTokenValue + tokenValue,
                uniqueTokenTypes: newUniqueTokens,
              };
            });

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
            
            // Track rock hit in metrics
            setGameMetrics(prev => ({
              ...prev,
              rocksHit: prev.rocksHit + 1,
              currentStreak: 0, // Reset streak on rock hit
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

      // Update speed boosts
      setSpeedBoosts(prevBoosts => {
        const updatedBoosts = prevBoosts
          .map(boost => ({
            ...boost,
            y: boost.y - boost.speed, // Move upward
          }))
          .filter(boost => boost.y > -60); // Remove off-screen boosts

        // Check collision with character
        updatedBoosts.forEach((boost) => {
          if (checkSpeedBoostCollision(character, boost)) {
            // Activate speed boost
            setHasSpeedBoost(true);
            setShowSpeedBoostBurst(true);
            
            // Track speed boost collection
            setGameMetrics(prev => ({
              ...prev,
              speedBoostsCollected: prev.speedBoostsCollected + 1,
            }));
            
            // Remove collected boost
            setSpeedBoosts(current => current.filter(b => b.id !== boost.id));
            
            // Haptic feedback
            if ('vibrate' in navigator && navigator.vibrate) {
              navigator.vibrate([30, 30, 30]); // Triple vibration
            }
            
            console.log('⚡ Speed boost collected!');
            
            // Deactivate after 5 seconds
            setTimeout(() => {
              setHasSpeedBoost(false);
              console.log('⚡ Speed boost ended');
            }, 5000);
            
            // Hide burst after animation
            setTimeout(() => {
              setShowSpeedBoostBurst(false);
            }, 1500);
          }
        });

        return updatedBoosts;
      });

      // Update blue boxes
      setBlueBoxes(prevBoxes => {
        const updatedBoxes = prevBoxes
          .map(box => ({
            ...box,
            y: box.y - box.speed, // Move upward fast!
          }))
          .filter(box => box.y > -40); // Remove off-screen boxes

        // Check collision with character
        updatedBoxes.forEach((box) => {
          if (checkBlueBoxCollision(character, box)) {
            // Award 500 points!
            setGameState(prev => ({
              ...prev,
              score: prev.score + 500,
            }));
            
            // Create explosion effect
            const explosion: BlueBoxExplosion = {
              id: `explosion-${Date.now()}`,
              x: box.x,
              y: box.y,
              timestamp: Date.now(),
            };
            setBlueBoxExplosions(prev => [...prev, explosion]);
            
            // Remove collected box
            setBlueBoxes(prev => prev.filter(b => b.id !== box.id));
            
            // Add to special score popup
            const scorePopup = {
              id: `bluebox-score-${Date.now()}`,
              x: box.x,
              y: box.y,
              value: 500,
            };
            setScorePopups(prev => [...prev, scorePopup]);
            
            // Add vibration feedback
            if ('vibrate' in navigator) {
              navigator.vibrate([50, 50, 50, 50, 50]); // Epic vibration!
            }
            
            console.log('💙 BLUE BOX COLLECTED! +500 POINTS!');
          }
        });

        return updatedBoxes.filter(box => 
          !updatedBoxes.some(b => b !== box && checkBlueBoxCollision(character, b))
        );
      });

      // Clean up explosions
      setBlueBoxExplosions(prev => 
        prev.filter(explosion => Date.now() - explosion.timestamp < 1500)
      );
      
      // Clean up score popups (show for 1 second)
      setScorePopups(prev => 
        prev.filter(popup => {
          // Using the id which contains timestamp
          const timestamp = parseInt(popup.id.split('-')[2] || '0');
          return Date.now() - timestamp < 1000;
        })
      );

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

            // Calculate play time in seconds
            const playTimeSeconds = Math.floor((Date.now() - gameMetrics.startTime) / 1000);
            
            // Update persistent stats with totals
            setPersistentStats((prevStats: any) => {
              const updated = {
                ...prevStats,
                totalTimePlayed: prevStats.totalTimePlayed + playTimeSeconds,
                bestScore: Math.max(prevStats.bestScore, prev.score),
                totalTokensCollected: prevStats.totalTokensCollected + prev.tokensCollected,
              };
              localStorage.setItem('streme-persistent-stats', JSON.stringify(updated));
              return updated;
            });
            
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
              gameplayStats: {
                playTime: playTimeSeconds,
                missedTokens: prev.missedTokens,
                rocksHit: gameMetrics.rocksHit,
                rocksSpawned: gameMetrics.rocksSpawned,
                speedBoostsCollected: gameMetrics.speedBoostsCollected,
                holdBonusTotal: gameMetrics.holdBonusTotal,
                longestStreak: gameMetrics.longestStreak,
                totalTokenValue: gameMetrics.totalTokenValue,
                uniqueTokenTypes: gameMetrics.uniqueTokenTypes.size,
              },
            }).then(leaderboardEntry => {
              console.log('🏆 Score submitted to server:', leaderboardEntry);
              
              // Check if this is a new high score and send notification
              const persistentStats = JSON.parse(localStorage.getItem('streme-persistent-stats') || '{}');
              if (prev.score === persistentStats.bestScore && notificationService.checkPermission() === 'granted') {
                notificationService.notifyHighScore(prev.score);
              }
              
              // If rank is top 10, send leaderboard notification
              if (leaderboardEntry.rank && leaderboardEntry.rank <= 10 && notificationService.checkPermission() === 'granted') {
                notificationService.notifyLeaderboardRank(leaderboardEntry.rank);
              }
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
  }, [gameState.isPlaying, character, targetPosition, spawnToken, spawnRock, spawnSpeedBoost, checkCollision, checkRockCollision, checkSpeedBoostCollision, getGameDimensions, showRockWarning, tokenStats, hasSpeedBoost]);

  // Start game
  const startGame = useCallback(() => {
    console.log('🎮 Starting game...');
    
    // Reset game over page
    setGameOverPage('main');
    
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
    setSpeedBoosts([]);
    setBlueBoxes([]);
    setBlueBoxExplosions([]);
    setScorePopups([]);
    setHasSpeedBoost(false);
    setShowSpeedBoostBurst(false);
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
    
    // Reset game metrics and track start time
    setGameMetrics({
      startTime: Date.now(),
      rocksHit: 0,
      rocksSpawned: 0,
      speedBoostsCollected: 0,
      holdBonusTotal: 0,
      longestStreak: 0,
      currentStreak: 0,
      totalTokenValue: 0,
      uniqueTokenTypes: new Set<string>(),
    });
    
    // Update persistent stats
    setPersistentStats((prev: any) => {
      const updated = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
      };
      localStorage.setItem('streme-persistent-stats', JSON.stringify(updated));
      return updated;
    });
    
    lastTokenSpawn.current = 0;
    lastRockSpawn.current = 0;
    lastSpeedBoostSpawn.current = 0;
    
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
    setSpeedBoosts([]);
    setBlueBoxes([]);
    setBlueBoxExplosions([]);
    setScorePopups([]);
    setHasSpeedBoost(false);
    setShowSpeedBoostBurst(false);
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
    
    // Reset game metrics and track start time
    setGameMetrics({
      startTime: Date.now(),
      rocksHit: 0,
      rocksSpawned: 0,
      speedBoostsCollected: 0,
      holdBonusTotal: 0,
      longestStreak: 0,
      currentStreak: 0,
      totalTokenValue: 0,
      uniqueTokenTypes: new Set<string>(),
    });
    
    // Update persistent stats
    setPersistentStats((prev: any) => {
      const updated = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
      };
      localStorage.setItem('streme-persistent-stats', JSON.stringify(updated));
      return updated;
    });
    
    lastTokenSpawn.current = 0;
    lastRockSpawn.current = 0;
    lastSpeedBoostSpawn.current = 0;
    
    // Show rock warning for 3 seconds
    setShowRockWarning(true);
    setTimeout(() => {
      setShowRockWarning(false);
    }, 3000);
  }, [getCharacterCenterPosition]);

  // Easter egg handler
  const handleEasterEggClick = useCallback(() => {
    const now = Date.now();
    
    // Reset clicks if more than 2 seconds since last click
    if (now - lastEasterEggClick.current > 2000) {
      easterEggClickCount.current = 1;
    } else {
      easterEggClickCount.current++;
      // Trigger Easter egg on 5 rapid clicks
      if (easterEggClickCount.current >= 5) {
        setShowEasterEgg(true);
        easterEggClickCount.current = 0;
        // Hide Easter egg after 4 seconds
        setTimeout(() => {
          setShowEasterEgg(false);
        }, 4000);
      }
    }
    
    lastEasterEggClick.current = now;
  }, []);

  // Removed unused parent stats update

  return (
    <div className="streme-game">
      <div className="game-container" ref={gameRef}>
        
        {/* Start Screen */}
        {!gameState.isPlaying && !gameState.gameOver && (
          <>
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
            
            <div className="preview-character" onClick={handleEasterEggClick} style={{ cursor: 'pointer' }}>
              <img 
                src="/stremeinu.png" 
                alt="StremeInu Preview" 
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
            
            {/* Token Icons Ticker - Outside the box */}
            <div className="token-icons-ticker">
              <div className="token-icons-scroll">
                {/* First set of tokens */}
                {availableTokens.map((token, index) => (
                  <img 
                    key={`${token.symbol}-icon-1-${index}`} 
                    src={token.img_url} 
                    alt={token.symbol} 
                    className="ticker-token-icon"
                    onError={(e) => {
                      e.currentTarget.src = 'https://api.streme.fun/images/streme-icon.png';
                    }}
                  />
                ))}
                
                {/* Promotional text */}
                <span className="ticker-promo-text">
                  Trade, stake and stream super tokens on streme.fun now!
                </span>
                
                {/* Second set of tokens */}
                {availableTokens.map((token, index) => (
                  <img 
                    key={`${token.symbol}-icon-2-${index}`} 
                    src={token.img_url} 
                    alt={token.symbol} 
                    className="ticker-token-icon"
                    onError={(e) => {
                      e.currentTarget.src = 'https://api.streme.fun/images/streme-icon.png';
                    }}
                  />
                ))}
                
                {/* Promotional text again for seamless loop */}
                <span className="ticker-promo-text">
                  Trade, stake and stream super tokens on streme.fun now!
                </span>
              </div>
            </div>
          </>
        )}

        {/* Game Over Screen */}
        {gameState.gameOver && (
          <div className="game-over">
            {gameOverPage === 'stats' ? (
              <>
                <h3>📊 Game Stats</h3>
                <div className="session-stats">
                  <p>Play Time: <span>{Math.floor((Date.now() - gameMetrics.startTime) / 1000)}s</span></p>
                  <p>Rocks Spawned: <span>{gameMetrics.rocksSpawned}</span></p>
                  <p>Rocks Hit: <span>{gameMetrics.rocksHit}</span></p>
                  <p>Speed Boosts: <span>{gameMetrics.speedBoostsCollected}</span></p>
                  <p>Hold Bonuses: <span>{gameMetrics.holdBonusTotal}</span></p>
                  <p>Longest Streak: <span>{gameMetrics.longestStreak}</span></p>
                  <p>Unique Tokens: <span>{gameMetrics.uniqueTokenTypes.size}</span></p>
                </div>
                
                <div className="lifetime-stats">
                  <h4>📋 Lifetime Stats</h4>
                  <p>Total Time Played: <span>{Math.floor(persistentStats.totalTimePlayed / 60)}m {persistentStats.totalTimePlayed % 60}s</span></p>
                  <p>Games Played: <span>{persistentStats.gamesPlayed}x</span></p>
                  <p>Best Score: <span>{persistentStats.bestScore}</span></p>
                  <p>Total Tokens: <span>{persistentStats.totalTokensCollected}</span></p>
                </div>
                
                <button 
                  className="play-button"
                  onClick={() => setGameOverPage('main')}
                >
                  ⬅️ Back
                </button>
              </>
            ) : (
              <>
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
                
                <button 
                  className="play-button secondary"
                  onClick={() => setGameOverPage('stats')}
                  style={{marginTop: '10px'}}
                >
                  📊 Stats
                </button>
                
                <button onClick={startGame} className="restart-button">
                  🔄 Play Again
                </button>
                
                <button onClick={() => setShowLeaderboard(true)} className="restart-button" style={{marginTop: '8px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'}}>
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
              </>
            )}
          </div>
        )}
        
        {/* Tip Link - Outside game over box */}
        {gameState.gameOver && (
          <div 
            onClick={() => window.open('https://farcaster.xyz/koh', '_blank')}
            style={{
              position: 'absolute',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              color: 'rgba(0, 0, 0, 0.7)',
              cursor: 'pointer',
              textDecoration: 'underline',
              zIndex: 200,
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(0, 0, 0, 0.9)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(0, 0, 0, 0.7)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🤖 Buy the dev some AI tokens
          </div>
        )}
        
        {/* STREAM $SUPERINU Easter Egg Button */}
        {gameState.gameOver && (
          <div 
            onClick={() => {
              setShowSuperinuPopup(true);
              setTimeout(() => setShowSuperinuPopup(false), 4000);
            }}
            className="stream-superinu-button"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '14px',
              fontWeight: '800',
              color: '#10b981',
              cursor: 'pointer',
              zIndex: 200,
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.2))',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              animation: 'streamFlow 3s ease-in-out infinite',
              textShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
              e.currentTarget.style.textShadow = '0 0 20px rgba(16, 185, 129, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.textShadow = '0 0 10px rgba(16, 185, 129, 0.6)';
            }}
          >
            STREAM $SUPERINU!
          </div>
        )}
        
        {/* SuperInu Popup */}
        {showSuperinuPopup && (
          <div 
            className="superinu-popup"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              pointerEvents: 'none',
              animation: 'superinuGlow 4s ease-out forwards'
            }}
          >
            <img 
              src="/stremeinu.png" 
              alt="SuperInu" 
              style={{
                width: '200px',
                height: '200px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 30px #10b981)',
                animation: 'superinuPulse 4s ease-out forwards'
              }}
            />
          </div>
        )}
        
        {/* Easter Egg Popup */}
        {showEasterEgg && (
          <div 
            className="easter-egg-popup"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            <img 
              src="/greeeninu.avif" 
              alt="Green Inu" 
              className="easter-egg-greeninu"
              style={{
                width: '250px',
                height: '250px',
                objectFit: 'contain',
                animation: 'easterEggSpin 2s ease-in-out',
                marginBottom: '20px',
              }}
            />
            <div 
              className="easter-egg-message"
              style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                textShadow: '0 0 30px rgba(16, 185, 129, 0.8), 0 0 60px rgba(34, 211, 238, 0.6)',
                animation: 'easterEggFadeIn 1s ease-out 1s forwards',
                opacity: 0,
              }}
            >
              We love you 0xfran and SuperFluid fam! 💚
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
                src="/stremeinu.png" 
                alt="StremeInu" 
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

            {/* Speed Boosts */}
            {speedBoosts.map(boost => (
              <div
                key={boost.id}
                className="speed-boost"
                style={{
                  left: `${boost.x}px`,
                  top: `${boost.y}px`,
                }}
              >
                <div className="speed-boost-inner">
                  <span className="speed-boost-icon">⚡</span>
                  <span className="speed-boost-text">X2</span>
                </div>
              </div>
            ))}

            {/* Blue Boxes */}
            {blueBoxes.map(box => (
              <div
                key={box.id}
                className="special-blue-box"
                style={{
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                }}
              />
            ))}

            {/* Blue Box Explosions */}
            {blueBoxExplosions.map(explosion => (
              <div
                key={explosion.id}
                className="blue-box-explosion"
                style={{
                  left: `${explosion.x}px`,
                  top: `${explosion.y}px`,
                }}
              >
                THE BASE APP!!
              </div>
            ))}

            {/* Score Popups */}
            {scorePopups.map(popup => (
              <div
                key={popup.id}
                className="score-popup"
                style={{
                  left: `${popup.x}px`,
                  top: `${popup.y}px`,
                }}
              >
                +{popup.value}
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
              <button 
                className="trending-button-game"
                onClick={() => setShowTrending(true)}
                title="Trending Tokens"
              >
                📈
              </button>
              <div className="primary-score">
                <span className="score-label">SCORE</span>
                <span className="score-value">{gameState.score.toLocaleString()}</span>
              </div>
              <div className="level-indicator">
                <span className="level-label">LEVEL</span>
                <span className="level-value">{gameState.level}</span>
              </div>
              <div className="rocks-indicator">
                <span className="rocks-label">ROCKS</span>
                <span className="rocks-value">{gameMetrics.rocksSpawned}</span>
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

            {/* Speed Boost Burst Effect */}
            {showSpeedBoostBurst && (
              <div className="speed-boost-burst">
                <div className="burst-text">SPEED BOOST X2!</div>
                <div className="burst-effect"></div>
              </div>
            )}

            {/* Speed Boost Indicator */}
            {hasSpeedBoost && (
              <div className="speed-boost-indicator">
                <span className="boost-icon">⚡</span>
                <span className="boost-timer">SPEED X2</span>
              </div>
            )}

            {/* Hold Bonus Indicator */}
            {isHolding && holdBonusCount > 0 && (
              <div className="hold-bonus-indicator">
                <span className="hold-icon">✋</span>
                <span className="hold-text">HOLD BONUS +{holdBonusCount}</span>
              </div>
            )}

            {/* Hold Bonus Popup */}
            {showHoldBonus && (
              <div className="hold-bonus-popup">
                +1 HOLD BONUS!
              </div>
            )}
            
            {/* Game Instructions */}
            <div className="game-instructions">
              <p>🏊‍♂️ Tap or use Arrow/WASD keys • 🪙 Catch tokens • 🪨 Avoid rocks • ❌ Don't miss 10!</p>
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
        
        {/* Tutorial - inside game container */}
        <Tutorial 
          isOpen={showTutorial}
          onComplete={handleTutorialComplete}
          gameContainerRef={gameRef}
        />
        
        {/* Trending Tokens - inside game container */}
        {showTrending && (
          <div className="trending-module">
            <TrendingScreen onClose={() => setShowTrending(false)} />
          </div>
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