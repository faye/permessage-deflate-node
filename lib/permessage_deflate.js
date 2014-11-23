'use strict';

var ServerSession = require('./server_session');

var PermessageDeflate = {
  createServerSession: function(driver, params) {
    if (!ServerSession.validParams(params)) return null;
    return new ServerSession(driver, params);
  },

  name: 'permessage-deflate',
  rsv1: true,
  rsv2: false,
  rsv3: false
};

module.exports = PermessageDeflate;
