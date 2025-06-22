import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VirtualJoystick.css';

interface VirtualJoystickProps {
  onDirectionChange: (direction: 'up' | 'down' | 'left' | 'right' | null, multiplier: number) => void;
  disabled?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ 
  onDirectionChange, 
  disabled = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [isActive, setIsActive] = useState(false);
  
  const joystickRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const maxDistanceRef = useRef<number>(0);

  const calculateDirection = useCallback((deltaX: number, deltaY: number): 'up' | 'down' | 'left' | 'right' | null => {
    const threshold = 20; // Minimum distance to trigger direction
    
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return null;
    }
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  const calculateMultiplier = useCallback((distance: number): number => {
    const maxDistance = maxDistanceRef.current;
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    return 1 + (normalizedDistance * 2); // Multiplier from 1x to 3x
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    
    const joystick = joystickRef.current;
    const stick = stickRef.current;
    if (!joystick || !stick) return;

    const rect = joystick.getBoundingClientRect();
    centerRef.current = {
      x: rect.width / 2,
      y: rect.height / 2
    };
    maxDistanceRef.current = Math.min(rect.width, rect.height) / 2 - 25;

    setIsDragging(true);
    setIsActive(true);
    
    // Trigger initial direction calculation
    const deltaX = clientX - rect.left - centerRef.current.x;
    const deltaY = clientY - rect.top - centerRef.current.y;
    const newDirection = calculateDirection(deltaX, deltaY);
    setDirection(newDirection);
    
    if (newDirection) {
      onDirectionChange(newDirection, 1);
    }
  }, [disabled, calculateDirection, onDirectionChange]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || disabled) return;
    
    const joystick = joystickRef.current;
    const stick = stickRef.current;
    if (!joystick || !stick) return;

    const rect = joystick.getBoundingClientRect();
    const deltaX = clientX - rect.left - centerRef.current.x;
    const deltaY = clientY - rect.top - centerRef.current.y;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = maxDistanceRef.current;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      const limitedDeltaX = Math.cos(angle) * maxDistance;
      const limitedDeltaY = Math.sin(angle) * maxDistance;
      
      stick.style.transform = `translate(${limitedDeltaX}px, ${limitedDeltaY}px)`;
    } else {
      stick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
    
    const newDirection = calculateDirection(deltaX, deltaY);
    const newMultiplier = calculateMultiplier(distance);
    
    if (newDirection !== direction) {
      setDirection(newDirection);
      onDirectionChange(newDirection, newMultiplier);
    }
    
    setMultiplier(newMultiplier);
  }, [isDragging, disabled, calculateDirection, calculateMultiplier, direction, onDirectionChange]);

  const handleEnd = useCallback(() => {
    if (disabled) return;
    
    setIsDragging(false);
    setIsActive(false);
    setDirection(null);
    setMultiplier(1);
    
    const stick = stickRef.current;
    if (stick) {
      stick.style.transform = 'translate(-50%, -50%)';
    }
    
    onDirectionChange(null, 1);
  }, [disabled, onDirectionChange]);

  // Mouse events
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleEnd();
    };

    const joystick = joystickRef.current;
    if (joystick) {
      joystick.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (joystick) {
        joystick.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Touch events
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    const joystick = joystickRef.current;
    if (joystick) {
      joystick.addEventListener('touchstart', handleTouchStart, { passive: false });
      joystick.addEventListener('touchmove', handleTouchMove, { passive: false });
      joystick.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (joystick) {
        joystick.removeEventListener('touchstart', handleTouchStart);
        joystick.removeEventListener('touchmove', handleTouchMove);
        joystick.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div className="game-area-joystick">
      <div 
        ref={joystickRef}
        className={`virtual-joystick ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <div className="joystick-base">
          {/* Farcaster Icon */}
          <div className="farcaster-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          
          <div 
            ref={stickRef}
            className={`joystick-stick ${isDragging ? 'dragging' : ''}`}
          >
            {/* Direction indicators */}
            <div className="joystick-direction-indicator">
              <div className={`direction-arrow up ${direction === 'up' ? 'active' : ''}`}></div>
              <div className={`direction-arrow down ${direction === 'down' ? 'active' : ''}`}></div>
              <div className={`direction-arrow left ${direction === 'left' ? 'active' : ''}`}></div>
              <div className={`direction-arrow right ${direction === 'right' ? 'active' : ''}`}></div>
            </div>
          </div>
          
          <div className="joystick-center"></div>
        </div>
        
        {/* Multiplier indicator */}
        {isActive && multiplier > 1 && (
          <div className="multiplier-indicator">
            <span className="multiplier-text">{multiplier.toFixed(1)}x</span>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="joystick-instructions">
        <p>🎮 Drag to move Stremeinu</p>
      </div>
    </div>
  );
}; 