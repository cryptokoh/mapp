import { useEffect, useState, useRef, useCallback } from 'react';
import './VirtualJoystick.css';

interface JoystickPosition {
  x: number;
  y: number;
}

interface VirtualJoystickProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right' | null, multiplier: number) => void;
  disabled?: boolean;
}

export function VirtualJoystick({ onMove, disabled = false }: VirtualJoystickProps) {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState<JoystickPosition>({ x: 0, y: 0 });
  const [holdTime, setHoldTime] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  
  const joystickRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const JOYSTICK_RADIUS = 60;
  const THUMB_RADIUS = 25;
  const MAX_DISTANCE = JOYSTICK_RADIUS - THUMB_RADIUS;

  const getJoystickCenter = useCallback(() => {
    if (!joystickRef.current) return { x: 0, y: 0 };
    const rect = joystickRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }, []);

  const calculateDirection = useCallback((x: number, y: number) => {
    const center = getJoystickCenter();
    const deltaX = x - center.x;
    const deltaY = y - center.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < 20) return null; // Dead zone
    
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    // Convert angle to direction
    if (angle > -45 && angle < 45) return 'right'; // Right
    if (angle >= 45 && angle < 135) return 'down'; // Down
    if (angle >= 135 || angle < -135) return 'left'; // Left
    return 'up'; // Up
  }, [getJoystickCenter]);

  const updateThumbPosition = useCallback((clientX: number, clientY: number) => {
    const center = getJoystickCenter();
    const deltaX = clientX - center.x;
    const deltaY = clientY - center.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    let newX = deltaX;
    let newY = deltaY;
    
    // Limit to max distance
    if (distance > MAX_DISTANCE) {
      newX = (deltaX / distance) * MAX_DISTANCE;
      newY = (deltaY / distance) * MAX_DISTANCE;
    }
    
    setPosition({ x: newX, y: newY });
  }, [getJoystickCenter]);

  const startHoldTimer = useCallback(() => {
    setHoldTime(0);
    setMultiplier(1);
    
    holdTimerRef.current = setInterval(() => {
      setHoldTime(prev => {
        const newTime = prev + 100;
        if (newTime >= 3000) {
          setMultiplier(2);
        } else if (newTime >= 1500) {
          setMultiplier(1.5);
        }
        return newTime;
      });
    }, 100);
  }, []);

  const stopHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = undefined;
    }
    setHoldTime(0);
    setMultiplier(1);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsActive(true);
    updateThumbPosition(e.clientX, e.clientY);
    startHoldTimer();
  }, [disabled, updateThumbPosition, startHoldTimer]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isActive || disabled) return;
    
    e.preventDefault();
    updateThumbPosition(e.clientX, e.clientY);
  }, [isActive, disabled, updateThumbPosition]);

  const handlePointerUp = useCallback(() => {
    if (!isActive) return;
    
    setIsActive(false);
    setPosition({ x: 0, y: 0 });
    stopHoldTimer();
    onMove(null, 1);
  }, [isActive, stopHoldTimer, onMove]);

  // Handle direction changes
  useEffect(() => {
    if (!isActive) return;
    
    const center = getJoystickCenter();
    const direction = calculateDirection(center.x + position.x, center.y + position.y);
    onMove(direction, multiplier);
  }, [isActive, position, multiplier, onMove, getJoystickCenter, calculateDirection]);

  // Add global pointer event listeners
  useEffect(() => {
    if (isActive) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isActive, handlePointerMove, handlePointerUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  const holdProgress = Math.min(holdTime / 3000, 1);
  const showMultiplier = multiplier > 1;

  return (
    <div className="virtual-joystick-container">
      <div 
        ref={joystickRef}
        className={`virtual-joystick ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onPointerDown={handlePointerDown}
      >
        {/* Base circle */}
        <div className="joystick-base">
          <div className="joystick-center-dot"></div>
        </div>
        
        {/* Thumb */}
        <div 
          ref={thumbRef}
          className="joystick-thumb"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <div className="thumb-inner"></div>
        </div>
        
        {/* Hold progress ring */}
        {isActive && (
          <div 
            className="hold-progress-ring"
            style={{
              background: `conic-gradient(
                rgba(139, 92, 246, 0.8) 0deg ${holdProgress * 360}deg,
                rgba(139, 92, 246, 0.2) ${holdProgress * 360}deg 360deg
              )`
            }}
          />
        )}
        
        {/* Multiplier indicator */}
        {showMultiplier && (
          <div className="multiplier-indicator">
            <span className="multiplier-text">×{multiplier}</span>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="joystick-instructions">
        <p>🎮 Drag to move • Hold 3s for ×2 speed</p>
      </div>
    </div>
  );
} 