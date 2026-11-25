/* === מודול רשימת קניות חכמה === */
(() => {
  const WORKER_BASE = APP_CONFIG.workerUrl;
  const STORAGE_KEY = "my_money_shopping_v1";
  const MEMORY_KEY = "my_money_price_memory_v1";
  const DELETED_KEY = "my_money_shop_deleted_v1";
  const WARRANTIES_KEY = "my_money_warranties_v1";
  const DELETED_WARRANTIES_KEY = "my_money_warranties_deleted_v1";
  const GOALS_KEY = "my_money_goals_v1";
  const DELETED_GOALS_KEY = "my_money_goals_deleted_v1";

  const DEFAULT_GOALS = [
    // דברים שרוצה לעשות (4)
    { id: "g_def_1", type: "do", title: "ללמוד אנגלית", priority: 10, cost: 0, saved: 0, done: false, notes: "", updatedAt: 1700000000001 },
    { id: "g_def_2", type: "do", title: "סדנה זוגית", priority: 7, cost: 2500, saved: 0, done: false, notes: "", updatedAt: 1700000000002 },
    { id: "g_def_3", type: "do", title: "לטוס ליפן", priority: 1, cost: 15000, saved: 0, done: false, notes: "", updatedAt: 1700000000003 },
    { id: "g_def_4", type: "do", title: "לטוס לאיטליה", priority: 1, cost: 12000, saved: 0, done: false, notes: "", updatedAt: 1700000000004 },
    // דברים שרוצה לקנות (13)
    { id: "g_def_5", type: "buy", title: "עפעפי שחר", priority: 8, cost: 25, saved: 0, done: false, notes: "", updatedAt: 1700000000005 },
    { id: "g_def_6", type: "buy", title: "וויסקי", priority: 6, cost: 700, saved: 0, done: false, notes: "", updatedAt: 1700000000006 },
    { id: "g_def_7", type: "buy", title: "סכום חלבי", priority: 5, cost: 100, saved: 0, done: false, notes: "", updatedAt: 1700000000007 },
    { id: "g_def_8", type: "buy", title: "עכבר ומקלדת", priority: 5, cost: 500, saved: 0, done: false, notes: "", updatedAt: 1700000000008 },
    { id: "g_def_9", type: "buy", title: "צלחות קורל בשריות", priority: 4, cost: 250, saved: 0, done: false, notes: "", updatedAt: 1700000000009 },
    { id: "g_def_10", type: "buy", title: "כיסאות מתקפלים", priority: 4, cost: 40, saved: 0, done: false, notes: "", updatedAt: 1700000000010 },
    { id: "g_def_11", type: "buy", title: "שואב שוטף", priority: 3, cost: 2500, saved: 0, done: false, notes: "", updatedAt: 1700000000011 },
    { id: "g_def_12", type: "buy", title: "טאבון", priority: 3, cost: 800, saved: 0, done: false, notes: "", updatedAt: 1700000000012 },
    { id: "g_def_13", type: "buy", title: "מכונת גלידה", priority: 2, cost: 600, saved: 0, done: false, notes: "", updatedAt: 1700000000013 },
    { id: "g_def_14", type: "buy", title: "מכונת שייקים", priority: 2, cost: 600, saved: 0, done: false, notes: "", updatedAt: 1700000000014 },
    { id: "g_def_15", type: "buy", title: "משנה שטיינזלץ", priority: 1, cost: 600, saved: 0, done: false, notes: "", updatedAt: 1700000000015 },
    { id: "g_def_16", type: "buy", title: "סוויצר למזגן", priority: 1, cost: 120, saved: 0, done: false, notes: "", updatedAt: 1700000000016 },
    { id: "g_def_17", type: "buy", title: "רכב", priority: 1, cost: 25000, saved: 0, done: false, notes: "", updatedAt: 1700000000017 }
  ];
  const FILE_META_KEY = "my_money_shop_drive_meta_v1";
  const DRIVE_FILE_NAME = APP_CONFIG.shoppingFileName;

  const DEPT_RULES = [
    { dept: "🧊 קפואים", keys: ["קפוא", "קפואה", "קפואים", "שניצל תירס", "צ'יפס", "פיצה", "גלידה", "שלגון", "אפונה", "מלאווח", "ג'חנון", "בצק עלים"] },
    { dept: "🧴 ניקיון ופארם", keys: ["נייר טואלט", "מגבונים", "סבון", "שמפו", "מרכך", "משחת שיניים", "מברשת", "כביסה", "אקונומיקה", "נוזל כלים", "ספוג", "שקיות אשפה", "נייר סופג", "דאודורנט", "קרם", "פארם", "ניקיון"] },
    { dept: "🥤 שתייה", keys: ["מיץ", "נקטר", "משקה", "מים", "קולה", "סודה", "בירה", "יין", "ספרייט", "פאנטה", "נסטי", "פיוז", "שישיית", "לימונדה"] },
    { dept: "🥖 מאפים ולחם", keys: ["לחם", "פיתה", "פיתות", "לחמני", "בגט", "חלה", "טורטיה", "בורקס", "קרואסון", "עוגה", "עוגת", "עוגיות", "רוגלך", "מאפ"] },
    { dept: "🥫 מזווה ויבשים", keys: ["דגני", "קורנפלקס", "שיבולת שועל", "שוקולד", "חמאת בוטנים", "אבקת מרק", "חלב קוקוס", "קרם קוקוס", "חלב סויה", "חלב שקדים", "רוטב", "רסק", "פסטה", "אורז", "פתיתים", "קוסקוס", "שמן", "מלח", "סוכר", "קמח", "שימורים", "טונה", "תירס", "קטשופ", "מיונז", "חרדל", "קפה", "תה", "במבה", "ביסלי", "חטיף", "אגוז", "שקד", "עדשים", "שעועית", "תבלין", "פפריקה", "כמון", "מזווה"] },
    { dept: "🥬 ירקות ופירות", keys: ["עגבני", "מלפפון", "בצל", "תפוח", "בננ", "פלפל", "חסה", "לימון", "אבוקדו", "גזר", "תפו\"א", "תפוחי אדמה", "שום", "קישוא", "חציל", "פטריות", "כוסברה", "פטרוזיליה", "תות", "ענבים", "אבטיח", "מלון", "תפוז", "קלמנטינ", "ירק", "פירות"] },
    { dept: "🥛 חלב, ביצים וסלטים", keys: ["חלב", "קוטג", "גבינ", "יוגורט", "שמנת", "חמאה", "ביצים", "ביצה", "מעדן", "שוקו", "מילקי", "דני", "צהובה", "בולגרית", "מוצרלה", "טחינה", "חומוס", "מטבוחה", "סלט", "צונן"] },
    { dept: "🥩 בשר, עוף ודגים", keys: ["עוף", "חזה", "שניצל", "כרעיים", "שוקיים", "פרגית", "בשר", "טחון", "אנטריקוט", "קבב", "המבורגר", "נקניק", "פסטרמה", "דג", "סלמון", "אמנון", "מושט", "קצביה"] }
  ];

  const DEPT_ORDER = [
    "🥬 ירקות ופירות",
    "🥖 מאפים ולחם",
    "🥛 חלב, ביצים וסלטים",
    "🥩 בשר, עוף ודגים",
    "🧊 קפואים",
    "🥫 מזווה ויבשים",
    "🥤 שתייה",
    "🧴 ניקיון ופארם",
    "📦 כללי"
  ];

  function classifyDepartment(productName, ramiDept = "") {
    const combined = `${ramiDept} ${productName}`.toLowerCase();
    for (const rule of DEPT_RULES) {
      if (rule.keys.some((k) => combined.includes(k))) return rule.dept;
    }
    return ramiDept ? `📦 ${ramiDept}` : "📦 כללי";
  }

  function deptEmoji(dept, name = "") {
    const d = dept || classifyDepartment(name);
    const m = d.match(/^(\S+)/);
    return m ? m[1] : "📦";
  }

  function loadJson(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }

  let items = loadJson(STORAGE_KEY, []);
  let priceMemory = loadJson(MEMORY_KEY, {});
  let deletedIds = loadJson(DELETED_KEY, {});
  let warranties = loadJson(WARRANTIES_KEY, []);
  let deletedWarranties = loadJson(DELETED_WARRANTIES_KEY, {});
  let deletedGoals = loadJson(DELETED_GOALS_KEY, {});
  let goals = (() => {
    const saved = loadJson(GOALS_KEY, null);
    if (Array.isArray(saved)) return saved;
    return DEFAULT_GOALS.filter((g) => !deletedGoals[g.id]).map((g) => ({ ...g }));
  })();
  let driveMeta = loadJson(FILE_META_KEY, null);
  let currentFilter = "all";
  let editingPriceItemId = null;

  let searchTimer = null;
  let searchSeq = 0;
  let searchAbort = null;

  let pushTimer = null;
  let startupSyncTimer = null;
  let syncInFlight = false;
  let pendingPush = false;
  let initialPullDone = false;
  let syncStatus = { state: "idle", label: "מקומי בלבד" };
  const checkedImageNames = new Set();

  const byId = (id) => document.getElementById(id);
  const fmtMoney = (n) => (typeof S !== "undefined" && S.hide) ? "₪•••" : "₪" + Number(n || 0).toFixed(2);

  function renderThumb(imageUrl, name, dept, cls = "shop-thumb") {
    const fb = esc(deptEmoji(dept, name));
    const src = String(imageUrl || "").trim();
    if (/^https?:\/\//i.test(src)) {
      return `<div class="${cls}"><img src="${esc(src)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="shop-thumb-fb" style="display:none">${fb}</span></div>`;
    }
    return `<div class="${cls}"><span class="shop-thumb-fb">${fb}</span></div>`;
  }

  function setSyncPill(state, label) {
    syncStatus = { state, label };
    const pill = byId("shop-sync-pill");
    const txt = byId("shop-sync-txt");
    if (!pill || !txt) return;
    pill.className = "sync-pill" + (state === "syncing" ? " busy" : state === "ok" ? "" : (state === "need_scope" || state === "warn") ? " warn" : " off");
    txt.textContent = label;
  }

  function showShareBanner(htmlMsg) {
    const el = byId("shop-share-banner");
    if (!el) return;
    el.innerHTML = `<span>${htmlMsg}</span><button type="button" class="qclr" style="position:static;flex:none;" onclick="document.getElementById('shop-share-banner').style.display='none'">✕</button>`;
    el.style.display = "flex";
  }

  function persistLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(MEMORY_KEY, JSON.stringify(priceMemory));
      localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
      localStorage.setItem(WARRANTIES_KEY, JSON.stringify(warranties));
      localStorage.setItem(DELETED_WARRANTIES_KEY, JSON.stringify(deletedWarranties));
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
      localStorage.setItem(DELETED_GOALS_KEY, JSON.stringify(deletedGoals));
    } catch {}
  }

  function scheduleDrivePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      syncWithDrive("push", true);
    }, 900);
  }

  function saveState(triggerSync = true) {
    persistLocal();
    render();
    if (triggerSync) scheduleDrivePush();
  }

  function markDeleted(id) {
    if (id) deletedIds[id] = Date.now();
  }

  function rememberProduct(name, price, dept, image = "") {
    const key = name.trim().toLowerCase();
    if (!key) return;
    const prev = priceMemory[key];
    priceMemory[key] = {
      name: name.trim(),
      price: Number(price) > 0 ? Number(price) : (prev?.price || 0),
      dept: dept || prev?.dept || "",
      image: String(image || "").trim() || prev?.image || "",
      updatedAt: Date.now()
    };
  }

  function addItem({ name, price = 0, qty = 1, dept = "", image = "" }) {
    const cleanName = name.trim();
    if (!cleanName) return;

    const now = Date.now();
    const mem = priceMemory[cleanName.toLowerCase()];
    const finalPrice = Number(price) > 0 ? Number(price) : (mem?.price || 0);
    const finalDept = dept || mem?.dept || classifyDepartment(cleanName);
    const finalImage = String(image || "").trim() || mem?.image || "";

    const existing = items.find((i) => !i.done && i.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      existing.qty += qty;
      if (finalPrice > 0) existing.price = finalPrice;
      if (finalImage) existing.image = finalImage;
      existing.updatedAt = now;
    } else {
      items.unshift({
        id: now.toString(36) + Math.random().toString(36).slice(2, 6),
        name: cleanName,
        price: finalPrice,
        qty,
        dept: finalDept,
        image: finalImage,
        done: false,
        updatedAt: now
      });
    }

    if (finalPrice > 0 || finalImage) rememberProduct(cleanName, finalPrice, finalDept, finalImage);
    byId("shop-search-input").value = "";
    closeDropdown();
    saveState(true);
  }

  function renderManualFallbackRow(term) {
    const dd = byId("shop-dropdown");
    if (!dd) return;
    dd.innerHTML = `<div class="shop-dd-item" onclick="window._shopAddManual()">
      <div class="shop-dd-left">
        ${renderThumb("", term, "", "shop-dd-thumb")}
        <div style="min-width:0;"><strong>הוסף "${esc(term)}" ידנית</strong><div class="shop-dd-meta">ללא התאמה באונליין • ישויך אוטומטית למחלקה</div></div>
      </div>
      <span class="shop-dd-price">+ הוסף</span>
    </div>`;
    dd.classList.add("open");
  }

  async function handleSearchInput(q) {
    const term = q.trim();
    if (term.length < 2) {
      closeDropdown();
      return;
    }

    const reqId = ++searchSeq;
    if (searchAbort) {
      searchAbort.abort();
      searchAbort = null;
    }

    const localMatches = Object.values(priceMemory)
      .filter((m) => m.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 4)
      .map((m) => ({ ...m, image: m.image || "", source: "זיכרון מחירים" }));

    if (!navigator.onLine) {
      if (localMatches.length > 0) renderDropdown(localMatches, false);
      else renderManualFallbackRow(term);
      return;
    }

    const ctrl = new AbortController();
    searchAbort = ctrl;

    renderDropdown(localMatches, true);

    try {
      const res = await fetch(`${WORKER_BASE}/rami?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error("rami_http_" + res.status);
      const data = await res.json();

      if (reqId !== searchSeq) return;
      if (byId("shop-search-input").value.trim() !== term) return;

      if (data.ok && Array.isArray(data.items) && data.items.length > 0) {
        const liveMatches = data.items.map((it) => ({
          name: it.name,
          price: it.price,
          oldPrice: it.oldPrice,
          dept: classifyDepartment(it.name, it.department),
          image: it.image || "",
          source: "רמי לוי אונליין"
        }));
        renderDropdown(liveMatches, false);
      } else if (localMatches.length === 0) {
        renderManualFallbackRow(term);
      } else {
        renderDropdown(localMatches, false);
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      if (reqId !== searchSeq) return;
      if (localMatches.length > 0) renderDropdown(localMatches, false);
      else renderManualFallbackRow(term);
    }
  }

  function renderDropdown(list, isLoadingMore) {
    const dd = byId("shop-dropdown");
    if (!list.length && !isLoadingMore) {
      closeDropdown();
      return;
    }
    let html = list.map((it, idx) => `
      <div class="shop-dd-item" data-idx="${idx}">
        <div class="shop-dd-left">
          ${renderThumb(it.image, it.name, it.dept, "shop-dd-thumb")}
          <div style="min-width:0;">
            <div style="font-weight:600; font-size:13.5px;">${esc(it.name)}</div>
            <div class="shop-dd-meta">${esc(it.dept)} • ${esc(it.source)}</div>
          </div>
        </div>
        <div class="shop-dd-price">
          ${it.oldPrice ? `<span class="shop-dd-old">${fmtMoney(it.oldPrice)}</span>` : ""}
          ${fmtMoney(it.price)}
        </div>
      </div>
    `).join("");

    if (isLoadingMore) {
      html += `<div style="padding:8px 14px; font-size:12px; color:var(--mut,#6b7280); text-align:center;">מחפש מחירים עדכניים ברמי לוי...</div>`;
    }

    dd.innerHTML = html;
    dd.classList.add("open");

    dd.querySelectorAll(".shop-dd-item").forEach((el, i) => {
      el.onclick = () => addItem(list[i]);
    });
  }

  function closeDropdown() {
    searchSeq++;
    if (searchAbort) {
      searchAbort.abort();
      searchAbort = null;
    }
    byId("shop-dropdown").classList.remove("open");
  }

  window._shopAddManual = () => addItem({ name: byId("shop-search-input").value });

  function hasStateChanged(prev, next) {
    if (prev.items.length !== next.items.length) return true;
    const prevItemsMap = new Map(prev.items.map((it) => [it.id, it]));
    for (const it of next.items) {
      const p = prevItemsMap.get(it.id);
      if (!p) return true;
      if (
        (Number(p.updatedAt) || 0) !== (Number(it.updatedAt) || 0) ||
        !!p.done !== !!it.done ||
        (Number(p.qty) || 1) !== (Number(it.qty) || 1) ||
        (Number(p.price) || 0) !== (Number(it.price) || 0) ||
        (p.image || "") !== (it.image || "")
      ) {
        return true;
      }
    }

    if (prev.warranties.length !== next.warranties.length) return true;
    const prevWMap = new Map(prev.warranties.map((w) => [w.id, w]));
    for (const w of next.warranties) {
      const p = prevWMap.get(w.id);
      if (!p || (Number(p.updatedAt) || 0) !== (Number(w.updatedAt) || 0)) return true;
    }

    const prevGoals = Array.isArray(prev.goals) ? prev.goals : [];
    const nextGoals = Array.isArray(next.goals) ? next.goals : [];
    if (prevGoals.length !== nextGoals.length) return true;
    const prevGMap = new Map(prevGoals.map((g) => [g.id, g]));
    for (const g of nextGoals) {
      const p = prevGMap.get(g.id);
      if (
        !p ||
        (Number(p.updatedAt) || 0) !== (Number(g.updatedAt) || 0) ||
        !!p.done !== !!g.done ||
        (Number(p.priority) || 0) !== (Number(g.priority) || 0) ||
        (Number(p.cost) || 0) !== (Number(g.cost) || 0) ||
        (Number(p.saved) || 0) !== (Number(g.saved) || 0)
      ) {
        return true;
      }
    }

    const prevMemKeys = Object.keys(prev.priceMemory);
    const nextMemKeys = Object.keys(next.priceMemory);
    if (prevMemKeys.length !== nextMemKeys.length) return true;
    for (const k of nextMemKeys) {
      const p = prev.priceMemory[k];
      const n = next.priceMemory[k];
      if (!p || (Number(p.updatedAt) || 0) !== (Number(n.updatedAt) || 0)) return true;
    }

    return false;
  }

  function mergeStates(local, remote) {
    const cutoff = Date.now() - 30 * 864e5;
    const mergedDeleted = {};
    const allDelKeys = new Set([...Object.keys(local.deletedIds || {}), ...Object.keys(remote.deletedIds || {})]);
    allDelKeys.forEach((id) => {
      const ts = Math.max(Number(local.deletedIds?.[id]) || 0, Number(remote.deletedIds?.[id]) || 0);
      if (ts > cutoff) mergedDeleted[id] = ts;
    });

    const itemsById = new Map();
    (remote.items || []).forEach((it) => {
      if (!it || !it.id) return;
      const upd = Number(it.updatedAt) || 0;
      if (mergedDeleted[it.id] && mergedDeleted[it.id] >= upd) return;
      itemsById.set(it.id, { ...it, image: it.image || "", updatedAt: upd });
    });

    (local.items || []).forEach((it) => {
      if (!it || !it.id) return;
      const upd = Number(it.updatedAt) || 0;
      if (mergedDeleted[it.id] && mergedDeleted[it.id] >= upd) return;
      const prev = itemsById.get(it.id);
      if (!prev) {
        itemsById.set(it.id, { ...it, image: it.image || "", updatedAt: upd });
      } else if (upd >= (Number(prev.updatedAt) || 0)) {
        itemsById.set(it.id, { ...it, image: it.image || prev.image || "", updatedAt: upd });
      } else if (!prev.image && it.image) {
        prev.image = it.image;
      }
    });

    const finalItems = [];
    const activeByName = new Map();
    for (const it of itemsById.values()) {
      if (!it.done) {
        const norm = it.name.trim().toLowerCase();
        const dup = activeByName.get(norm);
        if (dup) {
          if ((Number(it.updatedAt) || 0) >= (Number(dup.updatedAt) || 0)) {
            dup.qty = Math.max(Number(dup.qty) || 1, Number(it.qty) || 1);
            if (Number(it.price) > 0) dup.price = Number(it.price);
            if (it.dept) dup.dept = it.dept;
            if (it.image) dup.image = it.image;
            dup.updatedAt = Number(it.updatedAt) || dup.updatedAt;
          } else if (!dup.image && it.image) {
            dup.image = it.image;
          }
          continue;
        }
        activeByName.set(norm, it);
      }
      finalItems.push(it);
    }

    const mergedMemory = {};
    const allMemKeys = new Set([...Object.keys(remote.priceMemory || {}), ...Object.keys(local.priceMemory || {})]);
    allMemKeys.forEach((k) => {
      const r = remote.priceMemory?.[k];
      const l = local.priceMemory?.[k];
      if (!r) { mergedMemory[k] = { ...l, image: l.image || "" }; return; }
      if (!l) { mergedMemory[k] = { ...r, image: r.image || "" }; return; }
      const pick = (Number(l.updatedAt) || 0) >= (Number(r.updatedAt) || 0) ? l : r;
      const other = pick === l ? r : l;
      mergedMemory[k] = {
        ...pick,
        price: Number(pick.price) > 0 ? Number(pick.price) : (Number(other.price) || 0),
        dept: pick.dept || other.dept || "",
        image: pick.image || other.image || ""
      };
    });

    const mergedDeletedW = {};
    const allDelWKeys = new Set([...Object.keys(local.deletedWarranties || {}), ...Object.keys(remote.deletedWarranties || {})]);
    allDelWKeys.forEach((id) => {
      const ts = Math.max(Number(local.deletedWarranties?.[id]) || 0, Number(remote.deletedWarranties?.[id]) || 0);
      if (ts > cutoff) mergedDeletedW[id] = ts;
    });

    const normW = (w, upd) => {
      const atts = Array.isArray(w.attachments) ? w.attachments.filter((a) => a && (a.link || a.id)) : [];
      if (!atts.length && (w.fileLink || w.fileId)) {
        atts.push({ id: w.fileId || "", name: w.fileName || "קבלה / תעודת אחריות", link: w.fileLink || "" });
      }
      return {
        ...w,
        category: w.category || "",
        coverId: w.coverId || "",
        coverLink: w.coverLink || "",
        attachments: atts,
        updatedAt: upd
      };
    };

    const wById = new Map();
    (remote.warranties || []).forEach((w) => {
      if (!w || !w.id) return;
      const upd = Number(w.updatedAt) || 0;
      if (mergedDeletedW[w.id] && mergedDeletedW[w.id] >= upd) return;
      wById.set(w.id, normW(w, upd));
    });

    (local.warranties || []).forEach((w) => {
      if (!w || !w.id) return;
      const upd = Number(w.updatedAt) || 0;
      if (mergedDeletedW[w.id] && mergedDeletedW[w.id] >= upd) return;
      const nw = normW(w, upd);
      const prev = wById.get(nw.id);
      if (!prev) {
        wById.set(nw.id, nw);
      } else if (upd >= (Number(prev.updatedAt) || 0)) {
        const mergedAtts = nw.attachments.length ? nw.attachments : prev.attachments;
        wById.set(nw.id, {
          ...nw,
          category: nw.category || prev.category || "",
          coverId: nw.coverId || prev.coverId || "",
          coverLink: nw.coverLink || prev.coverLink || "",
          attachments: mergedAtts,
          fileId: nw.fileId || prev.fileId || "",
          fileName: nw.fileName || prev.fileName || "",
          fileLink: nw.fileLink || prev.fileLink || "",
          updatedAt: upd
        });
      } else {
        if (!prev.category && nw.category) prev.category = nw.category;
        if (!prev.coverLink && nw.coverLink) {
          prev.coverId = nw.coverId || prev.coverId || "";
          prev.coverLink = nw.coverLink;
        }
        if (!prev.attachments.length && nw.attachments.length) {
          prev.attachments = nw.attachments;
        }
        if (!prev.fileLink && nw.fileLink) {
          prev.fileId = nw.fileId || prev.fileId || "";
          prev.fileName = nw.fileName || prev.fileName || "";
          prev.fileLink = nw.fileLink;
        }
      }
    });

    const mergedDeletedG = {};
    const allDelGKeys = new Set([...Object.keys(local.deletedGoals || {}), ...Object.keys(remote.deletedGoals || {})]);
    allDelGKeys.forEach((id) => {
      const ts = Math.max(Number(local.deletedGoals?.[id]) || 0, Number(remote.deletedGoals?.[id]) || 0);
      if (ts > cutoff) mergedDeletedG[id] = ts;
    });

    const normG = (g, upd) => ({
      id: String(g.id),
      type: g.type === "do" ? "do" : "buy",
      title: String(g.title || "").trim(),
      priority: Math.min(10, Math.max(1, Number(g.priority) || 5)),
      cost: Math.max(0, Number(g.cost) || 0),
      saved: Math.max(0, Number(g.saved) || 0),
      done: !!g.done,
      notes: String(g.notes || "").trim(),
      updatedAt: upd
    });

    const gById = new Map();
    (remote.goals || []).forEach((g) => {
      if (!g || !g.id) return;
      const upd = Number(g.updatedAt) || 0;
      if (mergedDeletedG[g.id] && mergedDeletedG[g.id] >= upd) return;
      gById.set(g.id, normG(g, upd));
    });

    (local.goals || []).forEach((g) => {
      if (!g || !g.id) return;
      const upd = Number(g.updatedAt) || 0;
      if (mergedDeletedG[g.id] && mergedDeletedG[g.id] >= upd) return;
      const ng = normG(g, upd);
      const prev = gById.get(ng.id);
      if (!prev || upd >= (Number(prev.updatedAt) || 0)) {
        gById.set(ng.id, ng);
      }
    });

    DEFAULT_GOALS.forEach((dg) => {
      if (!gById.has(dg.id) && !mergedDeletedG[dg.id]) {
        gById.set(dg.id, { ...dg });
      }
    });

    return {
      items: finalItems,
      priceMemory: mergedMemory,
      deletedIds: mergedDeleted,
      warranties: Array.from(wById.values()),
      deletedWarranties: mergedDeletedW,
      goals: Array.from(gById.values()),
      deletedGoals: mergedDeletedG
    };
  }

  async function ensureDriveToken() {
    let tok = window._getAuthToken ? window._getAuthToken() : "";
    if (!tok && window._refreshAuthToken) {
      const ok = await window._refreshAuthToken();
      if (ok && window._getAuthToken) tok = window._getAuthToken();
    }
    return tok;
  }

  async function driveApiFetch(url, options = {}) {
    if (typeof driveFetchWithRetry === "function") {
      return driveFetchWithRetry(url, options);
    }
    const tok = await ensureDriveToken();
    if (!tok) throw new Error("no_auth");
    const headers = { ...(options.headers || {}), Authorization: "Bearer " + tok };
    return fetch(url, { ...options, headers });
  }

  async function resolveDriveFileId() {
    if (driveMeta && driveMeta.fileId) return driveMeta.fileId;
    const safeName = DRIVE_FILE_NAME.replace(/'/g, "\\'");
    const q = `name='${safeName}' and trashed=false`;
    const res = await driveApiFetch(
      "https://www.googleapis.com/drive/v3/files?fields=files(id,name,parents)&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy=" +
        encodeURIComponent("modifiedTime desc") +
        "&q=" +
        encodeURIComponent(q)
    );
    if (res.status === 401 || res.status === 403) {
      const err = new Error("need_scope");
      err.code = res.status;
      throw err;
    }
    if (!res.ok) throw new Error("drive_list_" + res.status);
    const data = await res.json();
    if (Array.isArray(data.files) && data.files.length > 0) {
      driveMeta = { fileId: data.files[0].id };
      try { localStorage.setItem(FILE_META_KEY, JSON.stringify(driveMeta)); } catch {}
      return driveMeta.fileId;
    }

    let parentId = "";
    try {
      const rootSafe = APP_CONFIG.receiptsRootFolder.replace(/'/g, "\\'");
      const rq = `name='${rootSafe}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const rRes = await driveApiFetch(
        "https://www.googleapis.com/drive/v3/files?fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&q=" +
          encodeURIComponent(rq)
      );
      if (rRes.ok) {
        const rJson = await rRes.json();
        if (rJson.files && rJson.files[0]) parentId = rJson.files[0].id;
      }
    } catch {}

    const boundary = "-------myMoneyShopBoundary" + Date.now();
    const meta = { name: DRIVE_FILE_NAME, mimeType: "application/json" };
    if (parentId) meta.parents = [parentId];
    const initPayload = JSON.stringify({
      version: 1,
      updatedAt: Date.now(),
      items,
      priceMemory,
      deletedIds,
      warranties,
      deletedWarranties,
      goals,
      deletedGoals
    });
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${initPayload}\r\n` +
      `--${boundary}--`;

    const cRes = await driveApiFetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id",
      {
        method: "POST",
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
        body
      }
    );
    if (cRes.status === 401 || cRes.status === 403) {
      const err = new Error("need_scope");
      err.code = cRes.status;
      throw err;
    }
    if (!cRes.ok) throw new Error("drive_create_" + cRes.status);
    const created = await cRes.json();
    driveMeta = { fileId: created.id };
    try { localStorage.setItem(FILE_META_KEY, JSON.stringify(driveMeta)); } catch {}
    return driveMeta.fileId;
  }

  async function readRemoteState(fileId) {
    const res = await driveApiFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`
    );
    if (res.status === 404) {
      driveMeta = null;
      try { localStorage.removeItem(FILE_META_KEY); } catch {}
      return null;
    }
    if (res.status === 401 || res.status === 403) {
      const err = new Error("need_scope");
      err.code = res.status;
      throw err;
    }
    if (!res.ok) throw new Error("drive_read_" + res.status);
    const txt = await res.text();
    if (!txt || !txt.trim()) return { items: [], priceMemory: {}, deletedIds: {}, warranties: [], deletedWarranties: {}, goals: [], deletedGoals: {} };
    try {
      return JSON.parse(txt);
    } catch {
      return { items: [], priceMemory: {}, deletedIds: {}, warranties: [], deletedWarranties: {}, goals: [], deletedGoals: {} };
    }
  }

  async function writeRemoteState(fileId, payload) {
    const res = await driveApiFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({
          version: 1,
          updatedAt: Date.now(),
          ...payload
        })
      }
    );
    if (res.status === 401 || res.status === 403) {
      const err = new Error("need_scope");
      err.code = res.status;
      throw err;
    }
    if (!res.ok) throw new Error("drive_write_" + res.status);
  }

  async function syncWithDrive(mode = "pull", silent = false) {
    clearTimeout(startupSyncTimer);
    if (!navigator.onLine) {
      setSyncPill("off", "לא מקוון");
      return;
    }
    const tok = await ensureDriveToken();
    if (!tok) {
      setSyncPill("off", "מקומי בלבד");
      return;
    }
    if (syncInFlight) {
      if (mode === "push") pendingPush = true;
      return;
    }

    syncInFlight = true;
    if (!silent) setSyncPill("syncing", "מסנכרן...");

    try {
      let fileId = await resolveDriveFileId();
      let remote = await readRemoteState(fileId);
      if (remote === null) {
        fileId = await resolveDriveFileId();
        remote = await readRemoteState(fileId) || {};
      }

      const localSnapshot = { items, priceMemory, deletedIds, warranties, deletedWarranties, goals, deletedGoals };
      const merged = mergeStates(localSnapshot, remote);
      const changed = hasStateChanged(localSnapshot, merged);

      items = merged.items;
      priceMemory = merged.priceMemory;
      deletedIds = merged.deletedIds;
      warranties = merged.warranties;
      deletedWarranties = merged.deletedWarranties;
      goals = merged.goals;
      deletedGoals = merged.deletedGoals;
      persistLocal();

      if (mode === "push" || pendingPush || changed) {
        pendingPush = false;
        await writeRemoteState(fileId, merged);
      }

      initialPullDone = true;
      setSyncPill("ok", "מסונכרן בדרייב");
      if (changed) {
        render();
        if (typeof S !== "undefined" && S.tab === "more" && S.sub === "wr" && !S.wForm && typeof draw === "function") {
          draw(true);
        }
        if (typeof S !== "undefined" && S.tab === "more" && S.sub === "gl" && !S.glForm && typeof draw === "function") {
          draw(true);
        }
      }
    } catch (err) {
      if (err && (err.message === "need_scope" || err.code === 401 || err.code === 403)) {
        setSyncPill("need_scope", "נדרשת הרשאת דרייב");
      } else {
        setSyncPill("warn", "שגיאת סנכרון");
      }
    } finally {
      syncInFlight = false;
      if (pendingPush) {
        pendingPush = false;
        scheduleDrivePush();
      }
    }
  }

  async function backfillMissingImages() {
    if (!navigator.onLine) return;
    if (typeof S !== "undefined" && S.tab !== "shop") return;
    const candidates = items.filter((it) => !it.image && it.name && !checkedImageNames.has(it.name.trim().toLowerCase())).slice(0, 6);
    if (!candidates.length) return;

    let updated = false;
    for (const it of candidates) {
      const key = it.name.trim().toLowerCase();
      checkedImageNames.add(key);
      try {
        const res = await fetch(`${WORKER_BASE}/rami?q=${encodeURIComponent(it.name.trim())}`);
        if (!res.ok) continue;
        const data = await res.json();
        const hit = data && Array.isArray(data.items) ? data.items.find((x) => x && x.image) : null;
        if (hit && hit.image) {
          it.image = hit.image;
          it.updatedAt = Date.now();
          rememberProduct(it.name, it.price || hit.price || 0, it.dept, hit.image);
          updated = true;
        }
      } catch {}
    }

    if (updated) {
      persistLocal();
      render();
      scheduleDrivePush();
    }
  }

  function toggleItem(id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    it.done = !it.done;
    it.updatedAt = Date.now();
    saveState(true);
  }

  function changeQty(id, delta) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const next = (Number(it.qty) || 1) + delta;
    if (next <= 0) {
      deleteItem(id);
      return;
    }
    it.qty = next;
    it.updatedAt = Date.now();
    saveState(true);
  }

  function deleteItem(id) {
    items = items.filter((x) => x.id !== id);
    markDeleted(id);
    if (editingPriceItemId === id) editingPriceItemId = null;
    saveState(true);
  }

  function startEditPrice(id) {
    editingPriceItemId = id;
    render();
    setTimeout(() => {
      const inp = document.querySelector(`[data-price-inp="${id}"]`);
      if (inp) { inp.focus(); inp.select(); }
    }, 30);
  }

  function commitEditPrice(id, rawVal) {
    const it = items.find((x) => x.id === id);
    editingPriceItemId = null;
    if (!it) { render(); return; }
    const val = Math.max(0, Math.round((parseFloat(String(rawVal || "0").replace(",", ".")) || 0) * 100) / 100);
    it.price = val;
    it.updatedAt = Date.now();
    if (val > 0) rememberProduct(it.name, val, it.dept, it.image);
    saveState(true);
  }

  function clearDoneItems() {
    const doneList = items.filter((x) => x.done);
    if (!doneList.length) return;
    doneList.forEach((x) => markDeleted(x.id));
    items = items.filter((x) => !x.done);
    saveState(true);
  }

  function shareList() {
    const active = items.filter((x) => !x.done);
    if (!active.length) {
      showShareBanner("אין מוצרים פתוחים ברשימה לשיתוף.");
      return;
    }
    const lines = active.map((x) => `• ${x.name}${x.qty > 1 ? ` (×${x.qty})` : ""}${x.price > 0 ? ` — ${fmtMoney(x.price * x.qty)}` : ""}`);
    const total = active.reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.qty) || 1), 0);
    const payload = active.map((x) => ({ n: x.name, q: x.qty, p: x.price, d: x.dept }));
    const shareUrl = `${location.origin}${location.pathname}#shop=${encodeURIComponent(JSON.stringify(payload))}`;
    const text = `רשימת קניות (${active.length} פריטים):\n${lines.join("\n")}${total > 0 ? `\nסה״כ משוער: ${fmtMoney(total)}` : ""}\n\nלייבוא לאפליקציה:\n${shareUrl}`;

    if (navigator.share) {
      navigator.share({ title: "רשימת קניות", text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showShareBanner("הרשימה וקישור הייבוא הועתקו ללוח ✓");
      }).catch(() => {});
    }
  }

  function importFromHashIfPresent() {
    if (!location.hash.startsWith("#shop=")) return;
    try {
      const raw = decodeURIComponent(location.hash.slice(6));
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        arr.forEach((x) => {
          if (x && x.n) {
            addItem({ name: String(x.n), qty: Number(x.q) || 1, price: Number(x.p) || 0, dept: String(x.d || "") });
          }
        });
        showShareBanner(`יובאו ${arr.length} פריטים לרשימת הקניות ✓`);
      }
    } catch {}
    history.replaceState(null, "", location.pathname + location.search);
  }

  function renderItemRow(it) {
    const lineTot = (Number(it.price) || 0) * (Number(it.qty) || 1);
    const isEditing = editingPriceItemId === it.id;
    return `<div class="shop-item ${it.done ? "done" : ""}">
      <button type="button" class="shop-check" data-stog="${esc(it.id)}" aria-label="סמן נקנה">${it.done ? "✓" : ""}</button>
      ${renderThumb(it.image, it.name, it.dept, "shop-thumb")}
      <div class="shop-mid">
        <div class="shop-name">${esc(it.name)}</div>
        <div class="shop-controls">
          ${isEditing
            ? `<input type="number" inputmode="decimal" step="0.01" min="0" data-price-inp="${esc(it.id)}" value="${Number(it.price) || ""}" placeholder="מחיר ליח׳" style="width:86px;padding:3px 6px;border:1px solid var(--acc);border-radius:8px;font-size:12px">`
            : `<button type="button" class="shop-unit-btn" data-sprice="${esc(it.id)}">${Number(it.price) > 0 ? `${fmtMoney(it.price)} ליח׳` : "+ מחיר"}</button>`}
          <div class="shop-qty-box">
            <button type="button" class="shop-qty-btn" data-sqty="${esc(it.id)}:-1">−</button>
            <span class="shop-qty-val">${Number(it.qty) || 1}</span>
            <button type="button" class="shop-qty-btn" data-sqty="${esc(it.id)}:1">+</button>
          </div>
        </div>
      </div>
      <div class="shop-end">
        <div class="shop-line-total">${lineTot > 0 ? fmtMoney(lineTot) : "—"}</div>
        <button type="button" class="shop-del-btn" data-sdel="${esc(it.id)}" aria-label="מחק">הסר</button>
      </div>
    </div>`;
  }

  function renderDeptGroups(list) {
    const groups = new Map();
    list.forEach((it) => {
      const d = it.dept || classifyDepartment(it.name);
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d).push(it);
    });

    const sortedDepts = [...groups.keys()].sort((a, b) => {
      const ia = DEPT_ORDER.indexOf(a);
      const ib = DEPT_ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b, "he");
    });

    return sortedDepts.map((dept) => {
      const groupItems = groups.get(dept);
      const subTot = groupItems.reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.qty) || 1), 0);
      return `<details class="card shop-dept" open>
        <summary>
          <span>${esc(dept)} <small class="mut">(${groupItems.length})</small></span>
          ${subTot > 0 ? `<span class="shop-dept-sub">${fmtMoney(subTot)}</span>` : ""}
        </summary>
        ${groupItems.map(renderItemRow).join("")}
      </details>`;
    }).join("");
  }

  function render() {
    const totalEst = items.reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.qty) || 1), 0);
    const leftEst = items.filter((x) => !x.done).reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.qty) || 1), 0);
    const doneCount = items.filter((x) => x.done).length;

    const setTxt = (id, v) => { const el = byId(id); if (el) el.textContent = v; };
    setTxt("shop-total-all", fmtMoney(totalEst));
    setTxt("shop-total-left", fmtMoney(leftEst));
    setTxt("shop-progress", `${doneCount}/${items.length}`);
    setTxt("shop-float-left", fmtMoney(leftEst));
    setTxt("shop-float-all", fmtMoney(totalEst));

    document.querySelectorAll("#page-shopping [data-filter]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === currentFilter);
    });

    const groupsEl = byId("shop-groups-container");
    const doneEl = byId("shop-done-container");
    if (!groupsEl) return;

    const openItems = items.filter((it) => !it.done);
    const doneItems = items.filter((it) => !!it.done);

    if (!items.length) {
      groupsEl.innerHTML = `<div class="card"><p class="mut" style="margin:0;text-align:center">רשימת הקניות ריקה. חפש מוצר למעלה כדי להתחיל.</p></div>`;
      if (doneEl) doneEl.innerHTML = "";
      return;
    }

    if (currentFilter === "todo") {
      groupsEl.innerHTML = openItems.length
        ? renderDeptGroups(openItems)
        : `<div class="card"><p class="mut" style="margin:0;text-align:center">כל הפריטים ברשימה כבר נאספו ✓</p></div>`;
      if (doneEl) doneEl.innerHTML = "";
      return;
    }

    if (currentFilter === "done") {
      groupsEl.innerHTML = doneItems.length
        ? renderDeptGroups(doneItems)
        : `<div class="card"><p class="mut" style="margin:0;text-align:center">עדיין לא סומנו פריטים שנקנו.</p></div>`;
      if (doneEl) doneEl.innerHTML = "";
      return;
    }

    groupsEl.innerHTML = openItems.length
      ? renderDeptGroups(openItems)
      : `<div class="card"><p class="mut" style="margin:0;text-align:center">כל הפריטים ברשימה נאספו לעגלה ✓</p></div>`;

    if (doneEl) {
      if (doneItems.length) {
        const doneTot = doneItems.reduce((s, x) => s + (Number(x.price) || 0) * (Number(x.qty) || 1), 0);
        doneEl.innerHTML = `<details class="card shop-dept" open>
          <summary>
            <span>✅ נאספו לעגלה <small class="mut">(${doneItems.length})</small></span>
            ${doneTot > 0 ? `<span class="shop-dept-sub">${fmtMoney(doneTot)}</span>` : ""}
          </summary>
          ${doneItems.map(renderItemRow).join("")}
        </details>`;
      } else {
        doneEl.innerHTML = "";
      }
    }
  }

  const searchInp = byId("shop-search-input");
  if (searchInp) {
    searchInp.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value;
      searchTimer = setTimeout(() => handleSearchInput(val), 220);
    });
    searchInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (searchInp.value.trim()) addItem({ name: searchInp.value });
      } else if (e.key === "Escape") {
        closeDropdown();
      }
    });
  }

  document.addEventListener("click", (e) => {
    const shopNavBtn = e.target.closest('nav button[data-t="shop"]');
    if (shopNavBtn) {
      if (!initialPullDone) {
        syncWithDrive("pull", true).then(() => backfillMissingImages());
      } else {
        backfillMissingImages();
      }
    }

    const shopPage = byId("page-shopping");
    if (!e.target.closest("#shop-search-input, #shop-dropdown")) {
      const dd = byId("shop-dropdown");
      if (dd && dd.classList.contains("open")) closeDropdown();
    }
    if (!shopPage || !shopPage.contains(e.target)) return;

    const btn = e.target.closest("button,[data-filter],[data-stog],[data-sqty],[data-sdel],[data-sprice]");
    if (!btn) return;

    if (btn.id === "shop-manual-add") {
      if (searchInp && searchInp.value.trim()) addItem({ name: searchInp.value });
      return;
    }
    if (btn.id === "shop-sync-pill" || btn.id === "shop-sync-btn") {
      if (syncStatus.state === "need_scope" && window._upgradeDriveScope) {
        window._upgradeDriveScope();
      } else {
        syncWithDrive("pull", false);
      }
      return;
    }
    if (btn.id === "shop-share-btn") { shareList(); return; }
    if (btn.id === "shop-clear-done") { clearDoneItems(); return; }
    if (btn.dataset.filter) {
      currentFilter = btn.dataset.filter;
      render();
      return;
    }
    if (btn.dataset.stog) { toggleItem(btn.dataset.stog); return; }
    if (btn.dataset.sqty) {
      const [id, d] = btn.dataset.sqty.split(":");
      changeQty(id, Number(d));
      return;
    }
    if (btn.dataset.sdel) { deleteItem(btn.dataset.sdel); return; }
    if (btn.dataset.sprice) { startEditPrice(btn.dataset.sprice); return; }
  });

  document.addEventListener("keydown", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.priceInp) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEditPrice(e.target.dataset.priceInp, e.target.value);
      } else if (e.key === "Escape") {
        editingPriceItemId = null;
        render();
      }
    }
  });

  document.addEventListener("focusout", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.priceInp) {
      commitEditPrice(e.target.dataset.priceInp, e.target.value);
    }
  });

  window._getWarranties = () => warranties;
  window._saveWarranty = (rec) => {
    if (!rec || !rec.id) return;
    delete deletedWarranties[rec.id];
    const idx = warranties.findIndex((w) => w.id === rec.id);
    if (idx >= 0) warranties[idx] = rec;
    else warranties.unshift(rec);
    persistLocal();
    scheduleDrivePush();
  };
  window._deleteWarranty = (id) => {
    if (!id) return;
    warranties = warranties.filter((w) => w.id !== id);
    deletedWarranties[id] = Date.now();
    persistLocal();
    scheduleDrivePush();
  };

  window._getGoals = () => goals;
  window._saveGoal = (rec) => {
    if (!rec || !rec.id) return;
    delete deletedGoals[rec.id];
    const clean = {
      id: String(rec.id),
      type: rec.type === "do" ? "do" : "buy",
      title: String(rec.title || "").trim(),
      priority: Math.min(10, Math.max(1, Number(rec.priority) || 5)),
      cost: Math.max(0, Number(rec.cost) || 0),
      saved: Math.max(0, Number(rec.saved) || 0),
      done: !!rec.done,
      notes: String(rec.notes || "").trim(),
      updatedAt: Date.now()
    };
    const idx = goals.findIndex((g) => g.id === clean.id);
    if (idx >= 0) goals[idx] = clean;
    else goals.unshift(clean);
    persistLocal();
    scheduleDrivePush();
  };
  window._deleteGoal = (id) => {
    if (!id) return;
    goals = goals.filter((g) => g.id !== id);
    deletedGoals[id] = Date.now();
    persistLocal();
    scheduleDrivePush();
  };
  window._shopSync = (mode = "pull", silent = false) => syncWithDrive(mode, silent);
  window._shopRender = () => render();

  importFromHashIfPresent();
  render();
  startupSyncTimer = setTimeout(() => {
    syncWithDrive("pull", true).then(() => {
      if (typeof S !== "undefined" && S.tab === "shop") backfillMissingImages();
    });
  }, 2500);
})();
