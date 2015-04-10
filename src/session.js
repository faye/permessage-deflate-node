import zlib from 'zlib';
import { concat } from './common';

export default class Session {
  constructor({ level    = zlib.Z_DEFAULT_LEVEL,
                memLevel = zlib.Z_DEFAULT_MEMLEVEL,
                strategy = zlib.Z_DEFAULT_STRATEGY,

                noContextTakeover = false,
                maxWindowBits,
                requestNoContextTakeover = false,
                requestMaxWindowBits }) {

    this._level    = level;
    this._memLevel = memLevel;
    this._strategy = strategy;

    this._acceptNoContextTakeover  = noContextTakeover;
    this._acceptMaxWindowBits      = maxWindowBits;
    this._requestNoContextTakeover = requestNoContextTakeover;
    this._requestMaxWindowBits     = requestMaxWindowBits;

    this._queueIn  = [];
    this._queueOut = [];
  }

  processIncomingMessage(message, callback) {
    if (!message.rsv1) return callback(null, message);
    if (this._lockIn) return this._queueIn.push([message, callback]);

    let [inflate, chunks, length] = [this._getInflate(), [], 0];
    if (this._inflate) this._lockIn = true;

    let return_ = (error, message) => {
      return_ = () => {};

      inflate.removeListener('data', onData);
      inflate.removeListener('error', onError);
      if (!this._inflate && inflate.close) inflate.close();

      this._lockIn = false;
      let next = this._queueIn.shift();
      if (next) this.processIncomingMessage.apply(this, next);

      callback(error, message);
    };

    let onData = (data) => {
      chunks.push(data);
      length += data.length;
    };

    let onError = (error) => return_(error, null);

    inflate.on('data', onData);
    inflate.on('error', onError);

    inflate.write(message.data);
    inflate.write(new Buffer([0x00, 0x00, 0xff, 0xff]));

    inflate.flush(() => {
      message.data = concat(chunks, length);
      return_(null, message);
    });
  }

  processOutgoingMessage(message, callback) {
    if (this._lockOut) return this._queueOut.push([message, callback]);

    let [deflate, chunks, length] = [this._getDeflate(), [], 0];
    if (this._deflate) this._lockOut = true;

    let return_ = (error, message) => {
      return_ = () => {};

      deflate.removeListener('data', onData);
      deflate.removeListener('error', onError);
      if (!this._deflate && deflate.close) deflate.close();

      this._lockOut = false;
      let next = this._queueOut.shift();
      if (next) this.processOutgoingMessage.apply(this, next);

      callback(error, message);
    };

    let onData = (data) => {
      chunks.push(data);
      length += data.length;
    };

    let onError = (error) => return_(error, null);

    deflate.on('data', onData);
    deflate.on('error', onError);
    deflate.write(message.data);

    let onFlush = () => {
      let data = concat(chunks, length);
      message.data = data.slice(0, data.length - 4);
      message.rsv1 = true;
      return_(null, message);
    };

    if (deflate.params !== undefined)
      deflate.flush(zlib.Z_SYNC_FLUSH, onFlush);
    else
      deflate.flush(onFlush);
  }

  close() {
    if (this._inflate && this._inflate.close) this._inflate.close();
    this._inflate = null;

    if (this._deflate && this._deflate.close) this._deflate.close();
    this._deflate = null;
  }

  _getInflate() {
    if (this._inflate) return this._inflate;
    let inflate = zlib.createInflateRaw({windowBits: this._peerWindowBits});
    if (this._peerContextTakeover) this._inflate = inflate;
    return inflate;
  }

  _getDeflate() {
    if (this._deflate) return this._deflate;

    let deflate = zlib.createDeflateRaw({
      windowBits: this._ownWindowBits,
      level:      this._level,
      memLevel:   this._memLevel,
      strategy:   this._strategy
    });

    let flush = deflate.flush;

    // This monkey-patch is needed to make Node 0.10 produce optimal output.
    // Without this it uses Z_FULL_FLUSH and effectively drops all its context
    // state on every flush.

    if (deflate._flushFlag !== undefined && deflate.params === undefined)
      deflate.flush = function(callback) {
        let ws = this._writableState;
        if (ws.ended || ws.ending || ws.needDrain) {
          flush.call(this, callback);
        } else {
          this._flushFlag = zlib.Z_SYNC_FLUSH;
          this.write(new Buffer(0), '', callback);
        }
      };

    if (this._ownContextTakeover) this._deflate = deflate;
    return deflate;
  }
}
