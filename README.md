# createTTL

Function for creating custom TTL handlers in JavaScript. Set expiration for keys and get notified when a key is expired.

## Usage

Include [ttl.js](ttl.js) in your web page (or load it with AMD).

```html
<script src="ttl.js"></script>
```

For a locasStorage based example, check out [localstorage-ttl.js](localstorage-ttl.js) and [localstorage-ttl.js](localstorage-ttl.html) which bundles this TTL API into a localStorage backed solution.

### Create TTL handler

Create a new TTL handler interface with `createTTL`

```
var ttl = createTTL([seed]);
ttl.start();
```

Where

  * **seed** is the last known state of a previous TTL handler (the state is reveived from the #onupdate notification)

`start()` must be called *after* the ttl object is set up. Do not call it before you set the `onupdate` and `onexpire` handlers, otherwise you might get a race condition where an expiration is detected and emitted before you have set the handlers.

**Example**

```javascript
var lastState = JSON.parse(localStorage.getItem('ttlInfo'));
var ttl = createTTL(lastState);
ttl.start();
```

### Resetting state

If you need to clear the current state and use updated one, use `reset`

```
ttl.reset(state);
```

Where

  * **state** is the last known state of a previous TTL handler

**Example**

```javascript
var ttl = createTTL();
ttl.start();
var state = JSON.parse(localStorage.getItem('ttlInfo'));
ttl.reset(state); // drop existing state and replace it with loaded state
```

### Set TTL for a key

Set the TTL value for a key with `set`

```javascript
ttl.set(key, expire);
```

Where

  * **key** is the name of the key
  * **expire** is the TTL in milliseconds. If this value is 0 or negative, any existing TTL is cleared

**Example**

```javascript
var ttl = createTTL();
ttl.start();
ttl.set('mykey', 1000); // expire in 1 second
```

### Get remaining TTL for a key

Get the TTL value for a key with `get`

```javascript
var remaining = ttl.get(key);
```

Where

  * **key** is the name of the key

**Example**

```javascript
var ttl = createTTL();
ttl.start();
var remaining = ttl.get('mykey');
```

### Get notified about expired key

Get notifications with the `onexpire` method

```
ttl.onexpire = function(key){};
```

Where

  * **key** is the expired key name

**Example**

```javascript
var ttl = createTTL();
ttlhandler.onexpire = function(key){
    // remove expired key from localStorage
    localStorage.removeItem(key);
};
ttl.start();
```

## Get notified about changes in TTL metadata

To be able to continue with TTLs when page is reloaded, you should store the TTL state if anything changes.

```
ttl.onupdate = function(state){};
```

Where

  * **state** is the updated state of the TTL handler

**example**

```javascript
var ttl = createTTL();
ttlhandler.onexpire = function(state){
    // Store serialized state data to localStorage
    localStorage.setItem('ttlInfo', JSON.stringify(state));
};
ttl.start();
```

## License

**MIT**