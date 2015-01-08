'use strict';

var zlib   = require('zlib'),
    common = require('./common');

var VERSION = process.version.match(/\d+/g).map(function(n) { return parseInt(n, 10) });

var Session = function(options) {
  this._level    = common.fetch(options, 'level',    zlib.Z_DEFAULT_LEVEL);
  this._memLevel = common.fetch(options, 'memLevel', zlib.Z_DEFAULT_MEMLEVEL);
  this._strategy = common.fetch(options, 'strategy', zlib.Z_DEFAULT_STRATEGY);

  this._acceptNoContextTakeover  = common.fetch(options, 'noContextTakeover', false);
  this._acceptMaxWindowBits      = common.fetch(options, 'maxWindowBits', undefined);
  this._requestNoContextTakeover = common.fetch(options, 'requestNoContextTakeover', false);
  this._requestMaxWindowBits     = common.fetch(options, 'requestMaxWindowBits', undefined);

  this._queueIn  = [];
  this._queueOut = [];
};

Session.prototype.processIncomingMessage = function(message, callback) {
  if (!message.rsv1) return callback(null, message);
  if (this._lockIn) return this._queueIn.push([message, callback]);

  var inflate = this._getInflate(),
      chunks  = [],
      length  = 0,
      self    = this;

  if (this._inflate) this._lockIn = true;

  var return_ = function(error, message) {
    return_ = function() {};

    inflate.removeListener('data', onData);
    inflate.removeListener('error', onError);
    if (!self._inflate && inflate.close) inflate.close();

    self._lockIn = false;
    var next = self._queueIn.shift();
    if (next) self.processIncomingMessage.apply(self, next);

    callback(error, message);
  };

  var onData = function(data) {
    chunks.push(data);
    length += data.length;
  };

  var onError = function(error) {
    return_(error, null);
  };

  inflate.on('data', onData);
  inflate.on('error', onError);

  inflate.write(message.data);
  inflate.write(new Buffer([0x00, 0x00, 0xff, 0xff]));

  inflate.flush(function() {
    message.data = common.concat(chunks, length);
    return_(null, message);
  });
};

Session.prototype.processOutgoingMessage = function(message, callback) {
  if (this._lockOut) return this._queueOut.push([message, callback]);

  var deflate = this._getDeflate(),
      chunks  = [],
      length  = 0,
      self    = this;

  if (this._deflate) this._lockOut = true;

  var return_ = function(error, message) {
    return_ = function() {};

    deflate.removeListener('data', onData);
    deflate.removeListener('error', onError);
    if (!self._deflate && deflate.close) deflate.close();

    self._lockOut = false;
    var next = self._queueOut.shift();
    if (next) self.processOutgoingMessage.apply(self, next);

    callback(error, message);
  };

  var onData = function(data) {
    var tail  = data.slice(Math.max(data.length - 4, 0), data.length),
        isEnd = (tail[0] === 0x00 && tail[1] === 0x00 && tail[2] === 0xff && tail[3] === 0xff);

    if (isEnd) data = data.slice(0, data.length - 4);

    chunks.push(data);
    length += data.length;

    if (isEnd) {
      message.rsv1 = true;
      message.data = common.concat(chunks, length);
      return_(null, message);
    }
  };

  var onError = function(error) {
    return_(error, null);
  };

  deflate.on('data', onData);
  deflate.on('error', onError);

  deflate.write(message.data);
  if (VERSION[0] === 0 && VERSION[1] < 10) deflate.flush();
};

Session.prototype.close = function() {
  // If we have a persistent inflate, close it. However, if the persistent
  // inflate is currently being used (eg, we're waiting for the callback from
  // inflate.flush), don't close it; processIncomingMessage will close it when
  // it sees that this._inflate is not set.
  if (this._inflate && this._inflate.close && !this._lockIn) {
    this._inflate.close();
  }
  this._inflate = null;

  if (this._deflate && this._deflate.close && !this._lockOut) {
    this._deflate.close();
  }
  this._deflate = null;
};

Session.prototype._getInflate = function() {
  if (this._inflate) return this._inflate;
  var inflate = zlib.createInflateRaw({windowBits: this._peerWindowBits});
  if (this._peerContextTakeover) this._inflate = inflate;
  return inflate;
};

Session.prototype._getDeflate = function() {
  if (this._deflate) return this._deflate;

  var deflate = zlib.createDeflateRaw({
    flush:      zlib.Z_SYNC_FLUSH,
    windowBits: this._ownWindowBits,
    level:      this._level,
    memLevel:   this._memLevel,
    strategy:   this._strategy
  });
  if (this._ownContextTakeover) this._deflate = deflate;
  return deflate;
};

module.exports = Session;
