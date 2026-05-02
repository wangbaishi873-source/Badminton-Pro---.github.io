/**
 * Badminton Pro - Service Worker
 * PWA离线缓存与更新策略
 *
 * 缓存策略:
 * - HTML: NetworkFirst (实时内容)
 * - CSS/JS: CacheFirst (静态资源，长期缓存)
 * - Images: StaleWhileRevalidate (图片预缓存)
 * - Google Fonts: CacheFirst with版本控制
 */

const CACHE_NAME = 'badminton-pro-v1.0.0';
const DATA_CACHE_NAME = 'badminton-data-v1';

// 核心资源 (应用外壳)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/badminton-rules.js'
];

// 缓存资源类型
const RESOURCE_TYPES = {
  CORE: 'core',
  STATIC: 'static',
  DYNAMIC: 'dynamic',
  EXTERNAL: 'external'
};

/**
 * 安装阶段 - 预缓存核心资源
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting on install');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error);
      })
  );
});

/**
 * 激活阶段 - 清理旧缓存
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // 删除旧版本缓存
              return name.startsWith('badminton-') &&
                     name !== CACHE_NAME &&
                     name !== DATA_CACHE_NAME;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

/**
 * 请求拦截 - 根据资源类型选择缓存策略
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 仅处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 根据请求类型选择策略
  const strategy = getCacheStrategy(request);

  event.respondWith(handleRequest(request, strategy));
});

/**
 * 获取缓存策略
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const ext = url.pathname.split('.').pop().toLowerCase();

  // HTML - Network First (获取最新内容)
  if (request.headers.get('accept')?.includes('text/html')) {
    return 'networkFirst';
  }

  // 静态资源 - Cache First (长期缓存)
  if (['js', 'css', 'woff', 'woff2'].includes(ext)) {
    return 'cacheFirst';
  }

  // 图片 - Stale While Revalidate (快速响应 + 后台更新)
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return 'staleWhileRevalidate';
  }

  // 数据请求 - Network First with Fallback
  if (url.pathname.includes('/api/') || url.pathname.includes('data')) {
    return 'networkFirst';
  }

  // 默认 - Network First
  return 'networkFirst';
}

/**
 * 处理请求
 */
async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);

  switch (strategy) {
    case 'cacheFirst':
      return cacheFirst(request, cache);
    case 'networkFirst':
      return networkFirst(request, cache);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, cache);
    default:
      return networkFirst(request, cache);
  }
}

/**
 * Cache First - 先读缓存，缓存没有才请求网络
 * 适用于: CSS, JS, Fonts, Icons
 */
async function cacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] Cache First - HIT:', request.url);
    return cachedResponse;
  }

  console.log('[SW] Cache First - MISS:', request.url);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First - Network failed:', error);

    const fallbackResponse = await cache.match(request);
    if (fallbackResponse) {
      return fallbackResponse;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Network First - 先请求网络，网络失败时使用缓存
 * 适用于: HTML, API
 */
async function networkFirst(request, cache) {
  try {
    console.log('[SW] Network First - FETCHING:', request.url);

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network First - OFFLINE, using cache:', request.url);

    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 如果是HTML请求，返回离线页面
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/index.html');
    }

    // 返回错误响应
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale While Revalidate - 立即返回缓存，同时后台更新缓存
 * 适用于: Images
 */
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);

  // 立即返回缓存
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || fetchPromise;
}

/**
 * 背景同步 - 离线数据同步
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);

  if (event.tag === 'sync-match-data') {
    event.waitUntil(syncMatchData());
  }
});

/**
 * 同步比赛数据到服务器 (如果未来有后端)
 */
async function syncMatchData() {
  try {
    // 从 IndexedDB 获取待同步数据
    const db = await openDatabase();
    const pendingMatches = await getPendingMatches(db);

    for (const match of pendingMatches) {
      // 模拟上传到服务器
      // await fetch('/api/matches', { method: 'POST', body: JSON.stringify(match) });

      // 标记为已同步
      await markAsSynced(db, match.id);
    }

    console.log('[SW] Synced', pendingMatches.length, 'matches');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

/**
 * IndexedDB 数据库操作
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BadmintonProDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 比赛记录存储
      if (!db.objectStoreNames.contains('matches')) {
        const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
        matchStore.createIndex('date', 'date', { unique: false });
        matchStore.createIndex('synced', 'synced', { unique: false });
      }

      // 设置存储
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

function getPendingMatches(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('matches', 'readonly');
    const store = tx.objectStore('matches');
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function markAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('matches', 'readwrite');
    const store = tx.objectStore('matches');
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const match = request.result;
      match.synced = true;
      store.put(match);
      resolve();
    };
  });
}

/**
 * 推送通知
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || '比赛数据已更新',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: '打开' },
      { action: 'close', title: '关闭' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Badminton Pro', options)
  );
});

/**
 * 通知点击
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => {
        // 聚焦现有窗口或打开新窗口
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        return self.clients.openWindow(url);
      })
  );
});

/**
 * 消息处理 - 与主线程通信
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
      .then(() => event.ports[0].postMessage({ success: true }));
  }
});

/**
 * 应用更新检查
 */
self.addEventListener('updatefound', () => {
  console.log('[SW] New version available');

  const newWorker = self.installing;

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // 通知用户有新版本
      showUpdateNotification();
    }
  });
});

/**
 * 显示更新通知
 */
async function showUpdateNotification() {
  const clients = await self.clients.matchAll({ type: 'window' });

  if (clients.length > 0) {
    clients[0].postMessage({
      type: 'UPDATE_AVAILABLE',
      message: '有新版本可用，点击刷新以更新'
    });
  }
}

console.log('[SW] Service Worker loaded');
