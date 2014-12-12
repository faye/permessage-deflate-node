'use strict';

var zlib   = require('zlib'),
    common = require('./common');

var Session = function(options) {
  this._level    = common.fetch(options, 'level',    zlib.Z_DEFAULT_LEVEL);
  this._memLevel = common.fetch(options, 'memLevel', zlib.Z_DEFAULT_MEMLEVEL);
  this._strategy = common.fetch(options, 'strategy', zlib.Z_DEFAULT_STRATEGY);

  this._acceptNoContextTakeover  = common.fetch(options, 'noContextTakeover', false);
  this._acceptMaxWindowBits      = common.fetch(options, 'maxWindowBits', undefined);
  this._requestNoContextTakeover = common.fetch(options, 'requestNoContextTakeover', false);
  this._requestMaxWindowBits     = common.fetch(options, 'requestMaxWindowBits', undefined);
};

Session.prototype.processIncomingMessage = function(message, callback) {
  if (!message.rsv1) return callback(null, message);

  var inflate = this._getInflate(),
      chunks  = [message.data, new Buffer([0x00, 0x00, 0xff, 0xff])],
      self    = this;

  this._processMessage(inflate, chunks, function(error, data) {
    if (!self._inflate && inflate.close) inflate.close();
    if (error) return callback(error, null);
    message.data = data;
    callback(null, message);
  });
};

Session.prototype.processOutgoingMessage = function(message, callback) {
  var deflate = this._getDeflate(),
      self    = this;

  this._processMessage(deflate, [message.data], function(error, data) {
    if (!self._deflate && deflate.close) deflate.close();
    if (error) return callback(error, null);
    message.rsv1 = true;
    message.data = data.slice(0, data.length - 4);
    callback(null, message);
  });
};

Session.prototype.close = function() {
  if (this._inflate && this._inflate.close) this._inflate.close();
  this._inflate = null;

  if (this._deflate && this._deflate.close) this._deflate.close();
  this._deflate = null;
};

Session.prototype._getInflate = function() {
  if (this._inflate) return this._inflate;
  var inflate = zlib.createInflateRaw({flush: zlib.Z_SYNC_FLUSH, windowBits: this._peerWindowBits});
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

Session.prototype._processMessage = function(codec, data, callback) {
  var chunks = [],
      length = 0;

  var return_ = function(error, result) {
    return_ = function() {};
    codec.removeListener('data', onData);
    codec.removeListener('error', onError);
    codec = null;
    callback(error, result);
  };

  var onData = function(chunk) {
    chunks.push(chunk);
    length += chunk.length;
  };

  var onError = function(error) {
    return_(error, null);
  };

  codec.on('data', onData);
  codec.on('error', onError);
  data.forEach(function(c) { codec.write(c) });

  codec.flush(function() {
    return_(null, common.concat(chunks, length));
  });
};

module.exports = Session;
