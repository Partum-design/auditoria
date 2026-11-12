// ===== ALMACENAMIENTO: varias auditorías + archivos en IndexedDB =====
import { SECTIONS, ITEM_MAP, isOtherOption } from './data.js';

const KEY = 'partum_audits_v2';
const LEGACY_KEY = 'partum_audit_data';
const listeners = new Set();

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function blankAudit(name = 'Nueva auditoría') {
    return {
        id: uid(), name, created: Date.now(), updated: Date.now(),
        config: { pillars: ['branding', 'dev', 'ops', 'social', 'extra'], devTypes: ['web'], platKinds: [], express: true, setupDone: false },
        values: {},     // respuestas
        flags: {},      // id -> 'na' | 'pending'
        sectionNA: {},  // sectionKey -> true
        custom: {},     // sectionKey -> [{ uid, label, value | auditoría }]
        files: {}       // itemId -> [{ fid, name, type, isImage }]
    };
}

let db; // se inicializa al final del módulo

function loadDb() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* vacío */ }
    if (!data || !data.audits) data = { current: null, audits: {} };
    // Migración desde la versión anterior
    try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
        if (legacy && Object.keys(legacy).length && !data.migrated) {
            const a = migrateLegacy(legacy);
            data.audits[a.id] = a;
            data.current = a.id;
            data.migrated = true;
        }
    } catch (e) { /* sin datos previos */ }
    if (!data.current || !data.audits[data.current]) {
        const ids = Object.keys(data.audits);
        if (ids.length) data.current = ids.sort((x, y) => data.audits[y].updated - data.audits[x].updated)[0];
        else { const a = blankAudit(); data.audits[a.id] = a; data.current = a.id; }
    }
    Object.values(data.audits).forEach(normalizeAudit);
    return data;
}

function normalizeAudit(a) {
    const b = blankAudit();
    ['values', 'flags', 'sectionNA', 'custom', 'files'].forEach(k => { if (!a[k] || typeof a[k] !== 'object') a[k] = {}; });
    a.config = { ...b.config, ...(a.config || {}) };
    return a;
}

// ---------- API pública ----------
export const store = {
    get audit() { return db.audits[db.current]; },
    get all() { return Object.values(db.audits).sort((a, b) => b.updated - a.updated); },
    get values() { return this.audit.values; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    val(id) { return this.audit.values[id]; },
    set(id, value) {
        const v = this.audit.values;
        if (value === '' || value == null || (Array.isArray(value) && !value.length)) delete v[id];
        else v[id] = value;
        if (id === 'bg_name') this.audit.name = value || 'Nueva auditoría';
        touch();
    },
    flag(id) { return this.audit.flags[id]; },
    setFlag(id, f) { if (f) this.audit.flags[id] = f; else delete this.audit.flags[id]; touch(); },
    sectionNA(key) { return !!this.audit.sectionNA[key]; },
    setSectionNA(key, on) { if (on) this.audit.sectionNA[key] = true; else delete this.audit.sectionNA[key]; touch(); },
    custom(key) { return this.audit.custom[key] || (this.audit.custom[key] = []); },
    files(id) { return this.audit.files[id] || []; },
    setConfig(patch) { Object.assign(this.audit.config, patch); touch(); },
    touch,

    newAudit(name) { const a = blankAudit(name); db.audits[a.id] = a; db.current = a.id; persist(true); return a; },
    switchTo(id) { if (db.audits[id]) { db.current = id; persist(true); } },
    duplicate(id) {
        const src = db.audits[id]; if (!src) return;
        const a = JSON.parse(JSON.stringify(src)); a.id = uid(); a.name = src.name + ' (copia)'; a.created = a.updated = Date.now();
        db.audits[a.id] = a; db.current = a.id; persist(true);
        // copiar archivos
        Object.values(a.files).flat().forEach(async f => { const d = await files.get(src.id, f.fid); if (d) files.put(a.id, f.fid, d); });
    },
    async remove(id) {
        const a = db.audits[id]; if (!a) return;
        await Promise.all(Object.values(a.files).flat().map(f => files.del(id, f.fid)));
        delete db.audits[id];
        if (db.current === id) { const rest = Object.keys(db.audits); if (rest.length) db.current = rest[0]; else { const n = blankAudit(); db.audits[n.id] = n; db.current = n.id; } }
        persist(true);
    },
    resetCurrent() {
        const a = this.audit; const fresh = blankAudit(); fresh.id = a.id; fresh.config = { ...a.config };
        Object.values(a.files).flat().forEach(f => files.del(a.id, f.fid));
        db.audits[a.id] = fresh; persist(true);
    },

    async addFile(itemId, file) {
        const a = this.audit; const fid = uid();
        const isImage = /^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type);
        let dataUrl = null;
        if (isImage) dataUrl = await compressImage(file);
        else if (file.size < 4e6) dataUrl = await readAsDataURL(file);
        if (dataUrl) await files.put(a.id, fid, dataUrl);
        (a.files[itemId] ||= []).push({ fid, name: file.name, type: file.type, isImage, size: file.size, stored: !!dataUrl });
        touch(); return fid;
    },
    async removeFile(itemId, fid) {
        const a = this.audit; a.files[itemId] = (a.files[itemId] || []).filter(f => f.fid !== fid);
        if (!a.files[itemId].length) delete a.files[itemId];
        await files.del(a.id, fid); touch();
    },
    fileData(fid, auditId = db.current) { return files.get(auditId, fid); },

    async exportJSON(id = db.current) {
        const a = JSON.parse(JSON.stringify(db.audits[id]));
        a.fileData = {};
        for (const f of Object.values(a.files).flat()) { const d = await files.get(id, f.fid); if (d) a.fileData[f.fid] = d; }
        return { app: 'partum-audit', version: 2, exported: new Date().toISOString(), audit: a };
    },
    async importJSON(json) {
        let a;
        if (json && json.app === 'partum-audit' && json.audit) a = json.audit;
        else if (json && typeof json === 'object') a = migrateLegacy(json); // respaldo antiguo
        else throw new Error('Archivo no válido');
        const fileData = a.fileData || {}; delete a.fileData;
        a.id = uid(); a.updated = Date.now(); normalizeAudit(a);
        db.audits[a.id] = a; db.current = a.id;
        for (const [fid, d] of Object.entries(fileData)) await files.put(a.id, fid, d);
        persist(true); return a;
    }
};
// (las importaciones antiguas guardan sus imágenes con finishMigration)

// ---------- Persistencia ----------
let saveTimer = null;
function touch() {
    store.audit.updated = Date.now();
    clearTimeout(saveTimer);
    emit('saving');
    saveTimer = setTimeout(() => persist(), 350);
}
function persist(structural = false) {
    try {
        localStorage.setItem(KEY, JSON.stringify(db));
        emit(structural ? 'switched' : 'saved');
    } catch (e) {
        emit('error', e);
    }
}
function emit(type, detail) { listeners.forEach(fn => fn(type, detail)); }
window.addEventListener('beforeunload', () => { if (saveTimer) { clearTimeout(saveTimer); try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { } } });

// ---------- IndexedDB para archivos ----------
const files = (() => {
    let dbp;
    const open = () => dbp ||= new Promise((res, rej) => {
        const r = indexedDB.open('partum-audit-files', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('files');
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    const tx = async (mode, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction('files', mode); const q = fn(t.objectStore('files')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
    return {
        put: (aid, fid, data) => tx('readwrite', s => s.put(data, `${aid}:${fid}`)).catch(() => null),
        get: (aid, fid) => tx('readonly', s => s.get(`${aid}:${fid}`)).catch(() => null),
        del: (aid, fid) => tx('readwrite', s => s.delete(`${aid}:${fid}`)).catch(() => null)
    };
})();

function readAsDataURL(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
async function compressImage(file, max = 1400) {
    const src = await readAsDataURL(file);
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        // rasterizar SVG/GIF a PNG para que funcione en el PDF
        return rasterize(src, max, 'image/png').catch(() => src);
    }
    const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
    return rasterize(src, max, keepAlpha ? 'image/png' : 'image/jpeg').catch(() => src);
}
function rasterize(src, max, type) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
            const s = Math.min(1, max / Math.max(img.naturalWidth || max, img.naturalHeight || max));
            const w = Math.max(1, Math.round((img.naturalWidth || max) * s)), h = Math.max(1, Math.round((img.naturalHeight || max) * s));
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            const ctx = c.getContext('2d');
            if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
            ctx.drawImage(img, 0, 0, w, h);
            res(c.toDataURL(type, 0.85));
        };
        img.onerror = rej; img.src = src;
    });
}

// ---------- Migración desde la versión 1 ----------
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

function matchOptions(raw, options) {
    // La versión anterior guardaba casillas como texto separado por comas (con errores si la opción tenía comas)
    const s = String(raw); const picked = []; let rest = norm(s);
    [...options].sort((a, b) => b.length - a.length).forEach(o => { const n = norm(o); if (n && rest.includes(n)) { picked.push(o); rest = rest.replace(n, ''); } });
    // Coincidencias aproximadas para opciones renombradas
    s.split(',').map(x => x.trim()).filter(Boolean).forEach(part => {
        const p = norm(part); if (!p || !rest.includes(p)) return;
        const o = options.find(o => norm(o).startsWith(p.slice(0, 8)) || p.startsWith(norm(o).slice(0, 8)));
        if (o && !picked.includes(o)) { picked.push(o); rest = rest.replace(p, ''); }
    });
    return picked;
}
function matchOne(raw, options) {
    const p = norm(raw);
    return options.find(o => norm(o) === p) || options.find(o => norm(o).startsWith(p.slice(0, 10)) || p.startsWith(norm(o).slice(0, 10))) || null;
}

export function migrateLegacy(old) {
    const a = blankAudit(old.bg_name || 'Auditoría importada');
    a.config.setupDone = true;
    a.config.devTypes = ['web'];
    const v = a.values;
    const legacyFileFor = {};

    Object.entries(old).forEach(([k, val]) => {
        if (val == null || val === '') return;
        if (k.startsWith('skip_')) { if (val) a.flags[k.slice(5)] = 'na'; return; }
        if (k.endsWith('_responsibles')) {
            const sec = k.replace('_responsibles', '').replace('web_development', 'web_performance');
            v[`${sec}_responsibles`] = val; return;
        }
        if (k.endsWith('_img') || k.endsWith('_file')) { const base = k.replace(/_(img|file)$/, ''); (legacyFileFor[base] ||= {})[k.endsWith('_img') ? 'img' : 'name'] = val; return; }
        const item = ITEM_MAP[k];
        if (item) {
            if (item.type === 'checks') {
                const picked = matchOptions(val, item.options);
                if (picked.length) v[k] = picked;
            } else if (['select', 'radio'].includes(item.type)) {
                const o = matchOne(val, item.options);
                if (o) v[k] = o;
                else { const other = item.options.find(isOtherOption); if (other) { v[k] = other; v[`${k}__other`] = val; } }
            } else if (SECTIONS.find(s => s.key === item.section).kind === 'audit') {
                v[`${k}_obs`] = val; // diagnósticos de texto -> observaciones
            } else v[k] = val;
            return;
        }
        v[k] = val; // campos de auditoría (status, risk...), personal, etc.
    });

    // Prioridades renombradas
    Object.keys(v).filter(k => k.endsWith('_priority')).forEach(k => { const n = String(v[k]).charAt(0); v[k] = { 1: '1 · Inmediato', 2: '2 · Corto plazo', 3: '3 · Mejora futura' }[n] || v[k]; });
    Object.keys(v).filter(k => k.endsWith('_status')).forEach(k => { if (v[k] === 'No Cumple') v[k] = 'No cumple'; if (v[k] === 'No Aplica') v[k] = 'No aplica'; });

    // Campos reestructurados
    if (old.bs_comp1 || old.bs_comp2) { v.bs_competitors = [old.bs_comp1, old.bs_comp2].filter(Boolean).map(n => ({ name: n, link: '' })); delete v.bs_comp1; delete v.bs_comp2; }
    const prods = [1, 2, 3].map(i => ({ name: old[`so_prod${i}`] || '', discount: old[`so_prod${i}_desc`] || '' })).filter(p => p.name || p.discount);
    if (prods.length) v.so_products = prods;
    [1, 2, 3].forEach(i => { delete v[`so_prod${i}`]; delete v[`so_prod${i}_desc`]; });
    if (old.bn_admin_other) { v.bn_admin__other = old.bn_admin_other; delete v.bn_admin_other; }
    if (old.sa_platforms_other) { v.sa_platforms__other = old.sa_platforms_other; delete v.sa_platforms_other; }
    if (old.sd_visits_detail || old.sad_visits_detail) v.sd_visits__other = old.sd_visits_detail || old.sad_visits_detail;
    if (!v.sd_approval_days && old.sad_approval_days) v.sd_approval_days = old.sad_approval_days;
    if (!v.sd_visits && old.sad_visits) v.sd_visits = matchOne(old.sad_visits, ITEM_MAP.sd_visits.options);
    if (!v.sd_security && old.sad_security) v.sd_security = old.sad_security;
    const respName = old.sd_responsible || old.sad_responsible;
    if (respName) { const r = v.social_disponibilidad_responsibles ||= [{ name: '', contact: '', days_agency: '', days_client: '' }]; if (!r[0].name) r[0].name = respName; }
    if (old.sad_budget || old.sad_focus || old.sad_target) v.sad_active = 'Sí';
    ['sad_responsible', 'sad_approval_days', 'sad_visits', 'sad_visits_detail', 'sad_security', 'sd_responsible', 'sd_visits_detail', 'bc_ondemand', 'bg_website_url'].forEach(k => { if (k !== 'bg_website_url') delete v[k]; });
    if (old.bg_website === 'Sí') v.bg_website = 'Sí, actualizada';
    if (old.bg_website_url) v.bg_website_url = old.bg_website_url;
    // Tienda en línea si había datos de e-commerce
    if ([0, 1, 2, 3, 4, 5, 6].some(i => old[`web_development_${i}_status`] || old[`web_development_${i}_obs`])) {
        v.dv_ecommerce = 'Sí';
        const obs = [0, 1, 2, 3, 4, 5, 6].map(i => old[`web_development_${i}_obs`]).filter(Boolean);
        if (obs.length) v.ec_categories = obs.join('\n');
    }

    // Imágenes antiguas en base64 -> se guardan como archivos al cargar
    a._legacyFiles = legacyFileFor;
    return a;
}

// Mover imágenes antiguas a IndexedDB (se ejecuta una vez)
export async function finishMigration() {
    for (const a of Object.values(db.audits)) {
        if (!a._legacyFiles) continue;
        for (const [itemId, f] of Object.entries(a._legacyFiles)) {
            if (!f.img) continue;
            const fid = uid();
            await files.put(a.id, fid, f.img);
            (a.files[itemId] ||= []).push({ fid, name: f.name || 'imagen', type: 'image/png', isImage: true, stored: true });
        }
        delete a._legacyFiles;
    }
    persist();
}

// Inicializar después de declarar todas las funciones auxiliares
db = loadDb();
