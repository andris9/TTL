/* jshint browser: true */
/* global define: false */

// AMD shim
(function(root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.createTTL = factory();
    }

}(this, function() {

    'use strict';

    /**
     * Generates a TTL object
     *
     * @constructs
     * @param {Object} [data] Earlier state got from #onupdate
     */
    function TTL(data) {
        this._running = false;
        this._keyData = data || [];
        this._nextTimeout = false;
    }

    /**
     * Method that is executed once a key has been expired
     *
     * Override this with your own implementation, this is just a placeholder
     *
     * @event
     * @param {String} key Expired key name
     */
    TTL.prototype.onexpire = function(key) {
        console.log('"%s" was expired', key);
    };

    /**
     * Method that is executed once something is changed in the TTL state. You should store this information somehow
     * and when the page is reloaded use this information as data for the TTL constructor
     *
     * Override this with your own implementation, this is just a placeholder
     *
     * @event
     * @param {Array} data TTL metainfo
     */
    TTL.prototype.onupdate = function(data) {
        console.log('TTL info updated', data);
    };

    /**
     * Resets state
     *
     * @param {Object} [data] Earlier state got from #onupdate
     */
    TTL.prototype.reset = function(state) {
        var running = this._running;
        this.clear();
        this._keyData = state || [];
        if (running) {
            this.start();
        }
    };

    /**
     * Starts the timer. This is not done automatically when setting up the constructor
     * so you would be able to set the handlers before anything is actually expired
     */
    TTL.prototype.start = function() {
        this._running = true;
        this._checkKeys();
    };

    /**
     * Starts the timer. This is not done automatically when setting up the constructor
     * so you would be able to set the handlers before anything is actually expired
     */
    TTL.prototype.clear = function() {
        this._running = false;
        clearTimeout(this._nextTimeout);
        this._keyData = [];
    };

    /**
     * Get remaining TTL time for a key
     *
     * @param {String} key Key name
     * @returns {Number} Remaining time in ms or 0 if key is not found
     */
    TTL.prototype.get = function(key) {
        var i, len;

        for (i = 0, len = this._keyData.length; i < len; i++) {
            if (this._keyData[i][0] === key) {
                return Math.max(this._keyData[i][1] - Date.now(), 0);
            }
        }

        return 0;
    };

    /**
     * Set TTL for a key name. If the ttl value is 0 or negative, ttl is cleared for the key
     *
     * @param {String} key Key name
     * @param {Number} ttl Milliseconds until the key is expired
     */
    TTL.prototype.set = function(key, ttl) {
        var i, len;
        var expires = Date.now() + ttl;
        var updated = false;

        // check and remove existing value
        for (i = 0, len = this._keyData.length; i < len; i++) {
            if (this._keyData[i][0] === key) {
                this._keyData.splice(i, 1);
                updated = true;
                break;
            }
        }

        // do not process if ttl is zero or negative, just drop the value
        if (ttl <= 0) {
            if (updated && !i) {
                // first element was removed, need to set new timer
                this._setTimer();
            }
            if (updated) {
                this._emitUpdated();
            }
            return;
        }

        // empty array, not much to do
        if (!this._keyData.length) {
            this._keyData = [
                [key, expires]
            ];
            this._setTimer();
            this._emitUpdated();
            return;
        }

        // ttl is lower than the first element
        if (this._keyData[0][1] >= expires) {
            this._keyData.unshift([key, expires]);
            this._setTimer();
            this._emitUpdated();
            return;
        }

        // ttl is higher than the last element
        if (this._keyData.length === 1 || this._keyData[this._keyData.length - 1][1] <= expires) {
            this._keyData.push([key, expires]);
            // this is not the first element, so no need to update timer
            this._emitUpdated();
            return;
        }

        // ttl is somewhere between the first and last element
        for (i = 0, len = this._keyData.length; i < len; i++) {
            if (this._keyData[i][1] >= expires) {
                this._keyData.splice(i, 0, [key, expires]);
                // this is not the first element, so no need to update timer
                this._emitUpdated();
                return;
            }
        }
    };

    // PRIVATE METHODS

    /**
     * Find and expire keys that have lower TTL than current time
     */
    TTL.prototype._checkKeys = function() {
        var now = Date.now();
        var expired = [];
        var remove = 0;

        for (var i = 0, len = this._keyData.length; i < len; i++) {
            if (this._keyData[i][1] > now) {
                break;
            }
            remove++;
            this._emitExpired(this._keyData[i][0]);
        }

        if (remove) {
            this._keyData.splice(0, remove);
        }

        this._setTimer();

        if (remove) {
            this._emitUpdated();
        }
    };

    /**
     * Updates next expire check timer
     */
    TTL.prototype._setTimer = function() {
        var that = this;
        var ttl;
        clearTimeout(this._nextTimeout);

        if (!this._keyData.length || !this._running) {
            return;
        }

        ttl = this._keyData[0][1] - Date.now();
        if (ttl <= 0) {
            this._checkKeys();
        } else {
            this._nextTimeout = setTimeout(function() {
                that._checkKeys();
            }, ttl + 10 /* make sure the key ttl falls under the treshold when timer runs */ );
        }
    };

    /**
     * Emits #onexpire for a key. The 'event' is emitted synchronously but if an error is thrown
     * re-throw it outside current event loop. This way you get the error but you do not break current code flow
     *
     * @param {String} key Expired key name
     */
    TTL.prototype._emitExpired = function(key) {
        try {
            this.onexpire(key);
        } catch (E) {
            setTimeout(function() {
                throw (E);
            }, 0);
        }
    };

    /**
     * Emits #onupdate if changes were detected in TTL metainfo. The 'event' is emitted synchronously but if an error is thrown
     * re-throw it outside current event loop. This way you get the error but you do not break current code flow
     *
     * @param {String} key Expired key name
     */
    TTL.prototype._emitUpdated = function() {
        try {
            this.onupdate(this._keyData);
        } catch (E) {
            setTimeout(function() {
                throw (E);
            }, 0);
        }
    };

    return function(data) {
        return new TTL(data);
    };

}));