// Quick test to verify angle calculations

function calculate2DAngle(pointA, pointB, pointC) {
  const vectorBA = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
  };

  const vectorBC = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  };

  const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;
  
  const magnitudeBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2);
  const magnitudeBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2);

  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
  const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  
  return (angleRadians * 180) / Math.PI;
}

// Test cases
console.log("Test 1: Right angle");
const test1 = calculate2DAngle(
  { x: 0, y: 1 },  // A
  { x: 0, y: 0 },  // B
  { x: 1, y: 0 }   // C
);
console.log(`Expected: 90°, Got: ${test1}°`);

console.log("\nTest 2: Straight line");
const test2 = calculate2DAngle(
  { x: 0, y: 0 },  // A
  { x: 1, y: 0 },  // B
  { x: 2, y: 0 }   // C
);
console.log(`Expected: 180°, Got: ${test2}°`);

console.log("\nTest 3: 45 degree angle");
const test3 = calculate2DAngle(
  { x: 0, y: 1 },  // A
  { x: 0, y: 0 },  // B
  { x: 1, y: 1 }   // C
);
console.log(`Expected: 45°, Got: ${test3}°`);