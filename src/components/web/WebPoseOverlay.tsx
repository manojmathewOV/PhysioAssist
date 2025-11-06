import { PoseLandmark } from '../../types/pose';

const POSE_CONNECTIONS = [
  // Face
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  // Body
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
  // Hands
  [15, 17],
  [15, 19],
  [15, 21],
  [16, 18],
  [16, 20],
  [16, 22],
];

const WebPoseOverlay = {
  drawPose(
    canvas: HTMLCanvasElement,
    landmarks: PoseLandmark[],
    angles: { [key: string]: number },
    width: number,
    height: number
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;

    POSE_CONNECTIONS.forEach(([start, end]) => {
      const landmark1 = landmarks[start];
      const landmark2 = landmarks[end];

      if (
        landmark1 &&
        landmark2 &&
        landmark1.visibility > 0.5 &&
        landmark2.visibility > 0.5
      ) {
        ctx.beginPath();
        ctx.moveTo(landmark1.x * width, landmark1.y * height);
        ctx.lineTo(landmark2.x * width, landmark2.y * height);
        ctx.stroke();
      }
    });

    // Draw landmarks
    landmarks.forEach((landmark, index) => {
      if (landmark.visibility > 0.5) {
        const x = landmark.x * width;
        const y = landmark.y * height;

        // Set color based on confidence
        if (landmark.visibility > 0.8) {
          ctx.fillStyle = '#00FF00';
        } else if (landmark.visibility > 0.6) {
          ctx.fillStyle = '#FFFF00';
        } else {
          ctx.fillStyle = '#FF0000';
        }

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw landmark index for debugging
        if (process.env.NODE_ENV === 'development') {
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.fillText(index.toString(), x + 5, y - 5);
        }
      }
    });

    // Draw angle measurements
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;

    // Draw angle for right elbow
    if (angles.rightElbow !== undefined) {
      const elbow = landmarks[14];
      if (elbow && elbow.visibility > 0.5) {
        const x = elbow.x * width;
        const y = elbow.y * height;
        const text = `${angles.rightElbow.toFixed(0)}°`;

        ctx.strokeText(text, x + 10, y - 10);
        ctx.fillText(text, x + 10, y - 10);
      }
    }

    // Draw angle for left elbow
    if (angles.leftElbow !== undefined) {
      const elbow = landmarks[13];
      if (elbow && elbow.visibility > 0.5) {
        const x = elbow.x * width;
        const y = elbow.y * height;
        const text = `${angles.leftElbow.toFixed(0)}°`;

        ctx.strokeText(text, x + 10, y - 10);
        ctx.fillText(text, x + 10, y - 10);
      }
    }

    // Draw angle for right knee
    if (angles.rightKnee !== undefined) {
      const knee = landmarks[26];
      if (knee && knee.visibility > 0.5) {
        const x = knee.x * width;
        const y = knee.y * height;
        const text = `${angles.rightKnee.toFixed(0)}°`;

        ctx.strokeText(text, x + 10, y - 10);
        ctx.fillText(text, x + 10, y - 10);
      }
    }

    // Draw angle for left knee
    if (angles.leftKnee !== undefined) {
      const knee = landmarks[25];
      if (knee && knee.visibility > 0.5) {
        const x = knee.x * width;
        const y = knee.y * height;
        const text = `${angles.leftKnee.toFixed(0)}°`;

        ctx.strokeText(text, x + 10, y - 10);
        ctx.fillText(text, x + 10, y - 10);
      }
    }
  },

  drawAngleArc(
    ctx: CanvasRenderingContext2D,
    center: { x: number; y: number },
    start: { x: number; y: number },
    end: { x: number; y: number },
    angle: number,
    radius: number = 40
  ) {
    // Calculate angles
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
    const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

    // Draw arc
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(74, 144, 226, 0.5)';
    ctx.lineWidth = 2;
    ctx.arc(center.x, center.y, radius, startAngle, endAngle);
    ctx.stroke();

    // Draw angle text
    const midAngle = (startAngle + endAngle) / 2;
    const textX = center.x + Math.cos(midAngle) * (radius + 20);
    const textY = center.y + Math.sin(midAngle) * (radius + 20);

    ctx.fillStyle = '#4A90E2';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${angle.toFixed(0)}°`, textX, textY);
  },
};

export default WebPoseOverlay;
