self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('v1').then(cache => {
            console.log('adding things to cache');
            return cache.addAll([
                './',
                './index.html',
                './script.js',
                './sw.js'
            ]);
        })
    );
});


self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response;
        })
    );
});
