importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

if (workbox) {
  // Precache the app
  workbox.precaching.precacheAndRoute([
  {
    "url": "index.html",
    "revision": "eb1d40e04f5fa9a9ba8ea6860a9a638e"
  },
  {
    "url": "main.52f1eac47abc1df65e29.js"
  },
  {
    "url": "style.d8258d6551c04a27c101.css"
  },
  {
    "url": "assets/audio/sfx.json",
    "revision": "2745717205d15b70dc5da76cf51f8bf3"
  },
  {
    "url": "assets/audio/sfx.ogg",
    "revision": "49ec47442c90668fcd11b9b959100bc2"
  },
  {
    "url": "assets/fonts/font.png",
    "revision": "cc5111250feb03dd6261047e973b3b20"
  },
  {
    "url": "assets/images/alcala-gate.png",
    "revision": "f99a6c737a2566f003e1adf638a7245d"
  },
  {
    "url": "assets/images/bull.png",
    "revision": "29ca398d2974ee56c30d3316b61676ca"
  },
  {
    "url": "assets/images/city-lights.png",
    "revision": "9095bbdeae1b4d03f4355e7ffc4e0f12"
  },
  {
    "url": "assets/images/city.png",
    "revision": "506eda314fbdb39d52061e166249e98a"
  },
  {
    "url": "assets/images/clouds.png",
    "revision": "0b9162b0570f0c0a24c25075f6da56b2"
  },
  {
    "url": "assets/images/convention-logo-small.png",
    "revision": "13417c438538944cb9e98f0c29466766"
  },
  {
    "url": "assets/images/convention-logo.png",
    "revision": "42db64fa862e7968a683e67ac39032e6"
  },
  {
    "url": "assets/images/favicon.png",
    "revision": "afb51a17c83aed76b9f5ea164b0a208d"
  },
  {
    "url": "assets/images/game-sprites.png",
    "revision": "a0060b6d9c1f82ddcbf80578dfb87767"
  },
  {
    "url": "assets/images/gamepad.png",
    "revision": "bc6fdbde43d8e1ec23b1d9b14d0009ed"
  },
  {
    "url": "assets/images/home_screen.png",
    "revision": "84580239a3eafc51b87af0f6f27001b8"
  },
  {
    "url": "assets/images/metro.png",
    "revision": "315c719116ec8631ecf670ade4329b29"
  },
  {
    "url": "assets/images/share.png",
    "revision": "6da74b779fdb005cb913d7266c3b205c"
  },
  {
    "url": "assets/images/title.png",
    "revision": "3cd883575902191be8735c515ddb7e0a"
  },
  {
    "url": "assets/images/wanda.png",
    "revision": "f54fba557397512fd7e35b33c70c2ff5"
  },
  {
    "url": "assets/music/89.ogg",
    "revision": "b041fdb7ac50df5bc4d6de79c300c804"
  },
  {
    "url": "assets/music/bethel.ogg",
    "revision": "b2a3ea38cbca10ddd42730adde888c04"
  },
  {
    "url": "assets/music/overworld.ogg",
    "revision": "a30af55713a73738133a7aa7e2e4f6ff"
  },
  {
    "url": "assets/pack.json",
    "revision": "928429323698f971fa3d7ca963086621"
  },
  {
    "url": "assets/sprites/game-sprites.json",
    "revision": "73bdab70b4af7fdab514a11bf7d20bf1"
  },
  {
    "url": "assets/sprites/game-sprites.png",
    "revision": "f89656950867cd4b436e11473305339e"
  },
  {
    "url": "assets/tilemaps/game-tilemap.json",
    "revision": "7cbf44e4829de3e22a4de9fa91027a7c"
  }
]);

  // Store in the cache all assets
  workbox.routing.registerRoute(new RegExp('\\.(css|ico|png|xml|json|ac3|m4a|mp3|ogg|fnt)$'), new workbox.strategies.NetworkFirst());
  workbox.routing.registerRoute(new RegExp('https://storage.googleapis.com/'), new workbox.strategies.NetworkFirst());

  // Enable Offline Google Analytics
  workbox.googleAnalytics.initialize();

  // Skip waiting
  workbox.core.skipWaiting();
}
