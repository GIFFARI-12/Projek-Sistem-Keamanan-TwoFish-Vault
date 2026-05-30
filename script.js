(() => {
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    let currentBlob = null,
        currentFilename = 'hasil.txt';

    function setThemeUI() {
        const t = document.documentElement.getAttribute('data-theme');
        const sun = $('#sunIcon');
        const moon = $('#moonIcon');
        if (t === 'dark') { sun.classList.add('hidden');
            moon.classList.remove('hidden'); } else { sun.classList.remove('hidden');
            moon.classList.add('hidden'); }
    }
    $('[data-theme-toggle]').addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        setThemeUI();
    });
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute(
        'data-theme', 'dark');
    setThemeUI();

    function toast(msg) {
        const item = document.createElement('div');
        item.className = 'toast-item';
        item.textContent = msg;
        $('#toast').appendChild(item);
        setTimeout(() => item.remove(), 2400);
    }

    function setStatus(msg) { $('#statusText').textContent = 'Status: ' + msg; }

    function bytesToHex(bytes) { return [...bytes].map(b => b.toString(16).padStart(2, '0')).join(''); }

    function hexToBytes(hex) {
        const cleaned = hex.replace(/\s/g, '');
        if (!/^[0-9a-fA-F]+$/.test(cleaned) || ![32, 48, 64].includes(cleaned.length))
            throw new Error('Kunci harus berupa heksadesimal 32, 48, atau 64 karakter (128/192/256-bit).');
        const out = new Uint8Array(cleaned.length / 2);
        for (let i = 0; i < out.length; i++) out[i] = parseInt(cleaned.substr(i * 2, 2), 16);
        return out;
    }

    function randomHex(byteLen) { const a = new Uint8Array(byteLen);
        crypto.getRandomValues(a); return bytesToHex(a); }

    function toBase64(bytes) { let bin = '';
        bytes.forEach(b => bin += String.fromCharCode(b)); return btoa(bin); }

    function fromBase64(str) { const bin = atob(str.trim()); const out = new Uint8Array(bin.length); for (let i =
            0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }

    function pkcs7Pad(data, blockSize = 16) { const padLen = blockSize - (data.length % blockSize); const padded =
            new Uint8Array(data.length + padLen);
        padded.set(data);
        padded.fill(padLen, data.length); return padded; }

    function pkcs7Unpad(data) { const padLen = data[data.length - 1]; if (padLen < 1 || padLen > 16) throw new Error(
            'Padding PKCS#7 tidak valid.'); for (let i = data.length - padLen; i < data.length; i++) { if (data[
                i] !== padLen) throw new Error('Padding PKCS#7 tidak valid.'); } return data.slice(0, data
            .length - padLen); }

    const q0 = [
        [0x8, 0x1, 0x7, 0xD, 0x6, 0xF, 0x3, 0x2, 0x0, 0xB, 0x5, 0x9, 0xE, 0xC, 0xA, 0x4],
        [0xE, 0xC, 0xB, 0x8, 0x1, 0x2, 0x3, 0x5, 0xF, 0x4, 0xA, 0x6, 0x7, 0x0, 0x9, 0xD],
        [0xB, 0xA, 0x5, 0xE, 0x6, 0xD, 0x9, 0x0, 0xC, 0x8, 0xF, 0x3, 0x2, 0x4, 0x7, 0x1],
        [0xD, 0x7, 0xF, 0x4, 0x1, 0x2, 0x6, 0xE, 0x9, 0xB, 0x3, 0x0, 0x8, 0x5, 0xC, 0xA]
    ];
    const q1 = [
        [0x2, 0x8, 0xB, 0xD, 0xF, 0x7, 0x6, 0xE, 0x3, 0x1, 0x9, 0x4, 0x0, 0xA, 0xC, 0x5],
        [0x1, 0xE, 0x2, 0xB, 0x4, 0xC, 0x3, 0x7, 0x6, 0xD, 0xA, 0x5, 0xF, 0x9, 0x0, 0x8],
        [0x4, 0xC, 0x7, 0x5, 0x1, 0x6, 0x9, 0xA, 0x0, 0xE, 0xD, 0x8, 0x2, 0xB, 0x3, 0xF],
        [0xB, 0x9, 0x5, 0x1, 0xC, 0x3, 0xD, 0xE, 0x6, 0x4, 0x7, 0xF, 0x2, 0x0, 0x8, 0xA]
    ];
    const MDS = [
        [0x01, 0xEF, 0x5B, 0x5B],
        [0x5B, 0xEF, 0xEF, 0x01],
        [0xEF, 0x5B, 0x01, 0xEF],
        [0xEF, 0x01, 0xEF, 0x5B]
    ];

    function gfMult(a, b) { let p = 0; for (let i = 0; i < 8; i++) { if (b & 1) p ^= a;
            a = (a & 0x80) ? ((a << 1) ^ 0x169) : (a << 1);
            b >>= 1; } return p & 0xFF; }

    function mdsMultiply(byteVec) { const out = [0, 0, 0, 0]; for (let i = 0; i < 4; i++) { let sum = 0; for (
                let j = 0; j < 4; j++) { sum ^= gfMult(MDS[i][j], byteVec[j]); } out[i] = sum & 0xFF; } return out; }

    class TwofishEngine {
        constructor(keyBytes) { this.keyBytes = keyBytes;
            this.keyLen = keyBytes.length;
            this.subkeys = new Array(40).fill(0);
            this.sBoxes = [
                [],
                [],
                [],
                []
            ];
            this._keySchedule(); }
        _keySchedule() { const kwords = Math.floor(this.keyLen / 4); const Me = new Array(4).fill(0); const Mo =
                new Array(4).fill(0); for (let i = 0; i < kwords; i++) { const word = (this.keyBytes[4 * i] <<
                    24) | (this.keyBytes[4 * i + 1] << 16) | (this.keyBytes[4 * i + 2] << 8) | this.keyBytes[
                    4 * i + 3]; if (i % 2 === 0) Me[i / 2] = word;
                else Mo[Math.floor(i / 2)] = word; } for (let i = 0; i < 4; i++) { for (let j = 0; j <
                256; j++) { let b = j; for (let k = 0; k < kwords; k++) { b = (q0[k % 4][b >>> 4] << 4) |
                        q1[k % 4][b & 0xF]; } this.sBoxes[i][j] = b; } } for (let i = 0; i < 40; i +=
            2) { const A = this._f32(i, Me); let B = this._f32(i + 1, Mo);
                B = ((B << 8) | (B >>> 24)) >>> 0;
                this.subkeys[i] = (A + B) >>> 0;
                this.subkeys[i + 1] = ((A + 2 * B) >>> 0); } }
        _f32(k, arr) { const a = arr[0],
                b = arr[1],
                c = arr[2],
                d = arr[3]; const t = (a + this.subkeys[k]) >>> 0; const u = (b + this.subkeys[k + 1]) >>> 0; const
                v = (c + this.subkeys[k + 2]) >>> 0; const w = (d + this.subkeys[k + 3]) >>> 0; return (t ^ u ^
                v ^ w) >>> 0; }
        _g(word) { const b0 = (word >>> 24) & 0xFF; const b1 = (word >>> 16) & 0xFF; const b2 = (word >>> 8) &
                0xFF; const b3 = word & 0xFF; const s0 = this.sBoxes[0][b0]; const s1 = this.sBoxes[1][
                b1
            ]; const s2 = this.sBoxes[2][b2]; const s3 = this.sBoxes[3][b3]; const outVec = mdsMultiply([
                s0, s1, s2, s3
            ]); return (outVec[0] << 24) | (outVec[1] << 16) | (outVec[2] << 8) | outVec[3]; }
        encryptBlock(plainBlock) { let x0 = (plainBlock[0] << 24) | (plainBlock[1] << 16) | (plainBlock[2] <<
                8) | plainBlock[3]; let x1 = (plainBlock[4] << 24) | (plainBlock[5] << 16) | (plainBlock[
                6] << 8) | plainBlock[7]; let x2 = (plainBlock[8] << 24) | (plainBlock[9] << 16) | (
                plainBlock[10] << 8) | plainBlock[11]; let x3 = (plainBlock[12] << 24) | (plainBlock[13] <<
                16) | (plainBlock[14] << 8) | plainBlock[15];
            x0 ^= this.subkeys[0];
            x1 ^= this.subkeys[1];
            x2 ^= this.subkeys[2];
            x3 ^= this.subkeys[3]; for (let r = 0; r < 16; r++) { const t0 = this._g(x0); const t1 = this._g(
                    x1);
                x2 ^= (t0 + t1 + this.subkeys[8 + 2 * r]) >>> 0;
                x3 ^= (t0 + 2 * t1 + this.subkeys[8 + 2 * r + 1]) >>> 0;
                [x0, x2] = [x2, x0];
                [x1, x3] = [x3, x1]; }
            x2 ^= this.subkeys[4];
            x3 ^= this.subkeys[5];
            x0 ^= this.subkeys[6];
            x1 ^= this.subkeys[7]; const out = new Uint8Array(16); new DataView(out.buffer).setUint32(0, x2,
                false); new DataView(out.buffer).setUint32(4, x3, false); new DataView(out.buffer).setUint32(
                8, x0, false); new DataView(out.buffer).setUint32(12, x1, false); return out; }
        decryptBlock(cipherBlock) { let x2 = (cipherBlock[0] << 24) | (cipherBlock[1] << 16) | (cipherBlock[
                2] << 8) | cipherBlock[3]; let x3 = (cipherBlock[4] << 24) | (cipherBlock[5] << 16) | (
                cipherBlock[6] << 8) | cipherBlock[7]; let x0 = (cipherBlock[8] << 24) | (cipherBlock[9] <<
                16) | (cipherBlock[10] << 8) | cipherBlock[11]; let x1 = (cipherBlock[12] << 24) | (
                cipherBlock[13] << 16) | (cipherBlock[14] << 8) | cipherBlock[15];
            x0 ^= this.subkeys[6];
            x1 ^= this.subkeys[7];
            x2 ^= this.subkeys[4];
            x3 ^= this.subkeys[5]; for (let r = 15; r >= 0; r--) { const t0 = this._g(x0); const t1 = this._g(
                    x1);
                x2 ^= (t0 + t1 + this.subkeys[8 + 2 * r]) >>> 0;
                x3 ^= (t0 + 2 * t1 + this.subkeys[8 + 2 * r + 1]) >>> 0;
                [x0, x2] = [x2, x0];
                [x1, x3] = [x3, x1]; }
            x0 ^= this.subkeys[0];
            x1 ^= this.subkeys[1];
            x2 ^= this.subkeys[2];
            x3 ^= this.subkeys[3]; const out = new Uint8Array(16); new DataView(out.buffer).setUint32(0, x0,
                false); new DataView(out.buffer).setUint32(4, x1, false); new DataView(out.buffer).setUint32(
                8, x2, false); new DataView(out.buffer).setUint32(12, x3, false); return out; }
    }

    function processEncrypt(bytes, keyBytes, mode) { const engine = new TwofishEngine(keyBytes); const padded =
            pkcs7Pad(bytes, 16); const blocks = []; let prev,
            iv; if (mode === 'CBC') { iv = crypto.getRandomValues(new Uint8Array(16));
            prev = iv.slice(); } else { iv = new Uint8Array(16);
            prev = new Uint8Array(16); } for (let i = 0; i < padded.length; i += 16) { let block = padded.slice(i,
                i + 16); if (mode === 'CBC') { for (let j = 0; j < 16; j++) block[j] ^= prev[j]; } const enc =
            engine.encryptBlock(block);
        blocks.push(enc); if (mode === 'CBC') prev = enc.slice(); } const body = concatU8(...blocks); return mode ===
            'CBC' ? concatU8(iv, body) : body; }

    function processDecrypt(bytes, keyBytes, mode) { const engine = new TwofishEngine(keyBytes); let body,
            prev; if (mode === 'CBC') { if (bytes.length < 16) throw new Error(
                'Ciphertext terlalu pendek untuk mode CBC.'); const iv = bytes.slice(0, 16);
            body = bytes.slice(16);
            prev = iv.slice(); } else { body = bytes;
            prev = new Uint8Array(16); } if (body.length % 16 !== 0) throw new Error(
            'Ciphertext tidak kelipatan 16 byte.'); const blocks = []; let chain = prev.slice(); for (let i = 0; i <
            body.length; i += 16) { const block = body.slice(i, i + 16); let dec = engine.decryptBlock(block); if (
                mode === 'CBC') { for (let j = 0; j < 16; j++) dec[j] ^= chain[j];
            chain = block.slice(); }
        blocks.push(dec); } return pkcs7Unpad(concatU8(...blocks)); }

    function concatU8(...arrays) { const total = arrays.reduce((n, a) => n + a.length, 0); const out = new Uint8Array(
            total); let off = 0; for (const arr of arrays) { out.set(arr, off);
            off += arr.length; } return out; }

    function currentMode() { const checked = document.querySelector('input[name="mode"]:checked'); return checked ?
            checked.value : 'CBC'; }

    function requireKey() { return hexToBytes($('#secretKey').value.trim()); }

    function updateStrength() { const val = $('#secretKey').value.trim(); const bar = $('#strengthBar'); const text =
            $('#strengthText'); const label = $('#keyLabel'); if (!/^[0-9a-fA-F]*$/.test(val)) { bar.style.width =
                '8%';
            bar.style.background = 'var(--color-error)';
            text.textContent = 'Format kunci tidak valid';
            label.textContent = '32 / 48 / 64 hex'; return; } const map = { 32: ['33%', 'var(--color-warning)',
                '128-bit', 'Kunci 128-bit valid'
            ], 48: ['66%', '#d19900', '192-bit', 'Kunci 192-bit valid'], 64: ['100%', 'var(--color-success)',
                '256-bit', 'Kunci 256-bit valid'
            ] }; if (map[val.length]) { bar.style.width = map[val.length][0];
            bar.style.background = map[val.length][1];
            text.textContent = map[val.length][3];
            label.textContent = val.length + ' hex = ' + map[val.length][2]; } else { bar.style.width = Math.min((
                val.length / 64) * 100, 100) + '%';
            bar.style.background = 'var(--color-warning)';
            text.textContent = 'Panjang belum sesuai (butuh 32/48/64)';
            label.textContent = '32 / 48 / 64 hex'; } }
    $('#secretKey').addEventListener('input', updateStrength);
    $('#generate128').onclick = () => { $('#secretKey').value = randomHex(16);
        updateStrength();
        toast('Kunci 128-bit (32 hex) dibuat.'); };
    $('#generate192').onclick = () => { $('#secretKey').value = randomHex(24);
        updateStrength();
        toast('Kunci 192-bit (48 hex) dibuat.'); };
    $('#generate256').onclick = () => { $('#secretKey').value = randomHex(32);
        updateStrength();
        toast('Kunci 256-bit (64 hex) dibuat.'); };
    updateStrength();
    $$('.tab').forEach(btn => btn.addEventListener('click', () => { $$('.tab').forEach(t => t.classList.remove(
            'active'));
        btn.classList.add('active'); const tab = btn.dataset.tab;
        $$('.tab-panel').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== tab));
        setStatus('Tab ' + btn.textContent.trim() + ' aktif'); }));
    $('#encryptTextBtn').onclick = () => { try { const key = requireKey(); const data = textEncoder.encode($(
                '#plainText').value); const cipher = processEncrypt(data, key, currentMode()); const b64 =
            toBase64(cipher);
            $('#textOutput').textContent = b64;
            currentBlob = new Blob([b64], { type: 'text/plain' });
            currentFilename = 'ciphertext.txt';
            setStatus('Enkripsi teks berhasil.');
            toast('Teks berhasil dienkripsi menjadi Base64.'); } catch (e) { setStatus('Error: ' + e.message);
            toast('Gagal: ' + e.message); } };
    $('#decryptTextBtn').onclick = () => { try { const key = requireKey(); const data = fromBase64($('#cipherText')
            .value); const plain = processDecrypt(data, key, currentMode()); const txt = textDecoder.decode(
            plain);
            $('#textOutput').textContent = txt;
            currentBlob = new Blob([txt], { type: 'text/plain' });
            currentFilename = 'plaintext.txt';
            setStatus('Dekripsi teks berhasil.');
            toast('Teks berhasil didekripsi.'); } catch (e) { setStatus('Error: ' + e.message);
            toast('Gagal: ' + e.message); } };
    $('#clearTextBtn').onclick = () => { $('#plainText').value = '';
        $('#cipherText').value = '';
        $('#textOutput').textContent =
            'Belum ada output. Silakan pilih tab, masukkan data, dan klik tombol proses.';
        currentBlob = null;
        setStatus('Input dibersihkan.'); };
    $('#copyBtn').onclick = async () => { try { await navigator.clipboard.writeText($('#textOutput').textContent);
            toast('Output disalin ke clipboard.'); } catch { toast(
            'Clipboard tidak tersedia pada browser ini.'); } };
    $('#downloadBtn').onclick = () => { if (!currentBlob) return toast('Belum ada hasil untuk diunduh.'); const a =
            document.createElement('a');
        a.href = URL.createObjectURL(currentBlob);
        a.download = currentFilename;
        a.click();
        URL.revokeObjectURL(a.href);
        toast('File "' + currentFilename + '" diunduh.'); };

    function wireDrop(zoneId, inputId) { const zone = $(zoneId),
            input = $(inputId);
        zone.addEventListener('click', () => input.click());
        ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault();
            zone.classList.add('drag'); }));
        ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault();
            zone.classList.remove('drag'); }));
        zone.addEventListener('drop', e => { input.files = e.dataTransfer.files;
            updateDropLabel(zone, input); });
        input.addEventListener('change', () => updateDropLabel(zone, input)); }

    function updateDropLabel(zone, input) { const fileName = input.files[0]?.name; if (fileName) { zone.childNodes
                .forEach(n => { if (n.nodeType === 3) n.textContent = ' ' + fileName; }); const svg = zone
                .querySelector('svg'); if (svg) svg.style.opacity = '1'; } }
    wireDrop('#encryptDrop', '#encryptFile');
    wireDrop('#decryptDrop', '#decryptFile');
    $('#encryptFileBtn').onclick = async () => { try { const file = $('#encryptFile').files[0]; if (!file) throw new Error(
                'Pilih file terlebih dahulu.'); if (file.size > 5 * 1024 * 1024) throw new Error(
                'Ukuran file melebihi batas 5 MB.'); const key = requireKey(); const data = new Uint8Array(
            await file.arrayBuffer()); const cipher = processEncrypt(data, key, currentMode());
            currentBlob = new Blob([cipher], { type: 'application/octet-stream' });
            currentFilename = file.name + '.enc';
            $('#textOutput').textContent = 'File siap diunduh: ' + currentFilename + '\nUkuran asli: ' + file.size +
                ' byte\nUkuran terenkripsi: ' + cipher.length + ' byte\nMode: ' + currentMode();
            setStatus('Enkripsi file berhasil.');
            toast('File berhasil dienkripsi.'); } catch (e) { setStatus('Error: ' + e.message);
            toast('Gagal: ' + e.message); } };
    $('#decryptFileBtn').onclick = async () => { try { const file = $('#decryptFile').files[0]; if (!file) throw new Error(
                'Pilih file .enc terlebih dahulu.'); if (file.size > 5 * 1024 * 1024) throw new Error(
                'Ukuran file melebihi batas 5 MB.'); const key = requireKey(); const data = new Uint8Array(
            await file.arrayBuffer()); const plain = processDecrypt(data, key, currentMode()); const rawName =
            file.name.replace(/\.enc$/i, '') || 'hasil-dekripsi';
            currentBlob = new Blob([plain], { type: 'application/octet-stream' });
            currentFilename = rawName;
            $('#textOutput').textContent = 'File siap diunduh: ' + currentFilename +
                '\nUkuran hasil dekripsi: ' + plain.length + ' byte\nMode: ' + currentMode();
            setStatus('Dekripsi file berhasil.');
            toast('File berhasil didekripsi.'); } catch (e) { setStatus('Error: ' + e.message);
            toast('Gagal: ' + e.message); } };
    setStatus('siap digunakan.');
    console.log('TwofishVault — Twofish engine siap. Semua proses berjalan di sisi klien.');
})();
