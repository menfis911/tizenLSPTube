if (!global.TextEncoder) global.TextEncoder = require('util').TextEncoder;
if (!global.TextDecoder) global.TextDecoder = require('util').TextDecoder;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// service.js
var service_exports = {};
__export(service_exports, {
  createClient: () => createClient,
  handle: () => handle,
  makeHandler: () => makeHandler
});
module.exports = __toCommonJS(service_exports);

// client.js
var import_crypto = __toESM(require("crypto"));

// vendor/config.ts
var config_default = {
  host: "api.browser.yandex.ru",
  hostWorker: "vot-worker.toil.cc",
  mediaProxy: "media-proxy.toil.cc",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 YaBrowser/26.10.0.0 Safari/537.36",
  componentVersion: "26.10.0.1854",
  chromiumRevision: "1854",
  hmac: "bt8xH3VOlb4mqf0nqAibnDOoiPlXsisf",
  defaultDuration: 310,
  minChunkSize: 5295308,
  loggerLevel: 1,
  version: "3.2.1"
};

// node_modules/@bufbuild/protobuf/dist/esm/wire/varint.js
function varint64read() {
  let lowBits = 0;
  let highBits = 0;
  for (let shift = 0; shift < 28; shift += 7) {
    let b = this.buf[this.pos++];
    lowBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  let middleByte = this.buf[this.pos++];
  lowBits |= (middleByte & 15) << 28;
  highBits = (middleByte & 112) >> 4;
  if ((middleByte & 128) == 0) {
    this.assertBounds();
    return [lowBits, highBits];
  }
  for (let shift = 3; shift <= 31; shift += 7) {
    let b = this.buf[this.pos++];
    highBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  throw new Error("invalid varint");
}
function varint64write(lo, hi, bytes) {
  for (let i = 0; i < 28; i = i + 7) {
    const shift = lo >>> i;
    const hasNext = !(shift >>> 7 == 0 && hi == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
  const hasMoreBits = !(hi >> 3 == 0);
  bytes.push((hasMoreBits ? splitBits | 128 : splitBits) & 255);
  if (!hasMoreBits) {
    return;
  }
  for (let i = 3; i < 31; i = i + 7) {
    const shift = hi >>> i;
    const hasNext = !(shift >>> 7 == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  bytes.push(hi >>> 31 & 1);
}
var TWO_PWR_32_DBL = 4294967296;
function int64FromString(dec) {
  const minus = dec[0] === "-";
  if (minus) {
    dec = dec.slice(1);
  }
  const base = 1e6;
  let lowBits = 0;
  let highBits = 0;
  function add1e6digit(begin, end) {
    const digit1e6 = Number(dec.slice(begin, end));
    highBits *= base;
    lowBits = lowBits * base + digit1e6;
    if (lowBits >= TWO_PWR_32_DBL) {
      highBits = highBits + (lowBits / TWO_PWR_32_DBL | 0);
      lowBits = lowBits % TWO_PWR_32_DBL;
    }
  }
  add1e6digit(-24, -18);
  add1e6digit(-18, -12);
  add1e6digit(-12, -6);
  add1e6digit(-6);
  return minus ? negate(lowBits, highBits) : newBits(lowBits, highBits);
}
function int64ToString(lo, hi) {
  let bits = newBits(lo, hi);
  const negative = bits.hi & 2147483648;
  if (negative) {
    bits = negate(bits.lo, bits.hi);
  }
  const result = uInt64ToString(bits.lo, bits.hi);
  return negative ? "-" + result : result;
}
function uInt64ToString(lo, hi) {
  ({ lo, hi } = toUnsigned(lo, hi));
  if (hi <= 2097151) {
    return String(TWO_PWR_32_DBL * hi + lo);
  }
  const low = lo & 16777215;
  const mid = (lo >>> 24 | hi << 8) & 16777215;
  const high = hi >> 16 & 65535;
  let digitA = low + mid * 6777216 + high * 6710656;
  let digitB = mid + high * 8147497;
  let digitC = high * 2;
  const base = 1e7;
  if (digitA >= base) {
    digitB += Math.floor(digitA / base);
    digitA %= base;
  }
  if (digitB >= base) {
    digitC += Math.floor(digitB / base);
    digitB %= base;
  }
  return digitC.toString() + decimalFrom1e7WithLeadingZeros(digitB) + decimalFrom1e7WithLeadingZeros(digitA);
}
function toUnsigned(lo, hi) {
  return { lo: lo >>> 0, hi: hi >>> 0 };
}
function newBits(lo, hi) {
  return { lo: lo | 0, hi: hi | 0 };
}
function negate(lowBits, highBits) {
  highBits = ~highBits;
  if (lowBits) {
    lowBits = ~lowBits + 1;
  } else {
    highBits += 1;
  }
  return newBits(lowBits, highBits);
}
var decimalFrom1e7WithLeadingZeros = (digit1e7) => {
  const partial = String(digit1e7);
  return "0000000".slice(partial.length) + partial;
};
function varint32write(value, bytes) {
  if (value >= 0) {
    while (value > 127) {
      bytes.push(value & 127 | 128);
      value = value >>> 7;
    }
    bytes.push(value);
  } else {
    for (let i = 0; i < 9; i++) {
      bytes.push(value & 127 | 128);
      value = value >> 7;
    }
    bytes.push(1);
  }
}
function varint32read() {
  let b = this.buf[this.pos++];
  let result = b & 127;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 7;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 14;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 21;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 15) << 28;
  for (let readBytes = 5; (b & 128) !== 0 && readBytes < 10; readBytes++)
    b = this.buf[this.pos++];
  if ((b & 128) != 0)
    throw new Error("invalid varint");
  this.assertBounds();
  return result >>> 0;
}

// node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
var protoInt64 = /* @__PURE__ */ makeInt64Support();
function makeInt64Support() {
  const dv = new DataView(new ArrayBuffer(8));
  const ok = typeof BigInt === "function" && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function" && (!!globalThis.Deno || typeof process != "object" || typeof process.env != "object" || process.env.BUF_BIGINT_DISABLE !== "1");
  if (ok) {
    const MIN = BigInt("-9223372036854775808");
    const MAX = BigInt("9223372036854775807");
    const UMIN = BigInt("0");
    const UMAX = BigInt("18446744073709551615");
    return {
      zero: BigInt(0),
      supported: true,
      parse(value) {
        const bi = typeof value == "bigint" ? value : BigInt(value);
        if (bi > MAX || bi < MIN) {
          throw new Error(`invalid int64: ${value}`);
        }
        return bi;
      },
      uParse(value) {
        const bi = typeof value == "bigint" ? value : BigInt(value);
        if (bi > UMAX || bi < UMIN) {
          throw new Error(`invalid uint64: ${value}`);
        }
        return bi;
      },
      enc(value) {
        dv.setBigInt64(0, this.parse(value), true);
        return {
          lo: dv.getInt32(0, true),
          hi: dv.getInt32(4, true)
        };
      },
      uEnc(value) {
        dv.setBigInt64(0, this.uParse(value), true);
        return {
          lo: dv.getInt32(0, true),
          hi: dv.getInt32(4, true)
        };
      },
      dec(lo, hi) {
        dv.setInt32(0, lo, true);
        dv.setInt32(4, hi, true);
        return dv.getBigInt64(0, true);
      },
      uDec(lo, hi) {
        dv.setInt32(0, lo, true);
        dv.setInt32(4, hi, true);
        return dv.getBigUint64(0, true);
      }
    };
  }
  return {
    zero: "0",
    supported: false,
    parse(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertInt64String(value);
      return value;
    },
    uParse(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertUInt64String(value);
      return value;
    },
    enc(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertInt64String(value);
      return int64FromString(value);
    },
    uEnc(value) {
      if (typeof value != "string") {
        value = value.toString();
      }
      assertUInt64String(value);
      return int64FromString(value);
    },
    dec(lo, hi) {
      return int64ToString(lo, hi);
    },
    uDec(lo, hi) {
      return uInt64ToString(lo, hi);
    }
  };
}
function assertInt64String(value) {
  if (!/^-?[0-9]+$/.test(value)) {
    throw new Error("invalid int64: " + value);
  }
}
function assertUInt64String(value) {
  if (!/^[0-9]+$/.test(value)) {
    throw new Error("invalid uint64: " + value);
  }
}

// node_modules/@bufbuild/protobuf/dist/esm/wire/text-encoding.js
var symbol = Symbol.for("@bufbuild/protobuf/text-encoding");
function getTextEncoding() {
  if (globalThis[symbol] == void 0) {
    const te = new globalThis.TextEncoder();
    const td = new globalThis.TextDecoder();
    globalThis[symbol] = {
      encodeUtf8(text) {
        return te.encode(text);
      },
      decodeUtf8(bytes) {
        return td.decode(bytes);
      },
      checkUtf8(text) {
        try {
          encodeURIComponent(text);
          return true;
        } catch (_) {
          return false;
        }
      }
    };
  }
  return globalThis[symbol];
}

// node_modules/@bufbuild/protobuf/dist/esm/wire/binary-encoding.js
var WireType;
(function(WireType2) {
  WireType2[WireType2["Varint"] = 0] = "Varint";
  WireType2[WireType2["Bit64"] = 1] = "Bit64";
  WireType2[WireType2["LengthDelimited"] = 2] = "LengthDelimited";
  WireType2[WireType2["StartGroup"] = 3] = "StartGroup";
  WireType2[WireType2["EndGroup"] = 4] = "EndGroup";
  WireType2[WireType2["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));
var FLOAT32_MAX = 34028234663852886e22;
var FLOAT32_MIN = -34028234663852886e22;
var UINT32_MAX = 4294967295;
var INT32_MAX = 2147483647;
var INT32_MIN = -2147483648;
var BinaryWriter = class {
  constructor(encodeUtf8 = getTextEncoding().encodeUtf8) {
    this.encodeUtf8 = encodeUtf8;
    this.stack = [];
    this.chunks = [];
    this.buf = [];
  }
  /**
   * Return all bytes written and reset this writer.
   */
  finish() {
    if (this.buf.length) {
      this.chunks.push(new Uint8Array(this.buf));
      this.buf = [];
    }
    let len = 0;
    for (let i = 0; i < this.chunks.length; i++)
      len += this.chunks[i].length;
    let bytes = new Uint8Array(len);
    let offset = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      bytes.set(this.chunks[i], offset);
      offset += this.chunks[i].length;
    }
    this.chunks = [];
    return bytes;
  }
  /**
   * Start a new fork for length-delimited data like a message
   * or a packed repeated field.
   *
   * Must be joined later with `join()`.
   */
  fork() {
    this.stack.push({ chunks: this.chunks, buf: this.buf });
    this.chunks = [];
    this.buf = [];
    return this;
  }
  /**
   * Join the last fork. Write its length and bytes, then
   * return to the previous state.
   */
  join() {
    let chunk = this.finish();
    let prev = this.stack.pop();
    if (!prev)
      throw new Error("invalid state, fork stack empty");
    this.chunks = prev.chunks;
    this.buf = prev.buf;
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  /**
   * Writes a tag (field number and wire type).
   *
   * Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
   *
   * Generated code should compute the tag ahead of time and call `uint32()`.
   */
  tag(fieldNo, type) {
    return this.uint32((fieldNo << 3 | type) >>> 0);
  }
  /**
   * Write a chunk of raw bytes.
   */
  raw(chunk) {
    if (this.buf.length) {
      this.chunks.push(new Uint8Array(this.buf));
      this.buf = [];
    }
    this.chunks.push(chunk);
    return this;
  }
  /**
   * Write a `uint32` value, an unsigned 32 bit varint.
   */
  uint32(value) {
    assertUInt32(value);
    while (value > 127) {
      this.buf.push(value & 127 | 128);
      value = value >>> 7;
    }
    this.buf.push(value);
    return this;
  }
  /**
   * Write a `int32` value, a signed 32 bit varint.
   */
  int32(value) {
    assertInt32(value);
    varint32write(value, this.buf);
    return this;
  }
  /**
   * Write a `bool` value, a variant.
   */
  bool(value) {
    this.buf.push(value ? 1 : 0);
    return this;
  }
  /**
   * Write a `bytes` value, length-delimited arbitrary data.
   */
  bytes(value) {
    this.uint32(value.byteLength);
    return this.raw(value);
  }
  /**
   * Write a `string` value, length-delimited data converted to UTF-8 text.
   */
  string(value) {
    let chunk = this.encodeUtf8(value);
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  /**
   * Write a `float` value, 32-bit floating point number.
   */
  float(value) {
    assertFloat32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setFloat32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `double` value, a 64-bit floating point number.
   */
  double(value) {
    let chunk = new Uint8Array(8);
    new DataView(chunk.buffer).setFloat64(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
   */
  fixed32(value) {
    assertUInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setUint32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
   */
  sfixed32(value) {
    assertInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setInt32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
   */
  sint32(value) {
    assertInt32(value);
    value = (value << 1 ^ value >> 31) >>> 0;
    varint32write(value, this.buf);
    return this;
  }
  /**
   * Write a `fixed64` value, a signed, fixed-length 64-bit integer.
   */
  sfixed64(value) {
    let chunk = new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.enc(value);
    view.setInt32(0, tc.lo, true);
    view.setInt32(4, tc.hi, true);
    return this.raw(chunk);
  }
  /**
   * Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
   */
  fixed64(value) {
    let chunk = new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.uEnc(value);
    view.setInt32(0, tc.lo, true);
    view.setInt32(4, tc.hi, true);
    return this.raw(chunk);
  }
  /**
   * Write a `int64` value, a signed 64-bit varint.
   */
  int64(value) {
    let tc = protoInt64.enc(value);
    varint64write(tc.lo, tc.hi, this.buf);
    return this;
  }
  /**
   * Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64(value) {
    const tc = protoInt64.enc(value), sign = tc.hi >> 31, lo = tc.lo << 1 ^ sign, hi = (tc.hi << 1 | tc.lo >>> 31) ^ sign;
    varint64write(lo, hi, this.buf);
    return this;
  }
  /**
   * Write a `uint64` value, an unsigned 64-bit varint.
   */
  uint64(value) {
    const tc = protoInt64.uEnc(value);
    varint64write(tc.lo, tc.hi, this.buf);
    return this;
  }
};
var BinaryReader = class {
  constructor(buf, decodeUtf8 = getTextEncoding().decodeUtf8) {
    this.decodeUtf8 = decodeUtf8;
    this.varint64 = varint64read;
    this.uint32 = varint32read;
    this.buf = buf;
    this.len = buf.length;
    this.pos = 0;
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  /**
   * Reads a tag - field number and wire type.
   */
  tag() {
    let tag = this.uint32(), fieldNo = tag >>> 3, wireType = tag & 7;
    if (fieldNo <= 0 || wireType < 0 || wireType > 5)
      throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
    return [fieldNo, wireType];
  }
  /**
   * Skip one element and return the skipped data.
   *
   * When skipping StartGroup, provide the tags field number to check for
   * matching field number in the EndGroup tag.
   */
  skip(wireType, fieldNo) {
    let start = this.pos;
    switch (wireType) {
      case WireType.Varint:
        while (this.buf[this.pos++] & 128) {
        }
        break;
      // @ts-ignore TS7029: Fallthrough case in switch -- ignore instead of expect-error for compiler settings without noFallthroughCasesInSwitch: true
      case WireType.Bit64:
        this.pos += 4;
      case WireType.Bit32:
        this.pos += 4;
        break;
      case WireType.LengthDelimited:
        let len = this.uint32();
        this.pos += len;
        break;
      case WireType.StartGroup:
        for (; ; ) {
          const [fn, wt] = this.tag();
          if (wt === WireType.EndGroup) {
            if (fieldNo !== void 0 && fn !== fieldNo) {
              throw new Error("invalid end group tag");
            }
            break;
          }
          this.skip(wt, fn);
        }
        break;
      default:
        throw new Error("cant skip wire type " + wireType);
    }
    this.assertBounds();
    return this.buf.subarray(start, this.pos);
  }
  /**
   * Throws error if position in byte array is out of range.
   */
  assertBounds() {
    if (this.pos > this.len)
      throw new RangeError("premature EOF");
  }
  /**
   * Read a `int32` field, a signed 32 bit varint.
   */
  int32() {
    return this.uint32() | 0;
  }
  /**
   * Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
   */
  sint32() {
    let zze = this.uint32();
    return zze >>> 1 ^ -(zze & 1);
  }
  /**
   * Read a `int64` field, a signed 64-bit varint.
   */
  int64() {
    return protoInt64.dec(...this.varint64());
  }
  /**
   * Read a `uint64` field, an unsigned 64-bit varint.
   */
  uint64() {
    return protoInt64.uDec(...this.varint64());
  }
  /**
   * Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64() {
    let [lo, hi] = this.varint64();
    let s = -(lo & 1);
    lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
    hi = hi >>> 1 ^ s;
    return protoInt64.dec(lo, hi);
  }
  /**
   * Read a `bool` field, a variant.
   */
  bool() {
    let [lo, hi] = this.varint64();
    return lo !== 0 || hi !== 0;
  }
  /**
   * Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
   */
  fixed32() {
    return this.view.getUint32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
   */
  sfixed32() {
    return this.view.getInt32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
   */
  fixed64() {
    return protoInt64.uDec(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `fixed64` field, a signed, fixed-length 64-bit integer.
   */
  sfixed64() {
    return protoInt64.dec(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `float` field, 32-bit floating point number.
   */
  float() {
    return this.view.getFloat32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `double` field, a 64-bit floating point number.
   */
  double() {
    return this.view.getFloat64((this.pos += 8) - 8, true);
  }
  /**
   * Read a `bytes` field, length-delimited arbitrary data.
   */
  bytes() {
    let len = this.uint32(), start = this.pos;
    this.pos += len;
    this.assertBounds();
    return this.buf.subarray(start, start + len);
  }
  /**
   * Read a `string` field, length-delimited data converted to UTF-8 text.
   */
  string() {
    return this.decodeUtf8(this.bytes());
  }
};
function assertInt32(arg) {
  if (typeof arg == "string") {
    arg = Number(arg);
  } else if (typeof arg != "number") {
    throw new Error("invalid int32: " + typeof arg);
  }
  if (!Number.isInteger(arg) || arg > INT32_MAX || arg < INT32_MIN)
    throw new Error("invalid int32: " + arg);
}
function assertUInt32(arg) {
  if (typeof arg == "string") {
    arg = Number(arg);
  } else if (typeof arg != "number") {
    throw new Error("invalid uint32: " + typeof arg);
  }
  if (!Number.isInteger(arg) || arg > UINT32_MAX || arg < 0)
    throw new Error("invalid uint32: " + arg);
}
function assertFloat32(arg) {
  if (typeof arg == "string") {
    const o = arg;
    arg = Number(arg);
    if (Number.isNaN(arg) && o !== "NaN") {
      throw new Error("invalid float32: " + o);
    }
  } else if (typeof arg != "number") {
    throw new Error("invalid float32: " + typeof arg);
  }
  if (Number.isFinite(arg) && (arg > FLOAT32_MAX || arg < FLOAT32_MIN))
    throw new Error("invalid float32: " + arg);
}

// vendor/yandex.ts
function createBaseVideoTranslationHelpObject() {
  return { target: "", targetUrl: "" };
}
var VideoTranslationHelpObject = {
  encode(message, writer = new BinaryWriter()) {
    if (message.target !== "") {
      writer.uint32(10).string(message.target);
    }
    if (message.targetUrl !== "") {
      writer.uint32(18).string(message.targetUrl);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBaseVideoTranslationHelpObject();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }
          message.target = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }
          message.targetUrl = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      target: isSet(object.target) ? globalThis.String(object.target) : "",
      targetUrl: isSet(object.targetUrl) ? globalThis.String(object.targetUrl) : ""
    };
  },
  toJSON(message) {
    const obj = {};
    if (message.target !== "") {
      obj.target = message.target;
    }
    if (message.targetUrl !== "") {
      obj.targetUrl = message.targetUrl;
    }
    return obj;
  },
  create(base) {
    return VideoTranslationHelpObject.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b;
    const message = createBaseVideoTranslationHelpObject();
    message.target = (_a = object.target) != null ? _a : "";
    message.targetUrl = (_b = object.targetUrl) != null ? _b : "";
    return message;
  }
};
function createBaseVideoTranslationRequest() {
  return {
    url: "",
    deviceId: void 0,
    firstRequest: false,
    duration: 0,
    unknown0: false,
    language: "",
    forceSourceLang: false,
    unknown1: false,
    translationHelp: [],
    wasStream: false,
    responseLanguage: "",
    unknown2: false,
    configVersion: 0,
    bypassCache: false,
    useLivelyVoice: false,
    videoTitle: ""
  };
}
var VideoTranslationRequest = {
  encode(message, writer = new BinaryWriter()) {
    if (message.url !== "") {
      writer.uint32(26).string(message.url);
    }
    if (message.deviceId !== void 0) {
      writer.uint32(34).string(message.deviceId);
    }
    if (message.firstRequest !== false) {
      writer.uint32(40).bool(message.firstRequest);
    }
    if (message.duration !== 0) {
      writer.uint32(49).double(message.duration);
    }
    if (message.unknown0 !== false) {
      writer.uint32(56).bool(message.unknown0);
    }
    if (message.language !== "") {
      writer.uint32(66).string(message.language);
    }
    if (message.forceSourceLang !== false) {
      writer.uint32(72).bool(message.forceSourceLang);
    }
    if (message.unknown1 !== false) {
      writer.uint32(80).bool(message.unknown1);
    }
    for (const v of message.translationHelp) {
      VideoTranslationHelpObject.encode(v, writer.uint32(90).fork()).join();
    }
    if (message.wasStream !== false) {
      writer.uint32(104).bool(message.wasStream);
    }
    if (message.responseLanguage !== "") {
      writer.uint32(114).string(message.responseLanguage);
    }
    if (message.unknown2 !== false) {
      writer.uint32(120).bool(message.unknown2);
    }
    if (message.configVersion !== 0) {
      writer.uint32(128).int32(message.configVersion);
    }
    if (message.bypassCache !== false) {
      writer.uint32(136).bool(message.bypassCache);
    }
    if (message.useLivelyVoice !== false) {
      writer.uint32(144).bool(message.useLivelyVoice);
    }
    if (message.videoTitle !== "") {
      writer.uint32(154).string(message.videoTitle);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBaseVideoTranslationRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 3: {
          if (tag !== 26) {
            break;
          }
          message.url = reader.string();
          continue;
        }
        case 4: {
          if (tag !== 34) {
            break;
          }
          message.deviceId = reader.string();
          continue;
        }
        case 5: {
          if (tag !== 40) {
            break;
          }
          message.firstRequest = reader.bool();
          continue;
        }
        case 6: {
          if (tag !== 49) {
            break;
          }
          message.duration = reader.double();
          continue;
        }
        case 7: {
          if (tag !== 56) {
            break;
          }
          message.unknown0 = reader.bool();
          continue;
        }
        case 8: {
          if (tag !== 66) {
            break;
          }
          message.language = reader.string();
          continue;
        }
        case 9: {
          if (tag !== 72) {
            break;
          }
          message.forceSourceLang = reader.bool();
          continue;
        }
        case 10: {
          if (tag !== 80) {
            break;
          }
          message.unknown1 = reader.bool();
          continue;
        }
        case 11: {
          if (tag !== 90) {
            break;
          }
          message.translationHelp.push(VideoTranslationHelpObject.decode(reader, reader.uint32()));
          continue;
        }
        case 13: {
          if (tag !== 104) {
            break;
          }
          message.wasStream = reader.bool();
          continue;
        }
        case 14: {
          if (tag !== 114) {
            break;
          }
          message.responseLanguage = reader.string();
          continue;
        }
        case 15: {
          if (tag !== 120) {
            break;
          }
          message.unknown2 = reader.bool();
          continue;
        }
        case 16: {
          if (tag !== 128) {
            break;
          }
          message.configVersion = reader.int32();
          continue;
        }
        case 17: {
          if (tag !== 136) {
            break;
          }
          message.bypassCache = reader.bool();
          continue;
        }
        case 18: {
          if (tag !== 144) {
            break;
          }
          message.useLivelyVoice = reader.bool();
          continue;
        }
        case 19: {
          if (tag !== 154) {
            break;
          }
          message.videoTitle = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      url: isSet(object.url) ? globalThis.String(object.url) : "",
      deviceId: isSet(object.deviceId) ? globalThis.String(object.deviceId) : void 0,
      firstRequest: isSet(object.firstRequest) ? globalThis.Boolean(object.firstRequest) : false,
      duration: isSet(object.duration) ? globalThis.Number(object.duration) : 0,
      unknown0: isSet(object.unknown0) ? globalThis.Boolean(object.unknown0) : false,
      language: isSet(object.language) ? globalThis.String(object.language) : "",
      forceSourceLang: isSet(object.forceSourceLang) ? globalThis.Boolean(object.forceSourceLang) : false,
      unknown1: isSet(object.unknown1) ? globalThis.Boolean(object.unknown1) : false,
      translationHelp: globalThis.Array.isArray(object == null ? void 0 : object.translationHelp) ? object.translationHelp.map((e) => VideoTranslationHelpObject.fromJSON(e)) : [],
      wasStream: isSet(object.wasStream) ? globalThis.Boolean(object.wasStream) : false,
      responseLanguage: isSet(object.responseLanguage) ? globalThis.String(object.responseLanguage) : "",
      unknown2: isSet(object.unknown2) ? globalThis.Boolean(object.unknown2) : false,
      configVersion: isSet(object.configVersion) ? globalThis.Number(object.configVersion) : 0,
      bypassCache: isSet(object.bypassCache) ? globalThis.Boolean(object.bypassCache) : false,
      useLivelyVoice: isSet(object.useLivelyVoice) ? globalThis.Boolean(object.useLivelyVoice) : false,
      videoTitle: isSet(object.videoTitle) ? globalThis.String(object.videoTitle) : ""
    };
  },
  toJSON(message) {
    var _a;
    const obj = {};
    if (message.url !== "") {
      obj.url = message.url;
    }
    if (message.deviceId !== void 0) {
      obj.deviceId = message.deviceId;
    }
    if (message.firstRequest !== false) {
      obj.firstRequest = message.firstRequest;
    }
    if (message.duration !== 0) {
      obj.duration = message.duration;
    }
    if (message.unknown0 !== false) {
      obj.unknown0 = message.unknown0;
    }
    if (message.language !== "") {
      obj.language = message.language;
    }
    if (message.forceSourceLang !== false) {
      obj.forceSourceLang = message.forceSourceLang;
    }
    if (message.unknown1 !== false) {
      obj.unknown1 = message.unknown1;
    }
    if ((_a = message.translationHelp) == null ? void 0 : _a.length) {
      obj.translationHelp = message.translationHelp.map((e) => VideoTranslationHelpObject.toJSON(e));
    }
    if (message.wasStream !== false) {
      obj.wasStream = message.wasStream;
    }
    if (message.responseLanguage !== "") {
      obj.responseLanguage = message.responseLanguage;
    }
    if (message.unknown2 !== false) {
      obj.unknown2 = message.unknown2;
    }
    if (message.configVersion !== 0) {
      obj.configVersion = Math.round(message.configVersion);
    }
    if (message.bypassCache !== false) {
      obj.bypassCache = message.bypassCache;
    }
    if (message.useLivelyVoice !== false) {
      obj.useLivelyVoice = message.useLivelyVoice;
    }
    if (message.videoTitle !== "") {
      obj.videoTitle = message.videoTitle;
    }
    return obj;
  },
  create(base) {
    return VideoTranslationRequest.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    const message = createBaseVideoTranslationRequest();
    message.url = (_a = object.url) != null ? _a : "";
    message.deviceId = (_b = object.deviceId) != null ? _b : void 0;
    message.firstRequest = (_c = object.firstRequest) != null ? _c : false;
    message.duration = (_d = object.duration) != null ? _d : 0;
    message.unknown0 = (_e = object.unknown0) != null ? _e : false;
    message.language = (_f = object.language) != null ? _f : "";
    message.forceSourceLang = (_g = object.forceSourceLang) != null ? _g : false;
    message.unknown1 = (_h = object.unknown1) != null ? _h : false;
    message.translationHelp = ((_i = object.translationHelp) == null ? void 0 : _i.map((e) => VideoTranslationHelpObject.fromPartial(e))) || [];
    message.wasStream = (_j = object.wasStream) != null ? _j : false;
    message.responseLanguage = (_k = object.responseLanguage) != null ? _k : "";
    message.unknown2 = (_l = object.unknown2) != null ? _l : false;
    message.configVersion = (_m = object.configVersion) != null ? _m : 0;
    message.bypassCache = (_n = object.bypassCache) != null ? _n : false;
    message.useLivelyVoice = (_o = object.useLivelyVoice) != null ? _o : false;
    message.videoTitle = (_p = object.videoTitle) != null ? _p : "";
    return message;
  }
};
function createBaseVideoTranslationResponse() {
  return {
    url: void 0,
    duration: void 0,
    status: 0,
    remainingTime: void 0,
    unknown0: void 0,
    translationId: "",
    language: void 0,
    message: void 0,
    isLivelyVoice: false,
    allowToTranslateVideo: void 0,
    shouldRetry: void 0,
    unknown3: void 0
  };
}
var VideoTranslationResponse = {
  encode(message, writer = new BinaryWriter()) {
    if (message.url !== void 0) {
      writer.uint32(10).string(message.url);
    }
    if (message.duration !== void 0) {
      writer.uint32(17).double(message.duration);
    }
    if (message.status !== 0) {
      writer.uint32(32).int32(message.status);
    }
    if (message.remainingTime !== void 0) {
      writer.uint32(40).int32(message.remainingTime);
    }
    if (message.unknown0 !== void 0) {
      writer.uint32(48).int32(message.unknown0);
    }
    if (message.translationId !== "") {
      writer.uint32(58).string(message.translationId);
    }
    if (message.language !== void 0) {
      writer.uint32(66).string(message.language);
    }
    if (message.message !== void 0) {
      writer.uint32(74).string(message.message);
    }
    if (message.isLivelyVoice !== false) {
      writer.uint32(80).bool(message.isLivelyVoice);
    }
    if (message.allowToTranslateVideo !== void 0) {
      writer.uint32(88).bool(message.allowToTranslateVideo);
    }
    if (message.shouldRetry !== void 0) {
      writer.uint32(96).int32(message.shouldRetry);
    }
    if (message.unknown3 !== void 0) {
      writer.uint32(104).int32(message.unknown3);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBaseVideoTranslationResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }
          message.url = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 17) {
            break;
          }
          message.duration = reader.double();
          continue;
        }
        case 4: {
          if (tag !== 32) {
            break;
          }
          message.status = reader.int32();
          continue;
        }
        case 5: {
          if (tag !== 40) {
            break;
          }
          message.remainingTime = reader.int32();
          continue;
        }
        case 6: {
          if (tag !== 48) {
            break;
          }
          message.unknown0 = reader.int32();
          continue;
        }
        case 7: {
          if (tag !== 58) {
            break;
          }
          message.translationId = reader.string();
          continue;
        }
        case 8: {
          if (tag !== 66) {
            break;
          }
          message.language = reader.string();
          continue;
        }
        case 9: {
          if (tag !== 74) {
            break;
          }
          message.message = reader.string();
          continue;
        }
        case 10: {
          if (tag !== 80) {
            break;
          }
          message.isLivelyVoice = reader.bool();
          continue;
        }
        case 11: {
          if (tag !== 88) {
            break;
          }
          message.allowToTranslateVideo = reader.bool();
          continue;
        }
        case 12: {
          if (tag !== 96) {
            break;
          }
          message.shouldRetry = reader.int32();
          continue;
        }
        case 13: {
          if (tag !== 104) {
            break;
          }
          message.unknown3 = reader.int32();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      url: isSet(object.url) ? globalThis.String(object.url) : void 0,
      duration: isSet(object.duration) ? globalThis.Number(object.duration) : void 0,
      status: isSet(object.status) ? globalThis.Number(object.status) : 0,
      remainingTime: isSet(object.remainingTime) ? globalThis.Number(object.remainingTime) : void 0,
      unknown0: isSet(object.unknown0) ? globalThis.Number(object.unknown0) : void 0,
      translationId: isSet(object.translationId) ? globalThis.String(object.translationId) : "",
      language: isSet(object.language) ? globalThis.String(object.language) : void 0,
      message: isSet(object.message) ? globalThis.String(object.message) : void 0,
      isLivelyVoice: isSet(object.isLivelyVoice) ? globalThis.Boolean(object.isLivelyVoice) : false,
      allowToTranslateVideo: isSet(object.allowToTranslateVideo) ? globalThis.Boolean(object.allowToTranslateVideo) : void 0,
      shouldRetry: isSet(object.shouldRetry) ? globalThis.Number(object.shouldRetry) : void 0,
      unknown3: isSet(object.unknown3) ? globalThis.Number(object.unknown3) : void 0
    };
  },
  toJSON(message) {
    const obj = {};
    if (message.url !== void 0) {
      obj.url = message.url;
    }
    if (message.duration !== void 0) {
      obj.duration = message.duration;
    }
    if (message.status !== 0) {
      obj.status = Math.round(message.status);
    }
    if (message.remainingTime !== void 0) {
      obj.remainingTime = Math.round(message.remainingTime);
    }
    if (message.unknown0 !== void 0) {
      obj.unknown0 = Math.round(message.unknown0);
    }
    if (message.translationId !== "") {
      obj.translationId = message.translationId;
    }
    if (message.language !== void 0) {
      obj.language = message.language;
    }
    if (message.message !== void 0) {
      obj.message = message.message;
    }
    if (message.isLivelyVoice !== false) {
      obj.isLivelyVoice = message.isLivelyVoice;
    }
    if (message.allowToTranslateVideo !== void 0) {
      obj.allowToTranslateVideo = message.allowToTranslateVideo;
    }
    if (message.shouldRetry !== void 0) {
      obj.shouldRetry = Math.round(message.shouldRetry);
    }
    if (message.unknown3 !== void 0) {
      obj.unknown3 = Math.round(message.unknown3);
    }
    return obj;
  },
  create(base) {
    return VideoTranslationResponse.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const message = createBaseVideoTranslationResponse();
    message.url = (_a = object.url) != null ? _a : void 0;
    message.duration = (_b = object.duration) != null ? _b : void 0;
    message.status = (_c = object.status) != null ? _c : 0;
    message.remainingTime = (_d = object.remainingTime) != null ? _d : void 0;
    message.unknown0 = (_e = object.unknown0) != null ? _e : void 0;
    message.translationId = (_f = object.translationId) != null ? _f : "";
    message.language = (_g = object.language) != null ? _g : void 0;
    message.message = (_h = object.message) != null ? _h : void 0;
    message.isLivelyVoice = (_i = object.isLivelyVoice) != null ? _i : false;
    message.allowToTranslateVideo = (_j = object.allowToTranslateVideo) != null ? _j : void 0;
    message.shouldRetry = (_k = object.shouldRetry) != null ? _k : void 0;
    message.unknown3 = (_l = object.unknown3) != null ? _l : void 0;
    return message;
  }
};
function createBaseAudioBufferObject() {
  return { audioFile: new Uint8Array(0), fileId: "" };
}
var AudioBufferObject = {
  encode(message, writer = new BinaryWriter()) {
    if (message.audioFile.length !== 0) {
      writer.uint32(18).bytes(message.audioFile);
    }
    if (message.fileId !== "") {
      writer.uint32(10).string(message.fileId);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBaseAudioBufferObject();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2: {
          if (tag !== 18) {
            break;
          }
          message.audioFile = reader.bytes();
          continue;
        }
        case 1: {
          if (tag !== 10) {
            break;
          }
          message.fileId = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      audioFile: isSet(object.audioFile) ? bytesFromBase64(object.audioFile) : new Uint8Array(0),
      fileId: isSet(object.fileId) ? globalThis.String(object.fileId) : ""
    };
  },
  toJSON(message) {
    const obj = {};
    if (message.audioFile.length !== 0) {
      obj.audioFile = base64FromBytes(message.audioFile);
    }
    if (message.fileId !== "") {
      obj.fileId = message.fileId;
    }
    return obj;
  },
  create(base) {
    return AudioBufferObject.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b;
    const message = createBaseAudioBufferObject();
    message.audioFile = (_a = object.audioFile) != null ? _a : new Uint8Array(0);
    message.fileId = (_b = object.fileId) != null ? _b : "";
    return message;
  }
};
function createBasePartialAudioBufferObject() {
  return { audioFile: new Uint8Array(0), chunkId: 0 };
}
var PartialAudioBufferObject = {
  encode(message, writer = new BinaryWriter()) {
    if (message.audioFile.length !== 0) {
      writer.uint32(18).bytes(message.audioFile);
    }
    if (message.chunkId !== 0) {
      writer.uint32(8).int32(message.chunkId);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBasePartialAudioBufferObject();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2: {
          if (tag !== 18) {
            break;
          }
          message.audioFile = reader.bytes();
          continue;
        }
        case 1: {
          if (tag !== 8) {
            break;
          }
          message.chunkId = reader.int32();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      audioFile: isSet(object.audioFile) ? bytesFromBase64(object.audioFile) : new Uint8Array(0),
      chunkId: isSet(object.chunkId) ? globalThis.Number(object.chunkId) : 0
    };
  },
  toJSON(message) {
    const obj = {};
    if (message.audioFile.length !== 0) {
      obj.audioFile = base64FromBytes(message.audioFile);
    }
    if (message.chunkId !== 0) {
      obj.chunkId = Math.round(message.chunkId);
    }
    return obj;
  },
  create(base) {
    return PartialAudioBufferObject.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b;
    const message = createBasePartialAudioBufferObject();
    message.audioFile = (_a = object.audioFile) != null ? _a : new Uint8Array(0);
    message.chunkId = (_b = object.chunkId) != null ? _b : 0;
    return message;
  }
};
function createBaseChunkAudioObject() {
  return { audioBuffer: void 0, audioPartsLength: 0, fileId: "", version: 0 };
}
var ChunkAudioObject = {
  encode(message, writer = new BinaryWriter()) {
    if (message.audioBuffer !== void 0) {
      PartialAudioBufferObject.encode(message.audioBuffer, writer.uint32(10).fork()).join();
    }
    if (message.audioPartsLength !== 0) {
      writer.uint32(16).int32(message.audioPartsLength);
    }
    if (message.fileId !== "") {
      writer.uint32(26).string(message.fileId);
    }
    if (message.version !== 0) {
      writer.uint32(32).int32(message.version);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBaseChunkAudioObject();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }
          message.audioBuffer = PartialAudioBufferObject.decode(reader, reader.uint32());
          continue;
        }
        case 2: {
          if (tag !== 16) {
            break;
          }
          message.audioPartsLength = reader.int32();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }
          message.fileId = reader.string();
          continue;
        }
        case 4: {
          if (tag !== 32) {
            break;
          }
          message.version = reader.int32();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      audioBuffer: isSet(object.audioBuffer) ? PartialAudioBufferObject.fromJSON(object.audioBuffer) : void 0,
      audioPartsLength: isSet(object.audioPartsLength) ? globalThis.Number(object.audioPartsLength) : 0,
      fileId: isSet(object.fileId) ? globalThis.String(object.fileId) : "",
      version: isSet(object.version) ? globalThis.Number(object.version) : 0
    };
  },
  toJSON(message) {
    const obj = {};
    if (message.audioBuffer !== void 0) {
      obj.audioBuffer = PartialAudioBufferObject.toJSON(message.audioBuffer);
    }
    if (message.audioPartsLength !== 0) {
      obj.audioPartsLength = Math.round(message.audioPartsLength);
    }
    if (message.fileId !== "") {
      obj.fileId = message.fileId;
    }
    if (message.version !== 0) {
      obj.version = Math.round(message.version);
    }
    return obj;
  },
  create(base) {
    return ChunkAudioObject.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b, _c;
    const message = createBaseChunkAudioObject();
    message.audioBuffer = object.audioBuffer !== void 0 && object.audioBuffer !== null ? PartialAudioBufferObject.fromPartial(object.audioBuffer) : void 0;
    message.audioPartsLength = (_a = object.audioPartsLength) != null ? _a : 0;
    message.fileId = (_b = object.fileId) != null ? _b : "";
    message.version = (_c = object.version) != null ? _c : 0;
    return message;
  }
};
function createBaseVideoTranslationAudioRequest() {
  return { translationId: "", url: "", partialAudioInfo: void 0, audioInfo: void 0 };
}
var VideoTranslationAudioRequest = {
  encode(message, writer = new BinaryWriter()) {
    if (message.translationId !== "") {
      writer.uint32(10).string(message.translationId);
    }
    if (message.url !== "") {
      writer.uint32(18).string(message.url);
    }
    if (message.partialAudioInfo !== void 0) {
      ChunkAudioObject.encode(message.partialAudioInfo, writer.uint32(34).fork()).join();
    }
    if (message.audioInfo !== void 0) {
      AudioBufferObject.encode(message.audioInfo, writer.uint32(50).fork()).join();
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBaseVideoTranslationAudioRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }
          message.translationId = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }
          message.url = reader.string();
          continue;
        }
        case 4: {
          if (tag !== 34) {
            break;
          }
          message.partialAudioInfo = ChunkAudioObject.decode(reader, reader.uint32());
          continue;
        }
        case 6: {
          if (tag !== 50) {
            break;
          }
          message.audioInfo = AudioBufferObject.decode(reader, reader.uint32());
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      translationId: isSet(object.translationId) ? globalThis.String(object.translationId) : "",
      url: isSet(object.url) ? globalThis.String(object.url) : "",
      partialAudioInfo: isSet(object.partialAudioInfo) ? ChunkAudioObject.fromJSON(object.partialAudioInfo) : void 0,
      audioInfo: isSet(object.audioInfo) ? AudioBufferObject.fromJSON(object.audioInfo) : void 0
    };
  },
  toJSON(message) {
    const obj = {};
    if (message.translationId !== "") {
      obj.translationId = message.translationId;
    }
    if (message.url !== "") {
      obj.url = message.url;
    }
    if (message.partialAudioInfo !== void 0) {
      obj.partialAudioInfo = ChunkAudioObject.toJSON(message.partialAudioInfo);
    }
    if (message.audioInfo !== void 0) {
      obj.audioInfo = AudioBufferObject.toJSON(message.audioInfo);
    }
    return obj;
  },
  create(base) {
    return VideoTranslationAudioRequest.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b;
    const message = createBaseVideoTranslationAudioRequest();
    message.translationId = (_a = object.translationId) != null ? _a : "";
    message.url = (_b = object.url) != null ? _b : "";
    message.partialAudioInfo = object.partialAudioInfo !== void 0 && object.partialAudioInfo !== null ? ChunkAudioObject.fromPartial(object.partialAudioInfo) : void 0;
    message.audioInfo = object.audioInfo !== void 0 && object.audioInfo !== null ? AudioBufferObject.fromPartial(object.audioInfo) : void 0;
    return message;
  }
};
function createBaseYandexSessionRequest() {
  return { uuid: "", module: "" };
}
var YandexSessionRequest = {
  encode(message, writer = new BinaryWriter()) {
    if (message.uuid !== "") {
      writer.uint32(10).string(message.uuid);
    }
    if (message.module !== "") {
      writer.uint32(18).string(message.module);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBaseYandexSessionRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }
          message.uuid = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }
          message.module = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      uuid: isSet(object.uuid) ? globalThis.String(object.uuid) : "",
      module: isSet(object.module) ? globalThis.String(object.module) : ""
    };
  },
  toJSON(message) {
    const obj = {};
    if (message.uuid !== "") {
      obj.uuid = message.uuid;
    }
    if (message.module !== "") {
      obj.module = message.module;
    }
    return obj;
  },
  create(base) {
    return YandexSessionRequest.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b;
    const message = createBaseYandexSessionRequest();
    message.uuid = (_a = object.uuid) != null ? _a : "";
    message.module = (_b = object.module) != null ? _b : "";
    return message;
  }
};
function createBaseYandexSessionResponse() {
  return { secretKey: "", expires: 0 };
}
var YandexSessionResponse = {
  encode(message, writer = new BinaryWriter()) {
    if (message.secretKey !== "") {
      writer.uint32(10).string(message.secretKey);
    }
    if (message.expires !== 0) {
      writer.uint32(16).int32(message.expires);
    }
    return writer;
  },
  decode(input, length) {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === void 0 ? reader.len : reader.pos + length;
    const message = createBaseYandexSessionResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }
          message.secretKey = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 16) {
            break;
          }
          message.expires = reader.int32();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },
  fromJSON(object) {
    return {
      secretKey: isSet(object.secretKey) ? globalThis.String(object.secretKey) : "",
      expires: isSet(object.expires) ? globalThis.Number(object.expires) : 0
    };
  },
  toJSON(message) {
    const obj = {};
    if (message.secretKey !== "") {
      obj.secretKey = message.secretKey;
    }
    if (message.expires !== 0) {
      obj.expires = Math.round(message.expires);
    }
    return obj;
  },
  create(base) {
    return YandexSessionResponse.fromPartial(base != null ? base : {});
  },
  fromPartial(object) {
    var _a, _b;
    const message = createBaseYandexSessionResponse();
    message.secretKey = (_a = object.secretKey) != null ? _a : "";
    message.expires = (_b = object.expires) != null ? _b : 0;
    return message;
  }
};
function bytesFromBase64(b64) {
  if (globalThis.Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}
function base64FromBytes(arr) {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}
function isSet(value) {
  return value !== null && value !== void 0;
}

// client.js
function createClient(request2) {
  let session, sessionPromise;
  const sign = (body) => import_crypto.default.createHmac("sha256", config_default.hmac).update(body).digest("hex");
  const headers = {
    "User-Agent": config_default.userAgent,
    Accept: "application/x-protobuf",
    "Content-Type": "application/x-protobuf",
    "Cache-Control": "no-cache"
  };
  async function getSession() {
    if (session && session.until > Date.now()) return session;
    if (!sessionPromise) sessionPromise = (async () => {
      const uuid = import_crypto.default.randomBytes(16).toString("hex").toUpperCase();
      const body = YandexSessionRequest.encode({ uuid, module: "video-translation" }).finish();
      const data = YandexSessionResponse.decode(await request2(
        "/session/create",
        body,
        { ...headers, "Vtrans-Signature": sign(body) }
      ));
      if (!data.secretKey || data.expires <= 0) throw new Error("\u042F\u043D\u0434\u0435\u043A\u0441 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043B \u0441\u0435\u0430\u043D\u0441 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430");
      session = { uuid, secretKey: data.secretKey, until: Date.now() + data.expires * 1e3 - 1e3 };
      return session;
    })().finally(() => {
      sessionPromise = null;
    });
    return sessionPromise;
  }
  async function signed(path, body, method) {
    const s = await getSession();
    const token = s.uuid + ":" + path + ":" + config_default.componentVersion;
    return request2(path, body, {
      ...headers,
      "Vtrans-Signature": sign(body),
      "Sec-Vtrans-Sk": s.secretKey,
      "Sec-Vtrans-Token": sign(token) + ":" + token
    }, method);
  }
  return async function translate(id, duration, language) {
    const url = "https://youtu.be/" + id;
    const body = VideoTranslationRequest.encode({
      url,
      duration,
      language,
      firstRequest: true,
      unknown0: true,
      forceSourceLang: false,
      unknown1: false,
      translationHelp: [],
      wasStream: false,
      responseLanguage: "ru",
      unknown2: true,
      configVersion: 2,
      bypassCache: false,
      useLivelyVoice: false,
      videoTitle: ""
    }).finish();
    let result = VideoTranslationResponse.decode(await signed("/video-translation/translate", body));
    if (result.status === 6) {
      await request2(
        "/video-translation/fail-audio-js",
        Buffer.from(JSON.stringify({ video_url: url })),
        { ...headers, Accept: "application/json", "Content-Type": "application/json" },
        "PUT"
      );
      const audio = VideoTranslationAudioRequest.encode({
        translationId: result.translationId,
        url,
        audioInfo: { audioFile: new Uint8Array(0), fileId: "fallback-empty-audio:video-translation:" + id }
      }).finish();
      await signed("/video-translation/audio", audio, "PUT");
      result = VideoTranslationResponse.decode(await signed("/video-translation/translate", body));
    }
    if (result.status === 7) {
      session = null;
      throw new Error("\u042F\u043D\u0434\u0435\u043A\u0441 \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u0445\u043E\u0434\u0430 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442. \u042D\u0442\u043E\u0442 \u0440\u0435\u0436\u0438\u043C \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F");
    }
    if (![1, 2, 3, 5, 6].includes(result.status)) throw new Error("\u042F\u043D\u0434\u0435\u043A\u0441 \u043D\u0435 \u0441\u043C\u043E\u0433 \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u044D\u0442\u043E \u0432\u0438\u0434\u0435\u043E");
    if (result.status === 1 || result.status === 5) {
      const audio = new URL(result.url || "");
      if (audio.protocol !== "https:" || audio.username || audio.password || audio.port || !/(^|\.)(yandex\.(ru|net|com)|yandexcloud\.net)$/.test(audio.hostname)) {
        throw new Error("\u042F\u043D\u0434\u0435\u043A\u0441 \u0432\u0435\u0440\u043D\u0443\u043B \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u0430\u0443\u0434\u0438\u043E");
      }
    }
    return {
      status: result.status,
      url: result.url || null,
      retryAfter: Math.max(5, Math.min(60, result.remainingTime || 10)),
      partial: result.status === 5
    };
  };
}

// service.js
var https = require("./compat-https.js");
function request(path, body, headers, method = "POST") {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => finish(new Error("\u042F\u043D\u0434\u0435\u043A\u0441 \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u0437\u0430 30 \u0441\u0435\u043A\u0443\u043D\u0434")), 3e4);
    function finish(error, data) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (error) {
        req.abort();
        reject(error);
      } else resolve(data);
    }
    const req = https.request({
      hostname: "api.browser.yandex.ru",
      port: 443,
      path,
      method,
      headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
      rejectUnauthorized: true
    }, (res) => {
      let size = 0;
      const chunks = [];
      res.on("data", (chunk) => {
        size += chunk.length;
        if (size > 1024 * 1024) finish(new Error("\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u043E\u0442\u0432\u0435\u0442 \u042F\u043D\u0434\u0435\u043A\u0441\u0430"));
        else chunks.push(chunk);
      });
      res.on("error", finish);
      res.on("end", () => res.statusCode === 200 ? finish(null, Buffer.concat(chunks)) : finish(new Error("\u042F\u043D\u0434\u0435\u043A\u0441: HTTP " + res.statusCode)));
    });
    req.on("error", finish);
    req.end(Buffer.from(body));
  });
}
function makeHandler(translate = createClient(request)) {
  const jobs = /* @__PURE__ */ new Map();
  return function handle2(req, res) {
    if (!req.url.startsWith("/lsptube/vot")) return false;
    function send(code, data) {
      if (res.destroyed) return;
      res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify(data));
    }
    const url = new URL(req.url, "https://www.youtube.com");
    const id = url.searchParams.get("id"), duration = Number(url.searchParams.get("duration"));
    const language = url.searchParams.get("lang") || "en";
    if (req.method !== "GET" || req.headers["x-lsptube"] !== "1" || url.pathname !== "/lsptube/vot" || !/^[a-zA-Z0-9_-]{11}$/.test(id || "") || !Number.isFinite(duration) || duration <= 0 || duration > 14400 || !/^(en|de|fr|es|it|ja|ko|zh|pt|tr|uk|ru)$/.test(language)) {
      send(400, { error: "\u041D\u0443\u0436\u0435\u043D \u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u0440\u043E\u043B\u0438\u043A YouTube \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C\u044E \u0434\u043E 4 \u0447\u0430\u0441\u043E\u0432" });
      return true;
    }
    const key = id + ":" + duration + ":" + language;
    let job = jobs.get(key);
    for (const [k, value] of jobs) if (value.until < Date.now()) jobs.delete(k);
    if (!job || job.until < Date.now()) {
      if (jobs.size >= 4) {
        send(429, { error: "\u0414\u043E\u0436\u0434\u0438\u0442\u0435\u0441\u044C \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430" });
        return true;
      }
      job = { until: Date.now() + 35e3 };
      job.promise = translate(id, duration, language).then((data) => {
        job.until = Date.now() + Math.max(5e3, data.retryAfter * 1e3);
        return data;
      }).catch((error) => {
        jobs.delete(key);
        throw error;
      });
      jobs.set(key, job);
    }
    job.promise.then((data) => send(200, data), (error) => send(502, { error: error.message }));
    return true;
  };
}
var handle = makeHandler();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createClient,
  handle,
  makeHandler
});
