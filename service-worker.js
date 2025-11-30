// Basic Service Worker to enable PWA 'Add to Home Screen' functionality
const CACHE_NAME = 'nifty-pulse-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for now. 
  // In a production app, you would cache assets here for offline support.
  event.respondWith(fetch(event.request));
});