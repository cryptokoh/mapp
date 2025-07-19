// Alternative: Completely instant movement (no interpolation)
// Replace the movement code in the game loop with this:

// Option 1: Instant teleportation
setCharacter(targetPosition);

// Option 2: Very fast but still visible movement
setCharacter(prev => {
  const deltaX = targetPosition.x - prev.x;
  const deltaY = targetPosition.y - prev.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Instant if close enough
  if (distance < 50) {
    return targetPosition;
  }
  
  // Otherwise move 80% of the way instantly
  return {
    x: prev.x + deltaX * 0.8,
    y: prev.y + deltaY * 0.8
  };
});

// Option 3: Remove CSS transition entirely for instant visual update
// In StremeGame.css, change:
// transition: all 0.08s linear;
// to:
// transition: none;