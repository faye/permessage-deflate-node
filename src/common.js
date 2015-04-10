const  VALID_PARAMS = [
  'server_no_context_takeover',
  'client_no_context_takeover',
  'server_max_window_bits',
  'client_max_window_bits'
];

export const DEFAULT_MAX_WINDOW_BITS = 15;
export const VALID_WINDOW_BITS = [8, 9, 10, 11, 12, 13, 14, 15];

export function concat(buffers, length) {
  let buffer = new Buffer(length),
      offset = 0;

  for (let buf of buffers) {
    buf.copy(buffer, offset);
    offset += buf.length;
  }
  return buffer;
}

export function validateOptions(options, validKeys) {
  for (let key in options) {
    if (validKeys.indexOf(key) < 0)
      throw new Error(`Unrecognized option: ${key}`);
  }
}

export function validParams(params) {
  for (let key of Object.keys(params)) {
    if (VALID_PARAMS.indexOf(key) < 0) return false;
    if (params[key] instanceof Array) return false;
  }
  if (params.hasOwnProperty('server_no_context_takeover')) {
    if (params.server_no_context_takeover !== true) return false;
  }
  if (params.hasOwnProperty('client_no_context_takeover')) {
    if (params.client_no_context_takeover !== true) return false;
  }
  if (params.hasOwnProperty('server_max_window_bits')) {
    if (this.VALID_WINDOW_BITS.indexOf(params.server_max_window_bits) < 0) return false;
  }
  return true;
}
