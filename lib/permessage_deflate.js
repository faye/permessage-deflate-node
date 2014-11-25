'use strict';

var ClientSession = require('./client_session'),
    ServerSession = require('./server_session');

var PermessageDeflate = {
  createClientSession: function(driver) {
    return new ClientSession(driver);
  },

  createServerSession: function(driver, offers) {
    for (var i = 0, n = offers.length; i < n; i++) {
      if (ServerSession.validParams(offers[i]))
        return new ServerSession(driver, offers[i]);
    }
    return null;
  },

  name: 'permessage-deflate',
  type: 'permessage',
  rsv1: true,
  rsv2: false,
  rsv3: false
};

module.exports = PermessageDeflate;
