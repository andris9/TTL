/* jshint browser: true */

(function() {
    var ttlHandler = document.createElement('link');
    var seed;
    var ttl;

    try {
        // load previously stored state info
        seed = JSON.parse(localStorage.getItem('__TTL'));
    } catch (E) {
        seed = [];
    }

    ttl = createTTL(seed);

    // handle external updates
    window.addEventListener('storage', function(e) {
        var state;
        if (event.key == '__TTL') {
            try {
                // load previously stored state info
                state = JSON.parse(localStorage.getItem('__TTL'));
            } catch (E) {}
            if (state) {
                ttl.reset(state);
            }
        }
    }, false);

    // store updated TTL state
    ttl.onupdate = function(data) {
        localStorage.setItem('__TTL', JSON.stringify(data));
    };

    // remove expired key from localstorage and emit 'expire' event
    ttl.onexpire = function(key) {
        localStorage.removeItem(key);
        ttlHandler.dispatchEvent(new CustomEvent('expire', {detail: key}));
    };

    // expose methods
    ttlHandler.set = function(key, expire) {
        ttl.set(key, expire);
    };
    ttlHandler.get = function(key) {
        return ttl.get(key);
    };

    window.TTL = ttlHandler;
    ttl.start();
})();