'use strict';

var ClientSession = require('./client_session'),
    ServerSession = require('./server_session');

var PermessageDeflate = {
  createClientSession: function(driver) {
    return new ClientSession(driver);
  },

  createServerSession: function(driver, params) {
    if (!ServerSession.validParams(params)) return null;
    return new ServerSession(driver, params);
  },

  name: 'permessage-deflate',
  type: 'permessage',
  rsv1: true,
  rsv2: false,
  rsv3: false
};

module.exports = PermessageDeflate;
