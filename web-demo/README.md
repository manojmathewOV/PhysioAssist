# PhysioAssist Live Exercise Simulation

Real-time biomechanics analysis and feedback demonstration for clinical exercises.

## Overview

This interactive web demo simulates the core functionality of PhysioAssist, demonstrating:

- **Real-time pose detection** and skeleton tracking
- **Biomechanical analysis** with accurate angle calculations
- **Live clinical feedback** based on movement quality and progress
- **Visual overlays** showing skeleton, angles, and progress
- **Compensation detection** for movement quality assessment

## Features

### 🎯 Supported Exercises

1. **Shoulder Flexion (Forward Lift)**
   - Target: 160° of forward shoulder movement
   - Clinical use: Post-rotator cuff surgery rehabilitation
   - Tests: Shoulder joint mobility and strength

2. **Knee Flexion (Lying Down)**
   - Target: 135° of knee bending
   - Clinical use: Post-knee surgery, arthritis management
   - Tests: Knee joint flexibility and range of motion

3. **Elbow Flexion (Bicep Curl)**
   - Target: 145° of elbow bending
   - Clinical use: General upper extremity rehabilitation
   - Tests: Elbow joint mobility and arm strength

### 📊 Real-time Metrics

- **Current Angle**: Live measurement in degrees
- **Target Angle**: Clinical goal based on AAOS standards
- **Progress**: Percentage toward target achievement
- **Frame Rate**: Performance monitoring (target: 30 fps)
- **Pose Quality**: Visibility and tracking confidence

### 🎨 Visual Feedback

- **Color-coded Progress**:
  - Blue (0-50%): Beginning phase
  - Green (50-75%): Mid-range progress
  - Orange (75-99%): Near target
  - Gold (100%): Target achieved!

- **Skeleton Overlay**:
  - Full body pose visualization
  - Highlighted active joints
  - Angle measurement arcs
  - Smooth real-time animation

### 💬 Live Clinical Feedback

- Progress-based encouragement messages
- Movement quality instructions
- Compensation detection alerts
- Target achievement celebration

## How to Use

### Running the Demo

#### Option 1: Simple HTTP Server (Python)

```bash
cd web-demo
python3 -m http.server 8000
```

Then open: http://localhost:8000

#### Option 2: Node.js HTTP Server

```bash
npm run demo:serve
```

Then open: http://localhost:3000/web-demo

#### Option 3: Direct File Open

Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)

### Using the Simulation

1. **Select Exercise**: Choose from shoulder, knee, or elbow flexion
2. **Select Side**: Choose left or right limb
3. **Select Speed**: Adjust exercise speed (slow/normal/fast)
4. **Click Start**: Begin the exercise simulation
5. **Watch**: Observe real-time angle calculation and feedback
6. **Stop/Reset**: Control the simulation as needed

## Technical Details

### Architecture

```
web-demo/
├── index.html              # Main UI and layout
├── exercise-simulator.js   # Pose generation and biomechanics
├── visualization.js        # Canvas rendering and animation
└── README.md              # This file
```

### Pose Data Generation

The simulation generates realistic pose data using:

- **MoveNet 17-point skeleton** format
- **Biomechanically accurate** joint movements
- **Smooth interpolation** for natural animation
- **Configurable parameters** for different exercises

### Angle Calculation

Uses **clinical-grade trigonometry**:

```javascript
// Calculate angle between three points (p1-p2-p3)
// p2 is the vertex (joint being measured)
angle = arccos((v1 · v2) / (|v1| × |v2|))
```

Where:
- v1 = vector from p2 to p1
- v2 = vector from p2 to p3
- Result in degrees (0-180°)

### Feedback System

Generates feedback based on:

1. **Current angle** vs **target angle**
2. **Progress percentage** (0-100%)
3. **Movement direction** (increasing/decreasing)
4. **Pose quality** (excellent/good/fair/poor)
5. **Compensation detection** (simple visibility-based)

## Clinical Standards

All target angles based on:

- **AAOS** (American Academy of Orthopaedic Surgeons) guidelines
- **AMA** Guides to the Evaluation of Permanent Impairment
- **Clinical best practices** for ROM measurement

### Normal ROM Ranges

| Joint | Movement | Normal Range | Demo Target |
|-------|----------|--------------|-------------|
| Shoulder | Flexion | 150-180° | 160° |
| Knee | Flexion | 130-140° | 135° |
| Elbow | Flexion | 140-150° | 145° |

## Performance

- **Target Frame Rate**: 30 fps
- **Canvas Resolution**: 640x480
- **Pose Updates**: Real-time (30-60 Hz)
- **Zero Latency**: No network dependency

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Requirements**:
- HTML5 Canvas support
- ES6 JavaScript support
- RequestAnimationFrame API

## Future Enhancements

Planned features for next version:

- [ ] Real camera input integration
- [ ] TensorFlow.js pose detection
- [ ] Bilateral comparison mode
- [ ] Protocol-based workflows
- [ ] Session recording and playback
- [ ] Export to PDF/JSON
- [ ] Multi-language support
- [ ] Accessibility improvements (WCAG AA)

## Limitations

**Current Simulation:**
- Uses **simulated pose data** (not real camera)
- **Simplified compensation detection**
- **Loop animation** (repeating movement)
- **No data persistence** (resets on page reload)

**For Production:**
- Requires real pose detection (TensorFlow/MediaPipe)
- Advanced compensation algorithms
- Data storage and tracking
- User authentication
- HIPAA compliance

## Code Examples

### Generate Custom Exercise

```javascript
// Create shoulder flexion at 45° (27.5% progress)
const pose = generateShoulderFlexionPose(0.275, 'left');

// Analyze biomechanics
const analysis = analyzeShoulderFlexion(pose, 'left');
console.log(`Current angle: ${analysis.angle}°`);

// Get feedback
const feedback = generateFeedback(analysis, 160);
console.log(feedback.message);
```

### Calculate Angle

```javascript
const angle = calculateAngle(
  { x: 100, y: 200 }, // Point 1
  { x: 100, y: 100 }, // Vertex (joint)
  { x: 200, y: 100 }  // Point 3
);
console.log(`Angle: ${angle}°`); // Result: 90°
```

## Troubleshooting

### Simulation Not Starting

- Check browser console for errors
- Ensure all 3 files are in same directory
- Try a different browser
- Disable browser extensions that block JavaScript

### Low Frame Rate

- Close other browser tabs
- Reduce canvas resolution (edit canvas.width/height)
- Use "Fast" speed setting
- Try a different browser

### Skeleton Not Visible

- Check canvas background (should be dark)
- Verify JavaScript files loaded correctly
- Check browser console for errors

## Credits

**Developed By**: PhysioAssist Team

**Clinical Advisors**: Based on AAOS and AMA guidelines

**Technology Stack**:
- Vanilla JavaScript (ES6)
- HTML5 Canvas API
- CSS3 Grid and Flexbox
- RequestAnimationFrame

## License

Part of the PhysioAssist clinical assessment platform.

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
**Status**: Demo/Simulation
