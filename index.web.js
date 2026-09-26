import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import materialIconsFont from 'react-native-vector-icons/Fonts/MaterialIcons.ttf';

// react-native-vector-icons needs its font registered on web
const iconFontStyle = document.createElement('style');
iconFontStyle.appendChild(
  document.createTextNode(
    `@font-face { src: url(${materialIconsFont}); font-family: MaterialIcons; }`
  )
);
document.head.appendChild(iconFontStyle);

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Run the app on web
const rootTag = document.getElementById('root') || document.getElementById('app');
AppRegistry.runApplication(appName, { rootTag });
