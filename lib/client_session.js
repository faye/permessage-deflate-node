'use strict';

var util    = require('util'),
    common  = require('./common'),
    Session = require('./session');

var ClientSession = function() {
  Session.apply(this, arguments);
};
util.inherits(ClientSession, Session);

ClientSession.validParams = function(params) {
  if (!common.validParams(params)) return false;

  if (params.hasOwnProperty('client_max_window_bits')) {
    if (common.VALID_WINDOW_BITS.indexOf(params.client_max_window_bits) < 0)
      return false;
  }
  return true;
};

ClientSession.prototype.generateOffer = function() {
  return [{client_max_window_bits: true}];
};

ClientSession.prototype.activate = function(params) {
  if (!ClientSession.validParams(params)) return false;

  this._ownContextTakeover = !params.client_no_context_takeover;
  this._ownWindowBits = params.client_max_window_bits || common.DEFAULT_MAX_WINDOW_BITS;

  this._peerContextTakeover = !params.server_no_context_takeover;
  this._peerWindowBits = params.server_max_window_bits || common.DEFAULT_MAX_WINDOW_BITS;

  return true;
};

module.exports = ClientSession;
