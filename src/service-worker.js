importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

if (workbox) {
  // Precache the app
  workbox.precaching.precacheAndRoute([]);

  // Store in the cache all assets
  workbox.routing.registerRoute(new RegExp('\\.(css|ico|png|xml|json|ac3|m4a|mp3|ogg|fnt)$'), new workbox.strategies.NetworkFirst());
  workbox.routing.registerRoute(new RegExp('https://storage.googleapis.com/'), new workbox.strategies.NetworkFirst());

  // Enable Offline Google Analytics
  workbox.googleAnalytics.initialize();

  // Skip waiting
  workbox.core.skipWaiting();
}
