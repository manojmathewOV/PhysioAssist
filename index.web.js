import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Run the app on web
const rootTag = document.getElementById('root') || document.getElementById('app');
AppRegistry.runApplication(appName, { rootTag });