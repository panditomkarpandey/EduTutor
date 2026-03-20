// sw.js – Service Worker for Education Tutor PWA
// Provides offline support and asset caching for low-bandwidth environments

const CACHE_VERSION = 'edu-tutor-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;

// Assets to cache on install (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/css/main.css',
  '/js/api.js',
  '/js/admin.js',
  '/manifest.json',
];

// API routes to cache (GET only, short TTL)
const CACHEABLE_API = [
  '/api/search/textbooks',
  '/api/search/boards',
];

const API_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes


// ── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});


// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('edu-tutor-') && k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});


// ── Fetch: cache strategy ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API requests: network-first with short cache
  if (url.pathname.startsWith('/api/')) {
    if (CACHEABLE_API.some(p => url.pathname.startsWith(p))) {
      event.respondWith(networkFirstWithTTL(request));
    }
    // All other API calls (auth, chat, etc.) — always network, never cache
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(request));
});


// Cache-first strategy (static assets)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    // Offline fallback for HTML pages
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}


// Network-first with TTL (cacheable API responses)
async function networkFirstWithTTL(request) {
  const cacheKey = request.url;

  // Try network first
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      // Store with timestamp header
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const timestamped = new Response(await response.clone().blob(), { headers });
      cache.put(cacheKey, timestamped);
      return response;
    }
  } catch (_) {
    // Network failed — fall through to cache
  }

  // Try cache with TTL check
  const cached = await caches.match(cacheKey);
  if (cached) {
    const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
    if (Date.now() - cachedAt < API_CACHE_TTL_MS) {
      return cached;
    }
  }

  return new Response(
    JSON.stringify({ detail: 'You appear to be offline. Please check your connection.' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}


// ── Background sync for offline questions ─────────────────────────────────────
// If the browser supports background sync, queue failed question submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-questions') {
    event.waitUntil(syncQueuedQuestions());
  }
});

async function syncQueuedQuestions() {
  // Questions queued while offline are stored in IndexedDB by the frontend
  // This sync handler would resubmit them — implementation left for future
  console.log('[SW] Background sync triggered for queued questions');
}


// ── Push notifications (future: quiz reminders) ───────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'Education Tutor', {
    body:    data.body || 'You have a new message',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url || '/dashboard.html' },
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/dashboard.html')
  );
});
