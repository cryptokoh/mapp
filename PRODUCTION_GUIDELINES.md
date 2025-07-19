# Production Guidelines for Farcaster Mini App

## Critical Constraint: 424px Width

All UI elements MUST be designed and positioned within the 424px width constraint. This is the fixed viewport for Farcaster Mini Apps.

### Key Rules

1. **Container Constraints**
   - Maximum width: 424px
   - Height: 695px (standard mobile viewport)
   - All elements must be visible within these bounds

2. **Absolute Positioning**
   - Use `position: absolute` within the game container
   - Never use `position: fixed` as it will escape the container
   - Calculate positions relative to the 424px container, not the viewport

3. **Tutorial & Overlays**
   ```css
   .overlay {
     position: absolute; /* NOT fixed */
     width: 100%;
     max-width: 424px;
     height: 100%;
   }
   ```

4. **Modals & Popups**
   - Center within the 424px container
   - Maximum width: 340-380px (with padding)
   - Position from bottom: minimum 80px to ensure visibility

5. **Touch Targets**
   - Minimum size: 44x44px (accessibility standard)
   - Ensure all interactive elements are within the 424px bounds

6. **Testing**
   - Always test with browser window wider than 424px
   - Use browser dev tools to simulate 424px viewport
   - Verify no elements extend beyond container bounds

### Common Pitfalls to Avoid

❌ Using `position: fixed` for overlays
❌ Calculating positions based on window/viewport width
❌ Placing important UI elements near edges
❌ Using percentage widths without max-width constraints

### Best Practices

✅ Use absolute positioning within the game container
✅ Test all UI states within 424px bounds
✅ Center important content with adequate padding
✅ Use the game container as the positioning reference

## Testing Checklist

- [ ] Tutorial appears fully within 424px width
- [ ] All modals/popups are centered and contained
- [ ] Touch targets are accessible and properly sized
- [ ] No horizontal scrolling occurs
- [ ] Game remains playable on actual mobile devices