const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32_DECODE = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
  P: 15,
  Q: 16,
  R: 17,
  S: 18,
  T: 19,
  U: 20,
  V: 21,
  W: 22,
  X: 23,
  Y: 24,
  Z: 25,
  2: 26,
  3: 27,
  4: 28,
  5: 29,
  6: 30,
  7: 31,
};

const blocks = [0, 0, 0, 0, 0, 0, 0, 0];

function throwInvalidUtf8(position, partial) {
  if (partial.length > 10) partial = "..." + partial.substr(-10);
  const err = new Error(
    "Decoded data is not valid UTF-8. Maybe try base32.decode.asBytes()? Partial data after reading " +
      position +
      " bytes: " +
      partial +
      " <-"
  );
  err.position = position;
  throw err;
}

function toUtf8String(bytes) {
  let str = "",
    i = 0,
    followingChars = 0,
    b,
    c;
  const length = bytes.length;

  while (i < length) {
    b = bytes[i++];
    if (b <= 0x7f) {
      str += String.fromCharCode(b);
      continue;
    } else if (b > 0xbf && b <= 0xdf) {
      c = b & 0x1f;
      followingChars = 1;
    } else if (b <= 0xef) {
      c = b & 0x0f;
      followingChars = 2;
    } else if (b <= 0xf7) {
      c = b & 0x07;
      followingChars = 3;
    } else {
      throwInvalidUtf8(i, str);
    }

    for (let j = 0; j < followingChars; ++j) {
      b = bytes[i++];
      if (b < 0x80 || b > 0xbf) throwInvalidUtf8(i, str);
      c <<= 6;
      c += b & 0x3f;
    }

    if (c >= 0xd800 && c <= 0xdfff) throwInvalidUtf8(i, str);
    if (c > 0x10ffff) throwInvalidUtf8(i, str);

    if (c <= 0xffff) {
      str += String.fromCharCode(c);
    } else {
      c -= 0x10000;
      str += String.fromCharCode((c >> 10) + 0xd800);
      str += String.fromCharCode((c & 0x3ff) + 0xdc00);
    }
  }
  return str;
}

function encodeBytes(bytes) {
  let base32Str = "";
  let v1, v2, v3, v4, v5;
  const length = bytes.length;
  const count = parseInt(length / 5) * 5;

  for (let i = 0; i < count; ) {
    v1 = bytes[i++];
    v2 = bytes[i++];
    v3 = bytes[i++];
    v4 = bytes[i++];
    v5 = bytes[i++];
    base32Str +=
      BASE32_CHARS[v1 >>> 3] +
      BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
      BASE32_CHARS[(v2 >>> 1) & 31] +
      BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
      BASE32_CHARS[((v3 << 1) | (v4 >>> 7)) & 31] +
      BASE32_CHARS[(v4 >>> 2) & 31] +
      BASE32_CHARS[((v4 << 3) | (v5 >>> 5)) & 31] +
      BASE32_CHARS[v5 & 31];
  }

  const remain = length - count;
  if (remain === 1) {
    v1 = bytes[count];
    base32Str += BASE32_CHARS[v1 >>> 3] + BASE32_CHARS[(v1 << 2) & 31] + "======";
  } else if (remain === 2) {
    v1 = bytes[count];
    v2 = bytes[count + 1];
    base32Str +=
      BASE32_CHARS[v1 >>> 3] +
      BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
      BASE32_CHARS[(v2 >>> 1) & 31] +
      BASE32_CHARS[(v2 << 4) & 31] +
      "====";
  } else if (remain === 3) {
    v1 = bytes[count];
    v2 = bytes[count + 1];
    v3 = bytes[count + 2];
    base32Str +=
      BASE32_CHARS[v1 >>> 3] +
      BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
      BASE32_CHARS[(v2 >>> 1) & 31] +
      BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
      BASE32_CHARS[(v3 << 1) & 31] +
      "===";
  } else if (remain === 4) {
    v1 = bytes[count];
    v2 = bytes[count + 1];
    v3 = bytes[count + 2];
    v4 = bytes[count + 3];
    base32Str +=
      BASE32_CHARS[v1 >>> 3] +
      BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
      BASE32_CHARS[(v2 >>> 1) & 31] +
      BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
      BASE32_CHARS[((v3 << 1) | (v4 >>> 7)) & 31] +
      BASE32_CHARS[(v4 >>> 2) & 31] +
      BASE32_CHARS[(v4 << 3) & 31] +
      "=";
  }
  return base32Str;
}

function encodeAscii(str) {
  let base32Str = "";
  let v1, v2, v3, v4, v5;
  const length = str.length;
  const count = parseInt(length / 5) * 5;

  for (let i = 0; i < count; ) {
    v1 = str.charCodeAt(i++);
    v2 = str.charCodeAt(i++);
    v3 = str.charCodeAt(i++);
    v4 = str.charCodeAt(i++);
    v5 = str.charCodeAt(i++);
    base32Str +=
      BASE32_CHARS[v1 >>> 3] +
      BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
      BASE32_CHARS[(v2 >>> 1) & 31] +
      BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
      BASE32_CHARS[((v3 << 1) | (v4 >>> 7)) & 31] +
      BASE32_CHARS[(v4 >>> 2) & 31] +
      BASE32_CHARS[((v4 << 3) | (v5 >>> 5)) & 31] +
      BASE32_CHARS[v5 & 31];
  }

  const remain = length - count;
  if (remain === 1) {
    v1 = str.charCodeAt(count);
    base32Str += BASE32_CHARS[v1 >>> 3] + BASE32_CHARS[(v1 << 2) & 31] + "======";
  } else if (remain === 2) {
    v1 = str.charCodeAt(count);
    v2 = str.charCodeAt(count + 1);
    base32Str +=
      BASE32_CHARS[v1 >>> 3] +
      BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
      BASE32_CHARS[(v2 >>> 1) & 31] +
      BASE32_CHARS[(v2 << 4) & 31] +
      "====";
  } else if (remain === 3) {
    v1 = str.charCodeAt(count);
    v2 = str.charCodeAt(count + 1);
    v3 = str.charCodeAt(count + 2);
    base32Str +=
      BASE32_CHARS[v1 >>> 3] +
      BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
      BASE32_CHARS[(v2 >>> 1) & 31] +
      BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
      BASE32_CHARS[(v3 << 1) & 31] +
      "===";
  } else if (remain === 4) {
    v1 = str.charCodeAt(count);
    v2 = str.charCodeAt(count + 1);
    v3 = str.charCodeAt(count + 2);
    v4 = str.charCodeAt(count + 3);
    base32Str +=
      BASE32_CHARS[v1 >>> 3] +
      BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
      BASE32_CHARS[(v2 >>> 1) & 31] +
      BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
      BASE32_CHARS[((v3 << 1) | (v4 >>> 7)) & 31] +
      BASE32_CHARS[(v4 >>> 2) & 31] +
      BASE32_CHARS[(v4 << 3) & 31] +
      "=";
  }
  return base32Str;
}

function encodeUtf8(str) {
  if (str === "") {
    return "";
  }

  let base32Str = "";
  let v1, v2, v3, v4, v5, code;
  let end = false;
  let i,
    start = 0,
    index = 0;
  let bytes = 0;
  const length = str.length;

  do {
    blocks[0] = blocks[5];
    blocks[1] = blocks[6];
    blocks[2] = blocks[7];
    for (i = start; index < length && i < 5; ++index) {
      code = str.charCodeAt(index);
      if (code < 0x80) {
        blocks[i++] = code;
      } else if (code < 0x800) {
        blocks[i++] = 0xc0 | (code >> 6);
        blocks[i++] = 0x80 | (code & 0x3f);
      } else if (code < 0xd800 || code >= 0xe000) {
        blocks[i++] = 0xe0 | (code >> 12);
        blocks[i++] = 0x80 | ((code >> 6) & 0x3f);
        blocks[i++] = 0x80 | (code & 0x3f);
      } else {
        code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(++index) & 0x3ff));
        blocks[i++] = 0xf0 | (code >> 18);
        blocks[i++] = 0x80 | ((code >> 12) & 0x3f);
        blocks[i++] = 0x80 | ((code >> 6) & 0x3f);
        blocks[i++] = 0x80 | (code & 0x3f);
      }
    }
    bytes += i - start;
    start = i - 5;
    if (index === length) {
      ++index;
    }
    if (index > length && i < 6) {
      end = true;
    }
    v1 = blocks[0];
    if (i > 4) {
      v2 = blocks[1];
      v3 = blocks[2];
      v4 = blocks[3];
      v5 = blocks[4];
      base32Str +=
        BASE32_CHARS[v1 >>> 3] +
        BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
        BASE32_CHARS[(v2 >>> 1) & 31] +
        BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
        BASE32_CHARS[((v3 << 1) | (v4 >>> 7)) & 31] +
        BASE32_CHARS[(v4 >>> 2) & 31] +
        BASE32_CHARS[((v4 << 3) | (v5 >>> 5)) & 31] +
        BASE32_CHARS[v5 & 31];
    } else if (i === 1) {
      base32Str += BASE32_CHARS[v1 >>> 3] + BASE32_CHARS[(v1 << 2) & 31] + "======";
    } else if (i === 2) {
      v2 = blocks[1];
      base32Str +=
        BASE32_CHARS[v1 >>> 3] +
        BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
        BASE32_CHARS[(v2 >>> 1) & 31] +
        BASE32_CHARS[(v2 << 4) & 31] +
        "====";
    } else if (i === 3) {
      v2 = blocks[1];
      v3 = blocks[2];
      base32Str +=
        BASE32_CHARS[v1 >>> 3] +
        BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
        BASE32_CHARS[(v2 >>> 1) & 31] +
        BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
        BASE32_CHARS[(v3 << 1) & 31] +
        "===";
    } else {
      v2 = blocks[1];
      v3 = blocks[2];
      v4 = blocks[3];
      base32Str +=
        BASE32_CHARS[v1 >>> 3] +
        BASE32_CHARS[((v1 << 2) | (v2 >>> 6)) & 31] +
        BASE32_CHARS[(v2 >>> 1) & 31] +
        BASE32_CHARS[((v2 << 4) | (v3 >>> 4)) & 31] +
        BASE32_CHARS[((v3 << 1) | (v4 >>> 7)) & 31] +
        BASE32_CHARS[(v4 >>> 2) & 31] +
        BASE32_CHARS[(v4 << 3) & 31] +
        "=";
    }
  } while (!end);
  return base32Str;
}

function encode(input, asciiOnly) {
  const notString = typeof input !== "string";
  if (notString && input.constructor === ArrayBuffer) {
    input = new Uint8Array(input);
  }
  if (notString) {
    return encodeBytes(input);
  } else if (asciiOnly) {
    return encodeAscii(input);
  } else {
    return encodeUtf8(input);
  }
}

function decode(base32Str, asciiOnly) {
  if (!asciiOnly) {
    return toUtf8String(decodeAsBytes(base32Str));
  }
  if (base32Str === "") {
    return "";
  }
  if (!/^[A-Z2-7=]+$/.test(base32Str)) {
    throw new Error("Invalid base32 characters");
  }

  let v1, v2, v3, v4, v5, v6, v7, v8;
  let str = "";
  let length = base32Str.indexOf("=");
  if (length === -1) {
    length = base32Str.length;
  }
  const count = parseInt(length / 8) * 8;

  for (let i = 0; i < count; ) {
    v1 = BASE32_DECODE[base32Str.charAt(i++)];
    v2 = BASE32_DECODE[base32Str.charAt(i++)];
    v3 = BASE32_DECODE[base32Str.charAt(i++)];
    v4 = BASE32_DECODE[base32Str.charAt(i++)];
    v5 = BASE32_DECODE[base32Str.charAt(i++)];
    v6 = BASE32_DECODE[base32Str.charAt(i++)];
    v7 = BASE32_DECODE[base32Str.charAt(i++)];
    v8 = BASE32_DECODE[base32Str.charAt(i++)];
    str +=
      String.fromCharCode(((v1 << 3) | (v2 >>> 2)) & 255) +
      String.fromCharCode(((v2 << 6) | (v3 << 1) | (v4 >>> 4)) & 255) +
      String.fromCharCode(((v4 << 4) | (v5 >>> 1)) & 255) +
      String.fromCharCode(((v5 << 7) | (v6 << 2) | (v7 >>> 3)) & 255) +
      String.fromCharCode(((v7 << 5) | v8) & 255);
  }

  const remain = length - count;
  if (remain === 2) {
    v1 = BASE32_DECODE[base32Str.charAt(count)];
    v2 = BASE32_DECODE[base32Str.charAt(count + 1)];
    str += String.fromCharCode(((v1 << 3) | (v2 >>> 2)) & 255);
  } else if (remain === 4) {
    v1 = BASE32_DECODE[base32Str.charAt(count)];
    v2 = BASE32_DECODE[base32Str.charAt(count + 1)];
    v3 = BASE32_DECODE[base32Str.charAt(count + 2)];
    v4 = BASE32_DECODE[base32Str.charAt(count + 3)];
    str +=
      String.fromCharCode(((v1 << 3) | (v2 >>> 2)) & 255) +
      String.fromCharCode(((v2 << 6) | (v3 << 1) | (v4 >>> 4)) & 255);
  } else if (remain === 5) {
    v1 = BASE32_DECODE[base32Str.charAt(count)];
    v2 = BASE32_DECODE[base32Str.charAt(count + 1)];
    v3 = BASE32_DECODE[base32Str.charAt(count + 2)];
    v4 = BASE32_DECODE[base32Str.charAt(count + 3)];
    v5 = BASE32_DECODE[base32Str.charAt(count + 4)];
    str +=
      String.fromCharCode(((v1 << 3) | (v2 >>> 2)) & 255) +
      String.fromCharCode(((v2 << 6) | (v3 << 1) | (v4 >>> 4)) & 255) +
      String.fromCharCode(((v4 << 4) | (v5 >>> 1)) & 255);
  } else if (remain === 7) {
    v1 = BASE32_DECODE[base32Str.charAt(count)];
    v2 = BASE32_DECODE[base32Str.charAt(count + 1)];
    v3 = BASE32_DECODE[base32Str.charAt(count + 2)];
    v4 = BASE32_DECODE[base32Str.charAt(count + 3)];
    v5 = BASE32_DECODE[base32Str.charAt(count + 4)];
    v6 = BASE32_DECODE[base32Str.charAt(count + 5)];
    v7 = BASE32_DECODE[base32Str.charAt(count + 6)];
    str +=
      String.fromCharCode(((v1 << 3) | (v2 >>> 2)) & 255) +
      String.fromCharCode(((v2 << 6) | (v3 << 1) | (v4 >>> 4)) & 255) +
      String.fromCharCode(((v4 << 4) | (v5 >>> 1)) & 255) +
      String.fromCharCode(((v5 << 7) | (v6 << 2) | (v7 >>> 3)) & 255);
  }

  return str;
}

function decodeAsBytes(base32Str) {
  if (base32Str === "") {
    return [];
  }
  if (!/^[A-Z2-7=]+$/.test(base32Str)) {
    throw new Error("Invalid base32 characters");
  }
  base32Str = base32Str.replace(/=/g, "");
  const length = base32Str.length;
  const count = parseInt(length / 8) * 8;

  let v1, v2, v3, v4, v5, v6, v7, v8;
  let bytes = [],
    index = 0;

  for (let i = 0; i < count; ) {
    v1 = BASE32_DECODE[base32Str.charAt(i++)];
    v2 = BASE32_DECODE[base32Str.charAt(i++)];
    v3 = BASE32_DECODE[base32Str.charAt(i++)];
    v4 = BASE32_DECODE[base32Str.charAt(i++)];
    v5 = BASE32_DECODE[base32Str.charAt(i++)];
    v6 = BASE32_DECODE[base32Str.charAt(i++)];
    v7 = BASE32_DECODE[base32Str.charAt(i++)];
    v8 = BASE32_DECODE[base32Str.charAt(i++)];
    bytes[index++] = ((v1 << 3) | (v2 >>> 2)) & 255;
    bytes[index++] = ((v2 << 6) | (v3 << 1) | (v4 >>> 4)) & 255;
    bytes[index++] = ((v4 << 4) | (v5 >>> 1)) & 255;
    bytes[index++] = ((v5 << 7) | (v6 << 2) | (v7 >>> 3)) & 255;
    bytes[index++] = ((v7 << 5) | v8) & 255;
  }

  const remain = length - count;
  if (remain === 2) {
    v1 = BASE32_DECODE[base32Str.charAt(count)];
    v2 = BASE32_DECODE[base32Str.charAt(count + 1)];
    bytes[index++] = ((v1 << 3) | (v2 >>> 2)) & 255;
  } else if (remain === 4) {
    v1 = BASE32_DECODE[base32Str.charAt(count)];
    v2 = BASE32_DECODE[base32Str.charAt(count + 1)];
    v3 = BASE32_DECODE[base32Str.charAt(count + 2)];
    v4 = BASE32_DECODE[base32Str.charAt(count + 3)];
    bytes[index++] = ((v1 << 3) | (v2 >>> 2)) & 255;
    bytes[index++] = ((v2 << 6) | (v3 << 1) | (v4 >>> 4)) & 255;
  } else if (remain === 5) {
    v1 = BASE32_DECODE[base32Str.charAt(count)];
    v2 = BASE32_DECODE[base32Str.charAt(count + 1)];
    v3 = BASE32_DECODE[base32Str.charAt(count + 2)];
    v4 = BASE32_DECODE[base32Str.charAt(count + 3)];
    v5 = BASE32_DECODE[base32Str.charAt(count + 4)];
    bytes[index++] = ((v1 << 3) | (v2 >>> 2)) & 255;
    bytes[index++] = ((v2 << 6) | (v3 << 1) | (v4 >>> 4)) & 255;
    bytes[index++] = ((v4 << 4) | (v5 >>> 1)) & 255;
  } else if (remain === 7) {
    v1 = BASE32_DECODE[base32Str.charAt(count)];
    v2 = BASE32_DECODE[base32Str.charAt(count + 1)];
    v3 = BASE32_DECODE[base32Str.charAt(count + 2)];
    v4 = BASE32_DECODE[base32Str.charAt(count + 3)];
    v5 = BASE32_DECODE[base32Str.charAt(count + 4)];
    v6 = BASE32_DECODE[base32Str.charAt(count + 5)];
    v7 = BASE32_DECODE[base32Str.charAt(count + 6)];
    bytes[index++] = ((v1 << 3) | (v2 >>> 2)) & 255;
    bytes[index++] = ((v2 << 6) | (v3 << 1) | (v4 >>> 4)) & 255;
    bytes[index++] = ((v4 << 4) | (v5 >>> 1)) & 255;
    bytes[index++] = ((v5 << 7) | (v6 << 2) | (v7 >>> 3)) & 255;
  }
  return bytes;
}

decode.asBytes = decodeAsBytes;

module.exports = {
  encode,
  decode,
};
