import btoa from 'btoa';
import aesJS from 'aes-js';

class PasswordEncryptionService {
    encrypt(password: string) {
        const key = process.env.AES_KEY;
        const iv = process.env.AES_IV;
        return btoa(
            String.fromCharCode.apply(null,
                new aesJS.ModeOfOperation.cbc(this.hexToBytes(key),
                    this.hexToBytes(iv)).encrypt(this.pkcs7pad(this.utf8ToBytes(password)))));
    }

    private utf8ToBytes(t: string) {
        const e = [];
        let n = 0;
        for (t = encodeURI(t); n < t.length;) {
            const i = t.charCodeAt(n++);
            37 === i ? (e.push(parseInt(t.substr(n, 2), 16)), n += 2) : e.push(i)
        }
        return e
    }

    private hexToBytes(t: string) {
        const e = [];
        for (let n = 0; n < t.length; n += 2) e.push(parseInt(t.substr(n, 2), 16));
        return e
    }

    private pkcs7pad(t: Uint8Array | number[]) {
        const e = 16 - (t = new Uint8Array(t.slice())).length % 16, n = new Uint8Array(t.length + e);
        n.set(t, 0);
        for (let i = t.length; i < n.length; i++) n[i] = e;
        return n
    }
}
export = PasswordEncryptionService;