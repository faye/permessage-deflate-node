import ClientSession from './client_session';
import ServerSession from './server_session';
import { validateOptions } from './common';

const VALID_OPTIONS = [
  'level',
  'memLevel',
  'strategy',
  'noContextTakeover',
  'maxWindowBits',
  'requestNoContextTakeover',
  'requestMaxWindowBits'
];

const PermessageDeflate = {
  configure(options) {
    validateOptions(options, VALID_OPTIONS);
    let opts = this._options || {};
    for (let key in opts) options[key] = opts[key];
    return Object.create(this, {_options: {value: options}});
  },

  createClientSession() {
    return new ClientSession(this._options || {});
  },

  createServerSession(offers) {
    for (let offer of offers) {
      if (ServerSession.validParams(offer))
        return new ServerSession(this._options || {}, offer);
    }
    return null;
  },

  name: 'permessage-deflate',
  type: 'permessage',
  rsv1: true,
  rsv2: false,
  rsv3: false
};

export default PermessageDeflate;
