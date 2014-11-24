'use strict';

var util    = require('util'),
    common  = require('./common'),
    Session = require('./session');

var ServerSession = function(driver, params) {
  Session.apply(this, arguments);
  this._params = params;
};
util.inherits(ServerSession, Session);

ServerSession.validParams = function(params) {
  if (!common.validParams(params)) return false;

  if (params.hasOwnProperty('client_max_window_bits')) {
    if (params.client_max_window_bits !== true && common.VALID_WINDOW_BITS.indexOf(params.client_max_window_bits) < 0)
      return false;
  }
  return true;
};

ServerSession.prototype.generateResponse = function() {
  var params = {};

  // https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression#section-8.1.1.1
  if (this._params.server_no_context_takeover)
    params.server_no_context_takeover = true;

  // https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression#section-8.1.1.2
  if (this._params.client_no_context_takeover)
    params.client_no_context_takeover = true;

  // https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression#section-8.1.2.1
  var serverMax = this._params.server_max_window_bits;
  if (serverMax) {
    params.server_max_window_bits = Math.min(serverMax, common.DEFAULT_MAX_WINDOW_BITS);
  }

  // https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression#section-8.1.2.2
  var clientMax = this._params.client_max_window_bits;
  if (clientMax) {
    if (clientMax === true) clientMax = common.DEFAULT_MAX_WINDOW_BITS;
    params.client_max_window_bits = Math.min(clientMax, common.DEFAULT_MAX_WINDOW_BITS);
  }

  this._ownContextTakeover = !params.server_no_context_takeover;
  this._ownWindowBits = params.server_max_window_bits || common.DEFAULT_MAX_WINDOW_BITS;

  this._peerContextTakeover = !params.client_no_context_takeover;
  this._peerWindowBits = params.client_max_window_bits || common.DEFAULT_MAX_WINDOW_BITS;

  return params;
};

module.exports = ServerSession;
