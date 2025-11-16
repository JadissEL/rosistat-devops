# PWA Service Worker Implementation Guide

This guide explains the service worker strategy implemented in RoSiStrat and how to extend it.

---

## Service Worker Fundamentals

### What is a Service Worker?

A service worker is a JavaScript file that runs in the background, separate from the web page. It acts as an intermediary between the app and the network, enabling:

- **Offline functionality** - Serve cached content when offline
- **Background sync** - Queue actions for later execution
- **Push notifications** - Receive system notifications
- **Caching strategy** - Intelligently manage app resources

### Lifecycle Events

Service workers have three main lifecycle events:

#### 1. Install Event
```javascript
self.addEventListener('install', event => {
  // Triggered when service worker is first registered
  // Used to cache critical assets
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});
```

**Purpose:** Pre-cache essential assets for offline functionality

**Best Practices:**
- Cache only critical resources
- Keep cache small for faster install
- Use versioned cache names
- Skip waiting for better UX

#### 2. Fetch Event
```javascript
self.addEventListener('fetch', event => {
  // Triggered when page makes HTTP request
  // Used to serve from cache or network
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
```

**Purpose:** Intercept network requests and serve from cache

**Cache Strategies Available:**
- Cache-first (try cache, fallback to network)
- Network-first (try network, fallback to cache)
- Stale-while-revalidate (serve cache, update in background)
- Network-only (no caching)
- Cache-only (no network)

#### 3. Activate Event
```javascript
self.addEventListener('activate', event => {
  // Triggered when new service worker takes control
  // Used to clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

**Purpose:** Clean up old cache versions

**Best Practices:**
- Remove only obsolete caches
- Keep current version
- Handle missing cache gracefully
- Log cleanup for debugging

---

## Current Implementation: Cache-First Strategy

### Overview

RoSiStrat uses a **cache-first with network fallback** strategy:

```
Request → Check Cache → Found? YES → Return ✓
                             ↓ NO
                         Network Request → Cache → Return
```

### Cached Resources

| Resource | Reason | Update Strategy |
|----------|--------|-----------------|
| `/` | App shell | On SW update |
| `/index.html` | Entry point | On SW update |
| `/manifest.json` | PWA config | On SW update |
| `/static/js/bundle.js` | App logic | On SW update |
| `/static/css/main.css` | Styling | On SW update |

### When to Use Cache-First

✅ **Good for:**
- Static assets (JS, CSS, images)
- Offline-first experiences
- Progressive enhancement
- Reducing server load

❌ **Bad for:**
- API responses (stale data)
- User-specific content
- Real-time data
- Authentication tokens

---

## Cache Strategies Deep Dive

### 1. Cache-First (Current Implementation)

**Code:**
```javascript
event.respondWith(
  caches.match(event.request)
    .then(response => response || fetch(event.request))
);
```

**Flow:**
1. Check service worker cache
2. Return if found (cached version)
3. Fetch from network if not cached
4. Return network response

**Use Cases:**
- Static assets
- Immutable resources
- Offline-first apps
- Progressive enhancement

**Pros:**
- ✅ Works offline
- ✅ Fast (cache hit)
- ✅ Reduces server load
- ✅ Good UX on slow networks

**Cons:**
- ❌ May serve stale content
- ❌ Need manual updates
- ❌ Requires cache busting

### 2. Network-First (Recommended for APIs)

**Code:**
```javascript
event.respondWith(
  fetch(event.request)
    .then(response => {
      // Clone response before caching
      const clonedResponse = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, clonedResponse);
      });
      return response;
    })
    .catch(() => caches.match(event.request))
);
```

**Flow:**
1. Attempt network request
2. Cache response if successful
3. Return network response
4. Fallback to cache if offline/error

**Use Cases:**
- API calls
- Real-time data
- User-generated content
- Frequently updated resources

**Pros:**
- ✅ Always fresh when online
- ✅ Works offline with cached version
- ✅ Better user experience
- ✅ Automatic cache updates

**Cons:**
- ❌ Slower on slow networks
- ❌ Requires network request
- ❌ May show loading state

### 3. Stale-While-Revalidate

**Code:**
```javascript
event.respondWith(
  caches.match(event.request)
    .then(response => {
      // Return cache immediately
      if (response) {
        // Update cache in background
        fetch(event.request).then(freshResponse => {
          if (freshResponse.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, freshResponse);
            });
          }
        });
        return response;
      }
      // No cache, fetch from network
      return fetch(event.request);
    })
);
```

**Flow:**
1. Return cached version immediately
2. Fetch fresh version in background
3. Update cache for next visit
4. Fallback to network if no cache

**Use Cases:**
- Semi-static content
- Blog posts, articles
- News feeds
- Product listings

**Pros:**
- ✅ Instant user response
- ✅ Fresh content eventually
- ✅ Works offline
- ✅ Best of both worlds

**Cons:**
- ❌ User sees old content first
- ❌ Background network cost
- ❌ Complexity

### 4. Network-Only

**Code:**
```javascript
event.respondWith(fetch(event.request));
```

**Use Cases:**
- Sensitive data
- Real-time systems
- High-security content
- Dynamic pages

### 5. Cache-Only

**Code:**
```javascript
event.respondWith(caches.match(event.request));
```

**Use Cases:**
- Offline fallback pages
- Static assets
- App shell

---

## Implementing Selective Caching

### By Request Type

```javascript
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // API calls - network-first
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(networkFirst(event.request));
  }
  
  // Static assets - cache-first
  if (/\.(js|css|png|jpg|svg)$/.test(url.pathname)) {
    return event.respondWith(cacheFirst(event.request));
  }
  
  // HTML - stale-while-revalidate
  if (event.request.headers.get('accept').includes('text/html')) {
    return event.respondWith(staleWhileRevalidate(event.request));
  }
});
```

### By Domain

```javascript
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Same origin - cache-first
  if (url.origin === self.location.origin) {
    return event.respondWith(cacheFirst(event.request));
  }
  
  // Cross-origin (CDN, APIs) - network-first
  return event.respondWith(networkFirst(event.request));
});
```

### By Request Method

```javascript
self.addEventListener('fetch', event => {
  // GET requests - cache
  if (event.request.method === 'GET') {
    return event.respondWith(cacheFirst(event.request));
  }
  
  // POST/PUT/DELETE - network only (no caching)
  return event.respondWith(fetch(event.request));
});
```

---

## Cache Management

### Version Updates

```javascript
// Increment on new deployment
const CACHE_NAME = 'rosistrat-v2';
const CACHE_VERSION = 2;

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('rosistrat-'))
          .filter(name => {
            const version = parseInt(name.split('-v')[1]);
            return version < CACHE_VERSION;
          })
          .map(name => caches.delete(name))
      );
    })
  );
});
```

### Programmatic Cache Updates

```javascript
// Update cache from app
function updateCache(url, response) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    const client = navigator.serviceWorker.controller;
    client.postMessage({
      type: 'CACHE_UPDATE',
      url: url,
      response: response
    });
  }
}

// Service worker receives message
self.addEventListener('message', event => {
  if (event.data.type === 'CACHE_UPDATE') {
    caches.open(CACHE_NAME).then(cache => {
      cache.put(
        event.data.url,
        new Response(JSON.stringify(event.data.response))
      );
    });
  }
});
```

### Cache Size Limits

```javascript
const MAX_CACHE_SIZE = 1024 * 1024 * 50; // 50 MB

async function limitCacheSize() {
  const names = await caches.keys();
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  let size = 0;
  for (const request of keys) {
    const response = await cache.match(request);
    size += response.headers.get('content-length') || 0;
    
    if (size > MAX_CACHE_SIZE) {
      cache.delete(request);
    }
  }
}
```

---

## Error Handling

### Network Errors

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache on network error
        return caches.match(event.request)
          .then(cachedResponse => 
            cachedResponse || showOfflinePage()
          );
      })
  );
});
```

### Offline Fallback Page

```javascript
// Pre-cache offline page on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/offline.html'
      ]);
    })
  );
});

function showOfflinePage() {
  return caches.match('/offline.html');
}
```

---

## Background Sync (Advanced)

### Queuing Failed Requests

```javascript
// In app - queue failed requests
async function makeRequest(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    // Queue for later
    await queueRequest(url, options);
    throw error;
  }
}

async function queueRequest(url, options) {
  const db = await openDB();
  await db.add('failedRequests', {
    url,
    options,
    timestamp: Date.now()
  });
}

// In service worker - sync on reconnection
self.addEventListener('sync', event => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  const db = await openDB();
  const requests = await db.getAll('failedRequests');
  
  for (const req of requests) {
    try {
      const response = await fetch(req.url, req.options);
      if (response.ok) {
        await db.delete('failedRequests', req.id);
      }
    } catch (error) {
      // Retry later
      console.error('Sync failed:', error);
    }
  }
}
```

---

## Push Notifications

### Register for Notifications

```javascript
// In app
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
  });
  
  // Send subscription to server
  await fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' }
  });
}

// In service worker
self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  });
});
```

---

## Testing & Debugging

### Service Worker DevTools

1. **Chrome DevTools → Application Tab:**
   - View registered service workers
   - Check cache contents
   - Simulate offline mode
   - Test cache updates

2. **Inspect Cache:**
```javascript
// In console
const cache = await caches.open('rosistrat-v1');
const keys = await cache.keys();
keys.forEach(req => console.log(req.url));
```

3. **Test Offline:**
```javascript
// Simulate offline in DevTools
// Application → Service Workers → Offline checkbox
```

### Logging

```javascript
// Service worker logging
self.addEventListener('fetch', event => {
  console.log(`[SW] ${event.request.method} ${event.request.url}`);
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log(`[SW] Cache HIT ${event.request.url}`);
        } else {
          console.log(`[SW] Cache MISS ${event.request.url}`);
        }
        return response || fetch(event.request);
      })
  );
});
```

---

## Best Practices Summary

### DO ✅

- ✅ Use versioned cache names
- ✅ Cache only essential assets
- ✅ Implement proper error handling
- ✅ Clean up old caches
- ✅ Use network-first for APIs
- ✅ Test offline functionality
- ✅ Monitor cache size
- ✅ Handle update events

### DON'T ❌

- ❌ Cache sensitive data
- ❌ Cache authentication tokens
- ❌ Pre-cache large files
- ❌ Ignore cache failures
- ❌ Use cache without versioning
- ❌ Cache POST/PUT/DELETE responses
- ❌ Forget to handle errors
- ❌ Deploy without testing

---

## Migration Guide

### From No Service Worker

```javascript
// 1. Create sw.js file
// 2. Add registration to index.html
// 3. Deploy and test
// 4. Monitor cache usage
// 5. Iterate on strategy
```

### From Existing Service Worker

```javascript
// 1. Update CACHE_NAME version
// 2. Add new assets to urlsToCache
// 3. Deploy
// 4. Old SW automatically cleaned up
// 5. New SW takes control on activate
```

### From Different Cache Strategy

```javascript
// 1. Update CACHE_NAME (forces new install)
// 2. Implement new strategy in fetch event
// 3. Deploy
// 4. Test new behavior
// 5. Monitor performance
```

---

## Resources

- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google PWA Documentation](https://web.dev/progressive-web-apps/)
- [Workbox Library](https://developers.google.com/web/tools/workbox)
- [Service Worker Cookbook](https://serviceworke.rs/)

---

**Document Version:** 1.0 | **Last Updated:** 2025 | **Status:** Production Ready
