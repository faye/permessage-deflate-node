import Session from './session';
import * as common from './common';

export default class ServerSession extends Session {
  constructor(options, params) {
    super(options);
    this._params = params;
  }

  static validParams(params) {
    if (!common.validParams(params)) return false;

    if (params.hasOwnProperty('client_max_window_bits')) {
      if ([true].concat(common.VALID_WINDOW_BITS).indexOf(params.client_max_window_bits) < 0)
        return false;
    }
    return true;
  }

  generateResponse() {
    let params = {};

    // https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression#section-8.1.1.1
    if (this._acceptNoContextTakeover || this._params.server_no_context_takeover)
      params.server_no_context_takeover = true;

    // https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression#section-8.1.1.2
    if (this._requestNoContextTakeover || this._params.client_no_context_takeover)
      params.client_no_context_takeover = true;

    // https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression#section-8.1.2.1
    let acceptMax, serverMax;
    if (this._acceptMaxWindowBits || this._params.server_max_window_bits) {
      acceptMax = this._acceptMaxWindowBits || common.DEFAULT_MAX_WINDOW_BITS;
      serverMax = this._params.server_max_window_bits || common.DEFAULT_MAX_WINDOW_BITS;
      params.server_max_window_bits = Math.min(acceptMax, serverMax);
    }

    // https://tools.ietf.org/html/draft-ietf-hybi-permessage-compression#section-8.1.2.2
    let clientMax = this._params.client_max_window_bits, requestMax;
    if (clientMax) {
      if (clientMax === true) {
        if (this._requestMaxWindowBits) params.client_max_window_bits = this._requestMaxWindowBits;
      } else {
        requestMax = this._requestMaxWindowBits || common.DEFAULT_MAX_WINDOW_BITS;
        params.client_max_window_bits = Math.min(requestMax, clientMax);
      }
    }

    this._ownContextTakeover = !params.server_no_context_takeover;
    this._ownWindowBits = params.server_max_window_bits || common.DEFAULT_MAX_WINDOW_BITS;

    this._peerContextTakeover = !params.client_no_context_takeover;
    this._peerWindowBits = params.client_max_window_bits || common.DEFAULT_MAX_WINDOW_BITS;

    return params;
  }
}
