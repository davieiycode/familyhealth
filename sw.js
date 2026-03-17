/* sw.js - Service Worker untuk Family Health App */

const CACHE_NAME = 'family-health-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './health_body_map_illustration_1773776783968.png',
    './emergency_health_card_1773776804585.png',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// 1. Event Install: Menyimpan aset ke dalam Cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache berhasil dibuka dan aset disimpan.');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// 2. Event Activate: Membersihkan cache lama jika ada pembaruan versi
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Event Fetch: Mengambil dari cache dulu (Offline First), jika tidak ada baru ke jaringan
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Jika file ada di cache, kembalikan file tersebut
                if (response) {
                    return response;
                }
                // Jika tidak ada, ambil dari internet
                return fetch(event.request);
            })
    );
});