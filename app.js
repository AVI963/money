const APP_CONFIG = Object.assign({
  clientId: '579770283485-41n96q8bol22fh83dkgua1lb5fq4n70c.apps.googleusercontent.com',
  workerUrl: 'https://plain-dust-203fmoney-auth.orbach222.workers.dev',
  driveScope: 'https://www.googleapis.com/auth/drive',
  files: {
    exp: 'סך הוצאת משק בית',
    inv: 'תיק השקעות',
    ins: 'לוח תשלומים ביטוח חיים',
    mort: ['סילוקין', 'משכנתא']
  },
  shoppingFileName: 'my_money_shopping.json',
  salaryFileName: 'my_money_salary.json',
  receiptsRootFolder: 'Sedrix',
  receiptsSubFolder: 'קבלות ואחריות'
}, window.APP_CONFIG || {});

const CLIENT_ID = APP_CONFIG.clientId;
const SC = APP_CONFIG.driveScope;
const FILES = APP_CONFIG.files;
const W = APP_CONFIG.workerUrl;

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const num = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/,/g, '').replace(/[^\d.\-+eE]/g, '').trim());
  return Number.isFinite(n) ? n : 0;
};

let toastTimer = 0;
function showToast(text, type = 'ok') {
  const el = document.getElementById('app-toast');
  if (!el || !text) return;
  el.textContent = String(text);
  el.className = 'app-toast on' + (type === 'err' ? ' err' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2800);
}

const COL=['#3b5bdb','#0d9488','#d97706','#e11d48','#0284c7','#65a30d','#dc2626','#7c3aed'];
const ICO=[
  [/עיצוב|ריהוט/,'🛋️'],
  [/דיור|שכר|משכנת/,'🏠'],
  [/סופר|מזון|אוכל|מכולת/,'🛒'],
  [/מסעד|קפה|משלוח/,'🍽️'],
  [/רכב|דלק|תחבור|חני|כביש/,'🚗'],
  [/בריאות|רפוא|תרופ|פארם/,'💊'],
  [/טיפוח|ספא|שיער|קוסמט|תספור/,'💅'],
  [/בילוי|פנאי|חופש|טיול|סרט|הופע/,'🎬'],
  [/אופנ|ביגוד|בגד|הנעל|נעלי/,'👕'],
  [/ילדים|תינוק|גן|צעצוע|חוג/,'🧸'],
  [/חשמל|מים|ארנונה|גז|ועד/,'💡'],
  [/תקשור|סלולר|אינטרנט|טלפון/,'📱'],
  [/לימוד|חינוך|קורס|ספר/,'🎓'],
  [/תרומ|צדק|מעשר/,'🤝'],
  [/ביטוח|בנק|עמל/,'🛡️'],
  [/מתנ/,'🎁'],
  [/שונות/,'📦']
];
const ico=c=>(ICO.find(x=>x[0].test(c))||[0,'🏷️'])[1];
const W_CATS=['מוצרי חשמל','רכב','ריהוט','אלקטרוניקה ומחשבים','בית וגינה','שונות'];
const wCatOf=w=>String((w&&w.category)||'').trim()||'שונות';
const SAL_TPL_KEY='sal_tpl',SAL_TPL_AT_KEY='sal_tpl_at',SAL_SV_KEY='sal_sv',SAL_DIRTY_PUSH_KEY='sal_dirty_push',SAL_META_KEY='my_money_sal_drive_meta_v1',SAL_DRIVE_FILE=APP_CONFIG.salaryFileName||'my_money_salary.json';
const S={exp:[],mon:[],inv:[],pen:[],docs:[],bud:{},sal:null,salAt:0,cp:[],ins:null,mort:null,syncAt:0,ym:0,tab:'home',sub:'',dcf:'',wrStatus:'all',wrCat:'',glFilter:'all',glSort:'prio',glForm:null,glPendingCover:null,glSaving:false,glErr:'',hide:false,theme:'',dnSel:null,syncing:false,mPick:false,moreEdit:false,moreLayout:null,homeEdit:false,homeLayout:null,qaEdit:false,qaLayout:null,wForm:null,wViewId:'',wPendingCover:null,wPendingFiles:[],wSaving:false,wErr:'',dcStatus:'all',gsOpen:false,gsQ:'',excl:new Set(),unexcl:new Set(),fire:null,pv:{by:'m',rows:'c',sel:[],open:[],q:'',from:0,to:0,pr:'12',dr:null}};
  let token,cc,quotesAbort=null;
const $=s=>document.querySelector(s),ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
const vib=(ms=8)=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
const expKey=e=>`${e.ym}|${e.d||0}|${String(e.c||'').trim()}|${String(e.t||'').trim()}|${e.a}`;
const isExcl=e=>{const k=expKey(e);return (e.sheetExcl&&!S.unexcl.has(k))||S.excl.has(k)};
function saveExcl(){ls('excl',JSON.stringify([...S.excl]));ls('unexcl',JSON.stringify([...S.unexcl]))}
const SVG={
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff:'<svg viewBox="0 0 24 24"><path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.2 3.2"/><path d="M6.6 6.6C4 8.4 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/></svg>',
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  sync:'<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M16 16h5v5"/></svg>',
  cal:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
  chevD:'<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>'
};
const isDarkTheme=()=>S.theme?S.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
function applyTheme(t){
  S.theme=(t==='dark'||t==='light')?t:'';
  if(S.theme)document.documentElement.dataset.theme=S.theme;
  else delete document.documentElement.dataset.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{
    if(S.theme)m.content=S.theme==='dark'?'#090d16':'#f4f6fa';
    else m.content=(m.media&&m.media.includes('dark'))?'#090d16':'#f4f6fa';
  });
}
const fmt=n=>S.hide?'₪•••':(n<0?'-':'')+'₪'+Math.round(Math.abs(n)).toLocaleString('he-IL'),pct=n=>Number.isFinite(n)?(n>0?'+':'')+n.toFixed(1)+'%':'—';
const shortK=n=>{if(S.hide)return '••';const a=Math.abs(n);return a>=1000?(a/1000).toFixed(1).replace(/\.0$/,'')+'K':Math.round(a).toLocaleString('he-IL')};
const fix=d=>new Date(d.getTime()+432e5),ymOf=d=>{d=fix(d);return d.getFullYear()*100+d.getMonth()+1};
const ymLb=y=>y&&Number.isFinite(y)?new Date(Math.floor(y/100),y%100-1,1).toLocaleDateString('he-IL',{month:'long',year:'numeric'}):'';
const ymShort=y=>y&&Number.isFinite(y)?new Date(Math.floor(y/100),y%100-1,1).toLocaleDateString('he-IL',{month:'short',year:'2-digit'}):'';
const T=(a,k)=>a.reduce((s,r)=>s+(+r[k]||0),0),dl=d=>d instanceof Date&&!isNaN(+d)?d.toLocaleDateString('he-IL'):'—';

function skeletonScreen(){
  return `<div class="sk-wrap" aria-busy="true" aria-label="טוען נתונים">
    <div class="sk-hdr">
      <div><div class="sk-line w40 h22"></div><div class="sk-line w55 h12" style="margin-top:8px"></div></div>
      <div class="sk-acts"><div class="sk-circle"></div><div class="sk-circle"></div><div class="sk-circle"></div></div>
    </div>
    <div class="sk-pills"><div class="sk-pill"></div><div class="sk-pill"></div><div class="sk-pill"></div><div class="sk-pill"></div></div>
    <div class="card sk-hero">
      <div class="sk-line w30 h12"></div>
      <div class="sk-line w55 h38" style="margin-top:10px"></div>
      <div class="sk-line w70 h14" style="margin-top:12px"></div>
      <div class="sk-box" style="margin-top:16px"></div>
      <div class="sk-trio"><div><div class="sk-line w60 h12"></div><div class="sk-line w75 h16" style="margin-top:6px"></div></div><div><div class="sk-line w60 h12"></div><div class="sk-line w75 h16" style="margin-top:6px"></div></div><div><div class="sk-line w60 h12"></div><div class="sk-line w75 h16" style="margin-top:6px"></div></div></div>
    </div>
    <div class="card">
      <div class="sk-line w45 h16"></div>
      <div class="sk-row"><div class="sk-ico"></div><div style="flex:1"><div class="sk-line w50 h14"></div><div class="sk-line w30 h11" style="margin-top:6px"></div></div><div class="sk-line w20 h16"></div></div>
      <div class="sk-row"><div class="sk-ico"></div><div style="flex:1"><div class="sk-line w45 h14"></div><div class="sk-line w35 h11" style="margin-top:6px"></div></div><div class="sk-line w20 h16"></div></div>
      <div class="sk-row"><div class="sk-ico"></div><div style="flex:1"><div class="sk-line w55 h14"></div><div class="sk-line w25 h11" style="margin-top:6px"></div></div><div class="sk-line w20 h16"></div></div>
    </div>
  </div>`;
}

function msg(t,isHtml=false){
  $('#app').innerHTML='<div id="msg"><p>'+(isHtml?t:esc(t))+'</p></div>';
}

function reviveInsDates(ins){
  if(!ins)return null;
  if(ins.end&&!(ins.end instanceof Date))ins.end=new Date(ins.end);
  if(Array.isArray(ins.pay))ins.pay.forEach(p=>{if(p&&p.d&&!(p.d instanceof Date))p.d=new Date(p.d)});
  return ins;
}
function reviveMortDates(mort){
  if(!mort)return null;
  if(Array.isArray(mort.pulses))mort.pulses.forEach(p=>{if(p&&p.d&&!(p.d instanceof Date))p.d=new Date(p.d)});
  if(Array.isArray(mort.pay))mort.pay.forEach(p=>{if(p&&p.d&&!(p.d instanceof Date))p.d=new Date(p.d)});
  return mort;
}

function saveSnap(){
  const core={exp:S.exp,mon:S.mon,inv:S.inv.map(r=>({...r,live:0})),pen:S.pen,docs:S.docs,bud:S.bud,cp:S.cp,sal:S.sal,salAt:S.salAt||0,ym:S.ym,syncAt:S.syncAt};
  if(S.sal&&Object.keys(S.sal).length)saveSalTplLocal();
  try{ls('data',JSON.stringify({...core,ins:S.ins,mort:S.mort}))}
  catch(e){try{ls('data',JSON.stringify(core))}catch(e2){}}
}
function rehydrateSnap(d){
  if(!d||typeof d!=='object')return false;
  const hasExp=Array.isArray(d.exp)&&d.exp.length>0;
  const hasSal=d.sal&&typeof d.sal==='object'&&Object.keys(d.sal).length>0;
  if(!hasExp&&!hasSal)return false;
  if(!Array.isArray(d.exp))d.exp=[];
  if(!Array.isArray(d.mon))d.mon=[];
  if(!Array.isArray(d.cp))d.cp=[];
  if(Array.isArray(d.inv))d.inv.forEach(r=>{if(r)r.live=0});
  if(d.ins)reviveInsDates(d.ins);
  if(d.mort)reviveMortDates(d.mort);
  if(!hasSal&&S.sal&&Object.keys(S.sal).length){delete d.sal;delete d.salAt}
  Object.assign(S,d);
  return true;
}
function syncLabel(){
  if(S.syncing)return{cls:'busy',txt:'מסנכרן...'};
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return{cls:'off',txt:'מצב אופליין'};
  if(!S.syncAt)return{cls:'off',txt:token?'מחובר':'לא מסונכרן'};
  const mins=Math.floor((Date.now()-S.syncAt)/60000);
  const t=mins<1?'עודכן עכשיו':mins<60?`לפני ${mins} דק׳`:new Date(S.syncAt).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
  return{cls:token?'':'off',txt:t};
}

async function driveFetchWithRetry(url,opts={},retried=false){
  if(!token&&ls('rt'))await refresh();
  if(!token){
    const err=new Error('החיבור פג, לחץ על סנכרן');
    err.code=401;
    throw err;
  }
  const usedToken=token;
  const headers={...(opts.headers||{}),Authorization:'Bearer '+usedToken};
  const res=await fetch(url,{...opts,headers});
  if(res.status===401&&!retried){
    if(token===usedToken){token=null;ls('tok',null)}
    if(token||await refresh())return driveFetchWithRetry(url,opts,true);
    const err=new Error('החיבור פג, לחץ על סנכרן');
    err.code=401;
    throw err;
  }
  if(res.status===429&&!retried){
    await new Promise(r=>setTimeout(r,1100+Math.floor(Math.random()*500)));
    return driveFetchWithRetry(url,opts,true);
  }
  if(res.status===403){
    let reason='';try{const j=await res.clone().json();reason=String((j.error&&j.error.errors&&j.error.errors[0]&&j.error.errors[0].reason)||'')}catch(e){}
    if(/ratelimit/i.test(reason)&&!retried){await new Promise(r=>setTimeout(r,1100+Math.floor(Math.random()*500)));return driveFetchWithRetry(url,opts,true)}
    if(reason==='insufficientFilePermissions'){const e2=new Error('אין לך הרשאת עריכה לקובץ או לתיקייה הזאת (צפייה בלבד)');e2.code=403;e2.readOnly=true;throw e2}
    const err=new Error('חסרה הרשאת גישה מלאה ל-Google Drive (403) — לחץ על סנכרן לאישור מחדש');
    err.code=403;
    err.needScope=true;
    throw err;
  }
  return res;
}

const XLSX_CDN_URL='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
let xlsxWorker=null,xlsxWorkerReady=false,xlsxWorkerBroken=false,xlsxReqSeq=0;
const xlsxPending=new Map();

function initXlsxWorker(){
  if(xlsxWorkerBroken||typeof Worker==='undefined'||typeof Blob==='undefined'||typeof URL==='undefined')return null;
  if(xlsxWorker)return xlsxWorker;
  try{
    const src=[
      'const fix=d=>new Date(d.getTime()+432e5);',
      'const ymOf=d=>{const fd=fix(d);return fd.getFullYear()*100+fd.getMonth()+1};',
      extractExtra.toString(),
      parseExpWb.toString(),
      parseInvWb.toString(),
      parseIns.toString(),
      parseMort.toString(),
      'let loaded=false;',
      'function ensure(u){if(loaded&&typeof XLSX!=="undefined")return;importScripts(u);if(typeof XLSX==="undefined")throw new Error("SheetJS_missing");loaded=true;}',
      'self.onmessage=e=>{const d=e.data||{};if(d.type==="init"){try{ensure(d.xlsxUrl);self.postMessage({type:"ready"})}catch(err){self.postMessage({type:"init_err"})}return;}try{ensure(d.xlsxUrl);const wb=XLSX.read(new Uint8Array(d.buffer),{type:"array",cellDates:true});const out=d.type==="exp"?parseExpWb(wb):d.type==="inv"?parseInvWb(wb):d.type==="ins"?parseIns(wb):d.type==="mort"?parseMort(wb):null;if(!out)throw new Error("סוג קובץ לא נתמך");self.postMessage({id:d.id,ok:true,data:out});}catch(err){self.postMessage({id:d.id,ok:false,error:(err&&err.message)?err.message:String(err)});}};'
    ].join('\n');
    const blobUrl=URL.createObjectURL(new Blob([src],{type:'application/javascript'}));
    const w=new Worker(blobUrl);
    setTimeout(()=>{try{URL.revokeObjectURL(blobUrl)}catch(e){}},5000);
    w.onmessage=e=>{
      const d=e.data||{};
      if(d.type==='ready'){xlsxWorkerReady=true;return}
      if(d.type==='init_err'){
        xlsxWorkerBroken=true;xlsxWorkerReady=false;
        try{w.terminate()}catch(err){}
        xlsxWorker=null;
        return;
      }
      const p=xlsxPending.get(d.id);
      if(!p)return;
      xlsxPending.delete(d.id);
      clearTimeout(p.timer);
      if(d.ok)p.resolve(d.data);
      else p.reject(new Error(d.error||'שגיאה בפענוח קובץ אקסל'));
    };
    w.onerror=()=>{
      xlsxWorkerBroken=true;xlsxWorkerReady=false;
      try{w.terminate()}catch(err){}
      xlsxWorker=null;
      xlsxPending.forEach(p=>{clearTimeout(p.timer);p.reject(new Error('worker_failed'))});
      xlsxPending.clear();
    };
    w.postMessage({type:'init',xlsxUrl:XLSX_CDN_URL});
    xlsxWorker=w;
    return w;
  }catch(e){
    xlsxWorkerBroken=true;
    return null;
  }
}

function parseExpWb(wb){
  const rows=XLSX.utils.sheet_to_json(wb.Sheets['ראשי']||wb.Sheets[wb.SheetNames[0]],{header:1,raw:true});
  const exp=[],mon=[],cp=[];
  const gi=(rows[0]||[]).findIndex(c=>String(c||'').includes('גיפט')),cj=gi>=0?gi:23;
  rows.slice(1).forEach(x=>{
    if(!x)return;
    if(typeof x[1]==='number'&&x[2]&&x[4] instanceof Date){
      const fd=fix(x[4]);
      const sheetExcl=/חד[\s-]?פעמי|חריג/.test(`${x[0]||''} ${x[3]||''} ${x[5]||''}`);
      exp.push({t:String(x[0]||''),a:x[1],c:String(x[2]||''),ym:fd.getFullYear()*100+fd.getMonth()+1,d:fd.getDate(),sheetExcl});
    }
    if(x[9] instanceof Date&&typeof x[11]==='number')mon.push({ym:ymOf(x[9]),inc:+x[13]||0});
    if(x[cj]&&typeof x[cj+1]==='number'&&!String(x[cj]).startsWith('סה'))cp.push({n:String(x[cj]),a:x[cj+1],c:String(x[cj+2]||'')});
  });
  const extra=extractExtra(wb);
  return{exp,mon,cp,bud:extra.bud,sal:extra.sal};
}

function parseInvWb(wb){
  const g=n=>wb.Sheets[n]?XLSX.utils.sheet_to_json(wb.Sheets[n],{cellDates:true}):[];
  const inv=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).filter(r=>+r['שווי ₪']>0);
  return{inv,pen:g('פנסיה'),docs:g('מסמכים')};
}

function parseExcelMain(type,buffer){
  if(typeof XLSX==='undefined')throw new Error('ספריית האקסל עדיין נטענת, נסה שוב בעוד רגע');
  const wb=XLSX.read(buffer,{type:'array',cellDates:true});
  if(type==='exp')return parseExpWb(wb);
  if(type==='inv')return parseInvWb(wb);
  if(type==='ins')return parseIns(wb);
  if(type==='mort')return parseMort(wb);
  throw new Error('סוג קובץ לא נתמך: '+type);
}

async function parseExcel(type,buffer){
  initXlsxWorker();
  if(!xlsxWorker||!xlsxWorkerReady)return parseExcelMain(type,buffer);
  try{
    return await new Promise((resolve,reject)=>{
      const id=++xlsxReqSeq;
      const timer=setTimeout(()=>{
        xlsxPending.delete(id);
        reject(new Error('worker_timeout'));
      },4000);
      xlsxPending.set(id,{resolve,reject,timer});
      xlsxWorker.postMessage({id,type,buffer,xlsxUrl:XLSX_CDN_URL});
    });
  }catch(e){
    if(/worker_failed|worker_timeout|SheetJS/i.test(String(e&&e.message||''))){
      xlsxWorkerBroken=true;xlsxWorkerReady=false;
      return parseExcelMain(type,buffer);
    }
    throw e;
  }
}

async function getFileBuffer(name){
  const q=encodeURIComponent((name[0]=='='?"name = '"+name.slice(1)+"'":"name contains '"+name+"'")+" and trashed=false and mimeType!='application/vnd.google-apps.folder'");
  const listRes=await driveFetchWithRetry('https://www.googleapis.com/drive/v3/files?fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy='+encodeURIComponent('modifiedTime desc')+'&q='+q);
  const l=await listRes.json();
  if(l.error){
    const e=new Error(l.error.message||'שגיאת Google Drive');
    e.code=l.error.code;
    throw e;
  }
  if(!l.files||!l.files.length)throw new Error('לא נמצא בדרייב קובץ ששמו כולל: '+name);
  const mediaRes=await driveFetchWithRetry('https://www.googleapis.com/drive/v3/files/'+l.files[0].id+'?alt=media&supportsAllDrives=true');
  if(!mediaRes.ok)throw new Error('שגיאה בהורדת הקובץ מהדרייב ('+mediaRes.status+')');
  return mediaRes.arrayBuffer();
}

async function getAnyBuffer(names){
  let er;
  for(const n of names){
    try{return await getFileBuffer(n)}
    catch(x){er=x;if(x.code===401||x.code===403||/פג/.test(x.message))throw x}
  }
  throw er||new Error('לא נמצא קובץ תואם');
}

async function getFile(name){
  return XLSX.read(await getFileBuffer(name),{type:'array',cellDates:true});
}

let loadPromise=null;
async function load(){
  if(loadPromise)return loadPromise;
  if(typeof navigator!=='undefined'&&navigator.onLine===false){
    S.syncing=false;
    if(!$('nav').hidden)draw(true);
    return;
  }
  loadPromise=(async()=>{
    const hadUI=!$('nav').hidden||S.exp.length>0||!!salMap();
    S.syncing=true;
    if(hadUI){$('nav').hidden=false;draw(true)}
    else $('#app').innerHTML=skeletonScreen();

    try{
      initXlsxWorker();
      if(!token&&ls('rt'))await refresh();

      let renderedEarly=false;
      const applyExpData=d=>{
        S.exp=d.exp;S.mon=d.mon;S.cp=d.cp;S.bud=d.bud||{};
        if(d.sal&&Object.keys(d.sal).length){
          S.sal=d.sal;S.salAt=Date.now();
          saveSalTplLocal();
          syncSalSvWithSheet();
        }
        S.err='';S.scopeErr=false;
        const allYms=S.exp.map(e=>e.ym);
        if(!allYms.length)S.ym=ymOf(new Date());
        else if(!S.ym||!allYms.includes(S.ym))S.ym=Math.max(...allYms);
        if(!S.pv.from)setPr('12');
      };

      const expTask=getFileBuffer(FILES.exp).then(buf=>parseExcel('exp',buf)).then(d=>{
        if(!hadUI){
          applyExpData(d);
          renderedEarly=true;
          $('nav').hidden=false;
          draw();
        }
        return d;
      });
      const invTask=getFileBuffer(FILES.inv).then(buf=>parseExcel('inv',buf));
      const insTask=getFileBuffer(FILES.ins).then(buf=>parseExcel('ins',buf));
      const mortTask=getAnyBuffer(FILES.mort).then(buf=>parseExcel('mort',buf));

      const [expRes,invRes,insRes,mortRes]=await Promise.allSettled([expTask,invTask,insTask,mortTask]);

      if(expRes.status==='rejected')throw expRes.reason;
      if(!renderedEarly)applyExpData(expRes.value);

      if(invRes.status==='fulfilled'){
        S.inv=invRes.value.inv;S.pen=invRes.value.pen;S.docs=invRes.value.docs;S.invErr='';
      }else{
        S.invErr=invRes.reason&&invRes.reason.message?invRes.reason.message:String(invRes.reason||'');
      }

      if(insRes.status==='fulfilled'){
        S.ins=reviveInsDates(insRes.value);S.insErr='';
      }else{
        const msgIns=insRes.reason&&insRes.reason.message?insRes.reason.message:String(insRes.reason||'');
        S.insErr=msgIns;
        if(/לא נמצא|מבנה/.test(msgIns))S.ins=null;
      }

      if(mortRes.status==='fulfilled'){
        S.mort=reviveMortDates(mortRes.value);S.mortErr='';
      }else{
        const msgMort=mortRes.reason&&mortRes.reason.message?mortRes.reason.message:String(mortRes.reason||'');
        S.mortErr='שגיאה בקריאת קובץ המשכנתא: '+msgMort;
        if(/לא נמצא|מבנה/.test(msgMort))S.mort=null;
      }

      S.syncAt=Date.now();
      saveSnap();
      recordNetWorthSnap();
      S.rt2=0;
      S.syncing=false;
      $('nav').hidden=false;
      draw(renderedEarly);
      S.files=null;
      if(S.tab=='more'&&(S.sub=='dc'||S.sub=='wr'))loadFiles();
      quotes();
      if(window._shopSync)window._shopSync('pull',true);
      syncSalDrive('pull');
    }catch(e){
      S.syncing=false;
      if((e.code===401||/פג/.test(e.message))&&!S.rt2){
        S.rt2=1;
        loadPromise=null;
        if(await refresh())return load();
      }
      S.err=e.message;
      S.scopeErr=!!e.needScope||e.code===403;
      if(S.exp.length||salMap())draw();
      else msg(`${esc(e.message)}<br><br><button class="go" ${S.scopeErr?'data-sync-consent':'data-sync'}>${S.scopeErr?'אשר הרשאות Drive מחדש':'נסה שוב'}</button>`,true);
    }finally{
      loadPromise=null;
    }
  })();
  return loadPromise;
}

function parseIns(wb){
  const sm=wb.Sheets['סיכום'];if(!sm||!sm.C6||!sm.C7)throw new Error('מבנה גיליון ביטוח חיים לא תקין');
  const pr=XLSX.utils.sheet_to_json(wb.Sheets['פרמיות שנתיות']||wb.Sheets[wb.SheetNames[1]],{header:1,raw:true}).slice(4,36),st=fix(sm.C6.v),yrs=+sm.C7.v||0,pay=[];
  for(let n=0;n<yrs*12;n++){const y=Math.floor(n/12),r=pr[y]||[],t=(+r[6]||0)+(+r[7]||0);pay.push({d:new Date(st.getFullYear(),st.getMonth()+n,st.getDate()),a:t?Math.floor(t/12*100)/100:null})}
  return{yrs,pay,pr,end:new Date(st.getFullYear(),st.getMonth()+yrs*12,st.getDate())};
}

function areaChart(pts,opts={}){
  const n=pts.length;if(!n)return '';
  const W=340,H=144,pX=14,pT=20,pB=12,pW=W-pX*2,pH=H-pT-pB;
  const maxV=Math.max(...pts.map(p=>p.v),opts.avg||0,1);
  const coords=pts.map((p,k)=>({
    ...p,k,
    x:+(pX+(n===1?pW/2:(1-k/(n-1))*pW)).toFixed(1),
    y:+(pT+pH-(p.v/maxV)*pH).toFixed(1)
  }));
  let line='M '+coords[0].x+' '+coords[0].y;
  for(let k=1;k<coords.length;k++){
    const a=coords[k-1],b=coords[k],cx=+((a.x+b.x)/2).toFixed(1);
    line+=` C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
  }
  const area=n>1?`${line} L ${coords[n-1].x} ${pT+pH} L ${coords[0].x} ${pT+pH} Z`:'';
  const avgY=opts.avg?+(pT+pH-(opts.avg/maxV)*pH).toFixed(1):null;
  const midY=+(pT+pH*0.5).toFixed(1);
  const gid='ag'+Math.random().toString(36).slice(2,7);
  const payload=encodeURIComponent(JSON.stringify(coords.map(c=>({x:c.x,y:c.y,lb:c.lb,flb:c.flb||c.lb,v:c.v,ym:c.ym||0}))));
  return `<div class="svgc" data-scrb="${payload}">
    <div class="scrub-tip"></div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--g)" stop-opacity=".36"/><stop offset="100%" stop-color="var(--g)" stop-opacity="0"/></linearGradient></defs>
      <line x1="${pX}" y1="${midY}" x2="${W-pX}" y2="${midY}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 4" opacity=".8" vector-effect="non-scaling-stroke"/>
      ${avgY!==null?`<line x1="${pX}" y1="${avgY}" x2="${W-pX}" y2="${avgY}" stroke="var(--b)" stroke-width="1.5" stroke-dasharray="4 4" opacity=".7" vector-effect="non-scaling-stroke"/>`:''}
      ${area?`<path d="${area}" fill="url(#${gid})"/>`:''}
      ${n>1?`<path d="${line}" fill="none" stroke="var(--g)" stroke-width="2.8" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`:''}
      <line class="scrub-ln" x1="0" y1="${pT}" x2="0" y2="${pT+pH}" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="3 3" opacity="0" vector-effect="non-scaling-stroke"/>
      <line class="scrub-dot-ring" x1="0" y1="0" x2="0.001" y2="0" stroke="var(--card)" stroke-width="15" stroke-linecap="round" opacity="0" vector-effect="non-scaling-stroke"/>
      <line class="scrub-dot" x1="0" y1="0" x2="0.001" y2="0" stroke="var(--g)" stroke-width="10" stroke-linecap="round" opacity="0" vector-effect="non-scaling-stroke"/>
      ${coords.map(c=>{const x2=+(c.x+0.001).toFixed(3);return `${c.on?`<line x1="${c.x}" y1="${c.y}" x2="${x2}" y2="${c.y}" stroke="var(--g)" stroke-width="20" stroke-linecap="round" opacity=".18" vector-effect="non-scaling-stroke"/>`:''}<line x1="${c.x}" y1="${c.y}" x2="${x2}" y2="${c.y}" stroke="var(--g)" stroke-width="${c.on?12:9.5}" stroke-linecap="round" vector-effect="non-scaling-stroke" ${c.ym?`data-y="${c.ym}"`:''} style="cursor:pointer"/><line x1="${c.x}" y1="${c.y}" x2="${x2}" y2="${c.y}" stroke="${c.on?'var(--g)':'var(--card)'}" stroke-width="${c.on?6.5:5.2}" stroke-linecap="round" vector-effect="non-scaling-stroke" ${c.ym?`data-y="${c.ym}"`:''} style="cursor:pointer"/>`}).join('')}
    </svg>
    ${opts.showLabels!==false?`<div class="xlabs">${[...coords].reverse().map(c=>`<span class="${c.on?'on':''}" ${c.ym?`data-y="${c.ym}"`:''} style="cursor:pointer">${esc(c.lb)}</span>`).join('')}</div>`:''}
  </div>`;
}

const isRent=e=>/שכר דירה|שכ["״]?ד|משכנתא/.test(String(e.t||'')+' '+String(e.c||''));
function sparkSvg(vals,col){
  if(!vals||vals.length<2)return '';
  const W=74,H=28,p=3.5,mx=Math.max(...vals,1),mn=Math.min(...vals,0),sp=Math.max(mx-mn,1);
  const pts=vals.map((v,i)=>{
    const x=p+(i/(vals.length-1))*(W-p*2);
    const y=H-p-((v-mn)/sp)*(H-p*2);
    return [x.toFixed(1),y.toFixed(1)];
  });
  const d='M '+pts.map(a=>a.join(' ')).join(' L ');
  const last=pts[pts.length-1];
  return `<svg class="tr-spk" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="3.2" fill="${col}"/></svg>`;
}
function trendsCard(ys,i){
  const win=ys.slice(Math.max(0,i-5),i+1);
  if(win.length<4)return `<div class="card sl"><h2>מגמות שקטות</h2><p class="mut">נדרשים לפחות 4 חודשי נתונים לזיהוי מגמות.</p></div>`;
  const mid=Math.floor(win.length/2),prevYms=win.slice(0,mid),recYms=win.slice(mid);
  const cats=[...new Set(S.exp.filter(e=>win.includes(e.ym)&&!isRent(e)&&!isExcl(e)).map(e=>e.c))];
  const items=cats.map(c=>{
    const ser=win.map(y=>T(S.exp.filter(e=>e.ym==y&&e.c==c&&!isRent(e)&&!isExcl(e)),'a'));
    const activeMonths=ser.filter(v=>v>0).length;
    const a1=ser.slice(0,mid).reduce((s,x)=>s+x,0)/prevYms.length;
    const a2=ser.slice(mid).reduce((s,x)=>s+x,0)/recYms.length;
    const diff=a2-a1,rawPct=a1>=150?(diff/a1)*100:0;
    const pctCh=Math.abs(rawPct)<=250?rawPct:0;
    return{c,ser,activeMonths,a1,a2,diff,pctCh,abs:Math.abs(diff)};
  }).filter(x=>x.activeMonths>=2&&x.a1+x.a2>90&&x.abs>30).sort((a,b)=>b.abs-a.abs).slice(0,4);
  if(!items.length)return `<div class="card sl"><h2>מגמות שקטות</h2><p class="mut">ההוצאות השוטפות יציבות מאוד ביחס לרבעון הקודם.</p></div>`;
  return `<div class="card sl"><div><div class="row"><h2>מגמות שקטות</h2><small class="mut">${recYms.length} חוד׳ מול ${prevYms.length} קודמים</small></div><span class="lb">שינויים בקצב השוטף (ללא שכ״ד וחריגים)</span></div><div>${items.map(it=>{
    const up=it.diff>0,col=up?(it.pctCh>18||it.diff>250?'#ef4444':'#f59e0b'):'#10b981';
    const desc=up?`עלייה של ${fmt(it.diff)}/חודש${it.pctCh?` (${Math.round(it.pctCh)}%)`:''}`:`ירידה של ${fmt(-it.diff)}/חודש${it.pctCh?` (${Math.abs(Math.round(it.pctCh))}%)`:''}`;
    return `<div class="tr-row"><span class="ci" style="width:36px;height:36px;font-size:17px;border-radius:12px;background:${col}1c">${ico(it.c)}</span><div class="tr-info"><b>${esc(it.c)}</b><small>${desc}</small></div>${sparkSvg(it.ser,col)}</div>`;
  }).join('')}</div></div>`;
}
function cashflowCard(ys,i){
  const sy=y=>T(S.exp.filter(e=>e.ym==y),'a'),inc=y=>(S.mon.find(x=>x.ym==y)||{}).inc||0,
  l6=ys.slice(Math.max(0,i-5),i+1),wi=l6.filter(y=>inc(y)>0),avgInc=wi.length?T(wi.map(y=>({a:inc(y)})),'a')/wi.length:0,
  mx=Math.max(...l6.map(y=>Math.max(sy(y),inc(y),avgInc)),1),mn=y=>new Date(Math.floor(y/100),y%100-1,1).toLocaleDateString('he-IL',{month:'short'});
  return `<div class="card sl">
    <div class="row" style="padding:0"><h2>הכנסות מול הוצאות</h2><div class="lg2"><span><i class="dot" style="background:var(--g)"></i>הכנסה</span><span><i class="dot" style="background:var(--r)"></i>הוצאה</span></div></div>
    <div class="cf-grid">${l6.map((y,k)=>{
      const iv=inc(y),ev=sy(y),net=iv-ev,on=y==S.ym;
      const ih=iv>0?Math.max(iv/mx*100,7):Math.max(avgInc/mx*100,26);
      const eh=Math.max(ev/mx*100,7);
      return `<div class="cf-col ${on?'on':''}" data-y="${y}">
        <span class="cf-net ${iv>0?(net>=0?'pos':'neg'):'mut'}">${iv>0?(net>=0?'+':'-')+shortK(net):'—'}</span>
        <div class="cf-bars">
          <div class="cf-bar ${iv>0?'inc':'ghost'}" style="height:${ih.toFixed(1)}%;animation-delay:${k*35}ms"></div>
          <div class="cf-bar exp" style="height:${eh.toFixed(1)}%;animation-delay:${k*35+20}ms"></div>
        </div>
        <small>${mn(y)}</small>
      </div>`;
    }).join('')}</div>
  </div>`;
}
function monthSheet(ys,sy){
  if(!S.mPick||!ys.length)return '';
  const latestYm=ys[ys.length-1];
  const byYr={};
  ys.forEach(y=>{const yr=Math.floor(y/100);(byYr[yr]=byYr[yr]||[]).push(y)});
  const years=Object.keys(byYr).sort((a,b)=>+b-+a);
  const mName=y=>new Date(Math.floor(y/100),y%100-1,1).toLocaleDateString('he-IL',{month:'long'});
  return `<div class="ms-back" data-mp-close>
    <div class="ms-sheet">
      <div class="ms-grab"></div>
      <div class="row" style="padding:0 0 8px"><h2 style="margin:0">בחירת חודש</h2>${S.ym!==latestYm?`<button class="chip2 on" data-y="${latestYm}" style="padding:5px 12px;font-size:12px">חזור לחודש הנוכחי ↩</button>`:`<button class="chip2" data-mp-close style="padding:4px 10px;font-size:12px">✕</button>`}</div>
      ${years.map(yr=>`<div><b class="mut" style="font-size:12.5px">${yr}</b><div class="ms-grid">${byYr[yr].slice().reverse().map(y=>`<button class="ms-cell ${y==S.ym?'on':''}" data-y="${y}"><b>${mName(y)}</b><small>${fmt(sy(y))}</small></button>`).join('')}</div></div>`).join('')}
    </div>
  </div>`;
}
function home(){
  const ys=[...new Set(S.exp.map(e=>e.ym))].sort((a,b)=>a-b);
  if(!ys.length)return `<div class="card"><p class="mut" style="text-align:center;margin:8px 0">אין עדיין נתוני הוצאות להצגה. לחץ על כפתור הסנכרון למעלה.</p></div>`;
  const i=ys.indexOf(S.ym),sy=y=>T(S.exp.filter(e=>e.ym==y),'a'),
  m=S.exp.filter(e=>e.ym==S.ym),tot=sy(S.ym),
  mExcl=m.filter(isExcl),exclSum=T(mExcl,'a'),
  rent=T(m.filter(isRent),'a'),varTot=Math.max(0,tot-rent-exclSum),
  pm=ys.slice(Math.max(0,i-6),i),
  avg=pm.length?T(S.exp.filter(e=>pm.includes(e.ym)&&!isExcl(e)),'a')/pm.length:0,
  pmRentMonths=pm.filter(y=>S.exp.some(e=>e.ym==y&&isRent(e))),
  avgRent=pmRentMonths.length?T(S.exp.filter(e=>pmRentMonths.includes(e.ym)&&isRent(e)),'a')/pmRentMonths.length:0,
  avgVar=pm.length?T(S.exp.filter(e=>pm.includes(e.ym)&&!isRent(e)&&!isExcl(e)),'a')/pm.length:0,
  inc=(S.mon.find(x=>x.ym==S.ym)||{}).inc||0,
  cat={};
  m.forEach(e=>(cat[e.c]=cat[e.c]||[]).push(e));
  const cs=Object.entries(cat).map(([c,a])=>[c,T(a,'a'),a]).sort((x,y)=>y[1]-x[1]),
  cav=c=>pm.length?T(S.exp.filter(e=>pm.includes(e.ym)&&e.c==c&&!isExcl(e)),'a')/pm.length:0,
  last=ys.slice(Math.max(0,i-5),i+1),sums=last.map(sy),
  now=new Date(),yr=Math.floor(S.ym/100),mo=S.ym%100,
  isCur=yr==now.getFullYear()&&mo==now.getMonth()+1,
  isEarly=isCur&&now.getDate()<=7,
  daysInMonth=new Date(yr,mo,0).getDate(),
  days=isCur?Math.max(1,now.getDate()):daysInMonth,
  daysLeft=isCur?Math.max(1,daysInMonth-now.getDate()+1):0,
  monthPct=isCur?Math.min(100,Math.max(4,(now.getDate()/daysInMonth)*100)):100;

  const totBud=Object.values(S.bud).reduce((x,y)=>x+y,0);
  const budRentEntry=Object.entries(S.bud).find(([c])=>/דיור|שכר|משכנת/.test(c));
  const expectedRent=rent>0?rent:avgRent;
  const varBudFromSheet=totBud>0?(budRentEntry?Math.max(0,totBud-budRentEntry[1]):totBud):0;
  const varTarget=varBudFromSheet>0?varBudFromSheet:(avgVar||1);
  const varPct=varTarget>0?(varTot/varTarget)*100:0;
  const expectedByToday=isCur?varTarget*(monthPct/100):varTarget;
  const paceDiffToday=varTot-expectedByToday;
  const paceRatio=expectedByToday>0?varTot/expectedByToday:0;

  const dailyVarPace=varTot/days;
  const histDailyVar=varTarget>0?varTarget/daysInMonth:dailyVarPace;
  const projectedVar=isEarly?(varTot+histDailyVar*Math.max(0,daysInMonth-days)):(dailyVarPace*daysInMonth);
  const projectedTotal=projectedVar+expectedRent;
  const baselineTotal=varBudFromSheet>0?(budRentEntry?totBud:totBud+expectedRent):(avgVar+expectedRent);
  const projDiff=baselineTotal>0?projectedTotal-baselineTotal:0;

  let st='ok';
  if(varTarget>0){
    if(varPct>102||(isCur&&!isEarly&&paceRatio>1.18))st='bad';
    else if(isCur&&!isEarly&&paceRatio>1.03)st='warn';
  }
  const varLeft=Math.max(0,varTarget-varTot);
  const diffVarClosed=avgVar?varTot-avgVar:0;

  let pillMain='',pillSub='';
  if(isCur){
    if(st=='ok'){
      pillMain=varLeft>0?`קצב מאוזן · נותרו ${fmt(varLeft)} לשוטף`:`הגעת ליעד השוטף החודשי`;
      pillSub=`יום ${now.getDate()}/${daysInMonth}`;
    }else if(st=='warn'){
      pillMain=`קצב מעט מהיר · נותרו ${fmt(varLeft)} לשוטף`;
      pillSub=`יום ${now.getDate()}/${daysInMonth}`;
    }else{
      pillMain=varTot>varTarget?`חריגה בשוטף של ${fmt(varTot-varTarget)}`:`קצב גבוה ביחס לזמן שעבר`;
      pillSub=`עוד ${daysLeft} ימים`;
    }
  }else{
    const net=inc?inc-tot:0;
    pillMain=inc?(net>=0?`חודש סגור · נשארו ${fmt(net)}`:`חודש סגור · חריגה של ${fmt(-net)}`):`סיכום ${ymLb(S.ym)}`;
    pillSub=`${m.length} פעולות`;
  }

  let heroChip='';
  if(isCur&&varTarget>0){
    if(Math.abs(paceDiffToday)<=25)heroChip=`<span class="chip">✓ בקצב מדויק להיום</span>`;
    else if(paceDiffToday<0)heroChip=`<span class="chip">↓ ${fmt(-paceDiffToday)} מתחת לקצב להיום</span>`;
    else heroChip=`<span class="chip ${st=='bad'?'bad':'warn'}">↑ ${fmt(paceDiffToday)} מעל הקצב להיום</span>`;
  }else if(!isCur&&avgVar){
    heroChip=`<span class="chip ${diffVarClosed>0?'bad':''}">${diffVarClosed>0?'↑':'↓'} ${fmt(Math.abs(diffVarClosed))} בשוטף ${diffVarClosed>0?'יותר':'פחות'} מהממוצע</span>`;
  }

  const pts=last.map((y,k)=>({
    ym:y,v:sums[k],on:y==S.ym,
    lb:new Date(Math.floor(y/100),y%100-1,1).toLocaleDateString('he-IL',{month:'short'}),
    flb:new Date(Math.floor(y/100),y%100-1,1).toLocaleDateString('he-IL',{month:'long',year:'2-digit'})
  }));
  const rentTag=rent>0?`מתוכם ${fmt(rent)} שכ״ד`:'';

  return `<div class="mp-bar">
    <div class="mp-strip" id="mstrip">${ys.map(y=>`<button class="mp-pill ${y==S.ym?'on':''}" ${y==S.ym?'data-mp-open':`data-y="${y}"`}>${y==S.ym?ymLb(y):ymShort(y)}</button>`).join('')}</div>
    <button class="mp-cal" data-mp-open title="בחירת חודש ושנה" aria-label="בחירת חודש ושנה">${SVG.cal}</button>
  </div>
  <div class="dpill ${st=='ok'?'':st}"><div class="dp-main"><span class="dp-dot"></span><span class="dp-txt">${pillMain}</span></div><span class="dp-sub">${pillSub}</span></div>
  <div class="card hg ${st=='ok'?'':st}"><div class="row" style="padding:0"><span class="lb">סך הוצאות החודש</span>${rentTag?`<small class="mut">${rentTag}</small>`:''}</div><div class="big">${fmt(tot)}</div>
  <div class="chips-inline">${heroChip}${exclSum>0?`<span class="chip mut">ללא חריגים: ${fmt(tot-exclSum)}</span>`:''}${S.excl.size>0?`<button class="ex-btn" data-ex-share title="העתק או שתף קישור לסנכרון סימוני החד-פעמי במכשיר נוסף">שתף סימונים ↗</button>`:''}</div>
  ${isCur?`<div class="rr-box">
    <div class="rr-l">
      <span class="rr-lbl">${isEarly?'צפי סוף חודש (הערכה)':'צפי סוף חודש'}</span>
      <span class="rr-val">${fmt(projectedTotal)}</span>
    </div>
    ${baselineTotal>0?`<div class="rr-r"><span class="chip ${projDiff>150?'bad':projDiff>0?'warn':''}">${projDiff>0?'↑ +':'↓ '}${fmt(Math.abs(projDiff))}</span><small class="mut" style="font-size:11px">${varBudFromSheet>0?'מהתקציב':'מהממוצע'}</small></div>`:''}
  </div>`:''}
  ${varTarget>0?`<div class="pace-box">
    <div class="pace-hdr"><span><b>הוצאות שוטפות</b> <small class="mut">(ללא שכ״ד)</small></span><span><b>${fmt(varTot)}</b> <small class="mut">/ ${fmt(varTarget)}</small></span></div>
    <div class="pace-track">
      <div class="pace-fill ${st=='ok'?'':st}" style="width:${Math.min(100,varPct).toFixed(1)}%"></div>
      ${isCur?`<div class="pace-now" style="inset-inline-start:${monthPct.toFixed(1)}%"><span class="pace-now-lbl">היום</span></div>`:''}
    </div>
    <div class="pace-ft"><span>${Math.round(varPct)}% נוצל</span><span>${varTot<=varTarget?'נותרו '+fmt(varLeft):'חריגה '+fmt(varTot-varTarget)}</span></div>
  </div>`:''}
  ${inc?(()=>{
    const effTot=tot+(rent===0&&isCur?avgRent:0);
    const netCash=inc-effTot;
    const savRate=(netCash/inc)*100;
    const clampedBar=Math.max(0,Math.min(100,savRate));
    const pctTxt=S.hide?'•••':(savRate>=0?`${Math.round(savRate)}%`:`${Math.round(savRate)}%`);
    return `<div class="row s" style="margin-top:12px"><span class="lb">הכנסה ${fmt(inc)}</span><b class="${netCash<0?'neg':'pos'}">יתרה ${fmt(netCash)}</b></div>
    <div class="sav-box"><div class="sav-top"><span>שיעור חיסכון חודשי</span><span class="sav-pct ${netCash<0?'neg':''}">${pctTxt}</span></div><div class="sav-bar"><i class="${netCash<0?'neg':''}" style="width:${clampedBar.toFixed(1)}%"></i></div></div>`;
  })():''}
  <div class="trio">
    ${isCur?`<div><span class="lb">נותר לשוטף</span><b>${fmt(varLeft)}</b></div><div><span class="lb">ממוצע ליום</span><b>${fmt(dailyVarPace)}</b></div><div><span class="lb">פעולות</span><b>${m.length}</b></div>`
           :`<div><span class="lb">הוצאות שוטפות</span><b>${fmt(varTot)}</b></div><div><span class="lb">ממוצע ליום</span><b>${fmt(tot/daysInMonth)}</b></div><div><span class="lb">פעולות</span><b>${m.length}</b></div>`}
  </div></div>
  ${renderHomeModules(tot,inc,avg,cs,cav,ys,i)}`;
}

function inv0(){
  if(!S.inv.length)return `<div class="card"><p>${esc(S.invErr||'לא נמצאו נתוני השקעות.')}</p></div>`;
  const val=T(S.inv,'שווי ₪'),cost=T(S.inv,'עלות ₪'),gain=val-cost,tax=Math.max(0,gain)*.25,acc={},top=[...S.inv].sort((a,b)=>b['שווי ₪']-a['שווי ₪']);
  S.inv.forEach(r=>(acc[r['חשבון']||'כללי']=acc[r['חשבון']||'כללי']||[]).push(r));
  const restVal=top.slice(6).reduce((s,r)=>s+num(r['שווי ₪']),0);
  const segs=[...top.slice(0,6).map((r,k)=>[String(r['שם']||''),num(r['שווי ₪']),COL[k]]),...(restVal>0?[['אחר',restVal,'#94a3b8']]:[])];
  return `<div class="card hg"><div class="lb">סך השקעות</div><div class="big">${fmt(val)}</div><span class="chip ${gain<0?'bad':''}">${cost>0?pct(gain/cost*100)+' · ':''}${fmt(gain)} רווח</span>
  <div class="stack">${segs.map(([,v,col])=>`<i style="width:${(v/(val||1)*100).toFixed(2)}%;background:${col}"></i>`).join('')}</div><div class="lg2">${segs.map(([name,v,col])=>`<span><i class="dot" style="background:${col}"></i>${esc(name)} ${Math.round(v/(val||1)*100)}%</span>`).join('')}</div>
  <div class="trio"><div><span class="lb">מס משוער</span><b>${fmt(-tax)}</b></div><div><span class="lb">אחרי מס</span><b>${fmt(val-tax)}</b></div></div>
  <p class="mut" style="margin:10px 0 0">הערכה בלבד: מס 25% על הרווח הכולל, בלי הצמדה למדד ובלי עמלות.</p></div>`+
  Object.entries(acc).map(([n,a],k)=>{const v=T(a,'שווי ₪'),c=T(a,'עלות ₪');
  return `<div class="card"><div class="row"><h2 style="margin:0">${esc(n)}</h2><b>${fmt(v)}</b></div><div class="row s"><span class="mut">תשואה</span><b class="${v<c?'neg':'pos'}">${c>0?pct((v-c)/c*100):'—'}</b></div>
  ${a.sort((x,y)=>y['שווי ₪']-x['שווי ₪']).map(r=>{const g=r['שווי ₪']-(+r['עלות ₪']||0),sh=r['שווי ₪']/(v||1)*100;return `<div style="padding-top:12px"><div class="row" style="padding:0"><span>${esc(r['שם'])}${r.live?' <small class="pos">● חי</small>':''}</span><b>${fmt(r['שווי ₪'])}</b></div>
  <div class="row s mut" style="padding:0"><span>${sh.toFixed(0)}% מהחשבון</span><span class="${g<0?'neg':'pos'}">${fmt(g)}</span></div><div class="bar" style="margin:4px 0 0"><i style="width:${sh}%;background:${COL[k*3%8]}"></i></div></div>`}).join('')}</div>`}).join('');
}

const pk=e=>S.pv.by=='y'?Math.floor(e.ym/100):e.ym,nf=n=>S.hide?'•••':Math.round(n).toLocaleString('he-IL');
const plb=p=>!p?'':S.pv.by=='y'?String(p):new Date(Math.floor(p/100),p%100-1,1).toLocaleDateString('he-IL',{month:'short',year:'2-digit'});
function setPr(p){
  const P=S.pv,ys=[...new Set(S.exp.map(e=>e.ym))].sort((a,b)=>a-b);
  if(!ys.length){const cur=ymOf(new Date());P.pr=p;P.from=cur;P.to=cur;P.dr=null;return}
  const mx=ys[ys.length-1],yr=Math.floor(mx/100),mo=mx%100;P.pr=p;P.to=mx;P.dr=null;
  if(p=='all')P.from=ys[0];
  else if(p=='ty')P.from=yr*100+1;
  else if(p=='ly'){P.from=(yr-1)*100+1;P.to=(yr-1)*100+12}
  else if(p=='qtr'){
    const qStartMo=Math.floor((mo-1)/3)*3+1;
    const qEndMo=qStartMo+2;
    const qStart=yr*100+qStartMo;
    const qEnd=yr*100+qEndMo;
    const inQ=ys.filter(y=>y>=qStart&&y<=qEnd);
    P.from=inQ.length?inQ[0]:ys[Math.max(0,ys.length-3)];
    P.to=inQ.length?inQ[inQ.length-1]:mx;
  }
  else P.from=ys[Math.max(0,ys.length-+p)];
}

function pvSlidesExtra(ys){
  const i=ys.indexOf(S.ym),sy=y=>T(S.exp.filter(e=>e.ym==y),'a'),inc=y=>(S.mon.find(x=>x.ym==y)||{}).inc||0,
  l6=ys.slice(Math.max(0,i-5),i+1),wi=l6.filter(y=>inc(y)>0),
  si=T(wi.map(y=>({a:inc(y)})),'a'),se=T(wi.map(y=>({a:sy(y)})),'a'),
  w=ys.slice(Math.max(0,i-11),i+1),cnt={};
  S.exp.filter(e=>w.includes(e.ym)).forEach(e=>{(cnt[e.t]=cnt[e.t]||new Set()).add(e.ym)});
  const fx=new Set(Object.keys(cnt).filter(t=>w.length>=4&&cnt[t].size>=w.length*.75)),cur=S.exp.filter(e=>e.ym==S.ym),fs=T(cur.filter(e=>fx.has(e.t)),'a'),tot=sy(S.ym),
  topf=Object.entries(cur.filter(e=>fx.has(e.t)).reduce((o,e)=>(o[e.t]=(o[e.t]||0)+e.a,o),{})).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const out=[];
  if(si){
    out.push(`<div class="card sl"><div><div class="row" style="padding:0"><h2>שיעור חיסכון (חצי שנה אחרונה)</h2><b class="pos" style="font-size:20px">${Math.round((si-se)/si*100)}%</b></div><span class="lb">מתוך ${wi.length} חודשים עם משכורת</span></div><div class="trio"><div><span class="lb">משכורת ממוצעת</span><b>${fmt(si/wi.length)}</b></div><div><span class="lb">הוצאות ממוצעות</span><b>${fmt(se/wi.length)}</b></div><div><span class="lb">נחסך בממוצע</span><b class="${si>se?'pos':'neg'}">${fmt((si-se)/wi.length)}</b></div></div></div>`);
  }
  if(fx.size){
    out.push(`<div class="card sl"><div><h2>קבועות מול משתנות (${ymLb(S.ym)})</h2><span class="lb">הוצאות שחוזרות כמעט כל חודש נחשבות קבועות</span><div class="stack" style="height:12px"><i style="width:${fs/(tot||1)*100}%;background:var(--b)"></i><i style="width:${(1-fs/(tot||1))*100}%;background:var(--line)"></i></div></div><div><div class="trio" style="margin-top:4px"><div><span class="lb">קבועות (${Math.round(fs/(tot||1)*100)}%)</span><b>${fmt(fs)}</b></div><div><span class="lb">משתנות (${Math.round((1-fs/(tot||1))*100)}%)</span><b>${fmt(tot-fs)}</b></div></div>${topf.map(([t,v])=>`<div class="row s"><span class="mut">${esc(t)}</span><b>${fmt(v)}</b></div>`).join('')}</div></div>`);
  }
  return out;
}

function pv(){
  const P=S.pv,R=P.rows,all=[...new Set(S.exp.map(e=>e.ym))].sort((a,b)=>a-b);
  if(!all.length)return `<div class="card"><p class="mut" style="text-align:center">אין נתוני הוצאות לניתוח.</p></div>`;
  const inr=S.exp.filter(e=>e.ym>=P.from&&e.ym<=P.to),
  cats=[...new Set(inr.map(e=>e.c))].sort((a,b)=>T(inr.filter(e=>e.c==b),'a')-T(inr.filter(e=>e.c==a),'a')),
  qNorm=String(P.q||'').toLowerCase(),
  d=inr.filter(e=>(!P.sel.length||P.sel.includes(e.c))&&(!qNorm||(e.t+' '+e.c).toLowerCase().includes(qNorm))),per=[];
  if(P.by=='y'){for(let y=Math.floor(P.from/100);y<=Math.floor(P.to/100);y++)per.push(y)}else{for(let y=Math.floor(P.from/100),m=P.from%100;y*100+m<=P.to;m==12?(y++,m=1):m++)per.push(y*100+m)}
  const M={};d.forEach(e=>{const r=e[R],p=pk(e);M[r]=M[r]||{t:0,p:{}};M[r].t+=e.a;M[r].p[p]=(M[r].p[p]||0)+e.a});
  const rs=Object.entries(M).sort((a,b)=>b[1].t-a[1].t),pt=per.map(p=>T(d.filter(e=>pk(e)==p),'a')),tot=T(d,'a'),nmo=all.filter(y=>y>=P.from&&y<=P.to).length||1,
  mxc=Math.max(...rs.flatMap(([,v])=>Object.values(v.p)),1),
  rawMaxP=pt.length?Math.max(...pt):0,
  pi=rawMaxP>0?pt.indexOf(rawMaxP):-1,
  pr=[['qtr','רבעון'],['3','3 חודשים'],['6','חצי שנה'],['12','שנה'],['ty','השנה'],['ly','שנה שעברה'],['all','הכל']],
  opt=v=>all.map(y=>`<option value="${y}" ${y==v?'selected':''}>${ymLb(y)}</option>`).join('');
  const row=(r,v,sb)=>`<tr><td ${R=='c'&&!sb?`data-x="${encodeURIComponent(r)}" style="cursor:pointer"`:`data-n="${encodeURIComponent(r)}" data-k="${sb?'t':R}" style="cursor:pointer"`}>${sb?'<span class="mut">↳ </span>':R=='c'?(P.open.includes(r)?'▾ ':'▸ '):''}${esc(r)}</td>${per.map(p=>{const x=v.p[p]||0;return `<td data-r="${encodeURIComponent(r)}" data-k="${sb?'t':R}" data-p="${p}" style="background:rgba(16,185,129,${(x/mxc*.42).toFixed(3)})">${x?nf(x):''}</td>`}).join('')}<td data-r="${encodeURIComponent(r)}" data-k="${sb?'t':R}" data-p=""><b>${nf(v.t)}</b></td></tr>`,
  sub=c=>{const m={};d.filter(e=>e.c==c).forEach(e=>{m[e.t]=m[e.t]||{t:0,p:{}};m[e.t].t+=e.a;m[e.t].p[pk(e)]=(m[e.t].p[pk(e)]||0)+e.a});return Object.entries(m).sort((a,b)=>b[1].t-a[1].t)};
  const pvPts=per.map((p,k)=>({v:pt[k],lb:plb(p),flb:plb(p),on:k===pi}));
  const extraSlides=pvSlidesExtra(all);
  const dotCount=4+extraSlides.length;
  return `<div class="card"><h2>ניתוח הוצאות</h2><div class="chips">${pr.map(([k,t])=>`<button class="chip2 ${P.pr==k?'on':''}" data-pr="${k}">${t}</button>`).join('')}</div>
  <div class="chips"><select data-sel="from">${opt(P.from)}</select><span class="mut">עד</span><select data-sel="to">${opt(P.to)}</select></div>
  <div class="chips"><div class="qwrap"><input data-q placeholder="חיפוש הוצאה ספציפית (למשל: חשמל)" value="${esc(P.q)}">${P.q?'<button class="qclr" data-qclr aria-label="נקה חיפוש">✕</button>':''}</div></div>
  <div class="chips"><button class="chip2 ${P.by=='m'?'on':''}" data-by="m">לפי חודש</button><button class="chip2 ${P.by=='y'?'on':''}" data-by="y">לפי שנה</button><button class="chip2 ${R=='c'?'on':''}" data-rows="c">קטגוריות</button><button class="chip2 ${R=='t'?'on':''}" data-rows="t">סוגי הוצאה</button></div></div>
  <div class="car"><div class="card sl"><div><div class="lb">סך הכל בטווח${P.sel.length?' ('+P.sel.length+' קטגוריות נבחרו)':''}</div><div class="big">${fmt(tot)}</div>
  <div class="trio"><div><span class="lb">ממוצע לחודש</span><b>${fmt(tot/nmo)}</b></div><div><span class="lb">חודשים</span><b>${nmo}</b></div><div><span class="lb">שיא${pi>=0&&per[pi]?' · '+plb(per[pi]):''}</span><b>${fmt(rawMaxP)}</b></div></div></div>
  ${areaChart(pvPts,{avg:tot/nmo,showLabels:per.length<=12})}</div>
  ${pxs(rs,tot,nmo,d,P,all)}${extraSlides.join('')}</div><div class="dots">${Array.from({length:dotCount},(_,k)=>`<i data-dot="${k}" class="${k?'':'on'}"></i>`).join('')}</div><div class="card"><h2>סינון קטגוריות</h2><div class="chips">${cats.map(c=>`<button class="chip2 ${P.sel.includes(c)?'on':''}" data-cat="${encodeURIComponent(c)}">${ico(c)} ${esc(c)}</button>`).join('')}</div><span class="mut">בחירה מרובה. בלי בחירה מוצגות כולן.</span></div>
  <div class="card" id="tb"><h2>טבלה</h2><div class="tw"><table><tr><th></th>${per.map(p=>`<th>${esc(plb(p))}</th>`).join('')}<th>סה״כ</th></tr>
  ${rs.map(([r,v])=>row(r,v,0)+(R=='c'&&P.open.includes(r)?sub(r).map(([t,u])=>row(t,u,1)).join(''):'')).join('')}
  <tr><td><b>סה״כ</b></td>${pt.map(x=>`<td><b>${nf(x)}</b></td>`).join('')}<td><b>${nf(tot)}</b></td></tr></table></div><span class="mut">לחץ על תא להצגת ההוצאות שבו.</span></div>
  ${P.dr?(()=>{const it=d.filter(e=>e[P.dr.k||R]==P.dr.r&&(P.dr.p==null||pk(e)==P.dr.p)).sort((a,b)=>P.dr.p==null?b.ym-a.ym||b.a-a.a:b.a-a.a);return `<div class="card" id="dr"><div class="row"><h2>${esc(P.dr.r)} · ${P.dr.p==null?'כל התקופה':esc(plb(P.dr.p))}</h2><button class="chip2" data-up>↑ לטבלה</button></div><div class="row s"><span class="mut">${it.length} פעולות · ממוצע ${fmt(it.length?T(it,'a')/it.length:0)}</span><b>${fmt(T(it,'a'))}</b></div>${P.dr.p==null?(P.dr.k=='c'?brk(it):''):it.map(e=>`<div class="row s"><span>${esc(e.t)} <span class="mut">${ymLb(e.ym)}</span></span><b>${fmt(e.a)}</b></div>`).join('')}</div>`})():''}`;
}

function nw(){const v=T(S.inv,'שווי ₪'),p=T(S.pen,'שווי ₪');if(!v&&!p)return '';
  return `<div class="card hg"><div class="lb">סך שווי נקי (השקעות ופנסיה)</div><div class="big">${fmt(v+p)}</div><div class="stack"><i style="width:${v/(v+p)*100}%;background:${COL[0]}"></i><i style="width:${p/(v+p)*100}%;background:${COL[1]}"></i></div>
  <div class="trio"><div><span class="lb">השקעות (${Math.round(v/(v+p)*100)}%)</span><b>${fmt(v)}</b></div><div><span class="lb">פנסיה והשתלמות (${Math.round(p/(v+p)*100)}%)</span><b>${fmt(p)}</b></div></div></div>`}
function penCard(){return S.pen.length?`<div class="card"><h2>חיסכון פנסיוני</h2>${S.pen.map(r=>`<div class="row"><span>${esc(r['שם'])} <span class="mut">${esc(r['סוג']||'')}</span></span><b>${fmt(r['שווי ₪'])}</b></div>`).join('')}<p class="mut">לפי הדוח האחרון בקובץ. לעדכון ערוך את הגיליון פנסיה.</p></div>`:''}
function inv(){return (S.qt?`<p class="mut" style="margin:4px 6px">● מחירים חיים עודכנו ב-${esc(S.qt)}</p>`:'')+nw()+nwHistoryCard()+inv0()+penCard()}

function todayISO(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addMonthsISO(isoDate,months){
  const mNum=Number(months)||0;
  if(!isoDate||mNum<=0)return '';
  const [y,m,d]=String(isoDate).split('-').map(Number);
  if(!y||!m||!d)return '';
  const tot=y*12+(m-1)+mNum;
  const ny=Math.floor(tot/12),nm=tot%12;
  const maxD=new Date(ny,nm+1,0).getDate();
  return `${ny}-${String(nm+1).padStart(2,'0')}-${String(Math.min(d,maxD)).padStart(2,'0')}`;
}
function parseLocalDate(val){
  if(!val)return null;
  if(val instanceof Date)return isNaN(+val)?null:val;
  if(typeof val==='number'&&val>20000&&val<100000){
    const d=new Date(Math.round((val-25569)*864e5)+432e5);
    return isNaN(+d)?null:d;
  }
  const s=String(val).trim();
  const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(iso)return new Date(+iso[1],+iso[2]-1,+iso[3],12,0,0);
  const dmy=s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if(dmy)return new Date(+dmy[3],+dmy[2]-1,+dmy[1],12,0,0);
  const d=new Date(s);
  return isNaN(+d)?null:d;
}
function normDocKey(s){
  return String(s||'').replace(/\(.*?\)/g,'').replace(/\s*-\s*\d{4}-\d{2}-\d{2}$/,'').replace(/[_\-]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
}
function extractDriveId(url){
  const m=String(url||'').match(/\/d\/([a-zA-Z0-9_-]{10,})|[?&]id=([a-zA-Z0-9_-]{10,})/);
  return m?(m[1]||m[2]):'';
}
function dc0(){
  const now=new Date(),F=S.files,files=F&&typeof F==='object'&&Array.isArray(F.out)?F.out:null,
  wList=window._getWarranties?window._getWarranties():[],
  docs=S.docs.map(d=>{
    const rawName=String(d['שם']||'').trim();
    const k=normDocKey(rawName);
    const linkId=extractDriveId(d['קישור']);
    return{...d,rawName,k,linkId};
  }).filter(d=>d.k),
  usedDocs=new Set(),
  linkedFileIds=new Set(),
  linkedFileLinks=new Set(),
  mk=d=>({cat:String(d['קטגוריה']||'').trim(),who:String(d['אדם']||'').trim(),x:parseLocalDate(d['תוקף עד']),sens:String(d['רגיש']||'').trim()=='כן'});

  wList.forEach(w=>{
    const addLink=lnk=>{
      if(!lnk)return;
      linkedFileLinks.add(lnk);
      const eid=extractDriveId(lnk);
      if(eid)linkedFileIds.add(eid);
    };
    if(w.fileId)linkedFileIds.add(w.fileId);
    addLink(w.fileLink);
    if(w.coverId)linkedFileIds.add(w.coverId);
    addLink(w.coverLink);
    if(Array.isArray(w.attachments)){
      w.attachments.forEach(a=>{
        if(a&&a.id)linkedFileIds.add(a.id);
        if(a&&a.link)addLink(a.link);
      });
    }
  });
  docs.forEach(d=>{
    if(d.linkId)linkedFileIds.add(d.linkId);
    if(d['קישור'])linkedFileLinks.add(String(d['קישור']).trim());
  });

  let L=[];
  if(files){
    files.forEach(f=>{
      if(f.name===APP_CONFIG.shoppingFileName||f.name===SAL_DRIVE_FILE||/^my_money_.*\.json$/i.test(f.name))return;
      const gFolder=String(f.g||'').trim();
      if(gFolder===APP_CONFIG.receiptsSubFolder||gFolder.startsWith(APP_CONFIG.receiptsSubFolder+' / '))return;
      if((f.id&&linkedFileIds.has(f.id))||(f.webViewLink&&linkedFileLinks.has(f.webViewLink)))return;
      const baseTitle=f.name.replace(/\.[^.]+$/,'');
      const tNorm=normDocKey(baseTitle);
      let bestDoc=null,bestScore=0;
      docs.forEach(d=>{
        if(usedDocs.has(d))return;
        if(d.linkId&&f.id&&d.linkId===f.id){bestDoc=d;bestScore=1e6;return}
        if(d.k.length<2)return;
        if(tNorm===d.k){
          const sc=1000+d.k.length;
          if(sc>bestScore){bestScore=sc;bestDoc=d}
        }else if(d.k.length>=3&&tNorm.includes(d.k)){
          const whoFirst=String(d['אדם']||'').trim().split(' ')[0].toLowerCase();
          const whoBonus=whoFirst&&whoFirst.length>=2&&tNorm.includes(whoFirst)?50:0;
          const sc=d.k.length+whoBonus;
          if(sc>bestScore){bestScore=sc;bestDoc=d}
        }
      });
      if(bestDoc)usedDocs.add(bestDoc);
      const displayName=bestDoc?bestDoc.rawName:baseTitle.replace(/\s*-\s*\d{4}-\d{2}-\d{2}$/,'').trim();
      L.push({n:displayName,link:f.webViewLink,...(bestDoc?mk(bestDoc):{cat:String(gFolder.split(' / ')[0]||'').trim()||'כללי',who:'',x:null,sens:false})});
    });
    docs.filter(d=>!usedDocs.has(d)).forEach(d=>L.push({n:d.rawName,link:d['קישור']||'',missing:!d['קישור'],...mk(d)}));
  }else{
    docs.forEach(d=>L.push({n:d.rawName,link:d['קישור']||'',od:!d['קישור'],...mk(d)}));
  }

  const allCount=L.length;
  const dcWithDays=L.map(d=>{
    const days=d.x?Math.round((d.x-now)/864e5):null;
    const st=days===null?'none':days<0?'expired':days<=90?'soon':'valid';
    return{...d,days,st};
  });
  const cntDcSoon=dcWithDays.filter(d=>d.st==='soon').length;
  const cntDcExp=dcWithDays.filter(d=>d.st==='expired').length;
  const cs=[...new Set(dcWithDays.map(d=>d.cat).filter(Boolean))];
  if(S.dcf&&!cs.includes(S.dcf))S.dcf='';
  const curDcSt=S.dcStatus||'all';
  L=dcWithDays.filter(d=>{
    if(S.dcf&&d.cat!==S.dcf)return false;
    if(curDcSt==='soon'&&d.st!=='soon')return false;
    if(curDcSt==='expired'&&d.st!=='expired')return false;
    if(curDcSt==='valid'&&!(d.st==='valid'||d.st==='none'))return false;
    return true;
  }).sort((a,b)=>(a.x?+a.x:9e15)-(b.x?+b.x:9e15)||String(a.n).localeCompare(String(b.n),'he'));

  return `<h2>מסמכים ותוקפים</h2>
  <div class="chips" style="margin-bottom:4px">
    <button class="chip2 ${curDcSt==='all'?'on':''}" data-dcs="all">הכל (${allCount})</button>
    <button class="chip2 ${curDcSt==='soon'?'on':''}" data-dcs="soon">עומד לפוג (${cntDcSoon})</button>
    <button class="chip2 ${curDcSt==='expired'?'on':''}" data-dcs="expired">פג תוקף (${cntDcExp})</button>
  </div>
  <div class="chips"><button class="chip2 ${S.dcf?'':'on'}" data-dcf="">כל הקטגוריות</button>${cs.map(c=>`<button class="chip2 ${S.dcf==c?'on':''}" data-dcf="${encodeURIComponent(c)}">${esc(c)}</button>`).join('')}</div>${F=='loading'?'<p class="mut">טוען קבצים מהדרייב...</p>':''}`+
  (L.length?L.map(d=>{const n=d.x?Math.round((d.x-now)/864e5):null,tx=n===null?'ללא תוקף':n<0?'פג':n<60?n+' ימים':n<730?Math.round(n/30.4)+' חודשים':Math.round(n/365)+' שנים',cl=n===null?'mut':n<0?'neg':n<90?'amb':'pos';
    return `<div class="cp"><div class="pl ${cl}">${tx}</div><div style="min-width:0"><b>${esc(d.n)}${d.sens?' 🔒':''}</b><div class="mut">${[esc(d.who),esc(d.cat),d.x?'עד '+dl(d.x):'',d.missing?'⚠ אין קובץ בדרייב':''].filter(Boolean).join(' · ')}</div></div>${d.link?`<button class="pr" data-l="${encodeURIComponent(d.link)}">פתח</button>`:d.od?`<button class="pr" data-od="${encodeURIComponent(d.n)}" data-op="${encodeURIComponent(d.who||'')}">פתח</button>`:''}</div>`}).join(''):'<div class="card"><p class="mut" style="margin:0;text-align:center">אין מסמכים להצגה בקטגוריה זו.</p></div>');
}

const W_CAT_ICO={'מוצרי חשמל':'🔌','רכב':'🚗','ריהוט':'🛋️','אלקטרוניקה ומחשבים':'💻','בית וגינה':'🏡','שונות':'📦'};
const NW_HIST_KEY='my_money_nw_history_v1';
const driveThumbUrl=id=>id?`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w400`:'';
const normalizeWarranty=w=>{
  if(!w||typeof w!=='object')return null;
  const atts=Array.isArray(w.attachments)?w.attachments.filter(a=>a&&(a.link||a.id)):[];
  if(!atts.length&&(w.fileLink||w.fileId)){
    atts.push({id:w.fileId||'',name:w.fileName||'קבלה / תעודת אחריות',link:w.fileLink||''});
  }
  const coverId=w.coverId||extractDriveId(w.coverLink||'');
  const coverLink=w.coverLink||(coverId?`https://drive.google.com/file/d/${coverId}/view`:'');
  return{...w,coverId,coverLink,attachments:atts};
};
const getAllWarranties=()=>(window._getWarranties?window._getWarranties():[]).map(normalizeWarranty).filter(Boolean);
const getCustomWCats=()=>{try{const a=JSON.parse(ls('w_custom_cats')||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}};
const saveCustomWCat=c=>{
  const clean=String(c||'').trim();
  if(!clean||W_CATS.includes(clean))return;
  const cur=getCustomWCats();
  if(!cur.includes(clean)){cur.push(clean);ls('w_custom_cats',JSON.stringify(cur))}
};

function recordNetWorthSnap(){
  const invV=T(S.inv,'שווי ₪'),penV=T(S.pen,'שווי ₪');
  const tot=Math.round(invV+penV);
  if(tot<=0)return;
  const curYm=ymOf(new Date());
  let hist=[];
  try{hist=JSON.parse(ls(NW_HIST_KEY)||'[]')}catch(e){hist=[]}
  if(!Array.isArray(hist))hist=[];
  const idx=hist.findIndex(x=>x.ym===curYm);
  const entry={ym:curYm,inv:Math.round(invV),pen:Math.round(penV),tot,ts:Date.now()};
  if(idx>=0)hist[idx]=entry;else hist.push(entry);
  hist=hist.sort((a,b)=>a.ym-b.ym).slice(-24);
  ls(NW_HIST_KEY,JSON.stringify(hist));
}
function nwHistoryCard(){
  let hist=[];
  try{hist=JSON.parse(ls(NW_HIST_KEY)||'[]')}catch(e){hist=[]}
  if(!Array.isArray(hist)||hist.length<2)return '';
  const pts=hist.slice(-8).map((h,k,arr)=>({
    v:h.tot,
    lb:ymShort(h.ym),
    flb:ymLb(h.ym),
    on:k===arr.length-1
  }));
  const first=pts[0].v,last=pts[pts.length-1].v,diff=last-first;
  return `<div class="card">
    <div class="row" style="padding:0"><h2>צמיחת הון אישי (ללא משכנתא)</h2><b class="${diff>=0?'pos':'neg'}">${diff>=0?'+':''}${fmt(diff)}</b></div>
    <span class="lb">השקעות + פנסיה לאורך זמן</span>
    ${areaChart(pts,{showLabels:true})}
  </div>`;
}

function forecastCard(ys,i){
  const pm=ys.slice(Math.max(0,i-5),i+1);
  if(!pm.length)return '';
  const incYs=pm.filter(y=>((S.mon.find(x=>x.ym==y)||{}).inc||0)>0);
  const avgInc=incYs.length?T(S.mon.filter(x=>incYs.includes(x.ym)),'inc')/incYs.length:0;
  const avgExp=T(S.exp.filter(e=>pm.includes(e.ym)&&!isExcl(e)),'a')/pm.length;
  const now=new Date(),insFuture=S.ins&&Array.isArray(S.ins.pay)?S.ins.pay.filter(p=>p.d>now):[];
  const ins30=T(insFuture.slice(0,1),'a'),ins60=T(insFuture.slice(0,2),'a'),ins90=T(insFuture.slice(0,3),'a');
  const net1=avgInc-avgExp-ins30;
  const net2=avgInc*2-avgExp*2-ins60;
  const net3=avgInc*3-avgExp*3-ins90;
  return `<div class="card sl">
    <div><div class="row" style="padding:0"><h2>תזרים צפוי 30 / 60 / 90</h2><span class="chip mut">ללא משכנתא</span></div>
    <span class="lb">תחזית יתרה מצטברת לפי הכנסות ממוצעות, הוצאות שוטפות וביטוח חיים</span></div>
    <div class="fc-grid">
      <div class="fc-box"><small>30 יום</small><b class="${net1>=0?'pos':'neg'}">${fmt(net1)}</b></div>
      <div class="fc-box"><small>60 יום</small><b class="${net2>=0?'pos':'neg'}">${fmt(net2)}</b></div>
      <div class="fc-box"><small>90 יום</small><b class="${net3>=0?'pos':'neg'}">${fmt(net3)}</b></div>
    </div>
    <div class="row s mut" style="margin-top:8px"><span>הכנסה ממוצעת: ${fmt(avgInc)}/חודש</span><span>הוצאות וביטוח: ${fmt(avgExp+ins30)}/חודש</span></div>
  </div>`;
}

function smartAlerts(){
  const now=new Date(),alerts=[];
  getAllWarranties().forEach(w=>{
    const x=parseLocalDate(w.expiryDate);
    if(!x)return;
    const days=Math.round((x-now)/864e5);
    if(days>=0&&days<=60){
      alerts.push({cls:days<=14?'bad':'warn',ico:'🧾',txt:`אחריות על "${w.name}" תפוג בעוד ${days} ימים`,act:'wr',id:w.id});
    }
  });
  S.docs.forEach(d=>{
    const x=parseLocalDate(d['תוקף עד']);
    if(!x)return;
    const days=Math.round((x-now)/864e5);
    if(days>=0&&days<=90){
      alerts.push({cls:days<=21?'bad':'warn',ico:'📁',txt:`המסמך "${d['שם']}" יפוג בעוד ${days} ימים`,act:'dc'});
    }
  });
  S.cp.forEach(c=>{
    const x=parseLocalDate(c.x||c['תוקף']);
    if(!x)return;
    const days=Math.round((x-now)/864e5);
    if(days>=0&&days<=45){
      alerts.push({cls:'info',ico:'🎟️',txt:`קופון "${c.n||c['שם']}" (${fmt(c.a||0)}) יפוג בעוד ${days} ימים`,act:'cp'});
    }
  });
  if(!alerts.length)return '';
  return `<div class="card"><h2>התראות חכמות (${alerts.length})</h2>${alerts.slice(0,4).map(a=>`<div class="alert-row ${a.cls}" data-alert-go="${a.act}" data-alert-id="${esc(a.id||'')}"><span>${a.ico}</span><span style="font-size:13px;font-weight:600">${esc(a.txt)}</span></div>`).join('')}</div>`;
}

function globalSearchModal(){
  if(!S.gsOpen)return '';
  const q=String(S.gsQ||'').trim().toLowerCase();
  const resExp=q?S.exp.filter(e=>(e.t+' '+e.c).toLowerCase().includes(q)).slice(0,6):[];
  const resInv=q?[...S.inv,...S.pen].filter(r=>String(r['שם']||'').toLowerCase().includes(q)).slice(0,5):[];
  const resWr=q?getAllWarranties().filter(w=>(w.name+' '+w.store+' '+w.category+' '+(w.notes||'')).toLowerCase().includes(q)).slice(0,5):[];
  const resDoc=q?S.docs.filter(d=>(String(d['שם']||'')+' '+String(d['קטגוריה']||'')).toLowerCase().includes(q)).slice(0,5):[];
  const resGl=q?(window._getGoals?window._getGoals():[]).filter(g=>(String(g.title||'')+' '+String(g.notes||'')).toLowerCase().includes(q)).slice(0,5):[];
  const total=resExp.length+resInv.length+resWr.length+resDoc.length+resGl.length;

  return `<div class="ms-back" data-gs-close>
    <div class="ms-sheet" style="max-height:86vh">
      <div class="ms-grab"></div>
      <div class="row" style="padding:0 0 8px">
        <h2 style="margin:0">🔍 חיפוש גלובלי</h2>
        <button type="button" class="chip2" data-gs-close style="padding:4px 10px;font-size:12px">✕</button>
      </div>
      <input id="gs-input" class="wf-inp" type="search" placeholder="חפש הוצאה, מניה, קבלה, אחריות או מסמך..." value="${esc(S.gsQ||'')}">
      ${!q?`<p class="mut" style="text-align:center;margin:16px 0">הקלד מילת חיפוש לחיפוש מיידי בכל הנתונים באפליקציה.</p>`:''}
      ${q&&!total?`<p class="mut" style="text-align:center;margin:16px 0">לא נמצאו תוצאות עבור "${esc(S.gsQ)}".</p>`:''}
      ${resWr.length?`<div class="gs-res-grp"><div class="gs-res-hdr">אחריות וקבלות (${resWr.length})</div>${resWr.map(w=>`<div class="gs-item" data-gs-wr="${esc(w.id)}"><span>🧾 <b>${esc(w.name)}</b> <small class="mut">${esc(w.store||w.category)}</small></span><b>${Number(w.price)>0?fmt(w.price):''}</b></div>`).join('')}</div>`:''}
      ${resExp.length?`<div class="gs-res-grp"><div class="gs-res-hdr">הוצאות (${resExp.length})</div>${resExp.map(e=>`<div class="gs-item" data-gs-ym="${e.ym}"><span>${ico(e.c)} <b>${esc(e.t)}</b> <small class="mut">${ymLb(e.ym)}</small></span><b>${fmt(e.a)}</b></div>`).join('')}</div>`:''}
      ${resInv.length?`<div class="gs-res-grp"><div class="gs-res-hdr">השקעות ופנסיה (${resInv.length})</div>${resInv.map(r=>`<div class="gs-item" data-gs-tab="inv"><span>📈 <b>${esc(r['שם'])}</b></span><b>${fmt(r['שווי ₪'])}</b></div>`).join('')}</div>`:''}
      ${resDoc.length?`<div class="gs-res-grp"><div class="gs-res-hdr">מסמכים (${resDoc.length})</div>${resDoc.map(d=>`<div class="gs-item" data-gs-sub="dc"><span>📁 <b>${esc(d['שם'])}</b></span><small class="mut">${esc(d['קטגוריה']||'')}</small></div>`).join('')}</div>`:''}
      ${resGl.length?`<div class="gs-res-grp"><div class="gs-res-hdr">יעדים ורכישות (${resGl.length})</div>${resGl.map(g=>`<div class="gs-item" data-gs-gl="${esc(g.id)}"><span>${g.type==='do'?'✨':'🛍️'} <b>${esc(g.title)}</b> <small class="mut">עדיפות ${g.priority}/10${g.done?' · הושג':''}</small></span><b>${Number(g.cost)>0?fmt(g.cost):''}</b></div>`).join('')}</div>`:''}
    </div>
  </div>`;
}

function wr(){
  const now=new Date(),F=S.files,files=F&&typeof F==='object'&&Array.isArray(F.out)?F.out:null,
  wList=getAllWarranties(),fileById=new Map();
  if(files)files.forEach(f=>{if(f.id)fileById.set(f.id,f)});

  const allItems=wList.map(w=>{
    const atts=w.attachments.map(a=>{
      const fObj=a.id?fileById.get(a.id):null;
      return{...a,link:(fObj&&fObj.webViewLink)||a.link||''};
    }).filter(a=>a.link||a.id);
    const x=parseLocalDate(w.expiryDate);
    const n=x?Math.round((x-now)/864e5):null;
    const status=n===null?'none':n<0?'expired':n<90?'soon':'valid';
    const cat=wCatOf(w);
    const coverImg=w.coverId?driveThumbUrl(w.coverId):(w.coverLink||'');
    return{...w,atts,coverImg,x,n,status,cat};
  });

  const totAssetsVal=allItems.reduce((s,it)=>s+(Number(it.price)||0),0);
  const cntAll=allItems.length;
  const cntValid=allItems.filter(it=>it.n===null||it.n>=0).length;
  const cntSoon=allItems.filter(it=>it.status==='soon').length;
  const cntExpired=allItems.filter(it=>it.status==='expired').length;
  const curStatus=S.wrStatus||'all';

  const statusTabs=[
    ['all',`הכל (${cntAll})`],
    ['valid',`בתוקף (${cntValid})`],
    ['soon',`עומד לפוג (${cntSoon})`],
    ['expired',`פג תוקף (${cntExpired})`]
  ];

  const allCats=[...new Set([...W_CATS,...getCustomWCats(),...allItems.map(it=>it.cat).filter(Boolean)])];
  if(S.wrCat&&!allCats.includes(S.wrCat))S.wrCat='';

  const filtered=allItems
    .filter(it=>{
      if(curStatus==='valid'&&!(it.n===null||it.n>=0))return false;
      if(curStatus==='soon'&&it.status!=='soon')return false;
      if(curStatus==='expired'&&it.status!=='expired')return false;
      if(S.wrCat&&it.cat!==S.wrCat)return false;
      return true;
    })
    .sort((a,b)=>(a.x?+a.x:9e15)-(b.x?+b.x:9e15)||String(a.name).localeCompare(String(b.name),'he'));

  return `<div class="row" style="padding:0 0 6px;gap:8px">
    <div><h2 style="margin:0">אחריות וקבלות</h2><span class="lb">תיק נכסים, תמונות מוצר וריבוי קבלות</span></div>
    <button class="pr" data-w-open="" style="background:var(--g);color:#fff">+ הוסף מוצר</button>
  </div>
  ${cntAll?`<div class="card" style="padding:11px 13px;margin-bottom:8px">
    <div class="trio" style="margin:0">
      <div><span class="lb">פריטים מתועדים</span><b>${cntAll}</b></div>
      <div><span class="lb">שווי רכישות</span><b>${fmt(totAssetsVal)}</b></div>
      <div><span class="lb">באחריות פעילה</span><b class="pos">${cntValid}</b></div>
    </div>
  </div>`:''}
  <div class="chips" style="margin:6px 0">
    ${statusTabs.map(([k,lbl])=>`<button class="chip2 ${curStatus===k?'on':''}" data-wrs="${k}">${lbl}</button>`).join('')}
  </div>
  <div class="chips" style="margin:4px 0 10px">
    <button class="chip2 ${S.wrCat?'':'on'}" data-wrc="">כל הקטגוריות</button>
    ${allCats.map(c=>{
      const cCnt=allItems.filter(it=>it.cat===c).length;
      return `<button class="chip2 ${S.wrCat===c?'on':''}" data-wrc="${encodeURIComponent(c)}">${esc(c)}${cCnt?` (${cCnt})`:''}</button>`;
    }).join('')}
  </div>`+
  (filtered.length?filtered.map(d=>{
    const n=d.n;
    const tx=n===null?'ללא תוקף':n<0?'פג':n<60?n+' ימים':n<730?Math.round(n/30.4)+' חוד׳':Math.round(n/365)+' שנים';
    const cl=n===null?'mut':n<0?'neg':n<90?'amb':'pos';
    const meta=[d.cat,d.store,Number(d.price)>0?fmt(d.price):'',d.x?'עד '+dl(d.x):''].filter(Boolean).map(esc).join(' · ');
    const catEmoji=W_CAT_ICO[d.cat]||'🧾';
    return `<div class="w-card" data-w-view="${esc(d.id)}" role="button" tabindex="0">
      <div class="w-thumb">${d.coverImg?`<img src="${esc(d.coverImg)}" alt="" loading="lazy" onerror="this.remove()">`:catEmoji}</div>
      <div class="w-body">
        <div class="w-top">
          <span class="w-title">${esc(d.name)}</span>
          <span class="w-badge ${cl}">${tx}</span>
        </div>
        <div class="w-sub">${meta||'ללא פרטים נוספים'}</div>
        ${d.atts.length?`<span class="w-files-pill">📎 ${d.atts.length===1?'קובץ קבלה / אחריות 1':`${d.atts.length} קבצים מצורפים`}</span>`:''}
      </div>
    </div>`;
  }).join(''):`<div class="card"><p class="mut" style="margin:0;text-align:center">${allItems.length?'אין פריטים התואמים לסינון שנבחר.':'עדיין לא נוספו מוצרים או קבלות. לחץ על "+ הוסף מוצר" למעלה.'}</p></div>`)
  +warrantyDetailSheet()+warrantySheet();
}


function prioMeta(p) {
  const n = Math.min(10, Math.max(1, Number(p) || 1));
  if (n >= 8) return { cls: 'hi', lbl: `דחוף · ${n}/10` };
  if (n >= 5) return { cls: 'md', lbl: `בינוני · ${n}/10` };
  return { cls: 'lo', lbl: `רגיל · ${n}/10` };
}

function gl() {
  const all = window._getGoals ? window._getGoals() : [];
  const open = all.filter(g => !g.done);
  const done = all.filter(g => !!g.done);
  const totCost = open.reduce((s, g) => s + (Number(g.cost) || 0), 0);
  const totSaved = open.reduce((s, g) => s + Math.min(Number(g.cost) || 0, Number(g.saved) || 0), 0);
  const remCost = Math.max(0, totCost - totSaved);
  const overallPct = totCost > 0 ? Math.min(100, Math.round((totSaved / totCost) * 100)) : 0;

  const flt = S.glFilter || 'all';
  const srt = S.glSort || 'prio';
  let list = all.filter(g => {
    if (flt === 'do') return !g.done && g.type === 'do';
    if (flt === 'buy') return !g.done && g.type === 'buy';
    if (flt === 'done') return !!g.done;
    return !g.done;
  });

  list = [...list].sort((a, b) => {
    if (srt === 'cost_desc') return (Number(b.cost) || 0) - (Number(a.cost) || 0);
    if (srt === 'cost_asc') return (Number(a.cost) || 0) - (Number(b.cost) || 0);
    return (Number(b.priority) || 0) - (Number(a.priority) || 0) || (Number(a.cost) || 0) - (Number(b.cost) || 0);
  });

  const f = S.glForm;
  const pendCov = S.glPendingCover;
  const existingCovUrl = f ? (f.coverLink || (f.coverId ? driveThumbUrl(f.coverId) : '')) : '';
  const covLabel = pendCov
    ? `🖼️ תמונה חדשה: ${esc(pendCov.name)}`
    : (existingCovUrl ? '✅ קיימת תמונת יעד' : '📷 בחר / צלם תמונה ליעד');

  const modal = f ? `<div class="ms-back" data-gl-close>
    <div class="ms-sheet" style="max-width:460px">
      <div class="ms-grab"></div>
      <div class="row" style="padding:0 0 8px">
        <h2 style="margin:0">${f.id ? 'עריכת יעד / רכישה' : 'הוספת יעד או רכישה'}</h2>
        <button type="button" class="chip2" data-gl-close style="padding:4px 10px;font-size:12px">✕</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button type="button" class="chip2 ${f.type === 'buy' ? 'on' : ''}" data-gl-type="buy" style="flex:1">🛍️ לקנות</button>
        <button type="button" class="chip2 ${f.type === 'do' ? 'on' : ''}" data-gl-type="do" style="flex:1">✨ לעשות</button>
      </div>
      <label class="wf-lbl">שם היעד / הפריט</label>
      <input id="gl-f-title" class="wf-inp" type="text" placeholder="למשל: לטוס ליפן / שואב שוטף" value="${esc(f.title || '')}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <div>
          <label class="wf-lbl">עלות משוערת (₪)</label>
          <input id="gl-f-cost" class="wf-inp" type="number" inputmode="decimal" min="0" value="${Number(f.cost) || ''}" placeholder="0">
        </div>
        <div>
          <label class="wf-lbl">נחסך עד כה (₪)</label>
          <input id="gl-f-saved" class="wf-inp" type="number" inputmode="decimal" min="0" value="${Number(f.saved) || ''}" placeholder="0">
        </div>
      </div>
      <label class="wf-lbl" style="margin-top:8px">סדר עדיפות (1 = לא מיידי · 10 = מיידי)</label>
      <div class="gl-prio-row">
        ${Array.from({ length: 10 }, (_, i) => i + 1).map(n => `<button type="button" class="chip2 gl-prio-btn ${Number(f.priority) === n ? 'on' : ''}" data-gl-prio="${n}">${n}</button>`).join('')}
      </div>
      <label class="wf-lbl" style="margin-top:10px">תמונה ליעד (אופציונלי)</label>
      <input id="gl-f-cover-inp" type="file" accept="image/*" style="display:none">
      <input id="gl-f-cover-cam" type="file" accept="image/*" capture="environment" style="display:none">
      <div style="display:flex;gap:6px;align-items:center">
        <button type="button" id="gl-f-cover-trig" class="wf-file-btn ${pendCov || existingCovUrl ? 'has' : ''}" style="flex:1">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${covLabel}</span>
          <span style="font-weight:700;color:var(--g);flex:none">${pendCov || existingCovUrl ? 'החלף' : 'גלריה'}</span>
        </button>
        <button type="button" id="gl-f-cover-cam-trig" class="chip2" title="צלם תמונה ליעד" aria-label="צלם תמונה ליעד" style="padding:8px 11px;flex:none">📷 צלם</button>
        ${(pendCov || existingCovUrl) ? `<button type="button" class="chip2" data-gl-uncover style="color:var(--r);padding:8px 10px">הסר</button>` : ''}
      </div>
      ${pendCov ? `<div class="gl-cover-preview"><span class="mut" style="font-size:12px">יישמר בעת שמירת היעד: <b>${esc(pendCov.name)}</b></span></div>` : (existingCovUrl ? `<div class="gl-cover-preview"><img src="${esc(f.coverId ? driveThumbUrl(f.coverId) : existingCovUrl)}" alt="${esc(f.title || '')}" onerror="this.style.display='none'"><span class="mut" style="font-size:12px">תמונה משויכת ליעד</span></div>` : '')}
      <label class="wf-lbl" style="margin-top:8px">הערות / קישור</label>
      <input id="gl-f-notes" class="wf-inp" type="text" placeholder="דגם מועדף, תאריך יעד..." value="${esc(f.notes || '')}">
      ${S.glErr ? `<p class="neg" style="font-size:12.5px;margin:8px 0 0">${esc(S.glErr)}</p>` : ''}
      <div class="row" style="margin-top:14px;padding:0;gap:8px">
        <button type="button" class="pr" data-gl-save ${S.glSaving ? 'disabled' : ''} style="flex:1;background:var(--g);color:#fff;padding:11px">${S.glSaving ? 'שומר...' : 'שמור יעד ✓'}</button>
        ${f.id ? `<button type="button" class="chip2" data-gl-del="${esc(f.id)}" style="color:var(--r);padding:10px 14px">מחק</button>` : ''}
      </div>
    </div>
  </div>` : '';

  return `<div class="card hg">
    <div class="row" style="padding:0 0 10px">
      <div><h2 style="margin:0">🎯 יעדים ורכישות</h2><span class="lb">תכנון, תיעדוף ומעקב חיסכון</span></div>
      <button type="button" class="pr" data-gl-open style="background:var(--g);color:#fff;padding:8px 14px;font-size:13px">+ חדש</button>
    </div>
    <div class="shop-hero-grid">
      <div class="shop-hero-box"><div class="shop-hero-lbl">עלות פתוחה</div><div class="shop-hero-val">${fmt(totCost)}</div></div>
      <div class="shop-hero-box"><div class="shop-hero-lbl">יתרה להשלמה</div><div class="shop-hero-val" style="color:var(--w-ink)">${fmt(remCost)}</div></div>
      <div class="shop-hero-box"><div class="shop-hero-lbl">יעדים פתוחים</div><div class="shop-hero-val">${open.length} <small class="mut" style="font-size:11px">(${done.length} הושגו)</small></div></div>
    </div>
    ${totCost > 0 ? `<div class="gl-prog-wrap" style="margin-top:12px"><div class="gl-prog-bar"><i style="width:${overallPct}%"></i></div><span class="lb" style="font-size:11.5px">נחסכו ${fmt(totSaved)} (${overallPct}%)</span></div>` : ''}
  </div>

  <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0">
    ${[['all', `פתוחים (${open.length})`], ['buy', `לקנות (${open.filter(x => x.type === 'buy').length})`], ['do', `לעשות (${open.filter(x => x.type === 'do').length})`], ['done', `הושג (${done.length})`]].map(([k, l]) => `<button type="button" class="chip2 ${flt === k ? 'on' : ''}" data-glf="${k}">${l}</button>`).join('')}
    <button type="button" class="chip2" data-gls style="margin-inline-start:auto;font-size:12px">${srt === 'prio' ? 'מיון: דחיפות ▾' : srt === 'cost_desc' ? 'מיון: יקר לזול ▾' : 'מיון: זול ליקר ▾'}</button>
  </div>

  ${!list.length ? `<div class="card"><p class="mut" style="margin:0;text-align:center">אין פריטים בקטגוריה זו.</p></div>` : list.map(g => {
    const cost = Number(g.cost) || 0;
    const saved = Math.min(cost, Number(g.saved) || 0);
    const pctVal = cost > 0 ? Math.min(100, Math.round((saved / cost) * 100)) : (g.done ? 100 : 0);
    const pm = prioMeta(g.priority);
    const fbIcon = g.type === 'do' ? '✨' : '🛍️';
    const gCovId = g.coverId || extractDriveId(g.coverLink || '');
    const gImgSrc = gCovId ? driveThumbUrl(gCovId) : String(g.coverLink || '').trim();
    const thumbHtml = /^https?:\/\//i.test(gImgSrc)
      ? `<div class="gl-thumb"><img src="${esc(gImgSrc)}" alt="${esc(g.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="gl-thumb-fb" style="display:none">${fbIcon}</span></div>`
      : `<div class="gl-thumb"><span class="gl-thumb-fb">${fbIcon}</span></div>`;

    return `<div class="gl-card ${g.done ? 'done' : ''}">
      <button type="button" class="shop-check" data-gl-tog="${esc(g.id)}" aria-label="סמן הושג">${g.done ? '✓' : ''}</button>
      ${thumbHtml}
      <div class="gl-body" data-gl-edit="${esc(g.id)}">
        <div class="gl-top">
          <span class="gl-title">${esc(g.title)}</span>
          <span class="gl-prio ${pm.cls}">${pm.lbl}</span>
        </div>
        ${g.notes ? `<div class="w-sub">${esc(g.notes)}</div>` : ''}
        ${cost > 0 ? `<div class="gl-prog-row">
          <div class="gl-prog-bar"><i style="width:${pctVal}%"></i></div>
          <span class="gl-amt">${saved > 0 ? `${fmt(saved)} / ` : ''}${fmt(cost)}</span>
        </div>` : `<div class="w-sub">ללא עלות כספית</div>`}
      </div>
    </div>`;
  }).join('')}
  ${modal}`;
}
function warrantyDetailSheet(){
  if(!S.wViewId)return '';
  const all=getAllWarranties();
  const d=all.find(x=>x.id===S.wViewId);
  if(!d){S.wViewId='';return ''}
  const now=new Date(),x=parseLocalDate(d.expiryDate),pDate=parseLocalDate(d.purchaseDate);
  const n=x?Math.round((x-now)/864e5):null;
  const cl=n===null?'mut':n<0?'neg':n<90?'amb':'pos';
  const stTx=n===null?'ללא הגבלת תוקף':n<0?`פג לפני ${Math.abs(n)} ימים`:`נותרו ${n} ימים (עד ${dl(x)})`;
  let progPct=0;
  if(pDate&&x&&x>pDate){
    progPct=Math.min(100,Math.max(0,((now-pDate)/(x-pDate))*100));
  }
  const coverImg=d.coverId?driveThumbUrl(d.coverId):(d.coverLink||'');
  const cat=wCatOf(d);
  return `<div class="ms-back" data-wv-close>
    <div class="ms-sheet">
      <div class="ms-grab"></div>
      <div class="row" style="padding:0 0 6px;gap:8px">
        <h2 style="margin:0">${esc(d.name)}</h2>
        <button type="button" class="chip2" data-wv-close style="padding:4px 10px;font-size:12px">✕</button>
      </div>
      <div class="wd-hero">
        <div class="wd-cover" ${d.coverLink?`data-l="${encodeURIComponent(d.coverLink)}"`:''}>${coverImg?`<img src="${esc(coverImg)}" alt="">`:(W_CAT_ICO[cat]||'🧾')}</div>
        <div style="min-width:0;flex:1">
          <span class="w-badge ${cl}" style="display:inline-block;margin-bottom:6px">${stTx}</span>
          <div class="mut" style="font-size:12.5px">${esc(cat)}${d.store?' · '+esc(d.store):''}</div>
          ${d.coverLink?`<div style="margin-top:6px"><button type="button" class="ex-btn" data-l="${encodeURIComponent(d.coverLink)}">הגדל תמונת מוצר ↗</button></div>`:''}
        </div>
      </div>
      ${x&&pDate?`<div style="margin:8px 0 12px">
        <div class="bar"><i style="width:${progPct.toFixed(1)}%;background:${n<0?'var(--r)':n<90?'#f59e0b':'var(--g)'}"></i></div>
        <div class="row s mut" style="padding:0;font-size:11px"><span>נרכש: ${dl(pDate)}</span><span>תפוגה: ${dl(x)}</span></div>
      </div>`:''}
      <div class="wd-grid">
        <div class="wd-kv"><span>מחיר רכישה</span><b>${Number(d.price)>0?fmt(d.price):'לא הוזן'}</b></div>
        <div class="wd-kv"><span>משך אחריות</span><b>${Number(d.months)>0?d.months+' חודשים':'ללא תוקף'}</b></div>
        <div class="wd-kv"><span>תאריך רכישה</span><b>${pDate?dl(pDate):'—'}</b></div>
        <div class="wd-kv"><span>חנות / ספק</span><b>${esc(d.store||'—')}</b></div>
      </div>
      ${d.notes?`<div class="wd-kv" style="margin-bottom:10px"><span>הערות / מספר סידורי</span><b>${esc(d.notes)}</b></div>`:''}
      <div style="margin-top:10px">
        <b style="font-size:13.5px">קבלות ותעודות אחריות (${d.attachments.length})</b>
        ${d.attachments.length?`<div class="wd-att-list">${d.attachments.map((a,idx)=>`<div class="wd-att-item">
          <span class="wd-att-name">📄 ${esc(a.name||`קובץ ${idx+1}`)}</span>
          ${a.link?`<button type="button" class="pr" data-l="${encodeURIComponent(a.link)}">פתח</button>`:''}
        </div>`).join('')}</div>`:`<p class="mut" style="font-size:12.5px;margin:6px 0">לא צורפו קבצי קבלה למוצר זה.</p>`}
      </div>
      <div class="row" style="margin-top:16px;padding:0;gap:8px">
        <button type="button" class="pr" data-w-edit="${esc(d.id)}" style="flex:1;background:var(--g);color:#fff;padding:11px">✎ ערוך פרטים וקבצים</button>
        <button type="button" class="chip2" data-wv-close style="padding:10px 16px">סגור</button>
      </div>
    </div>
  </div>`;
}

function warrantyPreviewHtml(purchaseDate,months){
  const m=Number(months)||0;
  if(m<=0)return '<span class="mut">יישמר כקבלה / מסמך ללא תאריך תפוגה</span><span class="chip mut">ללא תוקף</span>';
  const expIso=addMonthsISO(purchaseDate,m);
  const expD=parseLocalDate(expIso);
  if(!expD)return '<span class="mut">בחר תאריך רכישה לחישוב תוקף</span>';
  const days=Math.round((expD-new Date())/864e5);
  const cls=days<0?'bad':days<90?'warn':'';
  const stTxt=days<0?'פג תוקף':days<60?`עוד ${days} ימים`:days<730?`עוד ${Math.round(days/30.4)} חוד׳`:`עוד ${Math.round(days/365)} שנים`;
  return `<span>תוקף עד: <b>${dl(expD)}</b> <small class="mut">(${m} חוד׳)</small></span><span class="chip ${cls}">${stTxt}</span>`;
}
function updateWarrantyPreviewDom(){
  const f=S.wForm;if(!f)return;
  const pv=document.getElementById('wf-preview');
  if(pv)pv.innerHTML=warrantyPreviewHtml(f.purchaseDate,f.months);
  document.querySelectorAll('[data-wm]').forEach(btn=>{
    const val=btn.dataset.wm;
    if(val==='custom')btn.classList.toggle('on',!!f.customMode);
    else btn.classList.toggle('on',!f.customMode&&Number(val)===Number(f.months));
  });
  const cw=document.getElementById('wf-custom-wrap');
  if(cw)cw.style.display=f.customMode?'block':'none';
}
function warrantySheet(){
  const f=S.wForm;if(!f)return '';
  const presets=[[0,'ללא'],[12,'12 חוד׳'],[24,'24 חוד׳'],[36,'36 חוד׳'],[60,'60 חוד׳']];
  const allCats=[...new Set([...W_CATS,...getCustomWCats(),f.category&&f.category!=='__new__'?f.category:W_CATS[0]])];
  const pendingCover=S.wPendingCover;
  const pendingFiles=Array.isArray(S.wPendingFiles)?S.wPendingFiles:[];
  const existingAtts=Array.isArray(f.attachments)?f.attachments:[];
  const coverLabel=pendingCover
    ?`🖼️ תמונה חדשה: ${esc(pendingCover.name)}`
    :(f.coverLink?`✅ קיימת תמונת מוצר בדרייב`:'📷 צלם / בחר תמונת מוצר מבחוץ');

  return `<div class="ms-back" data-w-close>
    <div class="ms-sheet">
      <div class="ms-grab"></div>
      <div class="row" style="padding:0 0 6px">
        <h2 style="margin:0">${f.id?'עריכת מוצר ואחריות':'הוספת מוצר / אחריות'}</h2>
        <button type="button" class="chip2" data-w-close style="padding:4px 10px;font-size:12px">✕</button>
      </div>
      ${S.wErr?`<div class="bn" style="border-color:var(--r);color:var(--r);margin:6px 0">${esc(S.wErr)}</div>`:''}

      <label class="wf-lbl" for="wf-name">שם המוצר *</label>
      <input id="wf-name" class="wf-inp" type="text" placeholder="למשל: מכונת קפה Ninja / שואב אבק" value="${esc(f.name||'')}" data-wf="name">

      <label class="wf-lbl" for="wf-cat">קטגוריה</label>
      <select id="wf-cat" class="wf-inp" data-wf="category">
        ${allCats.map(c=>`<option value="${esc(c)}" ${!f.newCatMode&&(f.category||W_CATS[0])===c?'selected':''}>${esc(c)}</option>`).join('')}
        <option value="__new__" ${f.newCatMode?'selected':''}>+ קטגוריה חדשה...</option>
      </select>
      ${f.newCatMode?`<div style="margin-top:6px"><input id="wf-new-cat" class="wf-inp" type="text" placeholder="הקלד שם קטגוריה חדשה..." value="${esc(f.newCatName||'')}" data-wf="newCatName"></div>`:''}

      <label class="wf-lbl">תמונת מוצר מבחוץ (תוצג בכרטיסייה)</label>
      <input id="wf-cover-inp" type="file" accept="image/*" style="display:none">
      <input id="wf-cover-cam" type="file" accept="image/*" capture="environment" style="display:none">
      <div style="display:flex;gap:6px;align-items:center">
        <button type="button" id="wf-cover-trig" class="wf-file-btn ${pendingCover||f.coverLink?'has':''}" style="flex:1">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${coverLabel}</span>
          <span style="font-weight:700;color:var(--g);flex:none">${pendingCover||f.coverLink?'החלף':'גלריה'}</span>
        </button>
        <button type="button" id="wf-cover-cam-trig" class="chip2" title="צלם תמונת מוצר" aria-label="צלם תמונת מוצר" style="padding:8px 11px;flex:none">📷 צלם</button>
      </div>
      ${(f.coverLink&&!pendingCover)?`<div style="margin-top:4px;text-align:end"><button type="button" class="ex-btn" data-w-uncover>הסר תמונת מוצר</button></div>`:''}

      <div class="wf-grid2">
        <div>
          <label class="wf-lbl" for="wf-store">חנות / ספק</label>
          <input id="wf-store" class="wf-inp" type="text" placeholder="KSP / אמזון" value="${esc(f.store||'')}" data-wf="store">
        </div>
        <div>
          <label class="wf-lbl" for="wf-price">מחיר (₪)</label>
          <input id="wf-price" class="wf-inp" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0" value="${esc(f.price||'')}" data-wf="price">
        </div>
      </div>

      <label class="wf-lbl" for="wf-date">תאריך רכישה</label>
      <input id="wf-date" class="wf-inp" type="date" value="${esc(f.purchaseDate||todayISO())}" data-wf="purchaseDate">

      <label class="wf-lbl">משך אחריות (חודשים)</label>
      <div class="chips" style="margin:4px 0 6px">
        ${presets.map(([m,lbl])=>`<button type="button" class="chip2 ${!f.customMode&&Number(f.months)===m?'on':''}" data-wm="${m}">${lbl}</button>`).join('')}
        <button type="button" class="chip2 ${f.customMode?'on':''}" data-wm="custom">מותאם</button>
      </div>
      <div id="wf-custom-wrap" style="display:${f.customMode?'block':'none'};margin-bottom:6px">
        <input id="wf-custom-m" class="wf-inp" type="number" inputmode="numeric" min="0" max="360" placeholder="מספר חודשים" value="${esc(f.months||'')}" data-wf="customMonths">
      </div>
      <div class="wf-preview" id="wf-preview">${warrantyPreviewHtml(f.purchaseDate,f.months)}</div>

      <label class="wf-lbl">קבלות ותעודות אחריות (ניתן לצרף כמה קבצים / תמונות / PDF)</label>
      <input id="wf-file" type="file" multiple accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.heic" style="display:none">
      <input id="wf-file-cam" type="file" accept="image/*" capture="environment" style="display:none">
      <div style="display:flex;gap:6px;align-items:center">
        <button type="button" id="wf-file-trig" class="wf-file-btn ${pendingFiles.length||existingAtts.length?'has':''}" style="flex:1">
          <span>📎 קבצים / גלריה</span>
          <span style="font-weight:700;color:var(--g);flex:none">+ הוסף קבצים</span>
        </button>
        <button type="button" id="wf-file-cam-trig" class="chip2" title="צלם קבלה או תעודת אחריות" aria-label="צלם קבלה או תעודת אחריות" style="padding:8px 11px;flex:none">📷 צלם</button>
      </div>
      ${existingAtts.map((a,i)=>`<div class="wf-att-chip">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">✅ ${esc(a.name||`קובץ ${i+1}`)}</span>
        <button type="button" class="ex-btn" data-w-rm-att="${i}" style="color:var(--r)">הסר</button>
      </div>`).join('')}
      ${pendingFiles.map((pf,i)=>`<div class="wf-att-chip">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🆕 ${esc(pf.name)} (${(pf.size/1048576).toFixed(1)} MB)</span>
        <button type="button" class="ex-btn" data-w-rm-pend="${i}" style="color:var(--r)">ביטול</button>
      </div>`).join('')}

      <label class="wf-lbl" for="wf-notes">הערות / דגם / מספר סידורי</label>
      <input id="wf-notes" class="wf-inp" type="text" placeholder="למשל: 3 שנות אחריות יבואן רשמי" value="${esc(f.notes||'')}" data-wf="notes">

      <div class="row" style="margin-top:16px;padding:0;gap:8px">
        <button type="button" class="pr" data-w-save style="flex:1;background:var(--g);color:#fff;padding:12px" ${S.wSaving?'disabled':''}>${S.wSaving?'שומר ומעלה לדרייב...':'שמור מוצר ✓'}</button>
        <button type="button" class="chip2" data-w-close style="padding:11px 16px" ${S.wSaving?'disabled':''}>ביטול</button>
      </div>
      ${f.id?`<div style="margin-top:12px;text-align:center"><button type="button" class="ex-btn" data-w-del="${esc(f.id)}" style="color:var(--r);border-color:rgba(239,68,68,.35)">מחק מוצר זה</button></div>`:''}
    </div>
  </div>`;
}

/* Living Runway + 4% Rule / 300 Months & 300 Salaries Calculator */
function fireDefaults(){
  const now=new Date(),curYm=now.getFullYear()*100+now.getMonth()+1;
  const allYs=[...new Set(S.exp.map(e=>e.ym))].sort((a,b)=>a-b);
  const closedYs=allYs.filter(y=>y<curYm);
  const baseYs=closedYs.length>=2?closedYs.slice(-6):allYs.slice(-6);
  const avgExp=baseYs.length?Math.round(T(S.exp.filter(e=>baseYs.includes(e.ym)&&!isExcl(e)),'a')/baseYs.length):12000;
  const incYs=S.mon.filter(x=>x.inc>0).map(x=>x.ym).sort((a,b)=>a-b).slice(-6);
  const avgInc=incYs.length?Math.round(T(S.mon.filter(x=>incYs.includes(x.ym)),'inc')/incYs.length):avgExp;
  const estSave=Math.max(1000,Math.round((avgInc-avgExp)/500)*500||3000);
  return{
    exp:Math.max(3000,Math.round(avgExp/100)*100),
    baseExp:avgExp,
    baseInc:avgInc,
    swr:4,
    ret:6,
    save:estSave,
    incPen:false,
    taxAdj:false,
    runwayGoal:6
  };
}
function calcFire(F,def){
  const liquidVal=T(S.inv,'שווי ₪');
  const penVal=T(S.pen,'שווי ₪');
  const capital=liquidVal+(F.incPen?penVal:0);
  const effSwr=F.taxAdj?F.swr*0.85:F.swr;
  const mult=Math.round(1200/effSwr);
  const monthlyExp=Math.max(1000,+F.exp||def.baseExp);
  const runwayMonths=monthlyExp>0?capital/monthlyExp:0;
  const runwayPct=Math.min(100,(runwayMonths/Math.max(1,F.runwayGoal))*100);
  const runwayGap=Math.max(0,monthlyExp*F.runwayGoal-capital);
  const safeMonthlyNow=(capital*(effSwr/100))/12;
  const expCoveredPct=monthlyExp>0?(safeMonthlyNow/monthlyExp)*100:0;
  const targetByExp=monthlyExp*mult;
  const targetBy300Sal=(def.baseInc||monthlyExp)*300;
  const firePct=targetByExp>0?Math.min(100,(capital/targetByExp)*100):0;
  const fireGap=Math.max(0,targetByExp-capital);
  const rMon=Math.pow(1+(+F.ret||6)/100,1/12)-1;
  const saveMon=Math.max(0,+F.save||0);
  let simCap=capital,monthsToFire=0;
  if(capital<targetByExp){
    while(simCap<targetByExp&&monthsToFire<600){
      simCap=simCap*(1+rMon)+saveMon;
      monthsToFire++;
    }
  }
  const yrsTo=Math.floor(monthsToFire/12),mosTo=monthsToFire%12;
  const targetYear=new Date().getFullYear()+Math.round(monthsToFire/12);
  let etaHtml='';
  if(capital>=targetByExp){
    etaHtml=`<p class="pos" style="font-weight:700;margin:6px 0">🎉 כבר הגעת ליעד שהגדרת! ההון שלך מכסה 100% מהוצאות המחיה לפי כלל ה-${F.swr}%.</p>`;
  }else if(monthsToFire>=600){
    etaHtml=`<p class="mut">בקצב ההפקדה הנוכחי ההגעה ליעד רחוקה מ-50 שנה — נסה להגדיל הפקדה חודשית או להפחית הוצאות.</p>`;
  }else{
    etaHtml=`<div class="hl-box" style="margin-top:8px">
      <div><small class="mut" style="display:block">זמן משוער ליעד (${fmt(targetByExp)})</small><b style="font-size:18px">${yrsTo?yrsTo+' שנים':''}${yrsTo&&mosTo?' ו-':''}${mosTo?mosTo+' חודשים':''}</b></div>
      <span class="chip">שנת ${targetYear}</span>
    </div>
    <p class="mut" style="margin:10px 0 0">חסרים עוד <b>${fmt(fireGap)}</b> ליעד של ${mult} חודשי מחיה (וליעד 300 משכורות מלאות חסרים ${fmt(Math.max(0,targetBy300Sal-capital))}).</p>`;
  }
  return{liquidVal,penVal,capital,mult,monthlyExp,runwayMonths,runwayPct,runwayGap,safeMonthlyNow,expCoveredPct,targetByExp,targetBy300Sal,firePct,saveMon,etaHtml};
}
function sliderTrackBg(el){
  const min=+el.min||0,max=+el.max||100,val=+el.value||0;
  const p=Math.min(100,Math.max(0,((val-min)/(max-min))*100));
  return `linear-gradient(270deg, var(--g) ${p.toFixed(1)}%, var(--line) ${p.toFixed(1)}%)`;
}
function updateFireLive(){
  if(!S.fire)return;
  const def=fireDefaults(),C=calcFire(S.fire,def);
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};
  set('f-fire-pct',C.firePct.toFixed(1)+'% מהיעד');
  set('f-cov-pct',Math.round(C.expCoveredPct)+'%');
  set('f-trio-exp',fmt(C.targetByExp));
  set('f-trio-rw',C.runwayMonths.toFixed(1));
  set('f-rw-chip',C.runwayMonths.toFixed(1)+' חודשים');
  set('f-rw-goal-txt',`יעד קרן חירום: ${S.fire.runwayGoal} חודשים (${fmt(C.monthlyExp*S.fire.runwayGoal)})`);
  set('f-rw-gap-txt',C.runwayGap>0?'חסר '+fmt(C.runwayGap):'היעד הושג ✓');
  set('f-lbl-exp',fmt(C.monthlyExp));
  set('f-lbl-save',fmt(C.saveMon));
  const fb=document.getElementById('f-fire-bar');if(fb)fb.style.width=C.firePct.toFixed(1)+'%';
  const rb=document.getElementById('f-rw-bar');
  if(rb){rb.style.width=C.runwayPct.toFixed(1)+'%';rb.style.background=C.runwayMonths>=S.fire.runwayGoal?'var(--g)':'var(--w)'}
  const rc=document.getElementById('f-rw-chip');
  if(rc)rc.className='chip '+(C.runwayMonths>=S.fire.runwayGoal?'':C.runwayMonths>=3?'warn':'bad');
  const eta=document.getElementById('f-eta-wrap');if(eta)eta.innerHTML=C.etaHtml;
}
function fireView(){
  const def=fireDefaults();
  if(!S.fire)S.fire={...def};
  const F=S.fire,C=calcFire(F,def);
  const expPct=Math.min(100,Math.max(0,((C.monthlyExp-4000)/(35000-4000))*100));
  const savePct=Math.min(100,Math.max(0,(C.saveMon/25000)*100));
  return `
  <div class="card hg">
    <div class="row" style="padding:0"><span class="lb">כלל ה-${F.swr}% · חוק ${C.mult} החודשים</span><span class="chip" id="f-fire-pct">${C.firePct.toFixed(1)}% מהיעד</span></div>
    <div class="big">${fmt(C.safeMonthlyNow)}<span style="font-size:17px;font-weight:600;color:var(--mut)"> / חודש</span></div>
    <span class="lb">קצבה חודשית שההון שלך מייצר כבר היום במשיכת ${F.swr}% בשנה</span>
    <div class="fire-meter"><i id="f-fire-bar" style="width:${C.firePct.toFixed(1)}%"></i></div>
    <div class="pace-ft"><span>הון מחושב: <b>${fmt(C.capital)}</b></span><span>מכסה <b id="f-cov-pct">${Math.round(C.expCoveredPct)}%</b> מההוצאות</span></div>
    <div class="trio">
      <div><span class="lb">יעד ×${C.mult} הוצאות</span><b id="f-trio-exp">${fmt(C.targetByExp)}</b></div>
      <div><span class="lb">יעד 300 משכורות</span><b>${fmt(C.targetBy300Sal)}</b></div>
      <div><span class="lb">חודשי מחיה</span><b id="f-trio-rw">${C.runwayMonths.toFixed(1)}</b></div>
    </div>
  </div>

  <div class="card">
    <div class="row" style="padding:0"><h2>מד חמצן כלכלי (מחיה)</h2><span id="f-rw-chip" class="chip ${C.runwayMonths>=F.runwayGoal?'':C.runwayMonths>=3?'warn':'bad'}">${C.runwayMonths.toFixed(1)} חודשים</span></div>
    <span class="lb">כמה חודשי מחיה מלאים ההון שלך מכסה ללא הכנסה כלל</span>
    <div class="bar" style="height:10px;margin:12px 0 6px"><i id="f-rw-bar" style="width:${C.runwayPct.toFixed(1)}%;background:${C.runwayMonths>=F.runwayGoal?'var(--g)':'var(--w)'}"></i></div>
    <div class="pace-ft"><span id="f-rw-goal-txt">יעד קרן חירום: ${F.runwayGoal} חודשים (${fmt(C.monthlyExp*F.runwayGoal)})</span><span id="f-rw-gap-txt">${C.runwayGap>0?'חסר '+fmt(C.runwayGap):'היעד הושג ✓'}</span></div>
    <div class="chips" style="margin-top:10px">
      ${[3,6,12,24].map(g=>`<button class="chip2 ${F.runwayGoal==g?'on':''}" data-fw="runwayGoal:${g}">${g} חוד׳</button>`).join('')}
    </div>
  </div>

  <div class="card">
    <div class="row" style="padding:0"><h2>התאמת פרמטרים</h2><button class="chip2" data-freset style="padding:4px 10px;font-size:12px">אפס לנתוני האקסל</button></div>
    <span class="lb">ממוצע ההוצאות שלך ב-6 חודשים סגורים: ${fmt(def.baseExp)} · משכורת ממוצעת: ${fmt(def.baseInc)}</span>

    <div style="margin-top:14px">
      <div class="row s" style="padding:0"><span>הוצאה חודשית למחיה</span><b id="f-lbl-exp">${fmt(C.monthlyExp)}</b></div>
      <input type="range" min="4000" max="35000" step="100" value="${C.monthlyExp}" data-fsl="exp" style="background:linear-gradient(270deg,var(--g) ${expPct.toFixed(1)}%,var(--line) ${expPct.toFixed(1)}%)">
    </div>

    <div style="margin-top:8px">
      <div class="row s" style="padding:0"><span>חיסכון / הפקדה חודשית להשקעות</span><b id="f-lbl-save">${fmt(C.saveMon)}</b></div>
      <input type="range" min="0" max="25000" step="100" value="${C.saveMon}" data-fsl="save" style="background:linear-gradient(270deg,var(--g) ${savePct.toFixed(1)}%,var(--line) ${savePct.toFixed(1)}%)">
    </div>

    <div class="lb" style="margin-top:10px">שיעור משיכה שנתי (כלל 300 = 4%)</div>
    <div class="seg-sw">
      ${[[3.5,'3.5% שמרני (×343)'],[4,'4% קלאסי (×300)'],[4.5,'4.5% גמיש (×267)']].map(([r,t])=>`<button class="${F.swr==r?'on':''}" data-fw="swr:${r}">${t}</button>`).join('')}
    </div>

    <div class="lb" style="margin-top:10px">תשואה ריאלית שנתית משוערת</div>
    <div class="seg-sw">
      ${[[4,'4% סולידי'],[6,'6% מאוזן'],[8,'8% מנייתי']].map(([r,t])=>`<button class="${F.ret==r?'on':''}" data-fw="ret:${r}">${t}</button>`).join('')}
    </div>

    <div class="chips" style="margin-top:12px">
      ${C.penVal>0?`<button class="chip2 ${F.incPen?'on':''}" data-ftog="incPen">${F.incPen?'✓ כולל פנסיה והשתלמות':'+ כלול פנסיה והשתלמות'}</button>`:''}
      <button class="chip2 ${F.taxAdj?'on':''}" data-ftog="taxAdj">${F.taxAdj?'✓ כולל גילום מס רווחי הון':'+ גלם מס רווחי הון'}</button>
    </div>
  </div>

  <div class="card">
    <h2>תחזית הגעה לחופש כלכלי</h2>
    <div id="f-eta-wrap">${C.etaHtml}</div>
  </div>`;
}

function getMoreList(){
  const now=new Date();
  const mtNx=S.mort&&S.mort.pay?S.mort.pay.find(p=>p.d>now):null;
  const insNx=S.ins&&S.ins.pay?S.ins.pay.find(p=>p.d>now):null;
  const cpTot=S.cp.length?fmt(T(S.cp,'a')):'';
  const wCnt=window._getWarranties?window._getWarranties().length:0;
  const dcCnt=S.docs.length?S.docs.length+' מסמכים':'';
  const wrCnt=wCnt?wCnt+' קבלות':'';
  const glList=window._getGoals?window._getGoals().filter(g=>!g.done):[];
  const glTot=glList.reduce((s,g)=>s+(Number(g.cost)||0),0);
  const glBadge=glList.length?`${glList.length} יעדים · ${fmt(glTot)}`:'';
  const def=fireDefaults();
  const liq=T(S.inv,'שווי ₪');
  const rwBadge=liq&&def.baseExp?(liq/def.baseExp).toFixed(1)+' חוד׳':'';
  const catalog={
    fire:{id:'fire',i:'🧭',t:'חופש כלכלי ומחיה',s:'מד חמצן, כלל 4% ו-300 משכורות',bdg:rwBadge,wide:true,col:'#10b981'},
    gl:{id:'gl',i:'🎯',t:'יעדים ורכישות',s:'רשימת משאלות, תיעדוף וחיסכון',bdg:glBadge,wide:true,col:'#f59e0b'},
    mt:{id:'mt',i:'🏠',t:'משכנתא',s:'יתרה, פעימות, תמהיל ולוח סילוקין',bdg:mtNx?fmt(mtNx.tot)+'/חודש':'',wide:true,col:'#4f6bed'},
    cp:{id:'cp',i:'🎟️',t:'קופונים',s:'יתרות זמינות וקודים',bdg:cpTot,wide:false,col:'#10b981'},
    ins:{id:'ins',i:'🛡️',t:'ביטוח חיים',s:'לוח תשלומים והתקדמות',bdg:insNx&&insNx.a?fmt(insNx.a)+'/חודש':'',wide:false,col:'#06b6d4'},
    dc:{id:'dc',i:'📁',t:'מסמכים ותוקפים',s:'דרכון, רישיון וביטוחים',bdg:dcCnt,wide:false,col:'#f59e0b'},
    wr:{id:'wr',i:'🧾',t:'אחריות וקבלות',s:'קבלות, תוקף אחריות וקטגוריות',bdg:wrCnt,wide:false,col:'#10b981'},
    sl:{id:'sl',i:'🧮',t:'מחשבון שכר',s:'סימולטור משמרות ונטו',bdg:calcSalNet()>0?fmt(calcSalNet()):'',wide:false,col:'#8b5cf6'}
  };
  const defOrder=['fire','gl','mt','cp','ins','dc','wr','sl'];
  let cfg=Array.isArray(S.moreLayout)?S.moreLayout.filter(x=>x&&catalog[x.id]):[];
  const seen=new Set(cfg.map(x=>x.id));
  defOrder.forEach(id=>{if(!seen.has(id))cfg.push({id,wide:catalog[id].wide})});
  return cfg.map(x=>({...catalog[x.id],wide:!!x.wide}));
}
function saveMoreList(list){
  S.moreLayout=list.map(x=>({id:x.id,wide:!!x.wide}));
  ls('more_layout',JSON.stringify(S.moreLayout));
}
function more(){
  const views={ins,cp,dc,wr,mt,sl,gl,fire:fireView};
  if(S.sub&&views[S.sub])return `<button class="pr" data-sub="" style="margin:4px 0 10px">← חזרה</button>`+views[S.sub]();
  S.sub='';
  const list=getMoreList(),ed=S.moreEdit;
  return `<div class="row" style="padding:2px 2px 6px"><span class="lb">${ed?'שנה גודל (ריבוע/רחב) והזז מיקום':'כלים ומודולים נוספים'}</span><div style="display:flex;gap:6px">${ed?`<button class="chip2" data-med-reset style="padding:4px 10px;font-size:12px">איפוס</button>`:''}<button class="chip2 ${ed?'on':''}" data-med-tog style="padding:4px 12px;font-size:12px">${ed?'סיום עריכה ✓':'ערוך פריסה ✎'}</button></div></div>
  <div class="mgrid">${list.map((it,idx)=>{
    const ctrl=ed?`<div class="med-bar">
      <button class="med-btn" data-med-sz="${it.id}">${it.wide?'הפוך לריבוע':'הפוך לרחב'}</button>
      <button class="med-btn" data-med-mv="${idx}:-1" ${idx===0?'disabled':''} aria-label="הזז למעלה">▲</button>
      <button class="med-btn" data-med-mv="${idx}:1" ${idx===list.length-1?'disabled':''} aria-label="הזז למטה">▼</button>
    </div>`:'';
    return `<div class="mtile ${it.wide?'wide':''} ${ed?'editing':''}" ${ed?'':`data-sub="${it.id}" role="button" tabindex="0"`}>
      ${it.wide
        ?`<div style="display:flex;align-items:center;gap:12px;min-width:0"><span class="ci" style="background:${it.col}1c">${it.i}</span><div style="min-width:0"><b>${it.t}</b><small>${it.s}</small></div></div>${ed?ctrl:(it.bdg?`<span class="mt-badge">${it.bdg}</span>`:'<span>←</span>')}`
        :`<div class="mt-top"><span class="ci" style="background:${it.col}1c">${it.i}</span>${!ed&&it.bdg?`<span class="mt-badge">${it.bdg}</span>`:''}</div><div><b>${it.t}</b><small>${it.s}</small></div>${ctrl}`}
    </div>`;
  }).join('')}</div>`;
}
const greet=()=>{const h=new Date().getHours();return h<5?'לילה טוב':h<12?'בוקר טוב':h<18?'צהריים טובים':'ערב טוב'};
function insights(cs,cav){
  const L=[],tot=T(cs.map(x=>({a:x[1]})),'a'),ch=cs.filter(([c])=>!/דיור|שכר|משכנת/.test(c)).map(([c,v])=>[c,v-cav(c),cav(c)]).filter(x=>x[2]>0).sort((a,b)=>b[1]-a[1]);
  if(ch[0]&&ch[0][1]>0)L.push(['📈',esc(ch[0][0])+' גבוה ב-'+fmt(ch[0][1])+' מהממוצע שלו']);
  const lo=ch[ch.length-1];if(lo&&lo[1]<0)L.push(['📉',esc(lo[0])+' נמוך ב-'+fmt(-lo[1])+' מהממוצע שלו']);
  if(cs[0]&&tot)L.push(['🥇',esc(cs[0][0])+' מהווה '+Math.round(cs[0][1]/tot*100)+'% מההוצאות החודש']);
  const inc=(S.mon.find(x=>x.ym==S.ym)||{}).inc||0;
  if(inc>0){
    const sr=Math.round(((inc-tot)/inc)*100);
    L.push(['💰',sr>=0?`שיעור החיסכון החודשי עומד על ${S.hide?'•••':sr+'%'} (יתרה ${fmt(inc-tot)})`:`ההוצאות עולות על ההכנסה החודשית ב-${fmt(tot-inc)}`]);
  }
  const goals=window._getGoals?window._getGoals().filter(g=>!g.done):[];
  if(goals.length){
    const gCost=goals.reduce((s,g)=>s+Math.max(0,num(g.cost)),0);
    const gSaved=goals.reduce((s,g)=>s+Math.max(0,num(g.saved)),0);
    L.push(['🎯',`${goals.length} יעדים פתוחים · נחסכו ${fmt(gSaved)} מתוך ${fmt(gCost)}`]);
  }
  const now=new Date(),soon=new Date(now.getTime()+30*864e5);
  const wSoon=getAllWarranties().filter(w=>{if(!w.expiryDate)return false;const d=new Date(w.expiryDate+'T00:00:00');return d>=now&&d<=soon});
  if(wSoon.length)L.push(['🧾',`${wSoon.length} אחריויות מוצרים פגות ב-30 הימים הקרובים`]);
  const dSoon=(S.docs||[]).filter(d=>{if(!d.exp)return false;const dt=new Date(d.exp);return !isNaN(dt)&&dt>=now&&dt<=soon});
  if(dSoon.length)L.push(['📁',`${dSoon.length} מסמכים דורשים חידוש בקרוב`]);
  const nwTot=T(S.inv,'שווי ₪')+T(S.pen,'שווי ₪');
  if(nwTot>0)L.push(['🏦',`הון מנוהל (השקעות ופנסיה) מסתכם ב-${fmt(nwTot)}`]);
  return L.length?`<div class="card"><h2>תובנות</h2>${L.map(([i,t])=>`<div class="row" style="justify-content:flex-start;gap:12px"><span>${i}</span><span>${t}</span></div>`).join('')}</div>`:'';
}

const HOME_META={
  quick:{id:'quick',t:'פעולות מהירות'},
  carousel:{id:'carousel',t:'קרוסלת גרפים ובריאות פיננסית'},
  alerts:{id:'alerts',t:'התראות חכמות'},
  insights:{id:'insights',t:'תובנות אישיות'},
  cats:{id:'cats',t:'קטגוריות מובילות'}
};
const HOME_DEF_ORDER=['quick','carousel','alerts','insights','cats'];
function getHomeList(){
  let cfg=Array.isArray(S.homeLayout)?S.homeLayout.filter(x=>x&&HOME_META[x.id]):[];
  const seen=new Set(cfg.map(x=>x.id));
  HOME_DEF_ORDER.forEach(id=>{if(!seen.has(id))cfg.push({id,hidden:false})});
  return cfg.map(x=>({...HOME_META[x.id],hidden:!!x.hidden}));
}
function saveHomeList(list){
  S.homeLayout=list.map(x=>({id:x.id,hidden:!!x.hidden}));
  ls('home_layout',JSON.stringify(S.homeLayout));
}

const QA_CATALOG={
  gl:{id:'gl',i:'🎯',t:'הוספת יעד',attr:'data-quick-gl'},
  inv:{id:'inv',i:'📈',t:'נכסים',attr:'data-t="inv"'},
  dc:{id:'dc',i:'📁',t:'מסמכים',attr:'data-gs-sub="dc"'},
  shop:{id:'shop',i:'🛒',t:'קניות',attr:'data-t="shop"'},
  sync:{id:'sync',i:'🔄',t:'סנכרון',attr:'data-sync'},
  wr:{id:'wr',i:'🧾',t:'אחריות',attr:'data-gs-sub="wr"'},
  sl:{id:'sl',i:'🧮',t:'מחשבון שכר',attr:'data-gs-sub="sl"'},
  pv:{id:'pv',i:'📊',t:'ניתוח',attr:'data-t="pv"'},
  fire:{id:'fire',i:'🧭',t:'חופש כלכלי',attr:'data-gs-sub="fire"'},
  mt:{id:'mt',i:'🏠',t:'משכנתא',attr:'data-gs-sub="mt"'}
};
const QA_DEF_ORDER=['gl','inv','dc','shop','sync','wr','sl','pv','fire','mt'];
function getQaList(){
  let cfg=Array.isArray(S.qaLayout)?S.qaLayout.filter(x=>x&&QA_CATALOG[x.id]):[];
  const seen=new Set(cfg.map(x=>x.id));
  QA_DEF_ORDER.forEach((id,idx)=>{if(!seen.has(id))cfg.push({id,hidden:idx>=5})});
  return cfg.map(x=>({...QA_CATALOG[x.id],hidden:!!x.hidden}));
}
function saveQaList(list){
  S.qaLayout=list.map(x=>({id:x.id,hidden:!!x.hidden}));
  ls('qa_layout',JSON.stringify(S.qaLayout));
}
function quickActionsCard(){
  const list=getQaList(),ed=S.qaEdit;
  const visible=list.filter(x=>!x.hidden);
  return `<div class="card">
    <div class="qa-hdr">
      <h2>פעולות מהירות</h2>
      <div style="display:flex;gap:6px">
        ${ed?`<button type="button" class="btn-ghost" data-qa-reset style="padding:3px 8px;font-size:11.5px">איפוס</button>`:''}
        <button type="button" class="chip2 ${ed?'on':''}" data-qa-tog style="padding:3px 10px;font-size:11.5px">${ed?'סיום ✓':'התאמה ✎'}</button>
      </div>
    </div>
    ${ed?`<div class="qa-edit-list">${list.map((it,idx)=>`<div class="qa-edit-row">
      <span>${it.i} <b>${esc(it.t)}</b> <small class="mut">${it.hidden?'(מוסתר)':'(מוצג)'}</small></span>
      <div class="hlay-ctrls">
        <button type="button" class="med-btn" data-qa-mv="${idx}:-1" ${idx===0?'disabled':''}>▲</button>
        <button type="button" class="med-btn" data-qa-mv="${idx}:1" ${idx===list.length-1?'disabled':''}>▼</button>
        <button type="button" class="btn-secondary" data-qa-vis="${it.id}" style="padding:3px 8px;font-size:11px">${it.hidden?'הצג':'הסתר'}</button>
      </div>
    </div>`).join('')}</div>`
    :`<div class="qa-grid">${(visible.length?visible:list.slice(0,5)).map(it=>`<button type="button" class="qa-btn" ${it.attr}><span>${it.i}</span><span>${esc(it.t)}</span></button>`).join('')}</div>`}
  </div>`;
}
function financialHealthCard(tot,inc,avgExp,inCar=false){
  const invVal=T(S.inv,'שווי ₪'),penVal=T(S.pen,'שווי ₪'),netWorth=invVal+penVal;
  const baseM=Math.max(1,avgExp||tot||12000);
  const liqMonths=invVal/baseM;
  const liqScore=invVal>0?Math.min(100,Math.round((liqMonths/6)*100)):(inc>tot?65:40);

  const savRate=inc>0?((inc-tot)/inc)*100:0;
  const savScore=inc>0?Math.max(0,Math.min(100,Math.round(savRate*3.33))):50;

  const now=new Date();
  const mtNx=S.mort&&Array.isArray(S.mort.pay)?S.mort.pay.find(p=>p.d>now):null;
  const insNx=S.ins&&Array.isArray(S.ins.pay)?S.ins.pay.find(p=>p.d>now):null;
  const debtM=(mtNx?num(mtNx.tot):0)+(insNx?num(insNx.a):0);
  const debtRatio=inc>0?debtM/inc:(netWorth>0?debtM/(netWorth/24):0);
  const debtScore=debtM===0?95:Math.max(15,Math.min(100,Math.round((1-Math.min(0.85,debtRatio*1.4))*100)));

  const goals=window._getGoals?window._getGoals():[];
  const openGoals=goals.filter(g=>!g.done);
  const doneGoals=goals.filter(g=>g.done);
  const gCost=openGoals.reduce((s,g)=>s+Math.max(0,num(g.cost)),0);
  const gSaved=openGoals.reduce((s,g)=>s+Math.max(0,num(g.saved)),0);
  const goalProg=gCost>0?Math.min(1,gSaved/gCost):(goals.length?(doneGoals.length/goals.length):0.5);
  const penBoost=penVal>0?0.25:0;
  const goalsScore=Math.max(10,Math.min(100,Math.round((goalProg*0.75+penBoost)*100)));

  const totalScore=Math.max(0,Math.min(100,Math.round(liqScore*0.30+savScore*0.30+debtScore*0.20+goalsScore*0.20)));
  const grade=totalScore>=80?'מצוין':totalScore>=60?'יציב':'דורש תשומת לב';

  return `<div class="card${inCar?' sl':''}">
    <div class="health-score-top">
      <div><h2 style="margin:0">מדד בריאות פיננסית</h2><small class="mut">ציון משוקלל (0–100) · ${esc(grade)}</small></div>
      <div class="health-num">${S.hide?'•••':totalScore}</div>
    </div>
    <div class="health-grid">
      <div class="health-m"><small>נזילות (30%)</small><b>${S.hide?'•••':liqScore+'/100'}</b></div>
      <div class="health-m"><small>שיעור חיסכון (30%)</small><b>${S.hide?'•••':savScore+'/100'}</b></div>
      <div class="health-m"><small>התחייבויות (20%)</small><b>${S.hide?'•••':debtScore+'/100'}</b></div>
      <div class="health-m"><small>יעדים והון (20%)</small><b>${S.hide?'•••':goalsScore+'/100'}</b></div>
    </div>
    <p class="mut" style="margin:8px 0 0;font-size:11.5px">שקוף: 30% נזילות (${invVal>0?liqMonths.toFixed(1)+' חוד׳ מחיה':'לפי יתרה'}) · 30% חיסכון · 20% התחייבויות · 20% יעדים והון (${fmt(netWorth)})</p>
  </div>`;
}
function renderHomeModules(tot,inc,avg,cs,cav,ys,i){
  const list=getHomeList();
  const ed=S.homeEdit;
  const bar=`<div class="hlay-bar"><span class="lb">${ed?'התאם סדר והצגת כרטיסים במסך הבית':'סידור מודולרי של מסך הבית'}</span><div style="display:flex;gap:6px">${ed?`<button type="button" class="btn-ghost" data-hed-reset style="padding:4px 10px;font-size:12px">איפוס</button>`:''}<button type="button" class="btn-secondary ${ed?'on':''}" data-hed-tog style="padding:4px 12px;font-size:12px">${ed?'סיום עריכה ✓':'סדר כרטיסים ✎'}</button></div></div>`;
  if(ed){
    return bar+`<div class="card"><h2>ניהול כרטיסי מסך הבית</h2>${list.map((it,idx)=>`<div class="hlay-item">
      <span><b>${esc(it.t)}</b> <small class="mut">${it.hidden?'(מוסתר)':'(מוצג)'}</small></span>
      <div class="hlay-ctrls">
        <button type="button" class="med-btn" data-hed-mv="${idx}:-1" ${idx===0?'disabled':''} aria-label="הזז למעלה">▲</button>
        <button type="button" class="med-btn" data-hed-mv="${idx}:1" ${idx===list.length-1?'disabled':''} aria-label="הזז למטה">▼</button>
        <button type="button" class="btn-secondary" data-hed-vis="${it.id}" style="padding:4px 9px;font-size:11.5px">${it.hidden?'הצג':'הסתר'}</button>
      </div>
    </div>`).join('')}</div>`;
  }
  const mo=S.ym%100;
  const pts=ys.slice(Math.max(0,i-5),i+1).map((y,k)=>({
    ym:y,v:T(S.exp.filter(e=>e.ym==y),'a'),on:y==S.ym,
    lb:new Date(Math.floor(y/100),y%100-1,1).toLocaleDateString('he-IL',{month:'short'}),
    flb:new Date(Math.floor(y/100),y%100-1,1).toLocaleDateString('he-IL',{month:'long',year:'2-digit'})
  }));
  const renderSec=id=>{
    if(id==='quick')return quickActionsCard();
    if(id==='carousel')return `<div class="car">${donut(cs,tot)}${financialHealthCard(tot,inc,avg,true)}${cashflowCard(ys,i)}${forecastCard(ys,i)}<div class="card sl"><div><div class="row"><h2>חצי שנה אחרונה</h2><button class="pr" data-t="pv">ניתוח מלא ←</button></div><span class="lb">לחיצה ממושכת על הגרף לפירוט · הקו המקווקו הוא הממוצע ${fmt(avg)}</span></div>${areaChart(pts,{avg})}</div>${trendsCard(ys,i)}</div><div class="dots">${[0,1,2,3,4,5].map(k=>`<i data-dot="${k}" class="${k?'':'on'}"></i>`).join('')}</div>`;
    if(id==='alerts')return smartAlerts();
    if(id==='insights')return insights(cs,cav);
    if(id==='cats')return `<div class="card"><h2>קטגוריות מובילות</h2><span class="lb">לחץ לפירוט · סימון "חד-פעמי" (או הערה באקסל) מנטרל מהתחזית</span>${cs.map(([c,v,a],k)=>{const av=cav(c),r=av?v/av:0,bg=S.bud[c]||0,topC=(cs[0]&&cs[0][1])||1;
    return `<details class="ct"><summary><span class="ci" style="background:${COL[k%8]}22">${ico(c)}</span><span class="cn"><b>${esc(c)}</b><small>${Math.round(v/(tot||1)*100)}% מההוצאות · ${a.length} פעולות</small></span>
    <span class="ca"><b>${fmt(v)}</b>${bg?`<small class="${v>bg?'neg':'pos'}">${v>bg?'חריגה '+fmt(v-bg):'נשאר '+fmt(bg-v)} מתוך ${fmt(bg)}</small>`:av?`<small class="${r>1.1?'neg':r<.9?'pos':'mut'}">${r>1.1?'▲':r<.9?'▼':'≈'} ממוצע ${fmt(av)}</small>`:''}</span>${SVG.chevD}</summary>
    <div class="ct-body"><div class="bar"><i style="width:${bg?Math.min(v/bg*100,100):v/topC*100}%;background:${bg&&v>bg?'var(--r)':COL[k%8]}"></i></div>${a.sort((x,y)=>y.a-x.a).map(e=>{const ek=expKey(e),ex=isExcl(e);return `<div class="it ${ex?'ex-off':''}"><span>${e.d>1?`<span class="it-day">${e.d}/${mo}</span>`:''}<span class="it-name">${esc(e.t)}</span></span><div class="it-r"><button class="ex-btn ${ex?'on':''}" data-ex="${encodeURIComponent(ek)}" data-se="${e.sheetExcl?1:0}" title="נטרול מהתחזית ומהממוצע">${ex?(e.sheetExcl?'חריג (אקסל)':'חריג ✓'):'חד-פעמי'}</button><b>${fmt(e.a)}</b></div></div>`}).join('')}</div></details>`}).join('')||'<p class="mut">אין הוצאות בחודש הזה.</p>'}</div>`;
    return '';
  };
  return bar+list.filter(x=>!x.hidden).map(x=>renderSec(x.id)).join('');
}
function insSched(){const I=S.ins;if(!I||!I.yrs)return '';const now=new Date();
  return `<div class="card"><h2>לוח תשלומים מלא</h2><div class="tw"><table><tr><th>שנה</th><th>מתאריך</th><th>חודשי</th><th>שנתי</th><th>סטטוס</th></tr>${Array.from({length:I.yrs},(_,y)=>{const ps=I.pay.slice(y*12,y*12+12);if(!ps.length)return '';const a=ps[0].a,dn=ps.filter(p=>p.d<=now).length;return `<tr><td>${y+1}</td><td>${dl(ps[0].d)}</td><td>${a?fmt(a):'טרם פורסם'}</td><td>${a?fmt(T(ps,'a')):'—'}</td><td>${dn==12?'✓ שולם':dn?dn+' מתוך 12':'עתידי'}</td></tr>`}).join('')}</table></div></div>`}
function ins(){return ins0()+insSched()}

async function loadFiles(){
  S.files='loading';
  try{
    const G=async q=>{
      const all=[];let pt='';
      do{
        const u='https://www.googleapis.com/drive/v3/files?pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true&fields='+encodeURIComponent('nextPageToken,files(id,name,mimeType,webViewLink)')+'&q='+encodeURIComponent(q)+(pt?'&pageToken='+encodeURIComponent(pt):'');
        const res=await driveFetchWithRetry(u);
        if(!res.ok)throw new Error('drive_'+res.status);
        const j=await res.json();
        if(Array.isArray(j.files))all.push(...j.files);
        pt=j.nextPageToken||'';
      }while(pt);
      return all;
    };
    const rootName=APP_CONFIG.receiptsRootFolder.replace(/'/g,"\\'");
    const subName=APP_CONFIG.receiptsSubFolder;
    const root=(await G(`name='${rootName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`))[0];if(!root)throw 0;
    const out=[];let receiptsId='';let lv=[{id:root.id,p:''}];
    for(let d=0;d<5&&lv.length;d++){
      const cur=lv,res=await Promise.all(cur.map(f=>G("'"+f.id+"' in parents and trashed=false")));lv=[];
      res.forEach((a,k)=>a.forEach(x=>{
        if(x.mimeType=='application/vnd.google-apps.folder'){
          if(d===0&&x.name===subName)receiptsId=x.id;
          lv.push({id:x.id,p:(cur[k].p?cur[k].p+' / ':'')+x.name});
        }else{
          out.push({id:x.id,name:x.name,webViewLink:x.webViewLink,g:cur[k].p});
        }
      }));
    }
    S.files={root:root.id,receiptsId,out};
  }catch(e){S.files='err'}
  if(!S.wForm)draw();
}
function dc(){return pickCard()+dc0()}

async function prepareUploadBlob(file){
  if(!file||!file.type||!file.type.startsWith('image/')||file.size<=2621440)return{blob:file,ext:(file.name.split('.').pop()||'jpg').toLowerCase(),mime:file.type||'application/octet-stream'};
  return new Promise(resolve=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const maxDim=2200;let w=img.width,h=img.height;
      if(Math.max(w,h)>maxDim){const sc=maxDim/Math.max(w,h);w=Math.round(w*sc);h=Math.round(h*sc)}
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      cv.toBlob(b=>{
        if(b)resolve({blob:b,ext:'jpg',mime:'image/jpeg'});
        else resolve({blob:file,ext:(file.name.split('.').pop()||'jpg').toLowerCase(),mime:file.type});
      },'image/jpeg',0.86);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);resolve({blob:file,ext:(file.name.split('.').pop()||'jpg').toLowerCase(),mime:file.type})};
    img.src=url;
  });
}

async function uploadReceiptToDrive(file,meta){
  const findFolder=async(name,parentId)=>{
    const q=`name='${name.replace(/'/g,"\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`+(parentId?` and '${parentId}' in parents`:'');
    const r=await driveFetchWithRetry('https://www.googleapis.com/drive/v3/files?fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true&q='+encodeURIComponent(q));
    if(!r.ok)throw new Error('שגיאת גישה ל-Google Drive ('+r.status+')');
    const j=await r.json();
    return (j.files&&j.files[0])?j.files[0].id:'';
  };
  const createFolder=async(name,parentId)=>{
    const body={name,mimeType:'application/vnd.google-apps.folder'};
    if(parentId)body.parents=[parentId];
    const r=await driveFetchWithRetry('https://www.googleapis.com/drive/v3/files?fields=id,name&supportsAllDrives=true',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    if(!r.ok)throw new Error('לא ניתן ליצור תיקייה בדרייב ('+r.status+')');
    return (await r.json()).id;
  };
  const rootFolder=APP_CONFIG.receiptsRootFolder;
  const subFolder=APP_CONFIG.receiptsSubFolder;
  const filesObj=S.files&&typeof S.files==='object'?S.files:null;
  let rootId=(filesObj&&filesObj.root)||await findFolder(rootFolder,'');
  if(!rootId){
    rootId=await createFolder(rootFolder,'');
    if(filesObj)filesObj.root=rootId;
  }
  let recId=(filesObj&&filesObj.receiptsId)||await findFolder(subFolder,rootId);
  if(!recId){
    recId=await createFolder(subFolder,rootId);
    if(filesObj)filesObj.receiptsId=recId;
  }
  const prep=await prepareUploadBlob(file);
  const clean=s=>String(s||'').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim();
  const base=[clean(meta.name),clean(meta.store),clean(meta.purchaseDate)].filter(Boolean).join(' - ')||'קבלה';
  const uploadName=`${base}.${prep.ext}`;
  const boundary='-------myMoneyReceiptBoundary'+Date.now();
  const metaJson=JSON.stringify({name:uploadName,parents:[recId]});
  const headPart=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${prep.mime}\r\n\r\n`]);
  const tailPart=new Blob([`\r\n--${boundary}--`]);
  const multipart=new Blob([headPart,prep.blob,tailPart],{type:`multipart/related; boundary=${boundary}`});
  const upRes=await driveFetchWithRetry('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink',{
    method:'POST',
    headers:{'Content-Type':`multipart/related; boundary=${boundary}`},
    body:multipart
  });
  if(!upRes.ok)throw new Error('העלאת הקובץ נכשלה ('+upRes.status+')');
  const uploaded=await upRes.json();
  if(filesObj&&Array.isArray(filesObj.out)){
    filesObj.out.unshift({id:uploaded.id,name:uploaded.name,webViewLink:uploaded.webViewLink,g:subFolder});
  }
  return uploaded;
}

async function saveWarrantyAction(){
  const f=S.wForm;if(!f||S.wSaving)return;
  const name=String(f.name||'').trim();
  if(!name){S.wErr='נא להזין שם מוצר';draw(true);return}
  let category=f.newCatMode?String(f.newCatName||'').trim():String(f.category||W_CATS[0]).trim();
  if(!category){S.wErr='נא להזין שם קטגוריה';draw(true);return}
  saveCustomWCat(category);

  const purchaseDate=String(f.purchaseDate||todayISO()).trim();
  const months=Math.max(0,Math.round(Number(f.months)||0));
  const expiryDate=addMonthsISO(purchaseDate,months);
  const price=Math.max(0,Math.round((parseFloat(String(f.price||'0').replace(',','.'))||0)*100)/100);
  S.wSaving=true;S.wErr='';draw(true);

  try{
    let coverId=f.coverId||'',coverLink=f.coverLink||'';
    if(S.wPendingCover){
      const upCov=await uploadReceiptToDrive(S.wPendingCover,{name:`${name} (תמונת מוצר)`,store:f.store,purchaseDate});
      coverId=upCov.id||'';coverLink=upCov.webViewLink||'';
    }
    const attachments=[...(Array.isArray(f.attachments)?f.attachments:[])];
    const pendingList=Array.isArray(S.wPendingFiles)?S.wPendingFiles:[];
    for(let idx=0;idx<pendingList.length;idx++){
      const suffix=pendingList.length>1?` (${idx+1})`:'';
      const up=await uploadReceiptToDrive(pendingList[idx],{name:name+suffix,store:f.store,purchaseDate});
      attachments.push({id:up.id||'',name:up.name||pendingList[idx].name,link:up.webViewLink||''});
    }
    const firstAtt=attachments[0]||{};
    const rec={
      id:f.id||('w_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),
      name,
      category,
      store:String(f.store||'').trim(),
      price,
      purchaseDate,
      months,
      expiryDate,
      notes:String(f.notes||'').trim(),
      coverId,
      coverLink,
      attachments,
      fileId:firstAtt.id||'',
      fileName:firstAtt.name||'',
      fileLink:firstAtt.link||'',
      updatedAt:Date.now()
    };
    if(window._saveWarranty)window._saveWarranty(rec);
    S.wForm=null;S.wPendingCover=null;S.wPendingFiles=[];S.wSaving=false;S.wErr='';
    draw();
    showToast('המוצר והקבצים נשמרו בהצלחה ✓');
  }catch(err){
    S.wSaving=false;
    S.wErr=(err&&err.message)?err.message:'שגיאה בשמירה';
    draw(true);
  }
}

let lastFireVib=0,qTimer=0;
document.addEventListener('input',e=>{
  if(e.target.dataset.q!==undefined){
    S.pv.q=e.target.value;S.pv.dr=null;
    clearTimeout(qTimer);
    qTimer=setTimeout(()=>{
      const cur=document.querySelector('input[data-q]');
      const hadFocus=document.activeElement===cur;
      const pos=hadFocus&&cur?cur.selectionStart:null;
      draw(true);
      if(hadFocus){
        const inp=document.querySelector('input[data-q]');
        if(inp){inp.focus();if(pos!==null)try{inp.setSelectionRange(pos,pos)}catch(err){}}
      }
    },250);
  }
  if(e.target.dataset.wf!==undefined&&S.wForm){
    const k=e.target.dataset.wf;
    if(k==='customMonths'){
      S.wForm.months=Math.max(0,parseInt(e.target.value,10)||0);
      updateWarrantyPreviewDom();
    }else if(k==='purchaseDate'){
      S.wForm.purchaseDate=e.target.value;
      updateWarrantyPreviewDom();
    }else{
      S.wForm[k]=e.target.value;
    }
    return;
  }
  if(e.target.id==='gs-input'){
    S.gsQ=e.target.value;
    const pos=e.target.selectionStart;
    draw(true);
    const inp=document.getElementById('gs-input');
    if(inp){inp.focus();if(pos!==null)try{inp.setSelectionRange(pos,pos)}catch(err){}}
    return;
  }
  if(e.target.dataset.fsl!==undefined&&S.fire){
    const v=+e.target.value;
    S.fire[e.target.dataset.fsl]=v;
    e.target.style.background=sliderTrackBg(e.target);
    if(Math.abs(v-lastFireVib)>=500){lastFireVib=v;vib(3)}
    updateFireLive();
  }
});

const toDr=()=>setTimeout(()=>{const x=document.getElementById('dr');x&&x.scrollIntoView({behavior:'smooth',block:'start'})},40);
async function openDoc(name,person){
  if(!S.files||S.files=='err'||S.files=='loading')await loadFiles();
  const F=S.files,all=F&&typeof F==='object'&&Array.isArray(F.out)?F.out:[],key=name.replace(/\(.*?\)/g,'').trim();
  let hit=all.filter(f=>(f.g+' '+f.name).includes(key));const h2=person?hit.filter(f=>f.name.includes(person.split(' ')[0])):[];if(h2.length)hit=h2;
  if(hit.length==1)open(hit[0].webViewLink,'_blank','noopener');
  else if(hit.length>1){S.pick={name,hit};draw();scrollTo(0,0)}
  else{S.pick={name:name+' (לא נמצאה התאמה, כל הקבצים)',hit:all};draw();scrollTo(0,0)}
}
function pickCard(){const p=S.pick;return p?`<div class="card"><div class="row"><h2>בחר קובץ: ${esc(p.name)}</h2><button class="chip2" data-pk>✕</button></div>${p.hit.map(f=>`<div class="row s"><span>${esc(f.name)} <span class="mut">${esc(f.g)}</span></span><button class="pr" data-l="${encodeURIComponent(f.webViewLink)}">פתח</button></div>`).join('')}</div>`:''}

function syncDots(car){
  const dots=car.nextElementSibling;if(!dots)return;
  const slides=[...car.querySelectorAll('.sl')],cr=car.getBoundingClientRect(),cx=cr.left+cr.width/2;
  let best=0,bd=1e9;
  slides.forEach((sl,idx)=>{const r=sl.getBoundingClientRect(),d=Math.abs((r.left+r.width/2)-cx);if(d<bd){bd=d;best=idx}});
  dots.querySelectorAll('i').forEach((d,j)=>d.classList.toggle('on',j===best));
}
function centerMonthStrip(){
  const st=document.getElementById('mstrip');if(!st)return;
  const on=st.querySelector('.mp-pill.on');if(!on)return;
  st.scrollLeft+=(on.getBoundingClientRect().left+on.offsetWidth/2)-(st.getBoundingClientRect().left+st.clientWidth/2);
}
function updateSlFloat(){
  const scrolled=window.scrollY>130;
  const f=document.getElementById('slf');
  if(f)f.classList.toggle('on',scrolled);
  const sf=document.getElementById('shop-float-bar');
  if(sf)sf.classList.toggle('on',S.tab==='shop'&&scrolled);
}
window.addEventListener('scroll',updateSlFloat,{passive:true});
document.addEventListener('scroll',e=>{const c=e.target;if(c.classList&&c.classList.contains('car'))syncDots(c)},true);

const post=async(p,b)=>(await fetch(W+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})).json();
function setTok(j){token=j.access_token;ls('tok',JSON.stringify({t:token,e:Date.now()+((+j.expires_in||3600)-120)*1e3}))}
let refreshPromise=null;
async function refresh(){
  if(refreshPromise)return refreshPromise;
  const rt=ls('rt');if(!rt)return false;
  refreshPromise=(async()=>{
    try{
      const j=await post('/refresh',{refresh_token:rt});
      if(j.access_token){
        setTok(j);
        if(j.refresh_token)ls('rt',j.refresh_token);
        return true;
      }
      if(j.error=='invalid_grant'||j.error=='unauthorized_client')ls('rt',null);
    }catch(e){}
    return false;
  })();
  try{return await refreshPromise}finally{refreshPromise=null}
}
const fail=m=>{
  S.err=m;
  S.exp.length?draw():msg(`${esc(m)}<br><br><button class="go" data-sync>נסה שוב</button>`,true);
};
async function onAuthCode(r){
  if(!r||!r.code)return;
  try{
    const x=await post('/exchange',{code:r.code});
    if(!x.access_token){fail('שגיאת התחברות: '+(x.error_description||x.error||''));return}
    setTok(x);ls('gd','1');S.scopeErr=false;
    if(x.refresh_token)ls('rt',x.refresh_token);
    else alert('ההתחברות הצליחה, אך גוגל לא העניקה התחברות קבועה. הסר את ההרשאה של האפליקציה ב-myaccount.google.com/permissions, ואז התחבר שוב.');
    load();
  }catch(e){fail('אין חיבור לשרת ההתחברות')}
}
async function login(forceConsent=false){
  if(!forceConsent&&await refresh()){load();return}
  if(!window.google||!google.accounts||!google.accounts.oauth2){
    fail('שירות ההתחברות של Google עדיין נטען, נסה שוב בעוד רגע');
    return;
  }
  const onErr=err=>{if(err&&err.type!=='popup_closed')fail('שגיאת אימות מול Google')};
  const client=forceConsent
    ?google.accounts.oauth2.initCodeClient({client_id:CLIENT_ID,scope:SC,ux_mode:'popup',prompt:'consent',callback:onAuthCode,error_callback:onErr})
    :(cc=cc||google.accounts.oauth2.initCodeClient({client_id:CLIENT_ID,scope:SC,ux_mode:'popup',callback:onAuthCode,error_callback:onErr}));
  client.requestCode();
}
window._getAuthToken=()=>token;
window._refreshAuthToken=()=>refresh();
window._upgradeDriveScope=()=>login(true);

const brk=it=>{const m={};it.forEach(e=>{(m[e.t]=m[e.t]||{s:0,n:0}).s+=e.a;m[e.t].n++});const tot=T(it,'a')||1;
  return Object.entries(m).sort((a,b)=>b[1].s-a[1].s).map(([t,v])=>`<div style="padding-top:12px"><div class="row" style="padding:0"><span>${esc(t)}</span><b>${fmt(v.s)}</b></div><div class="row s mut" style="padding:0"><span>${v.n} פעולות · ממוצע ${fmt(v.s/v.n)}</span><span>${Math.round(v.s/tot*100)}%</span></div><div class="bar" style="margin:4px 0 0"><i style="width:${v.s/tot*100}%;background:var(--g)"></i></div></div>`).join('')};
async function getAny(a){let er;for(const n of a){try{return await getFile(n)}catch(x){er=x;if(x.code===401||x.code===403||/פג/.test(x.message))throw x}}throw er||new Error('לא נמצא קובץ תואם')}

function parseMort(wb){
  const J=n=>wb.Sheets[n]?XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,range:'A1:O400'}):[],
  sm=J('סיכום ומצב נוכחי'),pl=J('פעימות ואימות מול הבנק'),sc=J('לוח סילוקין חודשי'),si=J('סימולטור תרחישים ומחזור'),
  D=x=>x instanceof Date?fix(x):null,hr=(a,t)=>a.findIndex(r=>r&&r.some(c=>String(c||'').trim()==t)),
  va=(a,t)=>{for(const r of a){const i=r?r.findIndex(c=>String(c||'').includes(t)):-1;if(i>=0)return r.slice(i+1).find(c=>c!==undefined&&c!==null&&c!=='')}},
  frame=+va(sm,'סך מסגרת משכנתא מאושרת')||0,mi=hr(sm,'מסלול הלוואה'),pi=hr(pl,'מועד משיכה משוער'),hi=hr(pl,'תאריך חיוב בפועל'),ci=hr(sc,'תאריך חיוב'),ti=hr(si,'תרחיש כלכלי'),
  ni=sm.findIndex(r=>r&&String(r[0]||'').includes('סה"כ תשלומים כוללים'));let cum=0;
  const mix=mi>=0?[1,2,3,4].map(k=>sm[mi+k]).filter(r=>r&&r[0]&&typeof +r[1]==='number'&&!isNaN(+r[1])&&+r[1]>0).map(r=>({n:String(r[0]),a:+r[1],r:+r[3]||0,ix:String(r[4]||''),mech:String(r[5]||''),dr:+r[6]||0})):[];
  const pulses=pi>=0?[1,2,3,4,5,6].map(k=>pl[pi+k]).filter(r=>r&&r[0]&&typeof +r[2]==='number'&&!isNaN(+r[2])&&+r[2]>0).map(r=>{const a=+r[2];cum+=a;return{n:String(r[0]),d:D(r[1]),a,cum,t:String(r[5]||''),st:String(r[6]||''),note:String(r[7]||'')}}):[];
  const hist=hi>=0?pl.slice(hi+1,hi+40).filter(r=>r&&typeof r[2]=='number'&&typeof r[3]=='number').map(r=>({m:r[1],i:r[2],p:r[3],b:r[5],pu:r[6],e:r[7]})):[];
  const pay=ci>=0?sc.slice(ci+1).filter(r=>r&&typeof r[0]=='number'&&r[1] instanceof Date).map(r=>({n:r[0],d:fix(r[1]),y:r[2],dr:+r[3]||0,pr:+r[5]||0,it:+r[6]||0,ix:+r[7]||0,tot:(+r[5]||0)+(+r[6]||0)+(+r[7]||0),bal:+r[11]||0})):[];
  const sim=ti>=0?[1,2,3,4].map(k=>si[ti+k]||[]).filter(r=>r[0]).map(r=>({n:String(r[0]),mo:+r[5]||0,cost:+r[6]||0})):[];
  if(!pay.length&&!mix.length)throw new Error('מבנה גיליונות המשכנתא לא זוהה');
  return{bank:String(va(sm,'בנק וסניף')||''),val:+va(sm,'שווי נכס')||0,frame,note:ni>=0?[...sm[ni]].reverse().find(c=>typeof c=='string'&&c.length>20)||'':'',mix,pulses,hist,pay,sim};
}

function mt(){
  const M=S.mort;if(!M)return `<div class="card"><p>${esc(S.mortErr||'לא נמצא קובץ המשכנתא בדרייב.')}</p></div>`;
  const now=new Date(),paid=M.pay.filter(p=>p.d<=now),nx=M.pay.find(p=>p.d>now),last=paid[paid.length-1]||{bal:0},pp=T(paid,'pr'),pi=T(paid,'it'),px=T(paid,'ix'),
  al={pr:T(M.pay,'pr'),it:T(M.pay,'it'),ix:T(M.pay,'ix')},drawn=T(M.mix,'dr'),wr=M.mix.reduce((s,x)=>s+x.a*x.r,0)/(M.frame||1),full=M.pay.find(p=>p.dr>=M.frame),
  yrs=[...new Set(M.pay.map(p=>p.y))],mm=d=>(d.getMonth()+1)+'/'+String(d.getFullYear()).slice(2),gy=y=>M.pay.filter(p=>p.y==y),hs=M.hist,hx=Math.max(...hs.map(h=>h.i+h.p),1),
  cur=a=>a.some(p=>p.d<=now)&&a.some(p=>p.d>now),gt=al.pr+al.it+al.ix||1,LT=[['החזר קרן',pp,al.pr,COL[1]],['ריבית',pi,al.it,COL[2]],['הצמדה ועמלות',px,al.ix,COL[3]]],
  lastPayDate=M.pay.length?dl(M.pay[M.pay.length-1].d):'—';
  const st=[['שווי נכס',M.val?fmt(M.val):'—'],['מסגרת מאושרת',fmt(M.frame)],['שיעור מימון (LTV)',M.val?(M.frame/M.val*100).toFixed(1)+'%':'—'],['ריבית משוקללת',(wr*100).toFixed(2)+'%'],['נמשך עד כה',fmt(drawn)+' ('+Math.round(drawn/(M.frame||1)*100)+'%)'],['נותר למשיכה',fmt(Math.max(0,M.frame-drawn))]];
  return [
  `<div class="card hg"><div class="lb">משכנתא · ${esc(M.bank||'')}</div><div class="lb">יתרת קרן לסילוק (כולל הצמדה)</div><div class="big">${fmt(last.bal)}</div><span class="chip">${paid.length} מתוך ${M.pay.length} תשלומים</span>
  <div class="bar" style="height:10px;margin:16px 0 6px"><i style="width:${Math.max(paid.length/(M.pay.length||1)*100,1)}%;background:var(--g)"></i></div><div class="lb">${(paid.length/(M.pay.length||1)*100).toFixed(1)}% מהתקופה · מסתיימת ב-${lastPayDate}</div>
  <div class="trio"><div><span class="lb">שולם עד היום</span><b>${fmt(pp+pi+px)}</b></div><div><span class="lb">מזה ריבית והצמדה</span><b>${fmt(pi+px)}</b></div><div><span class="lb">קרן שהוחזרה</span><b>${fmt(pp)}</b></div></div></div>`,
  `<div class="grid"><div class="card"><span class="lb">התשלום הבא</span><b>${nx?fmt(nx.tot):'—'}</b><span class="lb">${nx?dl(nx.d):''}</span>${nx?`<div class="mut" style="font-size:12px">קרן ${fmt(nx.pr)} · ריבית ${fmt(nx.it)} · הצמדה ${fmt(nx.ix)}</div>`:''}</div>
  <div class="card"><span class="lb">אחרי המשיכה האחרונה</span><b>${full?fmt(full.tot):'—'}</b><span class="lb">${full?'מ-'+dl(full.d):''}</span></div></div>${M.note?`<p class="mut" style="margin:8px 4px">${esc(M.note)}</p>`:''}`,
  `<div class="grid" style="margin-top:12px">${st.map(([a,b])=>`<div class="card"><span class="lb">${a}</span><b style="font-size:18px">${b}</b></div>`).join('')}</div>`,
  `<div class="card"><h2>תמהיל המשכנתא</h2>${M.mix.map((x,k)=>`<div style="padding-top:12px"><div class="row" style="padding:0"><b>${esc(x.n)}</b><b>${fmt(x.a)}</b></div><div class="row s mut" style="padding:0"><span>${(x.r*100).toFixed(2)}% · ${esc(x.ix)}</span><span>${Math.round(x.a/(M.frame||1)*100)}% מהתמהיל</span></div><div class="bar" style="margin:4px 0"><i style="width:${x.dr/(x.a||1)*100}%;background:${COL[k%8]}"></i></div><div class="mut" style="font-size:12px">נמשך ${fmt(x.dr)}${x.a>x.dr?' · נותר '+fmt(x.a-x.dr):''} · ${esc(x.mech)}</div></div>`).join('')}</div>`,
  `<div class="card"><h2>פעימות (משיכות לקבלן)</h2>${M.pulses.map(p=>`<div class="row" style="align-items:flex-start;padding:10px 0;border-top:1px solid var(--line)"><span style="font-size:20px">${/בוצע/.test(p.st)?'✅':'⏳'}</span><div style="flex:1;margin:0 10px"><b>${esc(p.n)}</b><div class="mut">${p.d?dl(p.d):''} · ${esc(p.t)}</div><div class="mut" style="font-size:12px">${esc(p.note||'')}</div></div><div style="text-align:end"><b>${fmt(p.a)}</b><div class="mut">${Math.round(p.cum/(M.frame||1)*100)}%</div></div></div>`).join('')}</div>`,
  `<div class="card"><h2>חיובים בפועל בבנק</h2><span class="lb">אדום ריבית ועמלות · ירוק החזר קרן</span><div class="bars">${hs.map(h=>{const sumH=(h.i+h.p)||1;return `<div title="${esc(h.m)}: ${fmt(h.i+h.p)}"><b style="height:${(h.i+h.p)/hx*80}%;background:linear-gradient(var(--r) ${h.i/sumH*100}%,var(--g) 0)"></b><small>${esc(String(h.m).slice(0,2))}</small></div>`}).join('')}</div>
  <details class="ct"><summary><span>פירוט חודשי</span><b>${hs.length} חודשים</b>${SVG.chevD}</summary><div class="ct-body">${hs.map(h=>`<div style="padding:6px 0;border-top:1px solid var(--line)"><div class="row s" style="padding:0"><b>${esc(h.m)}</b><span>${fmt(h.i+h.p)} · יתרה משוכה ${fmt(h.b)}</span></div><div class="mut" style="font-size:12px">${esc(h.pu||'')}: ${esc(h.e||'')}</div></div>`).join('')}</div></details></div>`,
  `<div class="card"><h2>עלות כוללת לכל חיי ההלוואה</h2><div class="big" style="font-size:34px">${fmt(al.pr+al.it+al.ix)}</div><span class="lb">על מסגרת של ${fmt(M.frame)} · עלות מימון ${fmt(al.it+al.ix)}</span><div class="stack">${LT.map(x=>`<i style="width:${x[2]/gt*100}%;background:${x[3]}"></i>`).join('')}</div>${LT.map(x=>`<div class="row s"><span><i class="dot" style="background:${x[3]}"></i>${x[0]}</span><span class="mut">שולם ${fmt(x[1])} · נותר ${fmt(x[2]-x[1])}</span><b>${fmt(x[2])}</b></div>`).join('')}</div>`,
  `<div class="card"><h2>סיכום שנתי</h2><div class="tw"><table><tr><th>שנה</th><th>תקופה</th><th>חודשי</th><th>קרן</th><th>ריבית</th><th>הצמדה</th><th>סה״כ</th><th>יתרה</th><th>סילוק</th></tr>${yrs.map(y=>{const a=gy(y),e=a[a.length-1];return `<tr style="${cur(a)?'font-weight:700':''}"><td>${y}</td><td>${mm(a[0].d)}–${mm(e.d)}</td><td>${nf(T(a,'tot')/(a.length||1))}</td><td>${nf(T(a,'pr'))}</td><td>${nf(T(a,'it'))}</td><td>${nf(T(a,'ix'))}</td><td>${nf(T(a,'tot'))}</td><td>${nf(e.bal)}</td><td>${Math.round((1-e.bal/(M.frame||1))*100)}%</td></tr>`}).join('')}</table></div></div>`,
  `<div class="card"><h2>לוח סילוקין חודשי</h2><span class="lb">לחץ על שנה לפתיחה · ✓ שולם · ▶ התשלום הבא</span>${yrs.map(y=>{const a=gy(y);return `<details ${cur(a)?'open':''} class="ct"><summary><span>שנה ${y} · ${mm(a[0].d)}–${mm(a[a.length-1].d)}</span><b>${fmt(a[a.length-1].bal)}</b>${SVG.chevD}</summary><div class="ct-body"><div class="tw"><table><tr><th>חודש</th><th>קרן</th><th>ריבית</th><th>הצמדה</th><th>סה״כ</th><th>יתרה</th></tr>${a.map(p=>`<tr><td>${p.d<=now?'✓':p==nx?'▶':''} ${mm(p.d)}</td><td>${nf(p.pr)}</td><td>${nf(p.it)}</td><td>${nf(p.ix)}</td><td><b>${nf(p.tot)}</b></td><td>${nf(p.bal)}</td></tr>`).join('')}</table></div></div></details>`}).join('')}</div>`,
  `<div class="card"><h2>סימולטור תרחישים</h2><span class="lb">רגישות לשינויי ריבית ומדד, לפי הנתונים שבקובץ</span><div style="margin-top:8px">${M.sim.map(s=>`<div class="sim-item"><b style="display:block;font-size:14px;margin-bottom:4px">${esc(s.n)}</b><div class="row s" style="padding:0"><span class="mut">החזר חודשי ממוצע: <b style="color:var(--ink)">${fmt(s.mo)}</b></span><span class="mut">עלות ריבית והצמדה: <b style="color:var(--ink)">${fmt(s.cost)}</b></span></div></div>`).join('')}</div></div>`].join('');
}

function pxs(rs,tot,nmo,d,P,all){
  const R=P.rows,top=rs.slice(0,5),n=all.filter(y=>y>=P.from&&y<=P.to),k=n.length,i0=all.indexOf(n[0]),prev=i0>0?all.slice(Math.max(0,i0-k),i0):[],
  qNorm=String(P.q||'').toLowerCase(),
  pd=S.exp.filter(e=>prev.includes(e.ym)&&(!P.sel.length||P.sel.includes(e.c))&&(!qNorm||(e.t+' '+e.c).toLowerCase().includes(qNorm))),pt=T(pd,'a'),big=[...d].sort((a,b)=>b.a-a.a).slice(0,5);

  let slide3='';
  if(prev.length){
    const mxC=Math.max(tot,pt,1),diff=tot-pt;
    const catMap={};
    d.forEach(e=>catMap[e.c]=(catMap[e.c]||0)+e.a);
    pd.forEach(e=>catMap[e.c]=(catMap[e.c]||0)-e.a);
    const topShift=Object.entries(catMap).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))[0];
    slide3=`<div class="card sl">
      <div>
        <div class="row" style="padding:0;gap:6px"><h2 style="font-size:16px">לעומת התקופה הקודמת</h2><span class="chip ${diff>0?'bad':''}">${diff>0?'↑':'↓'} ${fmt(Math.abs(diff))}${pt?` (<bdi dir="ltr">${pct(diff/pt*100)}</bdi>)`:''}</span></div>
        <span class="lb">${prev.length} החודשים שלפני הטווח שנבחר</span>
        <div class="cmp-bars">
          <div class="cmp-row"><div class="row s" style="padding:0"><span>בטווח הנבחר</span><b>${fmt(tot)}</b></div><div class="cmp-track"><i style="width:${(tot/mxC*100).toFixed(1)}%;background:${diff>0?'var(--r)':'var(--g)'}"></i></div></div>
          <div class="cmp-row"><div class="row s" style="padding:0"><span class="mut">תקופה קודמת</span><b>${fmt(pt)}</b></div><div class="cmp-track"><i style="width:${(pt/mxC*100).toFixed(1)}%;background:var(--b);opacity:.65"></i></div></div>
        </div>
      </div>
      <div>
        <div class="trio" style="margin-top:4px;padding-top:10px">
          <div><span class="lb">ממוצע חודשי</span><b>${fmt(tot/nmo)}</b><small class="mut" style="display:block;font-size:11px">קודם ${fmt(pt/prev.length)}</small></div>
          <div><span class="lb">פעולות</span><b>${d.length}</b><small class="mut" style="display:block;font-size:11px">קודם ${pd.length}</small></div>
          <div><span class="lb">ממוצע לפעולה</span><b>${fmt(d.length?tot/d.length:0)}</b><small class="mut" style="display:block;font-size:11px">קודם ${fmt(pd.length?pt/pd.length:0)}</small></div>
        </div>
        ${topShift&&Math.abs(topShift[1])>50?`<div class="hl-box"><div style="display:flex;align-items:center;gap:8px;min-width:0"><span style="font-size:18px">${ico(topShift[0])}</span><div style="min-width:0"><small class="mut" style="display:block;font-size:11px">השינוי הבולט בקטגוריות</small><b style="font-size:13.5px">${esc(topShift[0])}</b></div></div><b class="${topShift[1]>0?'neg':'pos'}" style="font-size:14px;white-space:nowrap">${topShift[1]>0?'+':'-'}${fmt(Math.abs(topShift[1]))}</b></div>`:''}
      </div>
    </div>`;
  }else{
    const byYr={};
    d.forEach(e=>{const y=Math.floor(e.ym/100);(byYr[y]=byYr[y]||{t:0,ms:new Set()}).t+=e.a;byYr[y].ms.add(e.ym)});
    const yArr=Object.entries(byYr).sort((a,b)=>+b[0]-+a[0]),mxY=Math.max(...yArr.map(x=>x[1].t),1);
    slide3=`<div class="card sl">
      <div><h2>השוואה לפי שנים</h2><span class="lb">התפלגות סך ההוצאות וממוצע חודשי בכל שנה</span></div>
      <div style="margin:auto 0">${yArr.map(([y,v],idx)=>`<div style="padding-top:10px"><div class="row" style="padding:0"><b>${y} <small class="mut">(${v.ms.size} חוד׳)</small></b><b>${fmt(v.t)}</b></div><div class="row s mut" style="padding:0"><span>ממוצע ${fmt(v.t/(v.ms.size||1))}/חודש</span><span>${Math.round(v.t/(tot||1)*100)}%</span></div><div class="bar" style="margin:4px 0 0"><i style="width:${(v.t/mxY*100).toFixed(1)}%;background:${COL[idx%8]}"></i></div></div>`).join('')||'<p class="mut">אין נתונים.</p>'}</div>
      <div class="hl-box"><span class="mut" style="font-size:12.5px">סה״כ ${all.length} חודשי תיעוד</span><b>${fmt(tot/nmo)} / חודש</b></div>
    </div>`;
  }

  const bigSum=T(big,'a'),mxB=big[0]?big[0].a:1;
  const slide4=`<div class="card sl">
    <div><h2>ההוצאות הגדולות בטווח</h2><span class="lb">5 הפעולות הגבוהות ביותר בתקופה הנבחרת</span></div>
    <div style="margin:auto 0">${big.map((e,idx)=>{
      const ek=expKey(e),ex=isExcl(e);
      return `<div class="big-row">
        <div class="row" style="padding:0;gap:8px">
          <div style="display:flex;align-items:center;gap:9px;flex:1;min-width:0">
            <span class="ci" style="width:34px;height:34px;font-size:16px;border-radius:11px;background:${COL[idx%8]}1c">${ico(e.c)}</span>
            <div style="min-width:0"><b style="display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.t)}</b><small class="mut" style="font-size:11.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.c)} · ${ymLb(e.ym)}</small></div>
          </div>
          <div class="it-r"><button class="ex-btn ${ex?'on':''}" data-ex="${encodeURIComponent(ek)}" data-se="${e.sheetExcl?1:0}">${ex?(e.sheetExcl?'חריג (אקסל)':'חריג ✓'):'חד-פעמי'}</button><b>${fmt(e.a)}</b></div>
        </div>
        <div class="bar" style="height:4px;margin:6px 0 0"><i style="width:${(e.a/mxB*100).toFixed(1)}%;background:${COL[idx%8]}"></i></div>
      </div>`;
    }).join('')||'<p class="mut">אין נתונים.</p>'}</div>
    ${big.length?`<div class="hl-box"><span class="mut" style="font-size:12px">5 הגדולות מהוות ${Math.round(bigSum/(tot||1)*100)}% מהטווח</span><b>${fmt(bigSum)}</b></div>`:''}
  </div>`;

  return `<div class="card sl"><div><h2>מובילים בטווח</h2><span class="lb">הסעיפים עם ההוצאה הגבוהה ביותר</span></div><div style="margin:auto 0">${top.map(([r,v],j)=>`<div style="padding-top:8px"><div class="row" style="padding:0"><span>${R=='c'?ico(r)+' ':''}${esc(r)}</span><b>${fmt(v.t)}</b></div><div class="row s mut" style="padding:0"><span>ממוצע ${fmt(v.t/nmo)} לחודש</span><span>${Math.round(v.t/(tot||1)*100)}%</span></div><div class="bar" style="margin:4px 0 0"><i style="width:${v.t/((top[0]&&top[0][1].t)||1)*100}%;background:${COL[j]}"></i></div></div>`).join('')||'<p class="mut">אין נתונים.</p>'}</div></div>${slide3}${slide4}`;
}

function donut(cs,tot){
  if(!tot)return `<div class="card sl"><h2>לאן הלך הכסף</h2><p class="mut">אין הוצאות בחודש הזה.</p></div>`;
  const rest=cs.slice(6).reduce((s,x)=>s+x[1],0),seg=[...cs.slice(0,6).map(([c,v],k)=>[c,v,COL[k]]),...(rest?[['אחר',rest,'#94a3b8']]:[])];
  const R=56,C=2*Math.PI*R,gap=seg.length>1?2.2:0;let off=0;
  const sel=seg.find(s=>s[0]===S.dnSel)||null;
  const arcs=seg.map(([c,v,col])=>{
    const len=Math.max((v/tot)*C-gap,1),curOff=off;off+=(v/tot)*C;
    const act=sel&&sel[0]===c,dim=sel&&!act;
    return `<circle class="seg ${act?'act':dim?'dim':''}" cx="80" cy="80" r="${R}" stroke="${col}" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-curOff).toFixed(2)}" data-dn="${encodeURIComponent(c)}"/>`;
  }).join('');
  return `<div class="card sl"><div class="row" style="padding:0"><h2>לאן הלך הכסף</h2>${sel?`<button class="chip2" data-dn="" style="padding:3px 10px;font-size:11.5px">איפוס ✕</button>`:`<small class="mut">לחץ לפירוט</small>`}</div><div class="dn"><div class="donut-wrap"><svg viewBox="0 0 160 160">${arcs}</svg><div class="donut-center" data-dn="">${sel?`<span>${ico(sel[0])} ${esc(sel[0])}</span><b>${fmt(sel[1])}</b><small>${Math.round(sel[1]/tot*100)}%</small>`:`<span>סה״כ</span><b>${fmt(tot)}</b>`}</div></div>
  <div class="lg">${seg.map(([c,v,col])=>{const act=sel&&sel[0]===c,dim=sel&&!act;return `<div class="lg-row ${act?'act':dim?'dim':''}" data-dn="${encodeURIComponent(c)}"><span><i class="dot" style="background:${col}"></i>${esc(c)}</span><b>${Math.round(v/tot*100)}%</b></div>`}).join('')}</div></div></div>`;
}

function fev(f,get){
  const T=f.replace(/\s+/g,'').replace(/^=/,'').match(/\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?|\d*\.?\d+%?|[A-Z]+(?=\()|<=|>=|<>|[-+*\/^(),<>=]/g)||[];let i=0;
  const cn=n=>{let s='';while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s},cc=s=>s.split('').reduce((a,c)=>a*26+c.charCodeAt(0)-64,0),
  ref=s=>{const [a,b]=s.replace(/\$/g,'').split(':'),p=x=>[cc(x.match(/[A-Z]+/)[0]),+x.match(/\d+/)[0]],A1=p(a),B1=b?p(b):A1,o=[];for(let r=A1[1];r<=B1[1];r++)for(let c=A1[0];c<=B1[0];c++)o.push(get(cn(c)+r));return o};
  let E,A,M,P,U,V;
  E=()=>{const a=A(),o=T[i];if(['<','<=','>','>=','=','<>'].includes(o)){i++;const b=A();return o=='<'?a<b:o=='<='?a<=b:o=='>'?a>b:o=='>='?a>=b:o=='='?a==b:a!=b}return a};
  A=()=>{let a=M();while(T[i]=='+'||T[i]=='-'){const o=T[i++],b=M();a=o=='+'?a+b:a-b}return a};
  M=()=>{let a=P();while(T[i]=='*'||T[i]=='/'){const o=T[i++],b=P();a=o=='*'?a*b:(b?a/b:0)}return a};
  P=()=>{let a=U();while(T[i]=='^'){i++;a=Math.pow(a,U())}return a};
  U=()=>T[i]=='-'?(i++,-U()):T[i]=='+'?(i++,U()):V();
  V=()=>{const t=T[i++];if(!t)return 0;if(t=='('){const v=E();if(T[i]==')')i++;return v}
    if(/^\d|^\./.test(t))return t.endsWith('%')?parseFloat(t)/100:parseFloat(t);
    if(/^[A-Z]+$/.test(t)){if(T[i]=='(')i++;const args=[];if(T[i]&&T[i]!=')'){do{if(T[i]==',')i++;args.push(E())}while(T[i]==',')}if(T[i]==')')i++;const n=t,fl=args.flat().map(x=>+x||0);
      if(n=='SUM')return fl.reduce((s,x)=>s+x,0);
      if(n=='AVERAGE')return fl.length?fl.reduce((s,x)=>s+x,0)/fl.length:0;
      if(n=='MAX')return fl.length?Math.max(...fl):0;
      if(n=='MIN')return fl.length?Math.min(...fl):0;
      if(n=='IF')return args[0]?args[1]:(args[2]??0);
      if(n=='IFERROR')return Number.isFinite(args[0])?args[0]:(args[1]??0);
      if(n=='ABS')return Math.abs(args[0]||0);
      if(n=='ROUND'){const f10=Math.pow(10,args[1]||0);return Math.round((args[0]||0)*f10)/f10}
      if(n=='ROUNDUP'){const f10=Math.pow(10,args[1]||0);return Math.ceil((args[0]||0)*f10)/f10}
      if(n=='ROUNDDOWN'){const f10=Math.pow(10,args[1]||0);return Math.floor((args[0]||0)*f10)/f10}
      return 0}
    return t.includes(':')?ref(t):get(t.replace(/\$/g,''))};
  return E();
}

function extractExtra(wb){
  const bud={},sal={};
  const bs=wb.Sheets['תקציב'];
  if(bs)XLSX.utils.sheet_to_json(bs,{header:1,raw:true}).forEach(r=>{
    if(r&&r[0]&&typeof r[1]=='number')bud[String(r[0]).trim()]=r[1];
  });
  const ws=wb.Sheets['ראשי']||wb.Sheets[wb.SheetNames[0]];
  if(ws)for(let r=35;r<=95;r++)for(const l of 'KLMNOPQR'){
    const x=ws[l+r];
    if(x)sal[l+r]={v:x.v,f:x.f};
  }
  return{bud,sal};
}
function parseExtra(wb){
  const ex=extractExtra(wb);
  S.bud=ex.bud;
  S.sal=ex.sal;
}

let sv=null,salDriveMeta=null,salPushTimer=0,salSyncBusy=false,salPendingPush=false;

function saveSalTplLocal(){
  if(!S.sal||!Object.keys(S.sal).length)return;
  ls(SAL_TPL_KEY,JSON.stringify(S.sal));
  if(S.salAt)ls(SAL_TPL_AT_KEY,String(S.salAt));
}
function saveSalSvLocal(markPush=false){
  if(sv)ls(SAL_SV_KEY,JSON.stringify(sv));
  if(markPush){salPendingPush=true;ls(SAL_DIRTY_PUSH_KEY,'1')}
}
function loadSalLocal(){
  try{
    const tpl=JSON.parse(ls(SAL_TPL_KEY));
    if(tpl&&typeof tpl==='object'&&Object.keys(tpl).length){
      S.sal=tpl;
      S.salAt=+ls(SAL_TPL_AT_KEY)||0;
    }
  }catch(e){}
  try{
    const savedSv=JSON.parse(ls(SAL_SV_KEY));
    if(savedSv&&typeof savedSv==='object'&&Array.isArray(savedSv.c))sv=savedSv;
  }catch(e){}
  try{salDriveMeta=JSON.parse(ls(SAL_META_KEY))}catch(e){}
  salPendingPush=ls(SAL_DIRTY_PUSH_KEY)==='1';
}

function salCalc(ov){const C=S.sal||{},m={},vis=new Set(),get=a=>{if(a in ov)return ov[a];if(a in m)return m[a];if(vis.has(a))return 0;const c=C[a];if(!c)return 0;vis.add(a);m[a]=c.f?fev(c.f,get):(typeof c.v=='number'?c.v:0);vis.delete(a);return m[a]};return get}

function salMap(){
  const C=S.sal;if(!C)return null;
  const f=t=>Object.keys(C).find(a=>String(C[a].v||'').includes(t)),
    a1=f('משמרת בוקר'),aw=f('שכר לשעה'),a2=f('הסכמי שכר'),a3=f('ברוטו');
  if(!a1||!aw||!a2||!a3)return null;
  const r1=+a1.slice(1),r2=+a2.slice(1),r3=+a3.slice(1),
    L='KLMNOPQR',
    wa=L.slice(L.indexOf(aw[0])+1).split('').map(c=>c+aw.slice(1)).find(a=>C[a]&&typeof C[a].v=='number'),
    nm=(c,r)=>String(C[c+r]&&C[c+r].v||'').trim();
  if(!wa)return null;
  return{
    wage:wa,
    sh:'KLMNO'.split('').map(c=>({n:nm(c,r1),cA:c+(r1+1),rA:c+(r1+2),tA:c+(r1+3)})).filter(s=>s.n),
    shiftTot:'P'+(r1+3),
    ad:'KLMN'.split('').map(c=>({n:nm(c,r2),a:c+(r2+1)})).filter(x=>x.n),
    addTot:'O'+(r2+1),
    ded:'LMNO'.split('').map(c=>({n:nm(c,r3),a:c+(r3+1)})).filter(x=>x.n),
    gross:'K'+(r3+1),
    net:'P'+(r3+1)
  };
}

function getSalBaseInfo(M,base){
  const w0=+base(M.wage)||0;
  const baseC=M.sh.map(s=>+base(s.cA)||0);
  return{w0,baseC,sig:w0+'|'+baseC.join(',')};
}
function ensureSalSv(M,bi){
  if(!sv||!Array.isArray(sv.c)||sv.c.length!==M.sh.length){
    sv={c:[...bi.baseC],w:bi.w0,baseSig:bi.sig,dirty:false,updatedAt:0};
    saveSalSvLocal(false);
    return;
  }
  sv.c=sv.c.map(x=>Math.max(0,+x||0));
  sv.w=+sv.w>0?+sv.w:bi.w0;
}
function syncSalSvWithSheet(){
  const M=salMap();if(!M)return;
  const base=salCalc({}),bi=getSalBaseInfo(M,base);
  if(!sv||!Array.isArray(sv.c)||sv.c.length!==M.sh.length||!sv.dirty){
    sv={c:[...bi.baseC],w:bi.w0,baseSig:bi.sig,dirty:false,updatedAt:(sv&&+sv.updatedAt)||0};
    saveSalSvLocal(false);
  }
}
function commitSalSv(bi){
  const sameW=Math.abs((+sv.w||0)-bi.w0)<0.001;
  const sameC=sv.c.length===bi.baseC.length&&sv.c.every((v,idx)=>v===bi.baseC[idx]);
  sv.baseSig=bi.sig;
  sv.dirty=!(sameW&&sameC);
  sv.updatedAt=Date.now();
  saveSalSvLocal(true);
  scheduleSalBackup();
}
function calcSalNet(){
  try{
    const M=salMap();if(!M)return 0;
    const base=salCalc({}),bi=getSalBaseInfo(M,base);
    ensureSalSv(M,bi);
    const ov={[M.wage]:+sv.w||bi.w0};
    M.sh.forEach((s,k)=>ov[s.cA]=sv.c[k]);
    return +salCalc(ov)(M.net)||0;
  }catch(e){return 0}
}

function scheduleSalBackup(delay=1200){
  clearTimeout(salPushTimer);
  salPushTimer=setTimeout(()=>syncSalDrive('push'),delay);
}

async function resolveSalFileId(allowCreate){
  if(salDriveMeta&&salDriveMeta.fileId)return{id:salDriveMeta.fileId,created:false};
  const safeName=SAL_DRIVE_FILE.replace(/'/g,"\\'");
  const q=`name='${safeName}' and trashed=false`;
  const res=await driveFetchWithRetry('https://www.googleapis.com/drive/v3/files?fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy='+encodeURIComponent('modifiedTime desc')+'&q='+encodeURIComponent(q));
  if(!res.ok)return{id:'',created:false};
  const data=await res.json();
  if(Array.isArray(data.files)&&data.files.length){
    salDriveMeta={fileId:data.files[0].id};
    ls(SAL_META_KEY,JSON.stringify(salDriveMeta));
    return{id:salDriveMeta.fileId,created:false};
  }
  if(!allowCreate)return{id:'',created:false};

  let parentId=(S.files&&typeof S.files==='object'&&S.files.root)||'';
  if(!parentId){
    try{
      const rootSafe=APP_CONFIG.receiptsRootFolder.replace(/'/g,"\\'");
      const rq=`name='${rootSafe}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const rRes=await driveFetchWithRetry('https://www.googleapis.com/drive/v3/files?fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&q='+encodeURIComponent(rq));
      if(rRes.ok){
        const rJson=await rRes.json();
        if(rJson.files&&rJson.files[0])parentId=rJson.files[0].id;
      }
    }catch(e){}
  }

  const boundary='-------myMoneySalBoundary'+Date.now();
  const meta={name:SAL_DRIVE_FILE,mimeType:'application/json'};
  if(parentId)meta.parents=[parentId];
  const initPayload={version:1,updatedAt:Date.now(),sal:S.sal||null,salAt:S.salAt||0,sv:sv||null};
  const bodyBlob=new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(meta),
    `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(initPayload),
    `\r\n--${boundary}--`
  ],{type:`multipart/related; boundary=${boundary}`});

  const cRes=await driveFetchWithRetry('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id',{
    method:'POST',
    headers:{'Content-Type':`multipart/related; boundary=${boundary}`},
    body:bodyBlob
  });
  if(!cRes.ok)return{id:'',created:false};
  const created=await cRes.json();
  if(created&&created.id){
    salDriveMeta={fileId:created.id};
    ls(SAL_META_KEY,JSON.stringify(salDriveMeta));
    salPendingPush=false;
    ls(SAL_DIRTY_PUSH_KEY,null);
    return{id:created.id,created:true};
  }
  return{id:'',created:false};
}

async function syncSalDrive(mode='pull'){
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return;
  if(!token&&ls('rt')){const ok=await refresh();if(!ok)return}
  if(!token)return;
  if(salSyncBusy){
    if(mode==='push')salPendingPush=true;
    return;
  }
  const hasLocalSal=!!(S.sal&&Object.keys(S.sal).length);
  const wantWrite=mode==='push'||salPendingPush||ls(SAL_DIRTY_PUSH_KEY)==='1';
  salSyncBusy=true;
  try{
    let resolved=await resolveSalFileId(wantWrite||hasLocalSal);
    if(!resolved.id||resolved.created)return;
    let fileId=resolved.id;

    let remote=null;
    const rRes=await driveFetchWithRetry(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`);
    if(rRes.status===404){
      salDriveMeta=null;ls(SAL_META_KEY,null);
      resolved=await resolveSalFileId(wantWrite||hasLocalSal);
      if(!resolved.id||resolved.created)return;
      fileId=resolved.id;
    }else if(rRes.ok){
      const txt=await rRes.text();
      if(txt&&txt.trim()){try{remote=JSON.parse(txt)}catch(e){}}
    }

    let uiChanged=false,needRemoteWrite=wantWrite;

    if(remote&&typeof remote==='object'){
      const remHasSal=remote.sal&&typeof remote.sal==='object'&&Object.keys(remote.sal).length>0;
      if(!hasLocalSal&&remHasSal){
        S.sal=remote.sal;
        S.salAt=+remote.salAt||Date.now();
        saveSalTplLocal();
        saveSnap();
        uiChanged=true;
      }else if(hasLocalSal&&(!remHasSal||JSON.stringify(S.sal)!==JSON.stringify(remote.sal))){
        if((S.salAt||0)>=(+remote.salAt||0))needRemoteWrite=true;
      }

      const locUpd=Number(sv&&sv.updatedAt)||0;
      const remUpd=Number(remote.sv&&remote.sv.updatedAt)||0;
      if(remote.sv&&Array.isArray(remote.sv.c)&&remUpd>locUpd){
        sv=remote.sv;
        saveSalSvLocal(false);
        uiChanged=true;
      }else if(sv&&locUpd>remUpd){
        needRemoteWrite=true;
      }
    }else if(hasLocalSal||sv){
      needRemoteWrite=true;
    }

    if(needRemoteWrite&&(S.sal||sv)){
      const payload={version:1,updatedAt:Date.now(),sal:S.sal||null,salAt:S.salAt||0,sv:sv||null};
      const wRes=await driveFetchWithRetry(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&supportsAllDrives=true`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json; charset=UTF-8'},
        body:JSON.stringify(payload)
      });
      if(wRes.status===404){salDriveMeta=null;ls(SAL_META_KEY,null)}
      else if(wRes.ok){salPendingPush=false;ls(SAL_DIRTY_PUSH_KEY,null)}
    }

    if(uiChanged&&!$('nav').hidden&&(S.tab==='more'&&(S.sub==='sl'||!S.sub))){
      draw(true);
    }
  }catch(e){}
  finally{
    salSyncBusy=false;
    if(salPendingPush&&navigator.onLine!==false)scheduleSalBackup(1500);
  }
}

function sl(){
  const M=salMap();if(!M)return `<div class="card"><p>לא נמצא מחשבון השכר בגיליון ראשי של קובץ ההוצאות.${S.exp.length?'':' סנכרן עם הדרייב פעם אחת לשמירה קבועה במכשיר.'}</p></div>`;
  const base=salCalc({}),bi=getSalBaseInfo(M,base),w0=bi.w0;
  ensureSalSv(M,bi);
  const ov={[M.wage]:+sv.w||w0};M.sh.forEach((s,k)=>ov[s.cA]=sv.c[k]);
  const g=salCalc(ov),n=g(M.net),gr=g(M.gross),n0=base(M.net),diff=n-n0,cnt=sv.c.reduce((a,b)=>a+b,0),mg=M.sh.map((s,k)=>salCalc({...ov,[s.cA]:sv.c[k]+1})(M.net)-n);
  return [`<div class="sl-float" id="slf" data-up-top><span style="font-size:13px;font-weight:700">נטו חזוי: <b class="pos" style="font-size:15px">${fmt(n)}</b></span>${Math.abs(diff)>=1?`<span class="chip ${diff<0?'bad':''}" style="padding:2px 9px;font-size:11.5px">${diff>0?'+':''}${fmt(diff)}</span>`:`<span class="mut" style="font-size:11.5px">${cnt} משמרות</span>`}</div>`,
  `<div class="card hg"><div class="lb">מחשבון שכר</div><div class="lb">שכר נטו חזוי</div><div class="big">${fmt(n)}</div><span class="chip">${fmt(gr)} ברוטו</span><div class="row s" style="margin-top:10px"><span class="lb">בקובץ האקסל כרגע</span><b>${fmt(n0)}</b></div></div>`,
  `<div class="card"><h2>משמרות החודש</h2><span class="lb">נשמר אוטומטית גם באופליין ומגובה ברקע · לא משנה את האקסל</span>${M.sh.map((s,k)=>`<div class="row" style="align-items:center;padding:10px 0;border-top:1px solid var(--line)"><div><b>${esc(s.n)}</b><div class="mut">${fmt(g(s.rA))} למשמרת · נטו נוסף ${fmt(mg[k])}</div></div><div class="stp"><button class="chip2" data-sc="${k}:-1">−</button><b>${sv.c[k]}</b><button class="chip2" data-sc="${k}:1">+</button></div><b style="min-width:72px;text-align:end">${fmt(g(s.tA))}</b></div>`).join('')}
  <div class="row" style="align-items:center;margin-top:8px"><span class="lb">שכר לשעה</span><input type="number" step="0.01" data-sw value="${ov[M.wage]}"></div><button class="chip2" data-sreset style="margin-top:8px">אפס לערכי האקסל</button></div>`,
  `<div class="card"><h2>פירוט</h2><div class="row s"><span>משמרות (${cnt})</span><b>${fmt(g(M.shiftTot))}</b></div>${M.ad.map(x=>`<div class="row s mut"><span>${esc(x.n)}</span><span>${fmt(g(x.a))}</span></div>`).join('')}<div class="row s"><span>סה״כ הוספות</span><b>${fmt(g(M.addTot))}</b></div><div class="row" style="border-top:1px solid var(--line)"><b>ברוטו</b><b>${fmt(gr)}</b></div>${M.ded.map(x=>`<div class="row s"><span>${esc(x.n)}</span><b class="neg">${fmt(g(x.a))}</b></div>`).join('')}<div class="row" style="border-top:1px solid var(--line)"><b>שכר נטו</b><b class="pos">${fmt(n)}</b></div></div>`,
  `<div class="card"><h2>תובנות</h2><div class="row s"><span class="lb">ניכויים מהברוטו</span><b>${gr?((1-n/gr)*100).toFixed(1):0}%</b></div><div class="row s"><span class="lb">נטו ממוצע למשמרת</span><b>${cnt?fmt(n/cnt):'—'}</b></div></div>`].join('');
}

async function quotes(){
  if(!S.inv.length||!navigator.onLine)return;
  const id=r=>String(r['מספר נייר']||'').trim();
  const ids=[...new Set(S.inv.map(id).filter(Boolean))];
  if(!ids.length)return;
  if(quotesAbort)quotesAbort.abort();
  const ctrl=new AbortController();
  quotesAbort=ctrl;
  try{
    const res=await fetch(W+'/quote?ids='+encodeURIComponent(ids.join(',')),{signal:ctrl.signal});
    if(!res.ok)return;
    const j=await res.json(),fx=j.fx&&+j.fx.USDILS,Q=j.quotes||{};let n=0;
    S.inv.forEach(r=>{const q=Q[id(r)];if(!q||!(+q.price>0))return;const u=q.cur=='USD'?(fx?q.price*fx:0):q.cur=='ILA'?q.price/100:+q.price;if(u>0){r['שווי ₪']=+(u*(+r['כמות']||0)).toFixed(2);r.live=1;n++}});
    if(n){S.qt=new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});saveSnap();if(S.tab=='inv'||S.tab=='home')draw()}
  }catch(e){}
}
setInterval(()=>{if(document.visibilityState=='visible'&&S.tab=='inv'&&S.inv.length)quotes()},90000);

document.addEventListener('change',e=>{
  if((e.target.id==='gl-f-cover-inp'||e.target.id==='gl-f-cover-cam')&&S.glForm){
    const file=e.target.files&&e.target.files[0];
    if(file){S.glPendingCover=file;draw(true)}
    return;
  }
  if((e.target.id==='wf-cover-inp'||e.target.id==='wf-cover-cam')&&S.wForm){
    const file=e.target.files&&e.target.files[0];
    if(file){S.wPendingCover=file;draw(true)}
    return;
  }
  if((e.target.id==='wf-file'||e.target.id==='wf-file-cam')&&S.wForm){
    const fl=e.target.files?Array.from(e.target.files):[];
    if(fl.length){
      if(!Array.isArray(S.wPendingFiles))S.wPendingFiles=[];
      S.wPendingFiles.push(...fl);
      draw(true);
    }
    return;
  }
  if(e.target.dataset.wf==='category'&&S.wForm){
    if(e.target.value==='__new__'){
      S.wForm.newCatMode=true;
      S.wForm.newCatName='';
      draw(true);
      setTimeout(()=>{const el=document.getElementById('wf-new-cat');el&&el.focus()},40);
    }else{
      S.wForm.newCatMode=false;
      S.wForm.category=e.target.value;
      draw(true);
    }
    return;
  }
  if(e.target.dataset.sw!==undefined){
    const M=salMap();
    if(M){
      const base=salCalc({}),bi=getSalBaseInfo(M,base),nw=+e.target.value;
      ensureSalSv(M,bi);
      sv.w=nw>0?nw:bi.w0;
      commitSalSv(bi);
      draw(true);
    }
  }
  if(e.target.dataset.fsl!==undefined&&S.fire){ls('fire_cfg',JSON.stringify(S.fire))}
  const s=e.target.dataset.sel;if(s){S.pv[s]=+e.target.value;S.pv.pr='';S.pv.dr=null;draw()}
});

function ins0(){
  const I=S.ins;if(!I)return `<div class="card"><p>${esc(S.insErr||'הנתון זמין אחרי סנכרון עם הדרייב.')}</p></div>`;
  const now=new Date(),pd=I.pay.filter(p=>p.d<=now),paid=T(pd,'a'),nx=I.pay.find(p=>p.d>now),pc=pd.length/(I.pay.length||1)*100,yi=Math.max(0,Math.min(Math.floor(pd.length/12),I.yrs-1)),r=I.pr[yi]||[],miss=I.pay.filter(p=>p.a===null).length;
  return `<div class="card hg"><div class="lb">ביטוח חיים · שולם עד היום</div><div class="big">${fmt(paid)}</div><span class="chip">${pd.length} מתוך ${I.pay.length} תשלומים</span>
  <div class="bar" style="height:10px;margin:16px 0 6px"><i style="width:${Math.max(pc,1)}%;background:var(--g)"></i></div><div class="lb">${pc.toFixed(1)}% מתקופת הביטוח · מסתיים ב-${dl(I.end)}</div></div>
  <div class="grid"><div class="card"><span class="lb">התשלום הבא</span><b>${nx&&nx.a?fmt(nx.a):'—'}</b><span class="lb">${nx?dl(nx.d):''}</span></div><div class="card"><span class="lb">סכום ביטוח כיום</span><b>${fmt(r[5]||0)}</b><span class="lb">לכל מבוטח</span></div></div>
  ${miss?`<p class="mut" style="margin:10px 4px">ל-${miss} תשלומים עתידיים עדיין אין פרמיה בפוליסה.</p>`:''}
  <div class="card"><h2>פרמיה חודשית לפי שנת ביטוח</h2>${I.pr.filter(x=>x&&x[0]).map(x=>{const m=((+x[6]||0)+(+x[7]||0))/12,cur=x[0]==yi+1;return `<div class="row s" style="${cur?'font-weight:700':'color:var(--mut)'}"><span>שנה ${esc(x[0])}${cur?' (נוכחית)':''}</span><span>${m?fmt(m):'טרם פורסם'}</span></div>`}).join('')}</div>`;
}
function cp(){
  if(!S.cp.length)return `<div class="card"><p>${S.exp.length?'לא נמצאו קופונים בקובץ ההוצאות.':''}הקופונים זמינים אחרי סנכרון עם הדרייב.</p></div>`;
  return `<div class="card hg"><div class="lb">שווי קופונים</div><div class="big">${fmt(T(S.cp,'a'))}</div><span class="chip">${S.cp.length} קופונים</span></div>`+
  S.cp.map((c,k)=>`<div class="cp"><div class="am" style="background:${COL[k%8]}">${fmt(c.a)}</div><div><b>${esc(c.n)}</b><div class="mut">${c.c.startsWith('http')?'קישור למימוש':'קוד'}</div></div><button class="pr" data-c="${k}">${c.c.startsWith('http')?'פתח':'העתק קוד'}</button></div>`).join('');
}

const prevNums={},rmRed=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function renderBigVal(el,str){
  const fc=el.firstChild;
  if(!fc)return;
  const m=String(str).match(/^(-?)₪(.+)$/);
  if(!m){
    if(el.childNodes.length===1)el.textContent=str;
    else if(fc.nodeType===3)fc.nodeValue=str;
    return;
  }
  const sign=m[1],numPart=m[2];
  let wrap=fc.nodeType===1&&fc.classList&&fc.classList.contains('big-val')?fc:null;
  if(!wrap){
    wrap=document.createElement('span');
    wrap.className='big-val';
    el.replaceChild(wrap,fc);
  }
  wrap.innerHTML=`${sign}<span class="cur-sym">₪</span>${esc(numPart)}`;
}
function animNums(skipAnim=false){
  document.querySelectorAll('.big').forEach((el,idx)=>{
    const fc=el.firstChild;
    const raw=(fc&&fc.nodeType===3?fc.nodeValue:el.textContent).trim();
    if(S.hide){renderBigVal(el,raw);return}
    const m=raw.match(/^(-?)₪([\d,]+)$/)||raw.match(/^(-?)(\d+)%$/);
    if(!m){renderBigVal(el,raw);return}
    const isPct=raw.endsWith('%'),sign=m[1]==='-'?-1:1,target=sign*parseInt(m[2].replace(/,/g,''),10);
    const key=S.tab+':'+S.sub+':'+idx,from=prevNums[key];
    prevNums[key]=target;
    if(skipAnim||rmRed()||from===undefined||from===target){renderBigVal(el,raw);return}
    const t0=performance.now(),dur=320;
    const step=now=>{
      if(!el.isConnected)return;
      const p=Math.min((now-t0)/dur,1),e=1-Math.pow(1-p,3),cur=Math.round(from+(target-from)*e);
      if(p>=1){renderBigVal(el,raw);return}
      const curStr=isPct?cur+'%':(cur<0?'-':'')+'₪'+Math.abs(cur).toLocaleString('he-IL');
      renderBigVal(el,curStr);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function draw(skipAnim=false){
  const slb=syncLabel(),dark=isDarkTheme();
  const ys=S.tab==='home'?[...new Set(S.exp.map(e=>e.ym))].sort((a,b)=>a-b):[];
  const sy=y=>T(S.exp.filter(e=>e.ym==y),'a');
  $('#app').innerHTML=`<header><div class="hdr-title"><b>${greet()}</b><div class="hdr-meta"><span>${new Date().toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'})}</span><span class="sync-pill ${slb.cls}"><i></i>${slb.txt}</span></div></div><div class="hdr-acts"><button data-gs-open title="חיפוש גלובלי" aria-label="חיפוש גלובלי">${SVG.search}</button><button data-theme-tog title="${dark?'מעבר למצב בהיר':'מעבר למצב כהה'}" aria-label="${dark?'מעבר למצב בהיר':'מעבר למצב כהה'}">${dark?SVG.sun:SVG.moon}</button><button data-eye class="${S.hide?'on':''}" title="הסתר סכומים" aria-label="הסתר סכומים">${S.hide?SVG.eyeOff:SVG.eye}</button><button data-sync class="${S.syncing?'spin':''}" title="סנכרון" aria-label="סנכרון">${SVG.sync}</button></div></header>`+
  (S.err&&(!token||S.scopeErr)?`<div class="bn"><span>${esc(S.err)}</span><button ${S.scopeErr?'data-sync-consent':'data-sync'}>${S.scopeErr?'אשר הרשאות':'סנכרן'}</button></div>`:(!token&&!ls('rt')?`<div class="bn"><span>מציג נתונים שמורים במכשיר</span><button data-sync>סנכרן</button></div>`:''))+`<div class="view${skipAnim||S.tab==='shop'?' no-anim':''}">${({home,pv,inv,more,shop:()=>''}[S.tab]||home)()}</div>${S.tab==='home'?monthSheet(ys,sy):''}${globalSearchModal()}`;
  const sp=document.getElementById('page-shopping');
  if(sp)sp.style.display=S.tab==='shop'?'block':'none';
  if(window._shopRender)window._shopRender();
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==S.tab));
  document.querySelectorAll('.car').forEach(syncDots);
  centerMonthStrip();
  updateSlFloat();
  animNums(skipAnim);
}

function scrubAt(box,clientX){
  let pts;try{pts=JSON.parse(decodeURIComponent(box.dataset.scrb))}catch(e){return}
  const svg=box.querySelector('svg'),tip=box.querySelector('.scrub-tip'),ln=box.querySelector('.scrub-ln'),dot=box.querySelector('.scrub-dot'),ring=box.querySelector('.scrub-dot-ring');
  if(!svg||!tip||!pts||!pts.length)return;
  const r=svg.getBoundingClientRect(),relX=((clientX-r.left)/Math.max(r.width,1))*340;
  let best=pts[0],bd=1e9;pts.forEach(p=>{const d=Math.abs(p.x-relX);if(d<bd){bd=d;best=p}});
  if(tip.dataset.last!==best.flb){tip.dataset.last=best.flb;vib(4)}
  tip.textContent=best.flb+' · '+fmt(best.v);
  const pctX=Math.min(Math.max((best.x/340)*100,14),86);
  tip.style.left=pctX+'%';tip.classList.add('on');
  if(ln){ln.setAttribute('x1',best.x);ln.setAttribute('x2',best.x);ln.setAttribute('opacity','0.35')}
  const x2=+(best.x+0.001).toFixed(3);
  if(ring){ring.setAttribute('x1',best.x);ring.setAttribute('x2',x2);ring.setAttribute('y1',best.y);ring.setAttribute('y2',best.y);ring.setAttribute('opacity','1')}
  if(dot){dot.setAttribute('x1',best.x);dot.setAttribute('x2',x2);dot.setAttribute('y1',best.y);dot.setAttribute('y2',best.y);dot.setAttribute('opacity','1')}
}
function scrubEnd(box){
  if(!box)return;
  box.style.touchAction='';
  box.querySelector('.scrub-tip')?.classList.remove('on');
  box.querySelector('.scrub-ln')?.setAttribute('opacity','0');
  box.querySelector('.scrub-dot')?.setAttribute('opacity','0');
  box.querySelector('.scrub-dot-ring')?.setAttribute('opacity','0');
}
let scrbHold=null;
function clearScrbHold(endVis=false){
  if(!scrbHold)return;
  clearTimeout(scrbHold.timer);
  const b=scrbHold.box;
  if(endVis)setTimeout(()=>scrubEnd(b),900);
  else if(b)b.style.touchAction='';
  scrbHold=null;
}
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('[data-scrb]');if(!b)return;
  if(e.pointerType==='mouse'){scrubAt(b,e.clientX);return}
  clearScrbHold();
  const st={box:b,x:e.clientX,y:e.clientY,active:false,timer:0};
  st.timer=setTimeout(()=>{
    if(!scrbHold||scrbHold!==st)return;
    st.active=true;b.style.touchAction='none';vib(8);scrubAt(b,st.x);
  },220);
  scrbHold=st;
});
document.addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'){const b=e.target.closest('[data-scrb]');if(b)scrubAt(b,e.clientX);return}
  if(!scrbHold)return;
  if(!scrbHold.active){
    if(Math.hypot(e.clientX-scrbHold.x,e.clientY-scrbHold.y)>10)clearScrbHold(false);
    return;
  }
  scrubAt(scrbHold.box,e.clientX);
});
document.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&e.target&&e.target.matches&&e.target.matches('[data-scrb]'))scrubEnd(e.target)},true);
document.addEventListener('pointerup',e=>{
  if(e.pointerType==='mouse'){const b=e.target.closest('[data-scrb]');if(b)setTimeout(()=>scrubEnd(b),900);return}
  if(scrbHold){const wasActive=scrbHold.active;clearScrbHold(wasActive)}
});
document.addEventListener('pointercancel',()=>clearScrbHold(false));

document.addEventListener('click',async e=>{
  const sum=e.target.closest('details.ct > summary');
  if(sum&&!rmRed()){
    const det=sum.parentElement,body=det.querySelector('.ct-body');
    if(body){
      e.preventDefault();vib(6);
      if(det.open){
        const h=body.offsetHeight;
        const a=body.animate([{height:h+'px',opacity:1},{height:'0px',opacity:0}],{duration:190,easing:'cubic-bezier(.22,1,.36,1)'});
        a.onfinish=()=>{det.open=false};
      }else{
        det.open=true;
        const h=body.offsetHeight;
        body.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:230,easing:'cubic-bezier(.22,1,.36,1)'});
      }
      return;
    }
  }
  const b=e.target.closest('button,[data-y],[data-r],[data-x],[data-n],[data-dn],[data-dot],[data-ex],[data-ex-share],[data-fw],[data-ftog],[data-up-top],[data-sub],[data-mp-open],[data-mp-close],[data-med-tog],[data-med-sz],[data-med-mv],[data-med-reset],[data-hed-tog],[data-hed-mv],[data-hed-vis],[data-hed-reset],[data-quick-gl],[data-w-open],[data-w-view],[data-wv-close],[data-w-edit],[data-w-close],[data-wm],[data-w-save],[data-w-del],[data-w-uncover],[data-w-rm-att],[data-w-rm-pend],[data-wrs],[data-wrc],[data-glf],[data-gls],[data-gl-open],[data-gl-close],[data-gl-edit],[data-gl-tog],[data-gl-type],[data-gl-prio],[data-gl-save],[data-gl-del],[data-dcs],[data-alert-go],[data-gs-open],[data-gs-close],[data-gs-wr],[data-gs-gl],[data-gs-ym],[data-gs-tab],[data-gs-sub],[data-l],[data-sync-consent],[data-qa-tog],[data-qa-reset],[data-qa-mv],[data-qa-vis]');
  if(!b){if(!token&&ls('rt')&&navigator.onLine!==false)refresh().then(ok=>ok&&load());return}
  if(b.classList.contains('ms-back')&&e.target!==b)return;
  if('gsOpen'in b.dataset){
    vib(6);S.gsOpen=true;S.gsQ='';draw(true);
    setTimeout(()=>{const el=document.getElementById('gs-input');el&&el.focus()},50);
    return;
  }
  if('gsClose'in b.dataset){
    vib(6);S.gsOpen=false;draw(true);return;
  }
  if(b.dataset.gsWr){
    vib(8);S.gsOpen=false;S.tab='more';S.sub='wr';S.wViewId=b.dataset.gsWr;draw();scrollTo(0,0);return;
  }
  if(b.dataset.gsGl){
    vib(8);S.gsOpen=false;S.tab='more';S.sub='gl';
    const item=(window._getGoals?window._getGoals():[]).find(x=>x.id===b.dataset.gsGl);
    if(item){S.glFilter=item.done?'done':'all';S.glForm={...item};S.glErr='';}
    draw();scrollTo(0,0);return;
  }
  if(b.dataset.gsYm){
    vib(8);S.gsOpen=false;S.tab='home';S.sub='';S.ym=+b.dataset.gsYm;draw();scrollTo(0,0);return;
  }
  if(b.dataset.gsTab){
    vib(8);S.gsOpen=false;S.tab=b.dataset.gsTab;S.sub='';draw();scrollTo(0,0);return;
  }
  if(b.dataset.gsSub){
    vib(8);S.gsOpen=false;S.tab='more';S.sub=b.dataset.gsSub;draw();scrollTo(0,0);
    if(S.sub==='dc'&&token&&!S.files)loadFiles();
    return;
  }
  if(b.dataset.alertGo){
    vib(8);
    const act=b.dataset.alertGo;
    S.tab='more';S.sub=act;
    if(act==='wr'&&b.dataset.alertId)S.wViewId=b.dataset.alertId;
    draw();scrollTo(0,0);
    if((act==='dc'||act==='wr')&&token&&!S.files)loadFiles();
    return;
  }
  if(b.dataset.dcs!==undefined){
    vib(6);S.dcStatus=b.dataset.dcs;draw();return;
  }
  if(b.dataset.wView){
    vib(6);S.wViewId=b.dataset.wView;draw(true);return;
  }
  if('wvClose'in b.dataset){
    vib(6);S.wViewId='';draw(true);return;
  }
  if('wOpen'in b.dataset){
    vib(8);
    S.wViewId='';S.wPendingCover=null;S.wPendingFiles=[];S.wSaving=false;S.wErr='';
    S.wForm={id:'',name:'',category:W_CATS[0],newCatMode:false,newCatName:'',store:'',price:'',purchaseDate:todayISO(),months:24,customMode:false,notes:'',coverId:'',coverLink:'',attachments:[],fileId:'',fileName:'',fileLink:''};
    draw(true);
    setTimeout(()=>{const el=document.getElementById('wf-name');el&&el.focus()},60);
    return;
  }
  if(b.dataset.wEdit){
    vib(8);
    const wList=getAllWarranties();
    const w=wList.find(x=>x.id===b.dataset.wEdit);
    if(w){
      const presets=[0,12,24,36,60];
      S.wViewId='';S.wPendingCover=null;S.wPendingFiles=[];S.wSaving=false;S.wErr='';
      S.wForm={...w,category:wCatOf(w),newCatMode:false,newCatName:'',attachments:[...w.attachments],customMode:!presets.includes(Number(w.months)||0)};
      draw(true);
    }
    return;
  }
  if('wClose'in b.dataset){
    if(S.wSaving)return;
    vib(6);S.wForm=null;S.wPendingCover=null;S.wPendingFiles=[];S.wErr='';draw(true);return;
  }
  if(b.id==='wf-cover-trig'){
    const inp=document.getElementById('wf-cover-inp');if(inp)inp.click();return;
  }
  if(b.id==='wf-cover-cam-trig'){
    const inp=document.getElementById('wf-cover-cam');if(inp)inp.click();return;
  }
  if(b.id==='wf-file-trig'){
    const inp=document.getElementById('wf-file');if(inp)inp.click();return;
  }
  if(b.id==='wf-file-cam-trig'){
    const inp=document.getElementById('wf-file-cam');if(inp)inp.click();return;
  }
  if('wUncover'in b.dataset&&S.wForm){
    vib(6);S.wForm.coverId='';S.wForm.coverLink='';draw(true);return;
  }
  if(b.dataset.wRmAtt!==undefined&&S.wForm){
    vib(6);
    const idx=+b.dataset.wRmAtt;
    if(Array.isArray(S.wForm.attachments))S.wForm.attachments.splice(idx,1);
    draw(true);return;
  }
  if(b.dataset.wRmPend!==undefined&&S.wForm){
    vib(6);
    const idx=+b.dataset.wRmPend;
    if(Array.isArray(S.wPendingFiles))S.wPendingFiles.splice(idx,1);
    draw(true);return;
  }
  if(b.dataset.wrs!==undefined){vib(6);S.wrStatus=b.dataset.wrs;draw();return}
  if(b.dataset.glf!==undefined){vib(6);S.glFilter=b.dataset.glf;draw(true);return}
  if('gls'in b.dataset){
    vib(6);
    const order=['prio','cost_desc','cost_asc'];
    S.glSort=order[(order.indexOf(S.glSort||'prio')+1)%order.length];
    draw(true);return;
  }
  if('glOpen'in b.dataset){
    vib(8);
    S.glErr='';S.glPendingCover=null;S.glSaving=false;
    S.glForm={id:'',type:'buy',title:'',priority:5,cost:'',saved:'',done:false,notes:'',coverId:'',coverLink:''};
    draw(true);
    setTimeout(()=>{const el=document.getElementById('gl-f-title');el&&el.focus()},60);
    return;
  }
  if(b.dataset.glEdit){
    vib(8);
    const item=(window._getGoals?window._getGoals():[]).find(x=>x.id===b.dataset.glEdit);
    if(item){S.glErr='';S.glPendingCover=null;S.glSaving=false;S.glForm={...item,coverId:item.coverId||'',coverLink:item.coverLink||''};draw(true);}
    return;
  }
  if('glClose'in b.dataset){
    if(S.glSaving)return;
    vib(6);S.glForm=null;S.glPendingCover=null;S.glErr='';draw(true);return;
  }
  if(b.id==='gl-f-cover-trig'&&S.glForm){
    const inp=document.getElementById('gl-f-cover-inp');if(inp)inp.click();return;
  }
  if(b.id==='gl-f-cover-cam-trig'&&S.glForm){
    const inp=document.getElementById('gl-f-cover-cam');if(inp)inp.click();return;
  }
  if('glUncover'in b.dataset&&S.glForm){
    vib(6);S.glPendingCover=null;S.glForm.coverId='';S.glForm.coverLink='';draw(true);return;
  }
  if(b.dataset.glType&&S.glForm){
    vib(6);
    const tEl=document.getElementById('gl-f-title');
    const cEl=document.getElementById('gl-f-cost');
    const sEl=document.getElementById('gl-f-saved');
    const nEl=document.getElementById('gl-f-notes');
    if(tEl)S.glForm.title=tEl.value;
    if(cEl)S.glForm.cost=cEl.value;
    if(sEl)S.glForm.saved=sEl.value;
    if(nEl)S.glForm.notes=nEl.value;
    S.glForm.type=b.dataset.glType==='do'?'do':'buy';
    draw(true);return;
  }
  if(b.dataset.glPrio&&S.glForm){
    vib(6);
    const tEl=document.getElementById('gl-f-title');
    const cEl=document.getElementById('gl-f-cost');
    const sEl=document.getElementById('gl-f-saved');
    const nEl=document.getElementById('gl-f-notes');
    if(tEl)S.glForm.title=tEl.value;
    if(cEl)S.glForm.cost=cEl.value;
    if(sEl)S.glForm.saved=sEl.value;
    if(nEl)S.glForm.notes=nEl.value;
    S.glForm.priority=Number(b.dataset.glPrio)||5;
    draw(true);return;
  }
  if(b.dataset.glTog){
    vib(10);
    const item=(window._getGoals?window._getGoals():[]).find(x=>x.id===b.dataset.glTog);
    if(item&&window._saveGoal){
      window._saveGoal({...item,done:!item.done});
      showToast(!item.done?'היעד סומן כהושג 🎉':'היעד הוחזר לפתוחים');
      draw(true);
    }
    return;
  }
  if('glSave'in b.dataset&&S.glForm&&!S.glSaving){
    vib(10);
    const title=(document.getElementById('gl-f-title')?.value||'').trim();
    const cost=Math.max(0,Number(document.getElementById('gl-f-cost')?.value)||0);
    const saved=Math.max(0,Number(document.getElementById('gl-f-saved')?.value)||0);
    const notes=(document.getElementById('gl-f-notes')?.value||'').trim();
    if(!title){S.glErr='נא להזין שם יעד או רכישה';draw(true);return;}
    const id=S.glForm.id||('g_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
    let coverId=S.glForm.coverId||'';
    let coverLink=S.glForm.coverLink||'';
    if(S.glPendingCover){
      S.glSaving=true;S.glErr='';draw(true);
      try{
        if(typeof uploadReceiptToDrive==='function'&&token){
          const up=await uploadReceiptToDrive(S.glPendingCover,{name:`${title} (תמונת יעד)`,store:'',purchaseDate:todayISO()});
          coverId=up.id||'';
          coverLink=up.webViewLink||(coverId?`https://drive.google.com/file/d/${coverId}/view`:'');
        }else{
          const reader=new FileReader();
          coverLink=await new Promise((res,rej)=>{
            reader.onload=()=>res(String(reader.result||''));
            reader.onerror=()=>rej(new Error('שגיאה בקריאת התמונה'));
            reader.readAsDataURL(S.glPendingCover);
          });
        }
      }catch(err){
        S.glSaving=false;
        S.glErr=(err&&err.message)?err.message:'שגיאה בהעלאת התמונה';
        draw(true);return;
      }
      S.glSaving=false;
    }
    if(window._saveGoal){
      window._saveGoal({
        id,
        type:S.glForm.type==='do'?'do':'buy',
        title,
        priority:Number(S.glForm.priority)||5,
        cost,
        saved,
        done:!!S.glForm.done,
        notes,
        coverId,
        coverLink
      });
    }
    S.glForm=null;S.glPendingCover=null;S.glErr='';
    showToast('היעד נשמר ✓');
    draw(true);return;
  }
  if(b.dataset.glDel){
    if(confirm('למחוק יעד זה?')){
      vib(10);
      if(window._deleteGoal)window._deleteGoal(b.dataset.glDel);
      S.glForm=null;S.glErr='';
      showToast('היעד נמחק');
      draw(true);
    }
    return;
  }
  if(b.dataset.wrc!==undefined){vib(6);S.wrCat=decodeURIComponent(b.dataset.wrc);draw();return}
  if(b.dataset.wm!==undefined&&S.wForm){
    vib(6);
    if(b.dataset.wm==='custom'){
      S.wForm.customMode=true;
      updateWarrantyPreviewDom();
      setTimeout(()=>{const el=document.getElementById('wf-custom-m');el&&el.focus()},30);
    }else{
      S.wForm.customMode=false;
      S.wForm.months=Number(b.dataset.wm)||0;
      updateWarrantyPreviewDom();
    }
    return;
  }
  if('wSave'in b.dataset){vib(10);saveWarrantyAction();return}
  if(b.dataset.wDel){
    if(confirm('למחוק רשומת אחריות זו? (הקובץ בדרייב יישמר)')){
      vib(10);
      if(window._deleteWarranty)window._deleteWarranty(b.dataset.wDel);
      S.wForm=null;S.wPendingFile=null;S.wErr='';
      draw();
    }
    return;
  }
  if('upTop'in b.dataset){scrollTo({top:0,behavior:'smooth'});return}
  if('mpOpen'in b.dataset){vib(6);S.mPick=true;draw();return}
  if('mpClose'in b.dataset){vib(6);S.mPick=false;draw();return}
  if('medTog'in b.dataset){vib(8);S.moreEdit=!S.moreEdit;draw();return}
  if('medReset'in b.dataset){vib(8);S.moreLayout=null;ls('more_layout',null);draw();return}
  if('hedTog'in b.dataset){vib(8);S.homeEdit=!S.homeEdit;draw();return}
  if('hedReset'in b.dataset){vib(8);S.homeLayout=null;ls('home_layout',null);draw();return}
  if(b.dataset.hedMv){
    vib(6);const [idx,dir]=b.dataset.hedMv.split(':').map(Number),list=getHomeList(),ni=idx+dir;
    if(ni>=0&&ni<list.length){const tmp=list[idx];list[idx]=list[ni];list[ni]=tmp;saveHomeList(list);draw()}
    return;
  }
  if(b.dataset.hedVis){
    vib(6);const list=getHomeList(),it=list.find(x=>x.id===b.dataset.hedVis);
    if(it){it.hidden=!it.hidden;saveHomeList(list);draw()}
    return;
  }
  if('qaTog'in b.dataset){vib(8);S.qaEdit=!S.qaEdit;draw(true);return}
  if('qaReset'in b.dataset){vib(8);S.qaLayout=null;ls('qa_layout',null);draw(true);return}
  if(b.dataset.qaMv){
    vib(6);const [idx,dir]=b.dataset.qaMv.split(':').map(Number),list=getQaList(),ni=idx+dir;
    if(ni>=0&&ni<list.length){const tmp=list[idx];list[idx]=list[ni];list[ni]=tmp;saveQaList(list);draw(true)}
    return;
  }
  if(b.dataset.qaVis){
    vib(6);const list=getQaList(),it=list.find(x=>x.id===b.dataset.qaVis);
    if(it){it.hidden=!it.hidden;saveQaList(list);draw(true)}
    return;
  }
  if('quickGl'in b.dataset){
    vib(8);S.tab='more';S.sub='gl';S.glErr='';
    S.glForm={id:'',type:'buy',title:'',priority:5,cost:'',saved:'',done:false,notes:''};
    draw();scrollTo(0,0);
    setTimeout(()=>{const el=document.getElementById('gl-f-title');el&&el.focus()},60);
    return;
  }
  if(b.dataset.medSz){
    vib(6);const list=getMoreList(),it=list.find(x=>x.id===b.dataset.medSz);
    if(it){it.wide=!it.wide;saveMoreList(list);draw()}
    return;
  }
  if(b.dataset.medMv){
    vib(6);const [idx,dir]=b.dataset.medMv.split(':').map(Number),list=getMoreList(),ni=idx+dir;
    if(ni>=0&&ni<list.length){const tmp=list[idx];list[idx]=list[ni];list[ni]=tmp;saveMoreList(list);draw()}
    return;
  }
  if(b.dataset.fw&&S.fire){
    vib(6);const [k,v]=b.dataset.fw.split(':');S.fire[k]=+v;ls('fire_cfg',JSON.stringify(S.fire));draw();return;
  }
  if(b.dataset.ftog&&S.fire){
    vib(6);const k=b.dataset.ftog;S.fire[k]=!S.fire[k];ls('fire_cfg',JSON.stringify(S.fire));draw();return;
  }
  if('freset'in b.dataset){vib(8);S.fire=null;ls('fire_cfg',null);draw();return}
  if('exShare'in b.dataset){
    vib(8);
    const url=location.origin+location.pathname+'#excl='+encodeURIComponent(JSON.stringify([...S.excl]));
    if(navigator.share)navigator.share({title:'סימוני הוצאות חד-פעמיות',url}).catch(()=>{});
    else if(navigator.clipboard){navigator.clipboard.writeText(url);b.textContent='הקישור הועתק ✓'}
    return;
  }
  if(b.dataset.ex!==undefined){
    e.stopPropagation();vib(8);
    const k=decodeURIComponent(b.dataset.ex),se=b.dataset.se==='1';
    if(se){S.unexcl.has(k)?S.unexcl.delete(k):S.unexcl.add(k)}
    else{S.excl.has(k)?S.excl.delete(k):S.excl.add(k)}
    saveExcl();draw();return;
  }
  if(b.dataset.dot!==undefined){
    const k=+b.dataset.dot,car=b.parentElement?.previousElementSibling;
    if(car&&car.classList.contains('car')){
      vib(6);
      const sl=car.querySelectorAll('.sl')[k];
      if(sl)sl.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
    }
    return;
  }
  if('qclr'in b.dataset){vib(6);clearTimeout(qTimer);S.pv.q='';S.pv.dr=null;draw(true);const inp=document.querySelector('input[data-q]');if(inp)inp.focus();return}
  if('syncConsent'in b.dataset){vib(10);if(navigator.onLine===false){showToast('אין חיבור לאינטרנט — מוצגים נתונים שמורים','err');return}login(true);return}
  if('sync'in b.dataset){vib(10);if(navigator.onLine===false){showToast('אין חיבור לאינטרנט — מוצגים נתונים שמורים','err');return}login(!!S.scopeErr);return}
  if('themeTog'in b.dataset){
    vib(6);
    const next=isDarkTheme()?'light':'dark';
    ls('theme',next);
    applyTheme(next);
    draw(true);
    return;
  }
  if('eye'in b.dataset){vib(8);S.hide=!S.hide;ls('hide',S.hide?'1':'0');draw()}
  if(b.dataset.t){vib(8);S.tab=b.dataset.t;S.sub='';S.mPick=false;S.moreEdit=false;draw();scrollTo(0,0);if(S.tab==='shop'&&window._shopSync)window._shopSync('pull',true)}
  if(b.dataset.dn!==undefined){vib(6);const c=decodeURIComponent(b.dataset.dn);S.dnSel=(!c||S.dnSel===c)?null:c;draw();return}
  if(b.dataset.sc){
    const M=salMap();
    if(M){
      vib(6);
      const base=salCalc({}),bi=getSalBaseInfo(M,base),[k,d]=b.dataset.sc.split(':');
      ensureSalSv(M,bi);
      sv.c[+k]=Math.max(0,(+sv.c[+k]||0)+ +d);
      commitSalSv(bi);
      draw(true);
    }
    return;
  }
  if('sreset'in b.dataset){
    vib(8);
    const M=salMap();
    if(M){
      const base=salCalc({}),bi=getSalBaseInfo(M,base);
      sv={c:[...bi.baseC],w:bi.w0,baseSig:bi.sig,dirty:false,updatedAt:Date.now()};
      saveSalSvLocal(true);
      scheduleSalBackup();
    }else{
      sv=null;ls(SAL_SV_KEY,null);
    }
    draw(true);
    return;
  }
  if(b.dataset.pr){vib(6);setPr(b.dataset.pr);draw()}
  if(b.dataset.by){vib(6);S.pv.by=b.dataset.by;S.pv.dr=null;draw()}
  if(b.dataset.rows){vib(6);S.pv.rows=b.dataset.rows;S.pv.dr=null;draw()}
  if(b.dataset.cat){vib(6);const c=decodeURIComponent(b.dataset.cat),s=S.pv.sel;s.includes(c)?s.splice(s.indexOf(c),1):s.push(c);S.pv.dr=null;draw()}
  if(b.dataset.x){vib(6);const P=S.pv,c=decodeURIComponent(b.dataset.x),o=P.open,op=o.includes(c);op?o.splice(o.indexOf(c),1):o.push(c);P.dr=op?(P.dr&&P.dr.r==c&&P.dr.p==null?null:P.dr):{r:c,k:'c',p:null};draw();if(!op)toDr();return}
  if(b.dataset.n){vib(6);const P=S.pv,r=decodeURIComponent(b.dataset.n),same=P.dr&&P.dr.r==r&&P.dr.k==b.dataset.k&&P.dr.p==null;P.dr=same?null:{r,k:b.dataset.k,p:null};draw();if(!same)toDr();return}
  if('up'in b.dataset){const t=document.getElementById('tb');t&&t.scrollIntoView({behavior:'smooth',block:'start'});return}
  if('pk'in b.dataset){S.pick=null;draw()}
  if(b.dataset.od)openDoc(decodeURIComponent(b.dataset.od),decodeURIComponent(b.dataset.op||''));
  if(b.dataset.r){vib(6);S.pv.dr={r:decodeURIComponent(b.dataset.r),k:b.dataset.k,p:b.dataset.p===''?null:+b.dataset.p};draw();toDr()}
  if('fl'in b.dataset)loadFiles();
  if('sub'in b.dataset){vib(8);S.sub=b.dataset.sub;draw();scrollTo(0,0);if(S.sub=='dc'&&token&&!S.files)loadFiles();if(S.sub=='wr'){if(token&&!S.files)loadFiles();if(window._shopSync)window._shopSync('pull',true)}if(S.sub=='sl')syncSalDrive('pull')}
  if('dcf'in b.dataset){vib(6);S.dcf=decodeURIComponent(b.dataset.dcf);draw()}
  if(b.dataset.l)open(decodeURIComponent(b.dataset.l),'_blank','noopener');

  if(b.dataset.y){vib(8);S.ym=+b.dataset.y;S.dnSel=null;S.mPick=false;draw()}
  if(b.dataset.c){vib(10);const c=S.cp[+b.dataset.c];if(c.c.startsWith('http'))open(c.c,'_blank','noopener');else{navigator.clipboard.writeText(c.c);b.textContent='הועתק ✓';b.classList.add('ok')}}
});

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(S.gsOpen){S.gsOpen=false;draw(true);return}
  if(S.mPick){S.mPick=false;draw(true);return}
  if(S.wForm){S.wForm=null;S.wPendingCover=null;S.wPendingFiles=[];S.wErr='';draw(true);return}
  if(S.wViewId){S.wViewId='';draw(true);return}
  if(S.glForm){if(S.glSaving)return;S.glForm=null;S.glPendingCover=null;S.glErr='';draw(true);return}
  if(S.pick){S.pick=null;draw(true);return}
});

(function boot(){
  S.hide=ls('hide')=='1';
  applyTheme(ls('theme')||'');
  try{matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>{if(!S.theme&&!$('nav').hidden)draw(true)})}catch(e){}
  try{const ex=JSON.parse(ls('excl'));if(Array.isArray(ex))S.excl=new Set(ex)}catch(e){}
  try{const uex=JSON.parse(ls('unexcl'));if(Array.isArray(uex))S.unexcl=new Set(uex)}catch(e){}
  if(location.hash.startsWith('#excl=')){
    try{
      const imp=JSON.parse(decodeURIComponent(location.hash.slice(6)));
      if(Array.isArray(imp)){imp.forEach(k=>S.excl.add(k));saveExcl()}
      history.replaceState(null,'',location.pathname+location.search);
    }catch(e){}
  }
  try{const ml=JSON.parse(ls('more_layout'));if(Array.isArray(ml))S.moreLayout=ml}catch(e){}
  try{const hl=JSON.parse(ls('home_layout'));if(Array.isArray(hl))S.homeLayout=hl}catch(e){}
  try{const ql=JSON.parse(ls('qa_layout'));if(Array.isArray(ql))S.qaLayout=ql}catch(e){}
  try{const fc=JSON.parse(ls('fire_cfg'));if(fc&&typeof fc==='object')S.fire=fc}catch(e){}
  loadSalLocal();
  let hasSnap=false;
  try{const d=JSON.parse(ls('data'));hasSnap=rehydrateSnap(d)}catch(e){}
  if(S.sal&&Object.keys(S.sal).length){
    saveSalTplLocal();
    syncSalSvWithSheet();
  }
  if(hasSnap||salMap()||(navigator.onLine===false&&(ls('gd')==='1'||ls('rt')))){
    if(!S.pv.from)setPr('12');
    if(!S.exp.length&&salMap()){S.tab='more';S.sub='sl'}
    $('nav').hidden=false;
    draw();
  }
  try{const t=JSON.parse(ls('tok'));if(t&&t.e>Date.now())token=t.t}catch(e){}
  if(navigator.onLine!==false){
    initXlsxWorker();
    if(token)load();
    else if(ls('rt'))refresh().then(ok=>{if(ok)load();else if($('nav').hidden)fail('פג תוקף החיבור לדרייב, יש להתחבר מחדש')});
  }
  window.addEventListener('offline',()=>{if(!$('nav').hidden)draw(true)});
  window.addEventListener('online',()=>{
    if(!$('nav').hidden)draw(true);
    if(salPendingPush||ls(SAL_DIRTY_PUSH_KEY)==='1')scheduleSalBackup(300);
    if(token||ls('rt')){
      if(!S.syncAt||Date.now()-S.syncAt>5*60*1e3){
        (token?Promise.resolve(true):refresh()).then(ok=>ok&&load());
      }
    }
  });
  setInterval(()=>{if(document.visibilityState=='visible'&&navigator.onLine!==false&&ls('rt'))refresh()},40*60*1e3);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState=='visible'&&navigator.onLine!==false){
      if(ls('rt')){let t;try{t=JSON.parse(ls('tok'))}catch(e){}if(!t||t.e<Date.now())refresh().then(ok=>ok&&load())}
      if(S.tab==='shop'&&window._shopSync)window._shopSync('pull',true);
      if(S.tab==='more'&&S.sub==='sl')syncSalDrive('pull');
    }
  });
})();

if('serviceWorker'in navigator){
  navigator.serviceWorker.register('sw.js').then(reg=>{
    if(reg.update)reg.update().catch(()=>{});
  }).catch(()=>{});
}
