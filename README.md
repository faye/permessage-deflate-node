# permessage-deflate [![Build status](https://secure.travis-ci.org/faye/permessage-deflate-node.svg)](http://travis-ci.org/faye/permessage-deflate-node)

Implements the
[permessage-deflate](https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression)
WebSocket protocol extension as a plugin for
[websocket-extensions](https://github.com/faye/websocket-extensions-node).

## Installation

```
$ npm install permessage-deflate
```

## Usage

Add the plugin to your extensions:

```js
var Extensions = require('websocket-extensions'),
    deflate    = require('permessage-deflate');

var exts = new Extensions();
exts.add(deflate);
```

The extension can be configured, for example:

```js
var Extensions = require('websocket-extensions'),
    deflate    = require('permessage-deflate');

deflate = deflate.configure({noContextTakeover: true});

var exts = new Extensions();
exts.add(deflate);
```

Supported options are:

* `noContextTakeover`: if `true`, stops the session reusing a deflate context
  between messages
* `requestNoContextTakeover`: if `true`, makes the session tell the other peer
  not to reuse a deflate context between messages
* `maxWindowBits`: an integer from `8` to `15` inclusive that sets the size of
  the session's sliding window
* `requestMaxWindowBits`: an integer from `8` to `15` inclusive to ask the other
  peer to use to set its sliding window size, if supported

## License

(The MIT License)

Copyright (c) 2014 James Coglan

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the 'Software'), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
