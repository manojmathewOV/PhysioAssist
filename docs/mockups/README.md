# Clinical Assessment UI - HTML Mockups

Interactive HTML mockups demonstrating the simplified clinical assessment workflow.

## Files

1. **01-joint-selection.html** - Joint and movement selection screen
2. **02-angle-display.html** - Live angle measurement during assessment
3. **03-complete.html** - Assessment completion and summary

## How to View

Simply open any HTML file in your web browser:

```bash
# Option 1: Open directly
open docs/mockups/01-joint-selection.html

# Option 2: Use a simple web server
cd docs/mockups
python3 -m http.server 8000
# Then visit: http://localhost:8000/01-joint-selection.html
```

## Interactive Features

### 01-joint-selection.html
- Click on joint categories (Shoulder, Elbow, Knee) to expand
- Select a movement type to see checkmark
- Toggle between Left/Right side
- "Start Assessment" button enables when joint + movement selected
- Click "Start Assessment" to proceed to angle display

### 02-angle-display.html
- Simulates live angle measurement
- Angle automatically increases from 45° → 165°
- Watch color progression: Blue → Orange → Yellow → Green
- Instructions change dynamically based on progress
- Progress bar fills smoothly
- "Target Achieved" badge appears at 95%
- Click "Stop" to go to completion screen
- Click "Change Selection" to return to joint selection

### 03-complete.html
- Shows assessment summary
- Displays max angle achieved, clinical grade, and target %
- Detailed assessment information
- Recommendation based on performance
- Action buttons for next steps

## Design Principles Demonstrated

### Simplification
- **One action per screen**: Select → Assess → Review
- **No clutter**: Only essential information visible
- **Clear hierarchy**: Most important info (angle) is largest

### Visual Clarity
- **96px angle display**: Easily readable from distance
- **Color coding**: Intuitive progress indication
- **High contrast**: White text on dark backgrounds
- **Generous spacing**: Touch-friendly, not cramped

### Patient-Friendly
- **Plain language**: "Lifting arm to the front" not "Glenohumeral flexion"
- **Encouraging messages**: "You're doing great!" not technical jargon
- **Visual progress**: Bar + percentage + color
- **Success celebration**: Animations and badges on achievement

### Accessibility
- Large touch targets (44px minimum)
- High contrast ratios
- Clear focus states
- Simple navigation flow

## Responsive Design

All mockups are mobile-first and adapt to:
- Mobile phones (320px - 480px)
- Tablets (481px - 768px)
- Desktop browsers (769px+)

## Browser Compatibility

Tested and working in:
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## Customization

To modify colors, edit the CSS variables:

```css
/* Primary colors */
--blue: #2196F3;    /* Progress start */
--green: #4CAF50;   /* Success/Target */
--yellow: #FFC107;  /* Warning/Fair */
--red: #F44336;     /* Stop/Error */

/* Grays */
--dark: #000;
--medium-dark: #1a1a1a;
--medium: #666;
--light: #aaa;
--white: #fff;
```

## Next Steps

To implement in your React Native app:
1. Use the HTML as visual reference
2. Port styles to StyleSheet
3. Connect to actual ClinicalMeasurementService
4. Add camera/pose detection
5. Implement data persistence

## Feedback

These mockups demonstrate the core user flow. To test with real users:
1. Load on mobile device
2. Walk through the flow
3. Collect feedback on:
   - Clarity of instructions
   - Size of text/buttons
   - Color choices
   - Flow smoothness
   - Any confusion points
