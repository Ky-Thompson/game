import './style.scss';

import { initApp } from './firebase';
import { initLog } from './sentry';

initLog(); // Sentry logging
window.addEventListener('load', () => initApp()); // Firebase app
