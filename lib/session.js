var zlib   = require('zlib'),
    common = require('./common');

var Session = function() {};

Session.prototype.validFrameRsv = function(frame) {
  if (common.MESSAGE_OPCODES.indexOf(frame.opcode) >= 0)
    return {rsv1: true, rsv2: false, rsv3: false};
  else
    return {rsv1: false, rsv2: false, rsv3: false};
};

Session.prototype.processIncomingMessage = function(message, callback) {
  if (!message.rsv1) return callback(null, message);

  var inflate = this._getInflate(),
      chunks  = [],
      length  = 0,
      self    = this;

  var return_ = function(error, result) {
    if (!callback) return;
    inflate.removeListener('data', onData);
    inflate.removeListener('error', onError);
    if (!self._inflate) inflate.close();
    inflate = null;
    callback(error, result);
    callback = null;
  };

  var onData = function(chunk) {
    chunks.push(chunk);
    length += chunk.length;
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
  var deflate = this._getDeflate(),
      chunks  = [],
      length  = 0,
      self    = this;

  var return_ = function(error, result) {
    if (!callback) return;
    deflate.removeListener('data', onData);
    deflate.removeListener('error', onError);
    if (!self._deflate) deflate.close();
    deflate = null;
    callback(error, result);
    callback = null;
  };

  var onData = function(chunk) {
    chunks.push(chunk);
    length += chunk.length;
  };

  var onError = function(error) {
    return_(error, null);
  };

  deflate.on('data', onData);
  deflate.on('error', onError);
  deflate.write(message.data);

  deflate.flush(function() {
    var payload = common.concat(chunks, length);
    payload = payload.slice(deflate.headerOffset, payload.length - 4);

    deflate.headerOffset = 0;

    message.rsv1 = true;
    message.data = payload;
    return_(null, message);
  });
};

Session.prototype.close = function() {
  if (this._inflate) this._inflate.close();
  this._inflate = null;

  if (this._deflate) this._deflate.close();
  this._deflate = null;
};

Session.prototype._getInflate = function() {
  if (this._inflate) return this._inflate;

  var inflate = zlib.createInflate({flush: zlib.Z_SYNC_FLUSH, windowBits: this._peerWindowBits});

  if (this._peerContextTakeover) this._inflate = inflate;

  inflate.write(new Buffer([0x78, 0x9c]));
  return inflate;
};

Session.prototype._getDeflate = function() {
  if (this._deflate) return this._deflate;

  var deflate = zlib.createDeflate({flush: zlib.Z_SYNC_FLUSH, windowBits: this._ownWindowBits});

  if (this._ownContextTakeover) this._deflate = deflate;

  deflate.headerOffset = 2;
  return deflate;
};

module.exports = Session;
