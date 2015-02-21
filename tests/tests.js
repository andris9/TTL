/* jshint browser: true */
/* global QUnit: false, simpleStorage: false, asyncTest: false, expect: false,
   start: false, test: false, ok: false, deepEqual: false, equal: false */

var ttl;

module('general');

asyncTest('Set and expire a key', function() {
    'use strict';

    expect(2);

    var now = Date.now();
    var ttl = createTTL();

    ttl.onexpire = function(key) {
        equal(key, 'testkey');
        ok(Date.now() - now > 1000);
        start();
    };

    ttl.set('testkey', 1000);

    ttl.start();
});


asyncTest('Set and expire multiple keys', function() {
    'use strict';

    expect(3);

    var keys = [
        ['test1', 300],
        ['test2', 100],
        ['test3', 200]
    ];
    var ttl = createTTL();

    ttl.onexpire = function(key) {
        equal(key, keys.shift()[0]);

        if (!keys.length) {
            start();
        }
    };

    keys.forEach(function(key) {
        ttl.set(key[0], key[1]);
    });

    keys.sort(function(a, b) {
        return a[1] - b[1];
    });

    ttl.start();

});

asyncTest('Use earlier state', function() {
    'use strict';

    expect(3);

    var keys = [
        ['test1', 300],
        ['test2', 100],
        ['test3', 200]
    ];
    var ttl = createTTL([
        ['test2', Date.now() + 100],
        ['test3', Date.now() + 200],
        ['test1', Date.now() + 300]
    ]);

    ttl.onexpire = function(key) {
        equal(key, keys.shift()[0]);

        if (!keys.length) {
            start();
        }
    };

    keys.sort(function(a, b) {
        return a[1] - b[1];
    });

    ttl.start();
});