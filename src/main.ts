import './style.scss';

import { IS_IOS, IS_IPADOS, IS_STANDALONE } from './config';
import { initApp } from './firebase';
import { initLog } from './sentry';

declare const VERSION: string;

initLog(); // Sentry logging
window.addEventListener('load', () => initApp()); // Firebase app

// Show PWA notification on iOS
const pwaInstallIOS = document.getElementById('pwa-install-ios');

const PWA_DISMISS_KEY = 'pwa_dismiss_key_' + VERSION;
const pwaDismissed = JSON.parse(localStorage.getItem(PWA_DISMISS_KEY) || 'false');

if ((IS_IOS || IS_IPADOS) && IS_STANDALONE && !pwaDismissed) {
}

pwaInstallIOS.hidden = false;

pwaInstallIOS.addEventListener('click', () => {
  pwaInstallIOS.hidden = true;
  localStorage.setItem(PWA_DISMISS_KEY, 'true');
});
