/* xlsx-worker.js — Background Excel Parser for My Money PWA */
let xlsxLoaded = false;

function ensureXlsx(customUrl) {
  if (xlsxLoaded && typeof XLSX !== 'undefined') return;
  const candidates = [
    customUrl,
    'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
  ].filter(Boolean);

  for (const url of candidates) {
    try {
      importScripts(url);
      if (typeof XLSX !== 'undefined') {
        xlsxLoaded = true;
        return;
      }
    } catch (e) {}
  }
  throw new Error('לא ניתן לטעון את ספריית SheetJS ברקע');
}

const fix = d => new Date(d.getTime() + 432e5);
const ymOf = d => {
  const fd = fix(d);
  return fd.getFullYear() * 100 + fd.getMonth() + 1;
};

function parseLocalDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(+val) ? null : val;
  if (typeof val === 'number' && val > 20000 && val < 100000) {
    const d = new Date(Math.round((val - 25569) * 864e5) + 432e5);
    return isNaN(+d) ? null : d;
  }
  const s = String(val).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3], 12, 0, 0);
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1], 12, 0, 0);
  const d = new Date(s);
  return isNaN(+d) ? null : d;
}

function wDate(v) {
  if (v instanceof Date) return isNaN(+v) ? null : v;
  if (typeof v === 'number' && v > 20000 && v < 100000) {
    const d = new Date(Math.round((v - 25569) * 864e5));
    return isNaN(+d) ? null : d;
  }
  if (typeof v === 'string' && v.trim()) {
    return parseLocalDate(v.trim());
  }
  return null;
}

function parseExp(wb) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['ראשי'] || wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true });
  const exp = [], mon = [], cp = [], bud = {}, sal = {};
  const gi = (rows[0] || []).findIndex(c => String(c || '').includes('גיפט'));
  const cj = gi >= 0 ? gi : 23;

  rows.slice(1).forEach(x => {
    if (!x) return;
    const wNum = v => {
      if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
      if (v === null || v === undefined || v === '') return 0;
      const n = parseFloat(String(v).replace(/,/g, '').replace(/[^\d.\-+eE]/g, '').trim());
      return Number.isFinite(n) ? n : 0;
    };
    const wAmt = wNum(x[1]);
    const wDt = wDate(x[4]);
    const wCat = String(x[2] || '').trim();
    if (wAmt > 0 && wCat && wDt) {
      const fd = fix(wDt);
      const sheetExcl = /חד[\s-]?פעמי|חריג/.test(`${x[0] || ''} ${x[3] || ''} ${x[5] || ''}`);
      exp.push({
        t: String(x[0] || ''),
        a: wAmt,
        c: wCat,
        ym: fd.getFullYear() * 100 + fd.getMonth() + 1,
        d: fd.getDate(),
        sheetExcl
      });
    }
    if (x[9] instanceof Date && typeof x[11] === 'number') {
      mon.push({ ym: ymOf(x[9]), inc: +x[13] || 0 });
    }
    if (x[cj] && typeof x[cj + 1] === 'number' && !String(x[cj]).startsWith('סה')) {
      cp.push({ n: String(x[cj]), a: x[cj + 1], c: String(x[cj + 2] || '') });
    }
  });

  const bs = wb.Sheets['תקציב'];
  if (bs) {
    XLSX.utils.sheet_to_json(bs, { header: 1, raw: true }).forEach(r => {
      if (r && r[0] && typeof r[1] === 'number') bud[String(r[0]).trim()] = r[1];
    });
  }

  const ws = wb.Sheets['ראשי'] || wb.Sheets[wb.SheetNames[0]];
  if (ws) {
    for (let r = 35; r <= 95; r++) {
      for (const l of 'KLMNOPQR') {
        const cell = ws[l + r];
        if (cell) sal[l + r] = { v: cell.v, f: cell.f };
      }
    }
  }

  return { exp, mon, cp, bud, sal };
}

function parseInv(wb) {
  const toNum = v => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (v === null || v === undefined || v === '') return 0;
    const n = parseFloat(String(v).replace(/,/g, '').replace(/[^\d.\-+eE]/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  };
  const g = n => (wb.Sheets[n] ? XLSX.utils.sheet_to_json(wb.Sheets[n], { cellDates: true }) : []);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  const inv = raw.map(r => {
    const out = Object.assign({}, r);
    const val = toNum(r['שווי ₪'] != null && r['שווי ₪'] !== '' ? r['שווי ₪'] : (r['שווי'] != null && r['שווי'] !== '' ? r['שווי'] : r['שווי בש"ח']));
    const qty = toNum(r['כמות'] != null && r['כמות'] !== '' ? r['כמות'] : r['יחידות']);
    const cost = toNum(r['עלות ₪'] != null && r['עלות ₪'] !== '' ? r['עלות ₪'] : (r['עלות'] != null && r['עלות'] !== '' ? r['עלות'] : r['עלות רכישה']));
    const secId = String(r['מספר נייר'] || r['מספר נייר ערך'] || r['סימול'] || r['טיקר'] || r['Symbol'] || '').trim();
    if (val > 0) out['שווי ₪'] = val;
    if (qty > 0) out['כמות'] = qty;
    if (cost > 0) out['עלות ₪'] = cost;
    if (secId) out['מספר נייר'] = secId;
    return out;
  }).filter(r => toNum(r['שווי ₪']) > 0 || toNum(r['כמות']) > 0);
  const pen = g('פנסיה');
  const docs = g('מסמכים');
  return { inv, pen, docs };
}

function parseIns(wb) {
  const sm = wb.Sheets['סיכום'];
  if (!sm || !sm.C6 || !sm.C7) throw new Error('מבנה גיליון ביטוח חיים לא תקין');
  const pr = XLSX.utils.sheet_to_json(wb.Sheets['פרמיות שנתיות'] || wb.Sheets[wb.SheetNames[1]], { header: 1, raw: true }).slice(4, 36);
  const rawSt = wDate(sm.C6.v);
  if (!rawSt) throw new Error('מבנה גיליון ביטוח חיים לא תקין');
  const st = fix(rawSt);
  const yrs = +sm.C7.v || 0;
  const pay = [];
  for (let n = 0; n < yrs * 12; n++) {
    const y = Math.floor(n / 12);
    const r = pr[y] || [];
    const t = (+r[6] || 0) + (+r[7] || 0);
    pay.push({
      d: new Date(st.getFullYear(), st.getMonth() + n, st.getDate()),
      a: t ? Math.floor(t / 12 * 100) / 100 : null
    });
  }
  return {
    yrs,
    pay,
    pr,
    end: new Date(st.getFullYear(), st.getMonth() + yrs * 12, st.getDate())
  };
}

function parseMort(wb) {
  const J = n => (wb.Sheets[n] ? XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, range: 'A1:O400' }) : []);
  const sm = J('סיכום ומצב נוכחי');
  const pl = J('פעימות ואימות מול הבנק');
  const sc = J('לוח סילוקין חודשי');
  const si = J('סימולטור תרחישים ומחזור');
  const D = x => (x instanceof Date ? fix(x) : null);
  const hr = (a, t) => a.findIndex(r => r && r.some(c => String(c || '').trim() == t));
  const va = (a, t) => {
    for (const r of a) {
      const i = r ? r.findIndex(c => String(c || '').includes(t)) : -1;
      if (i >= 0) return r.slice(i + 1).find(c => c !== undefined && c !== null && c !== '');
    }
  };

  const frame = +va(sm, 'סך מסגרת משכנתא מאושרת') || 0;
  const mi = hr(sm, 'מסלול הלוואה');
  const pi = hr(pl, 'מועד משיכה משוער');
  const hi = hr(pl, 'תאריך חיוב בפועל');
  const ci = hr(sc, 'תאריך חיוב');
  const ti = hr(si, 'תרחיש כלכלי');
  const ni = sm.findIndex(r => r && String(r[0] || '').includes('סה"כ תשלומים כוללים'));
  let cum = 0;

  const mix = mi >= 0
    ? [1, 2, 3, 4]
        .map(k => sm[mi + k])
        .filter(r => r && r[0] && typeof +r[1] === 'number' && !isNaN(+r[1]) && +r[1] > 0)
        .map(r => ({ n: String(r[0]), a: +r[1], r: +r[3] || 0, ix: String(r[4] || ''), mech: String(r[5] || ''), dr: +r[6] || 0 }))
    : [];

  const pulses = pi >= 0
    ? [1, 2, 3, 4, 5, 6]
        .map(k => pl[pi + k])
        .filter(r => r && r[0] && typeof +r[2] === 'number' && !isNaN(+r[2]) && +r[2] > 0)
        .map(r => {
          const a = +r[2];
          cum += a;
          return { n: String(r[0]), d: D(r[1]), a, cum, t: String(r[5] || ''), st: String(r[6] || ''), note: String(r[7] || '') };
        })
    : [];

  const hist = hi >= 0
    ? pl.slice(hi + 1, hi + 40)
        .filter(r => r && typeof r[2] === 'number' && typeof r[3] === 'number')
        .map(r => ({ m: r[1], i: r[2], p: r[3], b: r[5], pu: r[6], e: r[7] }))
    : [];

  const pay = ci >= 0
    ? sc.slice(ci + 1)
        .filter(r => r && typeof r[0] === 'number' && r[1] instanceof Date)
        .map(r => ({
          n: r[0],
          d: fix(r[1]),
          y: r[2],
          dr: +r[3] || 0,
          pr: +r[5] || 0,
          it: +r[6] || 0,
          ix: +r[7] || 0,
          tot: (+r[5] || 0) + (+r[6] || 0) + (+r[7] || 0),
          bal: +r[11] || 0
        }))
    : [];

  const sim = ti >= 0
    ? [1, 2, 3, 4]
        .map(k => si[ti + k] || [])
        .filter(r => r[0])
        .map(r => ({ n: String(r[0]), mo: +r[5] || 0, cost: +r[6] || 0 }))
    : [];

  if (!pay.length && !mix.length) throw new Error('מבנה גיליונות המשכנתא לא זוהה');

  return {
    bank: String(va(sm, 'בנק וסניף') || ''),
    val: +va(sm, 'שווי נכס') || 0,
    frame,
    note: ni >= 0 ? [...sm[ni]].reverse().find(c => typeof c === 'string' && c.length > 20) || '' : '',
    mix,
    pulses,
    hist,
    pay,
    sim
  };
}

self.onmessage = e => {
  const { id, type, buffer, xlsxUrl } = e.data || {};
  if (type === 'init') {
    try { ensureXlsx(xlsxUrl); } catch (err) {}
    return;
  }
  try {
    ensureXlsx(xlsxUrl);
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
    let data;
    if (type === 'exp') data = parseExp(wb);
    else if (type === 'inv') data = parseInv(wb);
    else if (type === 'ins') data = parseIns(wb);
    else if (type === 'mort') data = parseMort(wb);
    else throw new Error('סוג פענוח לא מוכר: ' + type);
    self.postMessage({ id, ok: true, data });
  } catch (err) {
    self.postMessage({ id, ok: false, error: (err && err.message) ? err.message : String(err) });
  }
};