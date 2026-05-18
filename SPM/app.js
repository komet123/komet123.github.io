/* =============================================
   SMS — app.js  (DEMO / STATIC MODE)
   Semua fungsi API menggunakan async/await
   Data random disimulasikan via mockApi()
   ============================================= */

// ── CONFIG ─────────────────────────────────────
const USE_MOCK = true;          // false = pakai backend nyata
const API_BASE = '/api';        // ganti saat backend siap

// ── SESSION ────────────────────────────────────
let SESSION = { token: null, username: null, role: null };

// ── MOCK DATA ──────────────────────────────────
const MOCK_USERS = [
  { username: 'admin',    password: '1234', role: 'Admin' },
  { username: 'operator', password: '1234', role: 'Operator' },
];

const LOTS  = ['LOT-A21', 'LOT-B14', 'LOT-C09', 'LOT-D33'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const LOKS  = [
  'Temporary',
  'A1','A2','A3','A4','A5','A6','A7','A8','A9','A10',
  'B1','B2','B3','B4','B5','B6','B7','B8','B9','B10',
];

function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr)  { return arr[rnd(0, arr.length - 1)]; }

// Generate mock rak data sekali saat load
const MOCK_RAK = (() => {
  const db = {};
  LOKS.forEach(l => {
    const n = l === 'Temporary' ? rnd(0, 5) : rnd(0, 14);
    db[l] = [];
    for (let i = 0; i < n; i++) {
      const dateStr = '2026051' + rnd(0, 7);
      const boxes = [];
      for (let j = 0; j < rnd(2, 6); j++) {
        boxes.push({
          id_box:  'BOX-' + rnd(1000, 9999),
          lotcode: pick(LOTS),
          size:    pick(SIZES),
          nilai:   rnd(1, 9) * 10000,
        });
      }
      db[l].push({ plt_name: `PLT-${dateStr}-${i + 1}`, boxes });
    }
  });
  return db;
})();

let mockBoxSeq = 3000;

// ── MOCK API ───────────────────────────────────
function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms || rnd(500, 900)));
}

async function mockApi(method, endpoint, body) {
  await pause();

  // POST /auth/login
  if (endpoint === '/auth/login') {
    const u = MOCK_USERS.find(
      x => x.username === body.username && x.password === body.password
    );
    if (!u) throw new Error('Username atau password salah');
    return { data: { token: 'demo-token', username: u.username, role: u.role } };
  }

  // POST /scan-in/box  → kembalikan id_box
  if (endpoint === '/scan-in/box') {
    return { data: { id_box: 'BOX-' + (++mockBoxSeq) } };
  }

  // POST /scan-in/bag  → kembalikan lotcode, size, nilai
  if (endpoint === '/scan-in/bag') {
    return { data: { lotcode: pick(LOTS), size: pick(SIZES), nilai: rnd(1, 9) * 10000 } };
  }

  // POST /scan-out  → kembalikan size, nilai
  if (endpoint === '/scan-out') {
    return { data: { size: pick(SIZES), nilai: rnd(1, 9) * 10000 } };
  }

  // GET /location/rak  → list semua rak + jumlah palet
  if (method === 'GET' && endpoint === '/location/rak') {
    const list = LOKS.map(id => ({
      id_rak:       id,
      jumlah_palet: MOCK_RAK[id].length,
      kapasitas:    16,
    }));
    return { data: list };
  }

  // GET /location/rak/:id  → isi palet di rak tersebut
  if (method === 'GET' && endpoint.startsWith('/location/rak/')) {
    const id = endpoint.replace('/location/rak/', '');
    return { data: MOCK_RAK[id] || [] };
  }

  // POST /location/scan-box  → id_box, lotcode, nilai dari server
  if (endpoint === '/location/scan-box') {
    return {
      data: { id_box: body.barcode_box, lotcode: pick(LOTS), nilai: rnd(1, 9) * 10000 },
    };
  }

  // POST /location/palet  → simpan palet, server beri nama
  if (endpoint === '/location/palet') {
    const now  = new Date();
    const d    = now.getFullYear().toString()
               + String(now.getMonth() + 1).padStart(2, '0')
               + String(now.getDate()).padStart(2, '0');
    const cnt  = (MOCK_RAK[body.kode_rak] || []).length;
    const name = `PLT-${d}-${cnt + 1}`;
    if (!MOCK_RAK[body.kode_rak]) MOCK_RAK[body.kode_rak] = [];
    MOCK_RAK[body.kode_rak].push({
      plt_name: name,
      boxes: body.boxes.map(id => ({
        id_box:  id,
        lotcode: pick(LOTS),
        size:    pick(SIZES),
        nilai:   rnd(1, 9) * 10000,
      })),
    });
    return { data: { plt_name: name } };
  }

  throw new Error('Endpoint tidak dikenal: ' + endpoint);
}

// ── API REQUEST (router mock ↔ real) ───────────
async function apiRequest(method, endpoint, body = null) {
  if (USE_MOCK) return mockApi(method, endpoint, body);

  const headers = { 'Content-Type': 'application/json' };
  if (SESSION.token) headers['Authorization'] = 'Bearer ' + SESSION.token;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res  = await fetch(API_BASE + endpoint, config);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Terjadi kesalahan server');
  return json;
}

// ── UI HELPERS ─────────────────────────────────
const rupiah = v => 'Rp ' + Number(v).toLocaleString('id-ID');

function el(id)         { return document.getElementById(id); }
function show(id)       { const e = el(id); if (e) e.style.display = 'block'; }
function hide(id)       { const e = el(id); if (e) e.style.display = 'none'; }
function showFlex(id)   { const e = el(id); if (e) e.style.display = 'flex'; }
function txt(id, v)     { const e = el(id); if (e) e.textContent = v; }
function getVal(id)     { return el(id).value.trim(); }
function showErr(id, m) { const e = el(id); if (!e) return; e.textContent = m; e.style.display = 'block'; }
function hideAll(ids)   { ids.forEach(hide); }

function flash(id, msgId, msg, ms) {
  if (msgId) txt(msgId, msg);
  showFlex(id);
  setTimeout(() => hide(id), ms || 2500);
}

// Navigasi halaman utama
function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  el('page-' + name).classList.add('on');
  window.scrollTo(0, 0);
  if (name === 'scan-in')  siInit();
  if (name === 'scan-out') soInit();
  if (name === 'location') locInit();
}

// ═══════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════

function togglePass() {
  const inp  = el('login-password');
  const icon = el('eye-icon');
  if (inp.type === 'password') { inp.type = 'text';     icon.className = 'ti ti-eye-off'; }
  else                         { inp.type = 'password'; icon.className = 'ti ti-eye'; }
}

async function doLogin() {
  const username = getVal('login-username');
  const password = getVal('login-password');
  hide('login-err');

  if (!username || !password) {
    txt('login-err-msg', 'Username dan password wajib diisi');
    showFlex('login-err');
    return;
  }

  show('login-loading');
  try {
    const res = await apiRequest('POST', '/auth/login', { username, password });

    SESSION.token    = res.data.token;
    SESSION.username = res.data.username;
    SESSION.role     = res.data.role;

    txt('dash-username', SESSION.username);
    txt('dash-role',     SESSION.role);
    goPage('dashboard');
  } catch (err) {
    txt('login-err-msg', err.message);
    showFlex('login-err');
  } finally {
    hide('login-loading');
  }
}

function doLogout() {
  SESSION = { token: null, username: null, role: null };
  el('login-username').value = '';
  el('login-password').value = '';
  goPage('login');
}

// ═══════════════════════════════════════════════
//  SCAN IN
// ═══════════════════════════════════════════════

let siData  = [];
let siIdBox = null;

function siInit() {
  siData  = [];
  siIdBox = null;
  siPhaseBox();
  siRender();
}

function siFlow(step) {
  const order = ['box', 'bag', 'done'];
  const idx   = order.indexOf(step);
  order.forEach((s, i) => {
    const e = el('fl-' + s);
    if (!e) return;
    e.classList.remove('active', 'done');
    if (i < idx)        e.classList.add('done');
    else if (i === idx) e.classList.add('active');
  });
}

function siPhaseBox() {
  hide('si-phase-bag');
  show('si-phase-box');
  el('si-box-bc').value = '';
  hide('si-box-err');
  siIdBox = null;
  siFlow('box');
}

function siScanBox() {
  const barcode = getVal('si-box-bc');
  hide('si-box-err');
  if (!barcode) { showErr('si-box-err', 'Barcode box wajib diisi'); return; }

  // ID Box langsung pakai nilai barcode yang discan — tidak perlu ke server
  siIdBox = barcode;
  txt('si-box-info', 'Box Aktif: ' + siIdBox);
  hide('si-phase-box');
  show('si-phase-bag');
  siFlow('bag');
  el('si-bag-bc').value = '';
  el('si-bag-bc').focus();
}

async function siScanBag() {
  const barcode = getVal('si-bag-bc');
  hide('si-bag-err');
  hide('si-bag-ok');

  if (!barcode) { showErr('si-bag-err', 'Barcode bag wajib diisi'); return; }
  if (!/^0211\d{9}$/.test(barcode)) {
    showErr('si-bag-err', 'Format tidak valid — harus awali 0211 dan 13 digit');
    return;
  }
  if (siData.find(d => d.barcode === barcode)) {
    showErr('si-bag-err', 'Barcode ini sudah discan');
    return;
  }

  show('si-loading');
  try {
    const res = await apiRequest('POST', '/scan-in/bag', {
      barcode_bag: barcode,
      username:    SESSION.username,
    });

    siData.push({
      barcode,
      lotcode: res.data.lotcode,
      size:    res.data.size,
      nilai:   res.data.nilai,
      id_box:  siIdBox,
    });

    siRender();
    flash('si-bag-ok', 'si-bag-ok-msg',
      `${barcode}  ·  ${res.data.lotcode}  ·  ${res.data.size}  ·  ${rupiah(res.data.nilai)}`);

    el('si-bag-bc').value = '';
    el('si-bag-bc').focus();
    siFlow('done');
    setTimeout(() => siFlow('bag'), 1500);
  } catch (err) {
    showErr('si-bag-err', err.message);
  } finally {
    hide('si-loading');
  }
}

function siGantiBox() { siPhaseBox(); }

function siDel(i) { siData.splice(i, 1); siRender(); }

function siRender() {
  const tbody = el('si-tbody');
  const totEl = el('si-total');
  if (!siData.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Belum ada data</td></tr>';
    totEl.style.display = 'none';
    return;
  }
  let total = 0;
  tbody.innerHTML = siData.map((d, i) => {
    total += d.nilai;
    return `<tr>
      <td class="mono">${d.barcode}</td>
      <td>${d.lotcode}</td>
      <td class="tc">${d.size}</td>
      <td class="tr">${rupiah(d.nilai)}</td>
      <td class="mono">${d.id_box}</td>
      <td><button class="del-btn" onclick="siDel(${i})"><i class="ti ti-trash" style="font-size:14px"></i></button></td>
    </tr>`;
  }).join('');
  txt('si-total-n', siData.length);
  txt('si-total-v', rupiah(total));
  totEl.style.display = 'flex';
}

// ═══════════════════════════════════════════════
//  SCAN OUT
// ═══════════════════════════════════════════════

let soData = [];

function soInit() {
  soData = [];
  soRender();
  el('so-barcode').value = '';
  el('so-lotcode').value = '';
  hideAll(['so-lot-err', 'so-bc-err', 'so-ok', 'so-loading']);
}

async function soScan() {
  const lotcode = getVal('so-lotcode');
  const barcode = getVal('so-barcode');
  let ok = true;

  hideAll(['so-lot-err', 'so-bc-err', 'so-ok']);

  if (!lotcode) { showErr('so-lot-err', 'Lot code wajib diisi'); ok = false; }
  if (!barcode || !/^0211\d{9}$/.test(barcode)) {
    showErr('so-bc-err', 'Format tidak valid — harus awali 0211 dan 13 digit');
    ok = false;
  }
  if (!ok) return;

  if (soData.find(d => d.barcode === barcode)) {
    showErr('so-bc-err', 'Barcode ini sudah discan');
    return;
  }

  show('so-loading');
  try {
    const res = await apiRequest('POST', '/scan-out', {
      lotcode,
      barcode_bag: barcode,
      username:    SESSION.username,
    });

    soData.push({ barcode, size: res.data.size, nilai: res.data.nilai });
    soRender();
    flash('so-ok', 'so-ok-msg',
      `${barcode}  ·  Size: ${res.data.size}  ·  ${rupiah(res.data.nilai)}`);

    el('so-barcode').value = '';
    el('so-barcode').focus();
  } catch (err) {
    showErr('so-bc-err', err.message);
  } finally {
    hide('so-loading');
  }
}

function soDel(i) { soData.splice(i, 1); soRender(); }

function soRender() {
  const tbody = el('so-tbody');
  const totEl = el('so-total');
  if (!soData.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Belum ada data</td></tr>';
    totEl.style.display = 'none';
    return;
  }
  let total = 0;
  tbody.innerHTML = soData.map((d, i) => {
    total += d.nilai;
    return `<tr>
      <td class="mono">${d.barcode}</td>
      <td class="tc">${d.size}</td>
      <td class="tr">${rupiah(d.nilai)}</td>
      <td><button class="del-btn" onclick="soDel(${i})"><i class="ti ti-trash" style="font-size:14px"></i></button></td>
    </tr>`;
  }).join('');
  txt('so-total-n', soData.length);
  txt('so-total-v', rupiah(total));
  totEl.style.display = 'flex';
}

// ═══════════════════════════════════════════════
//  LOCATION
// ═══════════════════════════════════════════════

const LOC_CAP = 16;
let locRak   = null;
let locBoxes = [];

// ── Sub-page navigation ──
function locGo(n) {
  document.querySelectorAll('.loc-pg').forEach(p => p.classList.remove('on'));
  el('loc-pg' + n).classList.add('on');
  locBc(n);
  window.scrollTo(0, 0);
}

function locBc(n) {
  const b1  = el('bc1'), b2 = el('bc2'), b3 = el('bc3');
  const s2  = el('bc-s2'), s3 = el('bc-s3');
  b1.className = 'bc-link';
  b2.className = 'bc-link';
  if (n === 1) {
    b1.className = 'bc-active';
    s2.style.display = 'none'; b2.style.display = 'none';
    s3.style.display = 'none'; b3.style.display = 'none';
  } else if (n === 2) {
    b2.textContent = locRak; b2.className = 'bc-active';
    s2.style.display = 'inline'; b2.style.display = 'inline';
    s3.style.display = 'none';   b3.style.display = 'none';
  } else {
    b2.textContent = locRak;
    s2.style.display = 'inline'; b2.style.display = 'inline';
    s3.style.display = 'inline'; b3.style.display = 'inline';
  }
}

// ── Page 1: Denah ──
async function locInit() {
  locGo(1);
  show('loc-load');
  try {
    const res = await apiRequest('GET', '/location/rak');
    locRenderGrid(res.data);
  } catch (err) {
    console.error(err.message);
  } finally {
    hide('loc-load');
  }
}

function rakCls(cnt) {
  if (cnt === 0)       return 'st-empty';
  if (cnt >= LOC_CAP) return 'st-full';
  return 'st-some';
}

function locRenderGrid(list) {
  const map = {};
  list.forEach(r => { map[r.id_rak] = r.jumlah_palet; });
  const c = id => map[id] || 0;

  // Temporary
  const T  = el('cell-T');
  const cT = c('Temporary');
  T.className = 'tmp-row ' + rakCls(cT);
  T.innerHTML = `<span>Temporary</span><span style="font-size:11px;opacity:.85">${cT}/${LOC_CAP}</span>`;

  // Grid A & B
  ['a', 'b'].forEach(z => {
    const grid = el('grid-' + z);
    grid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const id  = (z === 'a' ? 'A' : 'B') + i;
      const cnt = c(id);
      const d   = document.createElement('div');
      d.className = 'rak-cell ' + rakCls(cnt);
      d.innerHTML = `<div><div>${id}</div><div class="sub">${cnt}/${LOC_CAP}</div></div>`;
      d.onclick   = () => locPick(id);
      grid.appendChild(d);
    }
  });

  let some = 0, full = 0, empty = 0;
  list.forEach(r => {
    const n = r.jumlah_palet;
    if (n === 0) empty++; else if (n >= LOC_CAP) full++; else some++;
  });
  txt('stat-some', some); txt('stat-full', full); txt('stat-empty', empty);
}

// ── Page 2: Isi Rak ──
async function locPick(id) {
  locRak = id;
  locGo(2);
  txt('p2-lok', id);
  txt('p2-kap', 'Memuat...');
  show('p2-load');
  el('p2-body').innerHTML = '';
  el('btn-add-plt').style.display = 'none';

  try {
    const res = await apiRequest('GET', '/location/rak/' + id);
    locRenderP2(res.data);
  } catch (err) {
    el('p2-body').innerHTML =
      `<div class="card"><p style="color:#991b1b;font-size:13px;text-align:center;padding:16px">${err.message}</p></div>`;
  } finally {
    hide('p2-load');
  }
}

// Gabung lotcode+size yang sama → jumlahkan nilai
function groupBoxes(boxes) {
  const map = {};
  boxes.forEach(b => {
    const k = b.lotcode + '|' + b.size;
    if (!map[k]) map[k] = { lotcode: b.lotcode, size: b.size, nilai: 0 };
    map[k].nilai += b.nilai;
  });
  return Object.values(map).sort((a, b) =>
    a.lotcode.localeCompare(b.lotcode) || a.size.localeCompare(b.size)
  );
}

function locRenderP2(pallets) {
  const cnt  = pallets.length;
  const full = cnt >= LOC_CAP;
  txt('p2-kap', `${cnt}/${LOC_CAP} palet terisi`);
  el('btn-add-plt').style.display = full ? 'none' : 'flex';

  const body = el('p2-body');

  if (!pallets.length) {
    body.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <i class="ti ti-packages"></i>
          <p>Rak <strong>${locRak}</strong> kosong</p>
          <small>Belum ada palet di rak ini</small>
          <button class="btn-info" onclick="locOpenP3()" style="margin:0 auto">
            <i class="ti ti-plus"></i> Tambahkan Palet
          </button>
        </div>
      </div>`;
    return;
  }

  let html = '';
  pallets.forEach((plt, pi) => {
    const grouped  = groupBoxes(plt.boxes);
    const totNilai = grouped.reduce((a, x) => a + x.nilai, 0);
    html += `
      <div class="plt-card">
        <div class="plt-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="plt-badge">P${pi + 1}</div>
            <div>
              <div class="plt-name">${plt.plt_name}</div>
              <div class="plt-meta">${plt.boxes.length} box</div>
            </div>
          </div>
          <div class="plt-total">
            <div class="plt-total-lbl">Total Nilai</div>
            <div class="plt-total-val">${rupiah(totNilai)}</div>
          </div>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr>
              <th>Lotcode</th><th class="tc">Size</th><th class="tr">Nilai</th>
            </tr></thead>
            <tbody>
              ${grouped.map(r => `
                <tr>
                  <td>${r.lotcode}</td>
                  <td class="tc">${r.size}</td>
                  <td class="tr">${rupiah(r.nilai)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  });

  if (!full) {
    html += `
      <button class="btn-dashed" onclick="locOpenP3()">
        <i class="ti ti-plus"></i> Tambahkan Palet (${cnt}/${LOC_CAP} terisi)
      </button>`;
  }
  body.innerHTML = html;
}

// ── Page 3: Isi Palet ──
function locOpenP3() {
  locBoxes = [];
  const now  = new Date();
  const d    = now.getFullYear().toString()
             + String(now.getMonth() + 1).padStart(2, '0')
             + String(now.getDate()).padStart(2, '0');
  const seq  = (MOCK_RAK[locRak] || []).length + 1;
  txt('p3-sub', `${locRak}  ·  PLT-${d}-${seq}`);
  txt('p3-cnt', '0 box');
  el('p3-bc').value = '';
  hideAll(['p3-err', 'p3-ok', 'p3-load', 'p3-save', 'p3-saving', 'p3-done']);
  locRenderP3();
  locGo(3);
  setTimeout(() => el('p3-bc').focus(), 100);
}

async function locScanBox() {
  const barcode = getVal('p3-bc');
  const errEl   = el('p3-err');
  errEl.style.display = 'none';
  hide('p3-ok');

  if (!barcode) { errEl.textContent = 'Barcode wajib diisi'; errEl.style.display = 'block'; return; }
  if (locBoxes.find(b => b.id_box === barcode)) {
    errEl.textContent = 'Box ini sudah discan'; errEl.style.display = 'block'; return;
  }

  show('p3-load');
  try {
    const res = await apiRequest('POST', '/location/scan-box', {
      barcode_box: barcode,
      kode_rak:    locRak,
      username:    SESSION.username,
    });
    locBoxes.push({ id_box: res.data.id_box, lotcode: res.data.lotcode, nilai: res.data.nilai });
    locRenderP3();
    flash('p3-ok', 'p3-ok-msg',
      `${res.data.id_box}  ·  ${res.data.lotcode}  ·  ${rupiah(res.data.nilai)}`);
    el('p3-bc').value = '';
    el('p3-bc').focus();
  } catch (err) {
    errEl.textContent = err.message; errEl.style.display = 'block';
  } finally {
    hide('p3-load');
  }
}

function locDelBox(i) { locBoxes.splice(i, 1); locRenderP3(); }

function locRenderP3() {
  const tbody  = el('p3-tbody');
  const totEl  = el('p3-total');
  const saveBtn = el('p3-save');
  txt('p3-cnt', locBoxes.length + ' box');

  if (!locBoxes.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Belum ada box</td></tr>';
    totEl.style.display   = 'none';
    saveBtn.style.display = 'none';
    return;
  }
  let total = 0;
  tbody.innerHTML = locBoxes.map((b, i) => {
    total += b.nilai;
    return `<tr>
      <td class="mono">${b.id_box}</td>
      <td>${b.lotcode}</td>
      <td class="tr">${rupiah(b.nilai)}</td>
      <td><button class="del-btn" onclick="locDelBox(${i})"><i class="ti ti-trash" style="font-size:14px"></i></button></td>
    </tr>`;
  }).join('');
  txt('p3-total-n', locBoxes.length);
  txt('p3-total-v', rupiah(total));
  totEl.style.display   = 'flex';
  saveBtn.style.display = 'flex';
}

async function locSavePalet() {
  if (!locBoxes.length) return;
  hide('p3-save');
  show('p3-saving');
  try {
    const res = await apiRequest('POST', '/location/palet', {
      kode_rak: locRak,
      username: SESSION.username,
      boxes:    locBoxes.map(b => b.id_box),
    });
    txt('p3-done-msg', `${res.data.plt_name}  ·  ${locBoxes.length} box  ·  Rak ${locRak}`);
    hide('p3-saving');
    show('p3-done');
    locBoxes = [];
  } catch (err) {
    hide('p3-saving');
    show('p3-save');
    const e = el('p3-err');
    e.textContent = err.message; e.style.display = 'block';
  }
}

function locLagi() { hide('p3-done'); locOpenP3(); }
