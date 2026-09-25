/**
 * Browser stand-in for react-native-linear-gradient (native-only). Renders a
 * View with a CSS linear-gradient background, honouring colors/start/end/locations.
 */
const React = require('react');
const { View } = require('react-native');

function LinearGradient({
  colors = [],
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  locations,
  style,
  children,
  ...rest
}) {
  const angle = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI + 90;
  const stops = colors
    .map((c, i) =>
      locations && locations[i] !== undefined ? `${c} ${locations[i] * 100}%` : c
    )
    .join(', ');
  return React.createElement(
    View,
    {
      ...rest,
      style: [style, { backgroundImage: `linear-gradient(${angle}deg, ${stops})` }],
    },
    children
  );
}

module.exports = LinearGradient;
module.exports.default = LinearGradient;
