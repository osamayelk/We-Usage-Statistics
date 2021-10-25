const btoa = require("btoa")
const aesJS = require("aes-js");
module.exports = {
    encrypt(password) {
        const key = process.env.AES_KEY;"0f0e0d0c0b0a09080706050403020100";
        const iv = process.env.AES_IV;"000102030405060708090a0b0c0d0e0f";
        return btoa(
            String.fromCharCode.apply(null,
                new aesJS.ModeOfOperation.cbc(hexToBytes(key),
                    hexToBytes(iv)).encrypt(pkcs7pad(utf8ToBytes(password)))));
    }
}

function utf8ToBytes(t) {
    const e = [];
    let n = 0;
    for (t = encodeURI(t); n < t.length;) {
        const i = t.charCodeAt(n++);
        37 === i ? (e.push(parseInt(t.substr(n, 2), 16)), n += 2) : e.push(i)
    }
    return e
}

function hexToBytes(t) {
    const e = [];
    for (let n = 0; n < t.length; n += 2) e.push(parseInt(t.substr(n, 2), 16));
    return e
}

function pkcs7pad(t) {
    const e = 16 - (t = new Uint8Array(t.slice())).length % 16, n = new Uint8Array(t.length + e);
    n.set(t, 0);
    for (let i = t.length; i < n.length; i++) n[i] = e;
    return n
}