# permessage-deflate

Provides support for the
[permessage-deflate](https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression)
extension to the WebSocket protocol, as a plugin to the
[websocket-driver](https://github.com/faye/websocket-driver-node) library.


## Installation

```
$ npm install permessage-deflate
```


## Usage

To enable support for the extension on a server-side driver:

```js
var websocket = require('websocket-driver'),
    deflate   = require('permessage-deflate'),
    http      = require('http');

var server = http.createServer();

server.on('upgrade', function(request, socket, body) {
  var driver = websocket.http(request);
  driver.addExtension(deflate);

  // proceed as normal
});
```


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
