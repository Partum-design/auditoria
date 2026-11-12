// ===== APP PRINCIPAL =====
import { PILLARS, DEV_TYPES, PLATFORM_KINDS, SECTIONS, SECTION_MAP, ITEM_MAP, AUDIT_STATUS, AUDIT_RISK, AUDIT_PRIORITY, RESPONSIBLES_ITEM, VISUAL_STYLES, isOtherOption } from './data.js';
import { store, finishMigration } from './store.js';
import { evalRule, sectionState, visibleSections, itemVisible, itemAnswered, sectionProgress, pillarProgress, globalProgress, collectStats, kindOf, pillarEnabled, expressOn, expressHidden } from './logic.js';

// ---------- utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const view = $('#view');
let current = { route: 'inicio', key: null };
let firstRender = true;
const completedOnce = new Set();
let viewAbort = new AbortController(); // limpia los eventos de la vista anterior

const STATUS_TONE = { 'Cumple': 'ok', 'Parcial': 'part', 'No cumple': 'bad', 'Desconocido': 'unk', 'No aplica': 'na' };
const RISK_TONE = { 'Bajo': 'ok', 'Medio': 'part', 'Alto': 'bad', 'Crítico': 'crit' };
const PRIO_TONE = { '1 · Inmediato': 'bad', '2 · Corto plazo': 'part', '3 · Mejora futura': 'unk' };
const SMART_DEFAULTS = { 'Cumple': ['Bajo', '3 · Mejora futura'], 'Parcial': ['Medio', '2 · Corto plazo'], 'No cumple': ['Alto', '1 · Inmediato'], 'Desconocido': ['Medio', '2 · Corto plazo'] };

// =====================================================================
//  INICIO
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
    setupBrandLogo();
    await finishMigration();
    bindGlobal();
    store.onChange(onStoreEvent);
    renderNav();
    updateChrome();
    route();
    window.addEventListener('hashchange', route);
});

function setupBrandLogo() {
    const img = $('#brandLogo'), txt = $('#brandText');
    const fallbacks = ['https://partumdesign.com.mx/wp-content/uploads/2025/03/Recursxo-1.png'];
    const fail = () => {
        const next = fallbacks.shift();
        if (next) img.src = next; else { img.hidden = true; txt.hidden = false; }
    };
    img.addEventListener('error', fail);
    if (img.complete && !img.naturalWidth) fail(); // ya falló antes de cargar el script
}

function onStoreEvent(type) {
    const el = $('#saveState');
    if (type === 'saving') { el.className = 'save-state saving'; el.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Guardando…</span>'; }
    if (type === 'saved' || type === 'switched') { el.className = 'save-state'; el.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>Todo guardado</span>'; }
    if (type === 'error') { el.className = 'save-state error'; el.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><span>Sin espacio: descarga un respaldo</span>'; toast('No se pudo guardar: el navegador se quedó sin espacio. Descarga un respaldo (.json).', 'error'); }
    if (type === 'switched') { refresh._sig = undefined; completedOnce.clear(); renderNav(); updateChrome(); route(true); }
}

// =====================================================================
//  RUTAS
// =====================================================================
function go(hash) { if (location.hash === hash) route(true); else location.hash = hash; }

function route(force) {
    const h = location.hash.replace(/^#\/?/, '') || 'inicio';
    const [r, key, focusId] = h.split('/');
    const render = () => {
        viewAbort.abort(); viewAbort = new AbortController();
        if (r === 's' && SECTION_MAP[key]) { current = { route: 's', key }; renderSection(key, focusId); }
        else if (r === 'resumen') { current = { route: 'resumen' }; renderSummary(); }
        else { current = { route: 'inicio' }; renderHome(); }
        updateNavActive(); updateCrumbs(); closeSheet();
        view.scrollTop = 0;
        if (focusId) requestAnimationFrame(() => focusQuestion(focusId));
    };
    if (document.startViewTransition && !reduceMotion && force !== 'silent' && !firstRender) document.startViewTransition(render);
    else render();
    firstRender = false;
}

function focusQuestion(id) {
    const q = $(`[data-qid="${CSS.escape(id)}"]`);
    if (!q) return;
    const card = q.querySelector('.q') || q;
    card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    card.classList.remove('highlight'); void card.offsetWidth; card.classList.add('highlight');
    const input = card.querySelector('input:not([type=hidden]):not([type=file]), textarea, select');
    setTimeout(() => input && input.focus({ preventScroll: true }), 450);
}

// =====================================================================
//  NAVEGACIÓN LATERAL
// =====================================================================
function navHTML() {
    let html = `<a class="nav-link" href="#/inicio" data-nav="inicio"><span class="ico"><i class="fa-solid fa-sliders"></i></span>Configuración</a>`;
    html += `<div class="nav-label">Diagnóstico</div>`;
    Object.entries(PILLARS).forEach(([p, P]) => {
        if (!pillarEnabled(p)) return;
        const secs = visibleSections(p);
        const open = current.key ? SECTION_MAP[current.key]?.pillar === p : p === store.audit.config.pillars[0];
        html += `<div class="pillar ${open ? 'open' : ''}" data-pillar="${p}" style="--c:${P.color}">
            <button class="pillar-head" type="button" aria-expanded="${open}"><span class="ico"><i class="fa-solid ${P.icon}"></i></span>${P.label}<span class="pct" data-ppct="${p}"></span><i class="fa-solid fa-chevron-right chev"></i></button>
            <div class="pillar-body"><div><div class="pillar-list">
            ${secs.map(s => `<button type="button" class="sec-link" data-sec="${s.key}" style="--c:${P.color}"><span class="sec-ind" data-ind="${s.key}"></span><span class="t">${esc(s.title)}</span></button>`).join('')}
            </div></div></div></div>`;
    });
    html += `<div class="nav-sep"></div><a class="nav-link" href="#/resumen" data-nav="resumen"><span class="ico"><i class="fa-solid fa-chart-pie"></i></span>Resumen y PDF</a>`;
    return html;
}

function renderNav() {
    const nav = $('#nav');
    nav.innerHTML = navHTML();
    nav.onclick = e => {
        const head = e.target.closest('.pillar-head');
        if (head) { const p = head.parentElement; p.classList.toggle('open'); head.setAttribute('aria-expanded', p.classList.contains('open')); return; }
        const s = e.target.closest('.sec-link');
        if (s) go(`#/s/${s.dataset.sec}`);
    };
    updateNavProgress(); updateNavActive();
}

function indicatorHTML(sec) {
    const r = sectionProgress(sec);
    if (r.state === 'locked') return `<span class="sec-state lock" title="Bloqueada"><i class="fa-solid fa-lock"></i></span>`;
    if (r.state === 'na') return `<span class="sec-state na" title="No aplica"></span>`;
    if (r.total && r.done === r.total) return `<span class="sec-state done"><i class="fa-solid fa-check"></i></span>`;
    const off = 44 - 44 * (r.pct / 100);
    return `<svg class="mini-ring" viewBox="0 0 18 18"><circle class="bg" cx="9" cy="9" r="7"/><circle class="fg" cx="9" cy="9" r="7" style="stroke-dashoffset:${off}"/></svg>`;
}

function updateNavProgress() {
    $$('.sec-link').forEach(l => {
        const sec = SECTION_MAP[l.dataset.sec]; const st = sectionState(sec);
        l.classList.toggle('locked', st === 'locked'); l.classList.toggle('na', st === 'na');
        const ind = l.querySelector('.sec-ind');
        const html = indicatorHTML(sec);
        if (ind._html !== html) { ind.innerHTML = html; ind._html = html; }
    });
    $$('[data-ppct]').forEach(el => { const r = pillarProgress(el.dataset.ppct); el.textContent = r.total ? r.pct + '%' : ''; });
}

function updateNavActive() {
    $$('.sec-link').forEach(l => l.classList.toggle('active', current.route === 's' && l.dataset.sec === current.key));
    $$('[data-nav]').forEach(l => l.classList.toggle('active', l.dataset.nav === current.route));
    $$('.bottom-nav [data-m]').forEach(b => b.classList.toggle('active', b.dataset.m === current.route || (b.dataset.m === 'sections' && current.route === 's')));
    if (current.key) { const p = $(`.pillar[data-pillar="${SECTION_MAP[current.key].pillar}"]`); if (p && !p.classList.contains('open')) p.classList.add('open'); }
}

function updateCrumbs() {
    const c = $('#crumbs');
    if (current.route === 's') {
        const s = SECTION_MAP[current.key]; const P = PILLARS[s.pillar];
        c.innerHTML = `<span style="color:${P.color}"><i class="fa-solid ${P.icon}"></i> ${P.label}</span><i class="fa-solid fa-chevron-right sep"></i><strong>${esc(s.title)}</strong>`;
    } else if (current.route === 'resumen') c.innerHTML = `<strong>Resumen y exportación</strong>`;
    else c.innerHTML = `<strong>Configuración del diagnóstico</strong>`;
}

let lastPct = -1;
function updateChrome() {
    const g = globalProgress();
    $('#globalRing').style.strokeDashoffset = 97.4 - 97.4 * g.pct / 100;
    $('#globalRing').style.stroke = g.pct === 100 ? 'var(--ok)' : 'var(--accent)';
    if (g.pct !== lastPct) { tweenNumber($('#globalPct'), lastPct < 0 ? g.pct : lastPct, g.pct, v => v + '%'); lastPct = g.pct; }
    const name = store.audit.name || 'Nueva auditoría';
    $('#clientName').textContent = name;
    $('#clientAvatar').textContent = (name.trim()[0] || 'N').toUpperCase();
    document.title = `${name} · Diagnóstico | Partum Design`;
}

function tweenNumber(el, from, to, fmt) {
    if (reduceMotion || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), d = 600;
    const step = t => { const k = Math.min(1, (t - t0) / d); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
}

// =====================================================================
//  INICIO / CONFIGURACIÓN
// =====================================================================
function renderHome() {
    const a = store.audit; const cfg = a.config;
    const name = store.val('bg_name') || '';
    const devOn = cfg.pillars.includes('dev');
    const platOn = devOn && cfg.devTypes.includes('platform');
    const kinds = cfg.platKinds || [];
    view.innerHTML = `<div class="view-inner stagger">
        <section class="hero" style="--i:0">
            <div class="eyebrow">Diagnóstico integral · Partum Design</div>
            <h1>Empecemos el diagnóstico de <span class="grad" id="heroName">${esc(name || 'tu cliente')}</span></h1>
            <p>Elige qué servicios incluye el proyecto. Solo verás las preguntas que aplican; lo demás se habilita automáticamente según las respuestas.</p>
        </section>

        <section class="step" style="--i:1">
            <div class="step-title"><span class="n">1</span><h2>¿Cómo se llama la marca o empresa?</h2></div>
            <input class="field name-input" id="homeName" type="text" placeholder="Nombre comercial" value="${esc(name)}" autocomplete="organization">
        </section>

        <section class="step" style="--i:2">
            <div class="step-title"><span class="n">2</span><h2>¿Qué servicios incluye?</h2><small>Puedes elegir varios</small></div>
            <div class="svc-grid" id="svcGrid">
                ${Object.entries(PILLARS).map(([p, P]) => `<label class="svc" style="--c:${P.color}">
                    <input type="checkbox" value="${p}" ${cfg.pillars.includes(p) ? 'checked' : ''}>
                    <span class="check"><i class="fa-solid fa-check"></i></span>
                    <div class="ico"><i class="fa-solid ${P.icon}"></i></div>
                    <h3>${P.label}</h3><p>${P.desc}</p>
                    <div class="meta" data-meta="${p}"></div>
                </label>`).join('')}
            </div>
        </section>

        <section class="step dev-types ${devOn ? 'show' : ''}" id="devStep" style="--i:3"><div>
            <div class="step-title"><span class="n">3</span><h2>¿Qué se va a desarrollar?</h2><small>Puedes elegir varios</small></div>
            <div class="svc-grid" id="devGrid">
                ${Object.entries(DEV_TYPES).map(([t, T]) => `<label class="svc" style="--c:${PILLARS.dev.color}">
                    <input type="checkbox" value="${t}" ${cfg.devTypes.includes(t) ? 'checked' : ''}>
                    <span class="check"><i class="fa-solid fa-check"></i></span>
                    <div class="ico"><i class="fa-solid ${T.icon}"></i></div>
                    <h3>${T.label}</h3><p>${T.desc}</p>
                </label>`).join('')}
            </div>
        </div></section>

        <section class="step dev-types ${platOn ? 'show' : ''}" id="platStep" style="--i:4"><div>
            <div class="step-title"><span class="n"><i class="fa-solid fa-layer-group" style="font-size:.75rem"></i></span><h2>¿Qué tipo de plataforma tecnológica?</h2><small>Combinables</small></div>
            <div class="plat-grid" id="platGrid">
                ${Object.entries(PLATFORM_KINDS).map(([k, K]) => `<label class="plat" style="--c:${K.color}">
                    <input type="checkbox" value="${k}" ${kinds.includes(k) ? 'checked' : ''}>
                    <span class="plat-glow" aria-hidden="true"></span>
                    <span class="check"><i class="fa-solid fa-check"></i></span>
                    <div class="plat-top"><div class="plat-ico"><i class="fa-solid ${K.icon}"></i></div><div><h3>${K.label}</h3><small>${K.name}</small></div></div>
                    <p>${K.tagline}</p>
                    <ul>${K.features.map(f => `<li><i class="fa-solid fa-circle-check"></i>${f}</li>`).join('')}</ul>
                </label>`).join('')}
            </div>
        </div></section>

        <label class="express ${cfg.express ? 'on' : ''}" id="expressCard" style="--i:5">
            <span class="express-ico"><i class="fa-solid fa-bolt"></i></span>
            <span class="express-txt"><b>Modo exprés</b><small id="expressHint">Solo lo esencial: oculta preguntas de detalle.</small></span>
            <span class="switch"><input type="checkbox" id="expressToggle" ${cfg.express ? 'checked' : ''}><span class="track"></span></span>
        </label>

        <div class="estimate" id="estimate" style="--i:6"></div>

        <section class="step" style="--i:7">
            <div class="step-title"><span class="n"><i class="fa-solid fa-folder-open" style="font-size:.75rem"></i></span><h2>Auditorías guardadas</h2>
                <small><button class="btn btn-ghost btn-sm" id="newAudit"><i class="fa-solid fa-plus"></i> Nueva</button> <button class="btn btn-ghost btn-sm" id="importBtn"><i class="fa-solid fa-upload"></i> Importar</button></small></div>
            <div class="audits-list" id="auditsList"></div>
        </section>
    </div>`;

    const updateEstimate = () => {
        const secs = visibleSections().filter(s => sectionState(s) !== 'hidden');
        const open = secs.filter(s => sectionState(s) === 'open');
        const qs = open.reduce((n, s) => n + s.items.filter(itemVisible).length, 0);
        const hiddenOpt = open.reduce((n, s) => n + s.items.filter(expressHidden).length, 0);
        const mins = Math.max(1, Math.round(qs * 0.3));
        const g = globalProgress();
        const next = firstIncomplete();
        $('#estimate').innerHTML = `
            <div><div class="num">${open.length}</div><div class="lbl">secciones activas</div></div>
            <div><div class="num">${qs}</div><div class="lbl">preguntas visibles</div></div>
            <div><div class="num">~${mins}<small> min</small></div><div class="lbl">tiempo estimado</div></div>
            <div><div class="num">${g.pct}%</div><div class="lbl">completado</div></div>
            <button class="btn btn-primary btn-lg" id="startBtn" ${next ? '' : 'disabled'}>${g.done ? 'Continuar donde me quedé' : 'Comenzar diagnóstico'} <i class="fa-solid fa-arrow-right"></i></button>`;
        $('#expressHint').textContent = expressOn()
            ? (hiddenOpt ? `Activo: ${hiddenOpt} preguntas de detalle ocultas. Desactívalo para un diagnóstico completo.` : 'Activo: solo lo esencial.')
            : 'Desactivado: verás todas las preguntas. Actívalo para ir directo a lo esencial.';
        $('#startBtn').onclick = () => { store.setConfig({ setupDone: true }); next ? go(`#/s/${next.key}`) : go('#/resumen'); };
        Object.keys(PILLARS).forEach(p => { const m = $(`[data-meta="${p}"]`); if (m) { const n = SECTIONS.filter(s => s.pillar === p && sectionState(s) !== 'hidden').length; m.textContent = pillarEnabled(p) ? `${n} secciones` : 'No incluido'; } });
    };

    $('#homeName').addEventListener('input', e => {
        store.set('bg_name', e.target.value.trim());
        $('#heroName').textContent = e.target.value.trim() || 'tu cliente';
        updateChrome();
    });
    $('#svcGrid').addEventListener('change', () => {
        const pillars = $$('#svcGrid input:checked').map(i => i.value);
        if (!pillars.length) { toast('Selecciona al menos un servicio', 'warn'); $(`#svcGrid input[value="${store.audit.config.pillars[0]}"]`).checked = true; return; }
        store.setConfig({ pillars: Object.keys(PILLARS).filter(p => pillars.includes(p)) });
        $('#devStep').classList.toggle('show', pillars.includes('dev'));
        $('#platStep').classList.toggle('show', pillars.includes('dev') && store.audit.config.devTypes.includes('platform'));
        renderNav(); updateChrome(); updateEstimate();
    });
    $('#devGrid').addEventListener('change', e => {
        const types = $$('#devGrid input:checked').map(i => i.value);
        if (!types.length) { toast('Elige al menos un tipo de desarrollo', 'warn'); e.target.checked = true; return; }
        store.setConfig({ devTypes: Object.keys(DEV_TYPES).filter(t => types.includes(t)) });
        const showPlat = types.includes('platform');
        $('#platStep').classList.toggle('show', showPlat);
        if (showPlat && e.target.value === 'platform' && e.target.checked) setTimeout(() => $('#platStep').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }), 250);
        renderNav(); updateChrome(); updateEstimate();
    });
    $('#platGrid').addEventListener('change', () => {
        const k = $$('#platGrid input:checked').map(i => i.value);
        store.setConfig({ platKinds: Object.keys(PLATFORM_KINDS).filter(x => k.includes(x)) });
        renderNav(); updateChrome(); updateEstimate();
    });
    $('#expressToggle').addEventListener('change', e => {
        store.setConfig({ express: e.target.checked });
        $('#expressCard').classList.toggle('on', e.target.checked);
        renderNav(); updateChrome(); updateEstimate();
        toast(e.target.checked ? 'Modo exprés activado' : 'Mostrando todas las preguntas');
    });
    $$('.svc, .plat').forEach(card => card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); card.style.setProperty('--mx', `${e.clientX - r.left}px`); card.style.setProperty('--my', `${e.clientY - r.top}px`); }));
    $('#newAudit').onclick = newAuditFlow;
    $('#importBtn').onclick = () => $('#importInput').click();
    renderAuditsList($('#auditsList'));
    updateEstimate();
}

function firstIncomplete() {
    return visibleSections().find(s => { const r = sectionProgress(s); return r.state === 'open' && r.done < r.total; });
}

function renderAuditsList(el) {
    const cur = store.audit.id;
    el.innerHTML = store.all.map(a => {
        const d = new Date(a.updated).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `<div class="audit-item ${a.id === cur ? 'current' : ''}" data-id="${a.id}">
            <span class="client-avatar">${esc((a.name || 'N')[0].toUpperCase())}</span>
            <div class="info" data-act="open"><strong>${esc(a.name || 'Nueva auditoría')}</strong><small>${a.id === cur ? 'Abierta · ' : ''}Editada ${d}</small></div>
            <button class="icon-btn" data-act="json" title="Descargar respaldo"><i class="fa-solid fa-download"></i></button>
            <button class="icon-btn" data-act="dup" title="Duplicar"><i class="fa-regular fa-copy"></i></button>
            <button class="icon-btn danger" data-act="del" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button>
        </div>`;
    }).join('');
    el.onclick = async e => {
        const btn = e.target.closest('[data-act]'); if (!btn) return;
        const id = btn.closest('.audit-item').dataset.id; const a = store.all.find(x => x.id === id);
        if (btn.dataset.act === 'open' && id !== store.audit.id) { store.switchTo(id); toast(`Abriste "${a.name}"`); }
        if (btn.dataset.act === 'dup') { store.duplicate(id); toast('Auditoría duplicada'); }
        if (btn.dataset.act === 'json') downloadBackup(id);
        if (btn.dataset.act === 'del') {
            if (await confirmDialog(`¿Eliminar "${a.name}"?`, 'Se borrarán sus respuestas y archivos de este navegador. Te recomendamos descargar un respaldo antes.', 'Eliminar', true)) { await store.remove(id); toast('Auditoría eliminada'); }
        }
    };
}

async function newAuditFlow() {
    const name = await promptDialog('Nueva auditoría', 'Nombre de la marca o empresa', '');
    if (name === null) return;
    const a = store.newAudit(name || 'Nueva auditoría');
    if (name) store.set('bg_name', name);
    toast('Auditoría creada');
    go('#/inicio');
}

// =====================================================================
//  SECCIÓN
// =====================================================================
function renderSection(key) {
    const sec = SECTION_MAP[key]; const P = PILLARS[sec.pillar];
    const st = sectionState(sec);
    if (st === 'hidden') { go('#/inicio'); return; }
    const { prev, next } = neighbors(key);
    const footer = `<div class="sec-footer">
        ${prev ? `<a class="btn btn-ghost" href="#/s/${prev.key}"><i class="fa-solid fa-arrow-left"></i><span>${esc(prev.title)}</span></a>` : `<a class="btn btn-ghost" href="#/inicio"><i class="fa-solid fa-arrow-left"></i><span>Configuración</span></a>`}
        ${next ? `<a class="btn btn-primary" href="#/s/${next.key}"><span>${esc(next.title)}</span><i class="fa-solid fa-arrow-right"></i></a>` : `<a class="btn btn-primary" href="#/resumen"><span>Ver resumen</span><i class="fa-solid fa-chart-pie"></i></a>`}
    </div>`;
    const hero = `<header class="sec-hero" style="--i:0"><div class="big-ico"><i class="fa-solid ${sec.icon}"></i></div><div>
        <div class="eyebrow">${P.label}</div><h1>${esc(sec.title)}</h1>${sec.desc ? `<p>${esc(sec.desc)}</p>` : ''}</div></header>`;

    if (st === 'locked') {
        const goto = sec.lockedGoto && SECTION_MAP[sec.lockedGoto];
        view.innerHTML = `<div class="view-inner" style="--c:${P.color}">${hero}
            <div class="locked-view"><div class="lock-ico"><i class="fa-solid fa-lock"></i></div>
            <h2>Esta sección aún no aplica</h2><p>${esc(sec.lockedHint || 'Se habilita según respuestas anteriores.')}</p>
            ${goto ? `<a class="btn btn-primary" href="#/s/${goto.key}"><i class="fa-solid fa-arrow-left"></i> Ir a ${esc(goto.title)}</a>` : ''}</div>${footer}</div>`;
        return;
    }

    const isNA = st === 'na';
    const kind = kindOf(sec);
    let i = 1;
    view.innerHTML = `<div class="view-inner stagger" style="--c:${P.color}">
        ${hero}
        <div class="sec-tools" style="--i:1">
            <div class="sec-bar"><div id="secBar"></div></div><span class="sec-count" id="secCount"></span>
            <label class="switch"><input type="checkbox" id="secNA" ${isNA ? 'checked' : ''}><span class="track"></span>Esta sección no aplica</label>
        </div>
        ${sec.intro === 'devTypes' ? devTypesNote() : ''}
        ${isNA ? `<div class="note" style="--i:2"><i class="fa-solid fa-circle-minus"></i><div>Marcaste esta sección como <b>no aplica</b>. Se mostrará así en el PDF. Desactiva el interruptor para responderla.</div></div>` : `
            ${kind === 'audit' ? bulkBarHTML() : ''}
            ${expressNoteHTML(sec)}
            ${sec.hasResponsible ? responsiblesHTML(sec) : ''}
            <div id="qList">${sec.items.filter(it => !it.devTypes || it.devTypes.some(t => store.audit.config.devTypes.includes(t))).map(item => questionHTML(sec, item, i++)).join('')}</div>
            <div class="custom-zone" style="--i:${i + 3}">
                <h3><i class="fa-solid fa-puzzle-piece"></i> Elementos adicionales</h3>
                <div id="customList">${store.custom(key).map(c => customHTML(sec, c)).join('')}</div>
                <button class="add-card" id="addCustom" type="button"><span class="plus"><i class="fa-solid fa-plus"></i></span>
                    <span><b>Agregar algo que no está en la lista</b><small>${kind === 'audit' ? 'Un punto extra a evaluar con estado, riesgo y prioridad' : 'Una pregunta o requerimiento propio de este cliente'}</small></span></button>
            </div>`}
        ${footer}
    </div>`;
    $$('#view .stagger > *').forEach((el, n) => el.style.setProperty('--i', Math.min(n, 12)));
    $$('#qList > .q-wrap').forEach((el, n) => el.style.setProperty('--i', Math.min(n + 2, 14)));

    $('#secNA').addEventListener('change', e => { store.setSectionNA(key, e.target.checked); route('silent'); refresh(); });
    if (isNA) { refreshSection(); return; }
    bindSection(sec);
    applyVisibility(sec, true);
    refreshSection();
}

function bulkBarHTML() {
    const opts = [['Cumple', 'ok', 'fa-circle-check'], ['Parcial', 'part', 'fa-circle-half-stroke'], ['No cumple', 'bad', 'fa-circle-xmark'], ['Desconocido', 'unk', 'fa-circle-question']];
    return `<div class="bulk" style="--i:2">
        <div class="bulk-txt"><i class="fa-solid fa-bolt"></i><div><b>Respuesta rápida</b><small>Aplica un estado a todos los puntos sin responder y ajusta solo las excepciones.<span class="kbd-hint"> Atajo: enfoca un punto y presiona <kbd>1</kbd>–<kbd>5</kbd>.</span></small></div></div>
        <div class="bulk-btns">${opts.map(([o, tone, ic]) => `<button type="button" class="bulk-btn" data-bulk="${o}" data-tone="${tone}"><i class="fa-solid ${ic}"></i> Todo ${o.toLowerCase()}</button>`).join('')}</div>
    </div>`;
}

function expressNoteHTML(sec) {
    if (!expressOn()) return '';
    const n = sec.items.filter(expressHidden).length;
    if (!n) return '';
    return `<div class="note express-note"><i class="fa-solid fa-bolt"></i><div>Modo exprés: ${n} pregunta${n > 1 ? 's' : ''} de detalle oculta${n > 1 ? 's' : ''}. <button type="button" class="link-btn" id="showAllQs">Mostrar todas</button></div></div>`;
}

function applyBulk(sec, status) {
    const ids = [...sec.items.filter(itemVisible).map(i => i.id), ...store.custom(sec.key).map(c => c.uid)]
        .filter(id => !store.val(`${id}_status`) && !store.flag(id));
    if (!ids.length) { toast('Todos los puntos ya tienen estado', 'warn'); return; }
    const def = SMART_DEFAULTS[status];
    const touched = [];
    ids.forEach(id => {
        store.set(`${id}_status`, status); touched.push(`${id}_status`);
        if (def) [['risk', def[0]], ['priority', def[1]]].forEach(([f, v]) => { if (!store.val(`${id}_${f}`)) { store.set(`${id}_${f}`, v); touched.push(`${id}_${f}`); } });
    });
    route('silent'); refresh();
    toast(`${ids.length} punto${ids.length > 1 ? 's' : ''} marcados como "${status}"`, 'ok', { label: 'Deshacer', fn: () => { touched.forEach(k => store.set(k, '')); route('silent'); refresh(); } });
}

function devTypesNote() {
    const cfg = store.audit.config;
    const t = cfg.devTypes.map(x => x === 'platform' && (cfg.platKinds || []).length ? `${DEV_TYPES[x].label} (${cfg.platKinds.map(k => PLATFORM_KINDS[k].label).join(' + ')})` : DEV_TYPES[x].label).join(' + ') || 'ninguno';
    return `<div class="note"><i class="fa-solid fa-layer-group"></i><div>Tipo de desarrollo: <b>${esc(t)}</b>. Las secciones se adaptan a esta elección. <a href="#/inicio" style="color:var(--accent);font-weight:600">Cambiar</a></div></div>`;
}

function neighbors(key) {
    const list = visibleSections().filter(s => sectionState(s) !== 'locked' || s.key === key);
    const idx = list.findIndex(s => s.key === key);
    return { prev: list[idx - 1], next: list[idx + 1] };
}

// ---------- Plantillas de preguntas ----------
function flagsHTML(id, audit) {
    const f = store.flag(id);
    return `<div class="q-flags">
        ${audit ? '' : `<button type="button" class="flag-btn na" data-flag="na" aria-pressed="${f === 'na'}" title="Esta pregunta no aplica"><i class="fa-solid fa-ban"></i> No aplica</button>`}
        <button type="button" class="flag-btn pending" data-flag="pending" aria-pressed="${f === 'pending'}" title="El cliente no lo tiene aún o está por definir"><i class="fa-regular fa-clock"></i> Pendiente</button>
    </div>`;
}

function pendingNoteHTML(id) {
    const show = store.flag(id) === 'pending';
    return `<div class="flag-note" ${show ? '' : 'hidden'}><input class="field" data-note="${id}" type="text" placeholder="¿Qué falta o quién lo enviará? (opcional)" value="${esc(store.val(id + '__note') || '')}"></div>`;
}

function questionHTML(sec, item, n) {
    const audit = kindOf(sec) === 'audit';
    const f = store.flag(item.id);
    return `<div class="q-wrap" data-qid="${item.id}">
        <article class="q ${f ? 'flag-' + f : ''}">
            <div class="q-head"><span class="q-num">${n}</span>
                <div class="q-title"><label class="lbl" for="f_${item.id}">${esc(item.label)}</label>${item.desc ? `<div class="desc">${esc(item.desc)}</div>` : ''}</div>
                ${flagsHTML(item.id, audit)}
            </div>
            <div class="q-body">${audit ? auditBodyHTML(item.id) : controlHTML(item)}</div>
            ${pendingNoteHTML(item.id)}
        </article></div>`;
}

function controlHTML(item) {
    const id = item.id; const v = store.val(id);
    let html = '';
    switch (item.type) {
        case 'textarea':
            html = `<textarea class="field" id="f_${id}" data-id="${id}" placeholder="${esc(item.placeholder || 'Escribe aquí…')}" rows="3">${esc(v || '')}</textarea>`; break;
        case 'number':
            html = `<input class="field" id="f_${id}" data-id="${id}" type="number" inputmode="numeric" min="0" placeholder="${esc(item.placeholder || '0')}" value="${esc(v || '')}" style="max-width:200px">`; break;
        case 'days':
            html = `<div class="input-affix"><div class="stepper"><button type="button" data-step="-1" aria-label="Menos">−</button><input id="f_${id}" data-id="${id}" type="number" inputmode="numeric" min="0" max="90" placeholder="–" value="${esc(String(v ?? '').replace(/\D/g, ''))}"><button type="button" data-step="1" aria-label="Más">+</button></div><span>días hábiles</span></div>
                <div class="quick">${[1, 2, 3, 5, 10].map(d => `<button type="button" data-quick="${d}">${d} ${d === 1 ? 'día' : 'días'}</button>`).join('')}</div>`; break;
        case 'date':
            html = `<input class="field" id="f_${id}" data-id="${id}" type="date" value="${esc(v || '')}" style="max-width:240px">`; break;
        case 'datetime':
            html = `<input class="field" id="f_${id}" data-id="${id}" type="datetime-local" value="${esc(v || '')}" style="max-width:280px">`; break;
        case 'select': case 'radio':
            html = item.options.length > 8
                ? `<select class="field" id="f_${id}" data-id="${id}"><option value="">Selecciona…</option>${item.options.map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
                : `<div class="chips" role="radiogroup" aria-label="${esc(item.label)}">${item.options.map((o, k) => `<label class="chip radio"><input type="radio" name="r_${id}" ${k === 0 ? `id="f_${id}"` : ''} data-id="${id}" value="${esc(o)}" ${v === o ? 'checked' : ''}><span class="box"></span>${esc(o)}</label>`).join('')}</div>`;
            html += otherHTML(item); break;
        case 'checks': {
            const arr = Array.isArray(v) ? v : [];
            const customs = store.val(`${id}__custom`) || [];
            html = `<div class="chips" data-checks="${id}">${item.options.map((o, k) => `<label class="chip"><input type="checkbox" ${k === 0 ? `id="f_${id}"` : ''} data-id="${id}" value="${esc(o)}" ${arr.includes(o) ? 'checked' : ''}><span class="box"></span>${esc(o)}</label>`).join('')}
                ${customs.map(o => `<label class="chip custom"><input type="checkbox" data-id="${id}" value="${esc(o)}" ${arr.includes(o) ? 'checked' : ''}><span class="box"></span>${esc(o)}<span class="rm" data-rmopt="${esc(o)}" title="Quitar opción"><i class="fa-solid fa-xmark"></i></span></label>`).join('')}
                <button type="button" class="chip-add" data-addopt="${id}"><i class="fa-solid fa-plus"></i> Otra opción</button></div>
                ${item.max ? `<div class="max-hint">Elige máximo ${item.max}</div>` : ''}${otherHTML(item)}`;
            break;
        }
        case 'visual_style':
            html = `<div class="styles-grid">${VISUAL_STYLES.map((s, k) => `<label class="style-opt"><input type="radio" name="r_${id}" ${k === 0 ? `id="f_${id}"` : ''} data-id="${id}" value="${esc(s.val)}" ${v === s.val ? 'checked' : ''}>
                <div class="img"><img src="${s.img}" alt="${esc(s.val)}" loading="lazy"></div><h5>${esc(s.val)}</h5><p>${esc(s.desc)}</p></label>`).join('')}</div>`; break;
        case 'repeater':
            html = repeaterHTML(item); break;
        default: {
            const t = { email: 'email', tel: 'tel', url: 'url' }[item.type] || 'text';
            const im = { email: 'email', tel: 'tel', url: 'url' }[item.type] || 'text';
            const ac = { email: 'email', tel: 'tel', url: 'url' }[item.type] || 'off';
            html = `<input class="field" id="f_${id}" data-id="${id}" type="${t}" inputmode="${im}" autocomplete="${ac}" placeholder="${esc(item.placeholder || (t === 'email' ? 'correo@empresa.com' : t === 'tel' ? '55 1234 5678' : 'Respuesta…'))}" value="${esc(v || '')}">`;
        }
    }
    if (item.upload) html += uploadHTML(id, item.upload);
    return html;
}

function otherHTML(item) {
    const other = item.options.find(isOtherOption); if (!other) return '';
    const v = store.val(item.id); const on = Array.isArray(v) ? v.includes(other) : v === other;
    return `<div class="other-field" data-other="${item.id}" ${on ? '' : 'hidden'}><input class="field" data-id="${item.id}__other" type="text" placeholder="Especifica…" value="${esc(store.val(item.id + '__other') || '')}"></div>`;
}

function uploadHTML(id, cfg) {
    const show = cfg === true || !cfg.showIf || evalRule(cfg.showIf);
    return `<div class="upload" data-upload="${id}" ${show ? '' : 'hidden'}>
        <label class="drop"><input type="file" multiple accept="image/*,.pdf,.ai,.eps,.svg,.psd,.zip,.doc,.docx,.xls,.xlsx"><i class="fa-solid fa-cloud-arrow-up"></i>
        <span>${esc(cfg.hint || 'Adjuntar evidencia')} <small style="color:var(--faint)">· arrastra o haz clic</small></span></label>
        <div class="thumbs" data-thumbs="${id}"></div></div>`;
}

function repeaterHTML(item, key = item.id) {
    let rows = store.val(key);
    const min = item.minRows ?? 1;
    if (!Array.isArray(rows) || !rows.length) rows = Array.from({ length: min }, () => ({}));
    return `<div class="repeater" data-rep="${key}">${rows.map((r, idx) => repRowHTML(item, key, r, idx, rows.length)).join('')}
        <button type="button" class="chip-add" data-repadd="${key}"><i class="fa-solid fa-plus"></i> ${esc(item.addLabel || 'Agregar')}</button></div>`;
}
function repRowHTML(item, key, r, idx, total) {
    return `<div class="rep-row" data-idx="${idx}"><div class="rep-head"><span>${esc(item.rowLabel || 'Elemento')} ${idx + 1}</span>
        ${total > 1 ? `<button type="button" class="icon-btn danger" data-repdel="${idx}" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button>` : ''}</div>
        <div class="rep-grid">${item.fields.map(f => `<div><label>${esc(f.label)}</label><input class="field" data-repk="${f.k}" type="${f.type || 'text'}" placeholder="${esc(f.placeholder || '')}" value="${esc(r[f.k] || '')}"></div>`).join('')}</div></div>`;
}

function responsiblesHTML(sec) {
    const key = `${sec.key}_responsibles`;
    const rows = store.val(key) || [];
    const names = rows.map(r => r.name).filter(Boolean);
    let copy = '';
    if (!names.length) {
        const src = SECTIONS.find(s => s.key !== sec.key && s.hasResponsible && (store.val(`${s.key}_responsibles`) || []).some(r => r.name));
        if (src) { const n = store.val(`${src.key}_responsibles`).map(r => r.name).filter(Boolean); copy = `<button type="button" class="resp-copy" data-copyresp="${src.key}" title="Copiar de ${esc(src.title)}"><i class="fa-regular fa-copy"></i> Usar ${esc(n[0])}${n.length > 1 ? ` +${n.length - 1}` : ''}</button>`; }
    }
    return `<details class="resp-card" style="--i:2">
        <summary><i class="fa-solid fa-user-check" style="color:var(--c)"></i> Responsable(s) de aprobación ${copy}<span class="sum" id="respSum">${names.length ? esc(names.join(', ')) : 'Sin asignar'}</span><i class="fa-solid fa-chevron-right chev"></i></summary>
        ${repeaterHTML(RESPONSIBLES_ITEM, key)}
    </details>`;
}

function auditBodyHTML(id) {
    const st = store.val(`${id}_status`), risk = store.val(`${id}_risk`), pr = store.val(`${id}_priority`);
    const chips = (field, opts, val, tones) => `<div class="chips">${opts.map((o, k) => `<label class="chip radio" data-tone="${tones[o]}"><input type="radio" name="${field}_${id}" ${field === 'status' && k === 0 ? `id="f_${id}"` : ''} data-id="${id}_${field}" value="${esc(o)}" ${val === o ? 'checked' : ''}><span class="box"></span>${esc(o)}</label>`).join('')}</div>`;
    const more = st && st !== 'No aplica';
    return `<div class="audit-grid">
        <div class="audit-row"><span class="k">Estado</span>${chips('status', AUDIT_STATUS, st, STATUS_TONE)}</div>
        <div class="audit-more ${more ? 'show' : ''}" data-more="${id}"><div>
            <div class="audit-row"><span class="k">Riesgo</span>${chips('risk', AUDIT_RISK, risk, RISK_TONE)}</div>
            <div class="audit-row"><span class="k">Prioridad</span>${chips('priority', AUDIT_PRIORITY, pr, PRIO_TONE)}</div>
            <div class="audit-2">
                <div><label class="k" style="font-size:.74rem;color:var(--muted);display:block;margin-bottom:4px">Fecha compromiso</label><input class="field" type="date" data-id="${id}_date" value="${esc(store.val(id + '_date') || '')}"></div>
                <div><label style="font-size:.74rem;color:var(--muted);display:block;margin-bottom:4px">Observaciones / acción</label><textarea class="field" rows="2" data-id="${id}_obs" placeholder="Detalles técnicos, hallazgos, siguiente paso…">${esc(store.val(id + '_obs') || '')}</textarea></div>
            </div>
            ${uploadHTML(id, { hint: 'Adjuntar evidencia (capturas, reportes)' })}
        </div></div>
    </div>`;
}

function customHTML(sec, c) {
    const audit = kindOf(sec) === 'audit';
    const f = store.flag(c.uid);
    return `<div class="q-wrap" data-qid="${c.uid}" data-custom="${c.uid}"><article class="q custom-q ${f ? 'flag-' + f : ''}">
        <div class="q-head"><span class="q-num"><i class="fa-solid fa-plus" style="font-size:.6rem"></i></span>
            <div class="q-title"><input class="custom-label" data-clabel="${c.uid}" value="${esc(c.label)}" placeholder="${audit ? 'Elemento a evaluar' : 'Pregunta o requerimiento'}">
            <input class="custom-desc" data-cdesc="${c.uid}" value="${esc(c.desc || '')}" placeholder="Descripción breve (opcional)"></div>
            ${flagsHTML(c.uid, audit)}
            <button type="button" class="icon-btn danger" data-cdel="${c.uid}" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button>
        </div>
        <div class="q-body">${audit ? auditBodyHTML(c.uid) : `<textarea class="field" data-id="${c.uid}" rows="2" placeholder="Respuesta o detalle…">${esc(store.val(c.uid) || '')}</textarea>${uploadHTML(c.uid, { hint: 'Adjuntar archivo (opcional)' })}`}</div>
        ${pendingNoteHTML(c.uid)}
    </article></div>`;
}

// ---------- Eventos de la sección ----------
function bindSection(sec) {
    const root = view; const sig = { signal: viewAbort.signal };
    const isAudit = kindOf(sec) === 'audit';

    root.addEventListener('input', e => {
        const t = e.target;
        if (t.dataset.id && (t.matches('input[type=text],input[type=email],input[type=tel],input[type=url],input[type=number],input[type=date],input[type=datetime-local],textarea'))) {
            store.set(t.dataset.id, t.value); t.classList.remove('invalid'); afterChange(sec, t.dataset.id);
        }
        if (t.dataset.note) { store.set(t.dataset.note + '__note', t.value); }
        if (t.dataset.clabel) { const c = store.custom(sec.key).find(x => x.uid === t.dataset.clabel); c.label = t.value; store.touch(); }
        if (t.dataset.cdesc) { const c = store.custom(sec.key).find(x => x.uid === t.dataset.cdesc); c.desc = t.value; store.touch(); }
        if (t.dataset.repk) {
            const rep = t.closest('[data-rep]'); const key = rep.dataset.rep; const idx = +t.closest('.rep-row').dataset.idx;
            const rows = readRepeater(rep); store.set(key, rows); afterChange(sec, key);
            if (key.endsWith('_responsibles')) { const s = $('#respSum'); const n = rows.map(r => r.name).filter(Boolean); if (s) s.textContent = n.length ? n.join(', ') : 'Sin asignar'; }
        }
    }, sig);

    root.addEventListener('change', e => {
        const t = e.target;
        if (t.type === 'radio' && t.dataset.id) {
            const id = t.dataset.id; store.set(id, t.value);
            if (isAudit || /_status$/.test(id)) handleAuditStatus(id, t.value);
            afterChange(sec, id);
        } else if (t.type === 'checkbox' && t.dataset.id) {
            const id = t.dataset.id; const group = t.closest('[data-checks]');
            let vals = $$('input:checked', group).map(x => x.value);
            const item = ITEM_MAP[id];
            // "Ninguna/Ninguno" es excluyente
            const none = item?.options.find(o => /^ningun/i.test(o));
            if (none) {
                if (t.value === none && t.checked) { $$('input', group).forEach(x => { if (x !== t) x.checked = false; }); vals = [none]; }
                else if (t.checked && vals.includes(none)) { $(`input[value="${CSS.escape(none)}"]`, group).checked = false; vals = vals.filter(x => x !== none); }
            }
            if (item?.max) { const lim = vals.length >= item.max; $$('label.chip', group).forEach(l => { const inp = $('input', l); l.classList.toggle('disabled', lim && !inp.checked); }); }
            store.set(id, vals); afterChange(sec, id);
        } else if (t.tagName === 'SELECT' && t.dataset.id) { store.set(t.dataset.id, t.value); afterChange(sec, t.dataset.id); }
        else if (t.type === 'file') { handleFiles(t.closest('[data-upload]').dataset.upload, t.files); t.value = ''; }
        else if (t.matches('input[type=email],input[type=url]') && t.value) validateField(t);
    }, sig);

    root.addEventListener('focusout', e => { const t = e.target; if (t.matches?.('input[type=email],input[type=url],input[type=tel]')) validateField(t); }, sig);

    // Permitir desmarcar un radio con un segundo clic
    root.addEventListener('pointerdown', e => { const l = e.target.closest('label.chip.radio, label.style-opt'); if (l) { const i = $('input', l); i._was = i.checked; } }, sig);
    root.addEventListener('click', e => {
        const l = e.target.closest('label.chip.radio, label.style-opt');
        if (l && e.target.tagName === 'INPUT') {
            const i = e.target; if (i._was) { i.checked = false; i._was = false; store.set(i.dataset.id, ''); if (/_status$/.test(i.dataset.id)) handleAuditStatus(i.dataset.id, ''); afterChange(sec, i.dataset.id); }
        }
    }, sig);

    root.addEventListener('click', e => {
        const t = e.target.closest('[data-bulk], [data-copyresp], #showAllQs'); if (!t) return;
        if (t.dataset.bulk) applyBulk(sec, t.dataset.bulk);
        if (t.dataset.copyresp) {
            e.preventDefault();
            const rows = (store.val(`${t.dataset.copyresp}_responsibles`) || []).map(r => ({ ...r }));
            store.set(`${sec.key}_responsibles`, rows); route('silent'); toast('Responsables copiados');
        }
        if (t.id === 'showAllQs') { store.setConfig({ express: false }); route('silent'); refresh(); toast('Mostrando todas las preguntas'); }
    }, sig);

    // Auto-avance: al elegir una opción única, lleva a la siguiente pregunta pendiente
    if (!isAudit) root.addEventListener('change', e => {
        const t = e.target;
        if (!(t.type === 'radio' && t.dataset.id) && t.tagName !== 'SELECT') return;
        if (isOtherOption(t.value || '')) return;
        const wrap = t.closest('#qList > .q-wrap'); if (!wrap) return;
        setTimeout(() => {
            let n = wrap.nextElementSibling;
            while (n && (n.classList.contains('is-hidden') || $('.q', n).classList.contains('answered') || $('.q', n).matches('[class*="flag-"]'))) n = n.nextElementSibling;
            if (!n) return;
            const r = n.getBoundingClientRect();
            if (r.top > innerHeight * .62) n.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        }, 380);
    }, sig);

    // Teclado en auditorías: 1–5 = estado del punto enfocado
    if (isAudit) root.addEventListener('keydown', e => {
        if (e.ctrlKey || e.metaKey || e.altKey || !/^[1-5]$/.test(e.key)) return;
        if (e.target.matches('input[type=text], input[type=date], textarea, select, input[type=number]')) return;
        const card = e.target.closest('[data-qid]'); if (!card) return;
        const inp = $$(`input[data-id$="_status"]`, card)[+e.key - 1]; if (!inp) return;
        e.preventDefault(); inp.click();
        const nxt = card.nextElementSibling;
        if (nxt && !nxt.classList.contains('is-hidden')) { const f = $('input[data-id$="_status"]', nxt); f?.focus({ preventScroll: true }); nxt.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }
    }, sig);

    root.addEventListener('click', async e => {
        const t = e.target.closest('button, [data-rmopt]'); if (!t) return;
        if (t.dataset.flag) {
            const card = t.closest('[data-qid]'); const id = card.dataset.qid; const f = t.dataset.flag;
            const nf = store.flag(id) === f ? null : f; store.setFlag(id, nf);
            $$('.flag-btn', card).forEach(b => b.setAttribute('aria-pressed', b.dataset.flag === nf));
            const q = $('.q', card); q.classList.remove('flag-na', 'flag-pending'); if (nf) q.classList.add('flag-' + nf);
            const note = $('.flag-note', card); note.hidden = nf !== 'pending'; if (nf === 'pending') $('input', note).focus();
            afterChange(sec, id);
        }
        if (t.dataset.step) { const inp = t.parentElement.querySelector('input'); inp.value = Math.max(0, (+inp.value || 0) + +t.dataset.step); inp.dispatchEvent(new Event('input', { bubbles: true })); }
        if (t.dataset.quick) { const q = t.closest('.q-body'); const inp = $('.stepper input', q); inp.value = t.dataset.quick; inp.dispatchEvent(new Event('input', { bubbles: true })); }
        if (t.dataset.addopt) addCustomOption(sec, t);
        if (t.dataset.rmopt !== undefined && t.matches('[data-rmopt]')) {
            e.preventDefault(); const group = t.closest('[data-checks]'); const id = group.dataset.checks; const o = t.dataset.rmopt;
            store.set(`${id}__custom`, (store.val(`${id}__custom`) || []).filter(x => x !== o));
            store.set(id, (store.val(id) || []).filter(x => x !== o));
            t.closest('label').remove(); afterChange(sec, id);
        }
        if (t.dataset.repadd) {
            const rep = t.closest('[data-rep]'); const key = rep.dataset.rep; const item = key.endsWith('_responsibles') ? RESPONSIBLES_ITEM : ITEM_MAP[key];
            const rows = readRepeater(rep); rows.push({}); store.set(key, rows);
            const wrap = document.createElement('div'); wrap.innerHTML = repRowHTML(item, key, {}, rows.length - 1, rows.length);
            t.before(wrap.firstElementChild); renumberRepeater(rep, item);
            $('.rep-row:last-of-type input', rep)?.focus();
        }
        if (t.dataset.repdel !== undefined && t.matches('[data-repdel]')) {
            const rep = t.closest('[data-rep]'); const row = t.closest('.rep-row'); const key = rep.dataset.rep; const item = key.endsWith('_responsibles') ? RESPONSIBLES_ITEM : ITEM_MAP[key];
            row.classList.add('removing');
            setTimeout(() => { row.remove(); store.set(key, readRepeater(rep)); renumberRepeater(rep, item); afterChange(sec, key); }, reduceMotion ? 0 : 280);
        }
        if (t.dataset.cdel) {
            const c = store.custom(sec.key).find(x => x.uid === t.dataset.cdel);
            if (await confirmDialog('¿Eliminar este elemento?', `"${c.label || 'Sin título'}" se quitará de la auditoría.`, 'Eliminar', true)) {
                const arr = store.custom(sec.key); arr.splice(arr.indexOf(c), 1);
                Object.keys(store.values).filter(k => k.startsWith(c.uid)).forEach(k => store.set(k, ''));
                const w = t.closest('.q-wrap'); w.classList.add('is-hidden'); setTimeout(() => w.remove(), 450); store.touch(); refresh();
            }
        }
        if (t.dataset.rmfile) { const up = t.closest('[data-upload]').dataset.upload; await store.removeFile(up, t.dataset.rmfile); renderThumbs(up); }
        if (t.id === 'addCustom') {
            const c = { uid: 'c_' + Math.random().toString(36).slice(2, 9), label: '', desc: '' };
            store.custom(sec.key).push(c); store.touch();
            const w = document.createElement('div'); w.innerHTML = customHTML(sec, c);
            const el = w.firstElementChild; el.classList.add('is-hidden'); $('#customList').append(el);
            requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-hidden')));
            setTimeout(() => $('.custom-label', el).focus(), 60);
            refresh();
        }
    }, sig);

    // Arrastrar archivos
    root.addEventListener('dragover', e => { const d = e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.add('over'); } }, sig);
    root.addEventListener('dragleave', e => { const d = e.target.closest('.drop'); if (d) d.classList.remove('over'); }, sig);
    root.addEventListener('drop', e => { const d = e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.remove('over'); handleFiles(d.closest('[data-upload]').dataset.upload, e.dataTransfer.files); } }, sig);

    $$('[data-thumbs]').forEach(el => renderThumbs(el.dataset.thumbs));
    // aplicar límite visual inicial
    $$('[data-checks]').forEach(g => { const item = ITEM_MAP[g.dataset.checks]; if (item?.max) { const n = $$('input:checked', g).length; $$('label.chip', g).forEach(l => l.classList.toggle('disabled', n >= item.max && !$('input', l).checked)); } });
}

function readRepeater(rep) {
    return $$('.rep-row', rep).map(row => Object.fromEntries($$('[data-repk]', row).map(i => [i.dataset.repk, i.value])));
}
function renumberRepeater(rep, item) {
    const rows = $$('.rep-row', rep);
    rows.forEach((r, i) => {
        r.dataset.idx = i; $('.rep-head span', r).textContent = `${item.rowLabel || 'Elemento'} ${i + 1}`;
        let del = $('[data-repdel]', r);
        if (rows.length > 1 && !del) $('.rep-head', r).insertAdjacentHTML('beforeend', `<button type="button" class="icon-btn danger" data-repdel="${i}" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button>`);
        if (rows.length <= 1 && del) del.remove();
    });
}

function addCustomOption(sec, btn) {
    const id = btn.dataset.addopt;
    const box = document.createElement('span'); box.className = 'chip-add-input';
    box.innerHTML = `<input class="field" type="text" placeholder="Nueva opción"><button type="button" class="icon-btn" title="Agregar"><i class="fa-solid fa-check"></i></button>`;
    btn.replaceWith(box); const inp = $('input', box); inp.focus();
    const commit = () => {
        const val = inp.value.trim();
        const restore = () => { box.replaceWith(btn); };
        if (!val) return restore();
        const all = [...(ITEM_MAP[id]?.options || []), ...(store.val(`${id}__custom`) || [])];
        if (all.some(o => norm(o) === norm(val))) { toast('Esa opción ya existe', 'warn'); return restore(); }
        store.set(`${id}__custom`, [...(store.val(`${id}__custom`) || []), val]);
        store.set(id, [...(store.val(id) || []), val]);
        const lbl = document.createElement('label'); lbl.className = 'chip custom';
        lbl.innerHTML = `<input type="checkbox" data-id="${id}" value="${esc(val)}" checked><span class="box"></span>${esc(val)}<span class="rm" data-rmopt="${esc(val)}" title="Quitar opción"><i class="fa-solid fa-xmark"></i></span>`;
        box.before(lbl); restore(); afterChange(sec, id);
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { inp.value = ''; commit(); } });
    $('button', box).addEventListener('click', commit);
    inp.addEventListener('blur', () => setTimeout(() => { if (box.isConnected) commit(); }, 150));
}

function handleAuditStatus(fieldId, status) {
    const id = fieldId.replace(/_status$/, '');
    if (fieldId === id) return;
    const more = $(`[data-more="${CSS.escape(id)}"]`);
    if (more) more.classList.toggle('show', !!status && status !== 'No aplica');
    const def = SMART_DEFAULTS[status];
    if (def) {
        [['risk', def[0]], ['priority', def[1]]].forEach(([f, val]) => {
            if (!store.val(`${id}_${f}`)) {
                store.set(`${id}_${f}`, val);
                const inp = $(`input[data-id="${CSS.escape(id + '_' + f)}"][value="${CSS.escape(val)}"]`); if (inp) inp.checked = true;
            }
        });
    }
}

function validateField(t) {
    const v = t.value.trim(); let ok = true;
    if (!v) ok = true;
    else if (t.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    else if (t.type === 'url') ok = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v);
    else if (t.type === 'tel') ok = v.replace(/\D/g, '').length >= 8;
    t.classList.toggle('invalid', !ok);
    let hint = t.parentElement.querySelector('.field-hint');
    if (!ok && !hint) { hint = document.createElement('div'); hint.className = 'field-hint'; t.after(hint); }
    if (hint) hint.textContent = ok ? '' : ({ email: 'Revisa el correo (ej. nombre@empresa.com)', url: 'Revisa el enlace (ej. https://sitio.com)', tel: 'El teléfono parece incompleto' }[t.type]);
    if (ok && t.type === 'url' && v && !/^https?:\/\//i.test(v)) { t.value = 'https://' + v; store.set(t.dataset.id, t.value); }
}

// ---------- Archivos ----------
async function handleFiles(itemId, list) {
    const files = [...list]; if (!files.length) return;
    for (const f of files) {
        if (f.size > 25e6) { toast(`"${f.name}" es muy pesado (máx. 25 MB)`, 'warn'); continue; }
        try { await store.addFile(itemId, f); } catch (e) { toast(`No se pudo guardar "${f.name}"`, 'error'); }
    }
    renderThumbs(itemId);
    toast(files.length > 1 ? `${files.length} archivos agregados` : 'Archivo agregado');
}
async function renderThumbs(itemId) {
    const el = $(`[data-thumbs="${CSS.escape(itemId)}"]`); if (!el) return;
    const list = store.files(itemId);
    const parts = await Promise.all(list.map(async f => {
        const data = f.isImage ? await store.fileData(f.fid) : null;
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        const icon = ext === 'pdf' ? 'fa-file-pdf' : ['ai', 'eps', 'psd', 'svg'].includes(ext) ? 'fa-file-image' : ['zip', 'rar'].includes(ext) ? 'fa-file-zipper' : 'fa-file-lines';
        return `<div class="thumb">${data ? `<img src="${data}" alt="${esc(f.name)}">` : `<div class="file-ico"><i class="fa-solid ${icon}"></i></div>`}<span title="${esc(f.name)}">${esc(f.name)}</span><button type="button" data-rmfile="${f.fid}" aria-label="Quitar archivo"><i class="fa-solid fa-xmark"></i></button></div>`;
    }));
    el.innerHTML = parts.join('');
}

// ---------- Visibilidad y progreso ----------
function afterChange(sec, id) {
    applyVisibility(sec);
    const card = $(`[data-qid="${CSS.escape(id.replace(/(__other|_status|_risk|_priority|_date|_obs)$/, ''))}"]`);
    if (card) markAnswered(sec, card);
    refresh();
}

function markAnswered(sec, card) {
    const id = card.dataset.qid;
    const item = ITEM_MAP[id] || { id };
    $('.q', card).classList.toggle('answered', itemAnswered(sec, item) && !store.flag(id));
}

function applyVisibility(sec, initial = false) {
    let n = 1;
    $$('#qList > .q-wrap').forEach(w => {
        const item = ITEM_MAP[w.dataset.qid];
        const vis = itemVisible(item);
        const was = !w.classList.contains('is-hidden');
        w.classList.toggle('is-hidden', !vis);
        w.setAttribute('aria-hidden', !vis);
        $$('input,select,textarea,button', w).forEach(x => { x.tabIndex = vis ? 0 : -1; });
        if (vis) { $('.q-num', w).textContent = n++; if (!was && !initial) { w.classList.remove('revealed'); void w.offsetWidth; w.classList.add('revealed'); } }
        markAnswered(sec, w);
        // campo "Otro"
        const other = $(`[data-other="${CSS.escape(item.id)}"]`, w);
        if (other) {
            const o = item.options.find(isOtherOption); const v = store.val(item.id);
            const on = Array.isArray(v) ? v.includes(o) : v === o;
            if (other.hidden === on) { other.hidden = !on; if (on && !initial) $('input', other).focus(); }
        }
        // carga de archivos condicional
        const up = $(`[data-upload="${CSS.escape(item.id)}"]`, w);
        if (up && item.upload?.showIf) up.hidden = !evalRule(item.upload.showIf);
    });
    $$('#customList > .q-wrap').forEach(w => markAnswered(sec, w));
}

function refreshSection() {
    if (current.route !== 's') return;
    const sec = SECTION_MAP[current.key]; const r = sectionProgress(sec);
    const bar = $('#secBar'), cnt = $('#secCount');
    if (bar) bar.style.width = r.pct + '%';
    if (cnt) cnt.textContent = r.state === 'na' ? 'No aplica' : `${r.done} de ${r.total}`;
    if (r.state === 'open' && r.total && r.done === r.total && !completedOnce.has(sec.key)) {
        completedOnce.add(sec.key);
        if (cnt && !reduceMotion) burst(cnt);
        const { next } = neighbors(sec.key);
        toast(`¡${sec.title} completa!`, 'ok', next ? { label: 'Siguiente', fn: () => go(`#/s/${next.key}`) } : { label: 'Ver resumen', fn: () => go('#/resumen') });
    }
    if (r.done < r.total) completedOnce.delete(sec.key);
}

let refreshQueued = false;
function refresh() {
    if (refreshQueued) return; refreshQueued = true;
    requestAnimationFrame(() => {
        refreshQueued = false;
        // si cambió la lista de secciones (por reglas), reconstruir menú
        const sig = visibleSections().map(s => s.key + sectionState(s)).join();
        if (sig !== refresh._sig) { const had = refresh._sig; refresh._sig = sig; if (had !== undefined) { renderNav(); announceUnlocks(had, sig); } }
        updateNavProgress(); updateChrome(); refreshSection();
    });
}
function announceUnlocks(before, after) {
    const b = new Set(before.split(',')); const newly = after.split(',').filter(x => x.endsWith('open') && !b.has(x));
    newly.forEach(x => { const key = x.replace(/open$/, ''); const s = SECTION_MAP[key]; if (s && b.has(key + 'locked')) toast(`Se habilitó "${s.title}"`, 'ok', { label: 'Ir', fn: () => go(`#/s/${key}`) }); });
}

// =====================================================================
//  RESUMEN
// =====================================================================
function renderSummary() {
    const s = collectStats();
    const totalAudit = Object.values(s.statusCount).reduce((a, b) => a + b, 0);
    const toneColor = { ok: 'var(--ok)', part: 'var(--warn)', bad: 'var(--bad)', unk: 'var(--info)', na: '#8a86ad', crit: 'var(--crit)' };
    const critical = s.findings.filter(f => ['Alto', 'Crítico'].includes(f.risk)).length;
    const name = store.audit.name;
    const unansweredBySec = {};
    s.unanswered.forEach(u => (unansweredBySec[u.sec.key] ||= { sec: u.sec, items: [] }).items.push(u.item));

    view.innerHTML = `<div class="view-inner stagger">
        <header class="sec-hero" style="--c:var(--accent)"><div class="big-ico"><i class="fa-solid fa-chart-pie"></i></div><div>
            <div class="eyebrow">Resumen</div><h1>${esc(name)}</h1><p>Revisa el avance, los hallazgos y lo que falta antes de exportar el reporte.</p></div></header>

        <div class="kpis">
            <div class="kpi ${s.global.pct === 100 ? 'ok' : ''}"><div class="v" data-count="${s.global.pct}" data-suffix="%">0%</div><div class="l">Completado</div></div>
            <div class="kpi"><div class="v" data-count="${s.global.done}">0</div><div class="l">de ${s.global.total} respuestas</div></div>
            <div class="kpi ${critical ? 'bad' : ''}"><div class="v" data-count="${critical}">0</div><div class="l">Riesgos altos / críticos</div></div>
            <div class="kpi ${s.pending.length ? 'warn' : ''}"><div class="v" data-count="${s.pending.length}">0</div><div class="l">Pendientes del cliente</div></div>
        </div>

        <section class="panel"><h2><i class="fa-solid fa-file-pdf" style="color:var(--accent)"></i> Exportar reporte</h2>
            ${exportOptionsHTML()}
            <div class="export-actions">
                <button class="btn btn-primary" data-pdf="save"><i class="fa-solid fa-download"></i> Descargar PDF</button>
                <button class="btn btn-ghost" data-pdf="preview"><i class="fa-regular fa-eye"></i> Vista previa</button>
                <button class="btn btn-ghost" id="sumBackup"><i class="fa-solid fa-floppy-disk"></i> Respaldo (.json)</button>
            </div>
        </section>

        <section class="panel"><h2><i class="fa-solid fa-bars-progress"></i> Avance por servicio</h2>
            ${s.pillars.map(p => `<div class="pbar" style="--c:${p.color}"><span><i class="fa-solid ${p.icon}" style="color:${p.color};width:18px"></i> ${p.label}</span><div class="track"><div data-w="${p.pct}"></div></div><span class="p">${p.pct}%</span></div>`).join('')}
        </section>

        ${totalAudit ? `<section class="panel"><h2><i class="fa-solid fa-clipboard-check"></i> Estado de puntos auditados <span class="count">${totalAudit} evaluados</span></h2>
            <div class="stack">${AUDIT_STATUS.map(st => `<div style="flex-grow:0;background:${toneColor[STATUS_TONE[st]]}" data-g="${s.statusCount[st]}" title="${st}: ${s.statusCount[st]}"></div>`).join('')}</div>
            <div class="legend">${AUDIT_STATUS.map(st => `<span style="--c:${toneColor[STATUS_TONE[st]]}">${st} · ${s.statusCount[st]}</span>`).join('')}</div>
        </section>` : ''}

        <section class="panel"><h2><i class="fa-solid fa-triangle-exclamation" style="color:var(--bad)"></i> Hallazgos prioritarios <span class="count">${s.findings.length}</span></h2>
            ${s.findings.length ? `<div class="list">${s.findings.slice(0, 12).map(f => `<div class="list-row"><div class="what">${esc(f.item.label || 'Elemento')}<small>${esc(f.sec.title)}${f.obs ? ' · ' + esc(f.obs.slice(0, 90)) : ''}</small></div>
                ${f.risk ? `<span class="pill" style="--c:${toneColor[RISK_TONE[f.risk]]}">${f.risk}</span>` : ''}<span class="pill" style="--c:${toneColor[STATUS_TONE[f.status]] || 'var(--faint)'}">${f.status || '—'}</span>
                <a class="icon-btn" href="#/s/${f.sec.key}/${f.item.id}" title="Ir"><i class="fa-solid fa-arrow-right"></i></a></div>`).join('')}</div>`
            : `<div class="empty"><i class="fa-regular fa-circle-check"></i> Sin hallazgos de riesgo por ahora.</div>`}
        </section>

        <section class="panel"><h2><i class="fa-regular fa-clock" style="color:var(--warn)"></i> Pendientes del cliente <span class="count">${s.pending.length}</span></h2>
            ${s.pending.length ? `<div class="list">${s.pending.map(p => `<div class="list-row"><div class="what">${esc(p.item.label || 'Elemento')}<small>${esc(p.sec.title)}${p.note ? ' · ' + esc(p.note) : ''}</small></div><a class="icon-btn" href="#/s/${p.sec.key}/${p.item.id}" title="Ir"><i class="fa-solid fa-arrow-right"></i></a></div>`).join('')}</div>`
            : `<div class="empty"><i class="fa-regular fa-circle-check"></i> Nada marcado como pendiente.</div>`}
        </section>

        <section class="panel"><h2><i class="fa-regular fa-circle-question"></i> Sin responder <span class="count">${s.unanswered.length}</span></h2>
            ${s.unanswered.length ? `<div class="list">${Object.values(unansweredBySec).map(g => `<div class="list-row"><div class="what">${esc(g.sec.title)}<small>${g.items.slice(0, 3).map(i => esc(i.label)).join(' · ')}${g.items.length > 3 ? ` y ${g.items.length - 3} más` : ''}</small></div><span class="pill" style="--c:var(--muted)">${g.items.length}</span><a class="icon-btn" href="#/s/${g.sec.key}/${g.items[0].id}" title="Ir"><i class="fa-solid fa-arrow-right"></i></a></div>`).join('')}</div>`
            : `<div class="empty"><i class="fa-solid fa-trophy" style="color:var(--warn)"></i> ¡Todo respondido!</div>`}
        </section>
    </div>`;
    $$('#view .stagger > *').forEach((el, n) => el.style.setProperty('--i', n));
    requestAnimationFrame(() => setTimeout(() => {
        $$('[data-w]').forEach(el => el.style.width = el.dataset.w + '%');
        $$('[data-g]').forEach(el => el.style.flexGrow = el.dataset.g);
        $$('[data-count]').forEach(el => tweenNumber(el, 0, +el.dataset.count, v => v + (el.dataset.suffix || '')));
    }, 120));
    bindExport(view);
    $('#sumBackup').onclick = () => downloadBackup();
}

function exportOptionsHTML() {
    const o = getExportOpts();
    return `<div class="export-opts">
        <label class="switch"><input type="checkbox" data-opt="summary" ${o.summary ? 'checked' : ''}><span class="track"></span>Incluir resumen ejecutivo y hallazgos</label>
        <label class="switch"><input type="checkbox" data-opt="empty" ${o.empty ? 'checked' : ''}><span class="track"></span>Incluir preguntas sin responder</label>
        <label class="switch"><input type="checkbox" data-opt="images" ${o.images ? 'checked' : ''}><span class="track"></span>Incluir imágenes adjuntas</label>
    </div>`;
}
function getExportOpts() { try { return { summary: true, empty: false, images: true, ...JSON.parse(localStorage.getItem('partum_pdf_opts') || '{}') }; } catch (e) { return { summary: true, empty: false, images: true }; } }
function bindExport(root) {
    root.addEventListener('change', e => { if (e.target.dataset.opt) { const o = getExportOpts(); o[e.target.dataset.opt] = e.target.checked; try { localStorage.setItem('partum_pdf_opts', JSON.stringify(o)); } catch (x) { } } }, root === view ? { signal: viewAbort.signal } : undefined);
    $$('[data-pdf]', root).forEach(b => b.onclick = () => exportPDF(b.dataset.pdf));
}

async function exportPDF(mode = 'save') {
    if (!window.jspdf) { toast('El generador de PDF aún está cargando, intenta de nuevo', 'warn'); return; }
    const busy = document.createElement('div'); busy.className = 'busy';
    busy.innerHTML = `<div class="busy-box"><div class="spin"></div><div>Generando PDF…</div></div>`;
    document.body.append(busy);
    try {
        const { buildPDF } = await import('./pdf.js');
        const doc = await buildPDF(getExportOpts());
        const fname = `Diagnostico_${(store.audit.name || 'Cliente').replace(/[^\wÀ-ſ]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        if (mode === 'preview') { const url = doc.output('bloburl'); const w = window.open(url, '_blank'); if (!w) doc.save(fname); }
        else { doc.save(fname); toast('PDF descargado'); }
    } catch (e) {
        console.error(e); toast('No se pudo generar el PDF: ' + e.message, 'error');
    } finally { busy.remove(); }
}

// =====================================================================
//  BÚSQUEDA (Ctrl+K)
// =====================================================================
function buildIndex() {
    const idx = [];
    visibleSections().forEach(sec => {
        const P = PILLARS[sec.pillar]; const st = sectionState(sec);
        idx.push({ type: 'Secciones', label: sec.title, sub: P.label + (st === 'locked' ? ' · bloqueada' : ''), icon: sec.icon, color: P.color, href: `#/s/${sec.key}` });
        if (st !== 'open') return;
        sec.items.filter(itemVisible).forEach(item => {
            idx.push({ type: 'Preguntas', label: item.label, sub: sec.title, icon: P.icon, color: P.color, href: `#/s/${sec.key}/${item.id}`, extra: item.desc });
            const v = store.val(item.id) ?? store.val(item.id + '_obs');
            const txt = Array.isArray(v) ? v.map(x => typeof x === 'object' ? Object.values(x).join(' ') : x).join(', ') : v;
            if (txt && String(txt).trim()) idx.push({ type: 'Respuestas', label: String(txt).slice(0, 120), sub: item.label, icon: 'fa-quote-left', color: P.color, href: `#/s/${sec.key}/${item.id}` });
        });
    });
    idx.push({ type: 'Acciones', label: 'Resumen y exportar PDF', sub: 'Ver avance y descargar', icon: 'fa-file-pdf', color: '#4cc9f0', href: '#/resumen' });
    idx.push({ type: 'Acciones', label: 'Configuración del diagnóstico', sub: 'Servicios y tipo de desarrollo', icon: 'fa-sliders', color: '#4cc9f0', href: '#/inicio' });
    return idx;
}

let palIdx = [], palSel = 0, palRes = [];
function openPalette() {
    palIdx = buildIndex();
    const p = $('#palette'); p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
    const inp = $('#paletteInput'); inp.value = ''; renderPalette(''); setTimeout(() => inp.focus(), 30);
}
function closePalette() { const p = $('#palette'); p.classList.remove('open'); p.setAttribute('aria-hidden', 'true'); }
function renderPalette(q) {
    const nq = norm(q).trim();
    palRes = nq ? palIdx.map(r => { const l = norm(r.label), s = norm(r.sub + ' ' + (r.extra || '')); const words = nq.split(/\s+/); const ok = words.every(w => l.includes(w) || s.includes(w)); return ok ? { ...r, score: (l.startsWith(nq) ? 0 : l.includes(nq) ? 1 : 2) + (r.type === 'Respuestas' ? 1 : 0) } : null; }).filter(Boolean).sort((a, b) => a.score - b.score).slice(0, 40)
        : palIdx.filter(r => r.type !== 'Respuestas').slice(0, 30);
    palSel = 0;
    const hl = t => { if (!nq) return esc(t); const n = norm(t); const i = n.indexOf(nq.split(/\s+/)[0]); if (i < 0) return esc(t); const w = nq.split(/\s+/)[0].length; return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + w)) + '</mark>' + esc(t.slice(i + w)); };
    let lastType = '';
    $('#paletteResults').innerHTML = palRes.length ? palRes.map((r, i) => {
        const g = r.type !== lastType ? `<div class="p-group">${r.type}</div>` : ''; lastType = r.type;
        return `${g}<button type="button" class="p-item ${i === 0 ? 'sel' : ''}" data-i="${i}" style="--c:${r.color}"><span class="ico"><i class="fa-solid ${r.icon}"></i></span><span class="t"><div>${hl(r.label)}</div><small>${esc(r.sub)}</small></span></button>`;
    }).join('') : `<div class="empty" style="padding:20px;justify-content:center">Sin resultados para "${esc(q)}"</div>`;
}
function palGo(i) { const r = palRes[i]; if (!r) return; closePalette(); go(r.href); }

// =====================================================================
//  GLOBAL: atajos, modales, hoja móvil
// =====================================================================
function bindGlobal() {
    $('#searchTrigger').onclick = openPalette;
    $('#paletteInput').addEventListener('input', e => renderPalette(e.target.value));
    $('#paletteInput').addEventListener('keydown', e => {
        const items = $$('.p-item');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((x, i) => x.classList.toggle('sel', i === palSel)); items[palSel]?.scrollIntoView({ block: 'nearest' }); }
        if (e.key === 'Enter') { e.preventDefault(); palGo(palSel); }
    });
    $('#paletteResults').addEventListener('click', e => { const b = e.target.closest('.p-item'); if (b) palGo(+b.dataset.i); });
    $('#palette').addEventListener('click', e => { if (e.target.dataset.close !== undefined) closePalette(); });

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#palette').classList.contains('open') ? closePalette() : openPalette(); }
        if (e.key === 'Escape') { closePalette(); closeSheet(); closeModal(null); }
        if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && current.route === 's') { const n = neighbors(current.key); const t = e.key === 'ArrowRight' ? n.next : n.prev; if (t) go(`#/s/${t.key}`); }
    });

    $('#exportBtn').onclick = openExportModal;
    $('#backupBtn').onclick = () => downloadBackup();
    $('#clientSwitch').onclick = openAuditsModal;
    $('#importInput').addEventListener('change', async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        try { const json = JSON.parse(await f.text()); const a = await store.importJSON(json); await finishMigration(); toast(`Importaste "${a.name}"`); go('#/inicio'); }
        catch (err) { toast('El archivo no es un respaldo válido', 'error'); }
    });

    // móvil
    $$('.bottom-nav [data-m]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.m === 'sections') openSheet();
        if (b.dataset.m === 'search') openPalette();
    }));
    $('#sheet').addEventListener('click', e => {
        if (e.target.dataset.close !== undefined) closeSheet();
        const s = e.target.closest('.sec-link'); if (s) { closeSheet(); go(`#/s/${s.dataset.sec}`); }
        const h = e.target.closest('.pillar-head'); if (h) h.parentElement.classList.toggle('open');
        const a = e.target.closest('a.nav-link'); if (a) closeSheet();
    });
    // deslizar para cerrar la hoja
    let y0 = null; const panel = $('.sheet-panel');
    panel.addEventListener('touchstart', e => { if ($('#sheetBody').scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) panel.style.transform = `translateY(${dy}px)`; }, { passive: true });
    panel.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; panel.style.transform = ''; y0 = null; if (dy > 90) closeSheet(); });

    $('#modal').addEventListener('click', e => { if (e.target.dataset.close !== undefined) closeModal(null); });
}

function openSheet() {
    $('#sheetBody').innerHTML = `<div class="nav">${navHTML()}</div>`;
    $$('#sheetBody .sec-link').forEach(l => { const ind = $('.sec-ind', l); ind.innerHTML = indicatorHTML(SECTION_MAP[l.dataset.sec]); l.classList.toggle('active', l.dataset.sec === current.key); l.classList.toggle('locked', sectionState(SECTION_MAP[l.dataset.sec]) === 'locked'); });
    $$('#sheetBody [data-ppct]').forEach(el => { const r = pillarProgress(el.dataset.ppct); el.textContent = r.total ? r.pct + '%' : ''; });
    const s = $('#sheet'); s.classList.add('open'); s.setAttribute('aria-hidden', 'false');
}
function closeSheet() { const s = $('#sheet'); s.classList.remove('open'); s.setAttribute('aria-hidden', 'true'); }

// ---------- Modales ----------
let modalResolve = null;
function openModal(html, onOpen) {
    $('#modalBox').innerHTML = html;
    const m = $('#modal'); m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    onOpen && onOpen($('#modalBox'));
    setTimeout(() => ($('#modalBox [autofocus]') || $('#modalBox .btn-primary, #modalBox .btn-danger'))?.focus(), 50);
    return new Promise(r => modalResolve = r);
}
function closeModal(val) {
    const m = $('#modal'); if (!m.classList.contains('open')) return;
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
    if (modalResolve) { modalResolve(val); modalResolve = null; }
}
function confirmDialog(title, text, okLabel = 'Aceptar', danger = false) {
    return openModal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="modal-actions"><button class="btn btn-ghost" data-r="0">Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-r="1">${esc(okLabel)}</button></div>`,
        box => $$('[data-r]', box).forEach(b => b.onclick = () => closeModal(b.dataset.r === '1')));
}
function promptDialog(title, placeholder, value) {
    return openModal(`<h2>${esc(title)}</h2><p></p><input class="field" id="pr" placeholder="${esc(placeholder)}" value="${esc(value)}" autofocus><div class="modal-actions"><button class="btn btn-ghost" data-r="0">Cancelar</button><button class="btn btn-primary" data-r="1">Crear</button></div>`,
        box => { $$('[data-r]', box).forEach(b => b.onclick = () => closeModal(b.dataset.r === '1' ? $('#pr').value.trim() : null)); $('#pr').addEventListener('keydown', e => { if (e.key === 'Enter') closeModal($('#pr').value.trim()); }); });
}
function openExportModal() {
    const g = globalProgress();
    openModal(`<h2><i class="fa-solid fa-file-pdf" style="color:var(--accent)"></i> Exportar reporte</h2>
        <p>${esc(store.audit.name)} · ${g.pct}% completado${g.pct < 100 ? '. Puedes exportar aunque falten respuestas.' : ''}</p>
        ${exportOptionsHTML()}
        <div class="modal-actions"><button class="btn btn-ghost" data-pdf="preview"><i class="fa-regular fa-eye"></i> Vista previa</button><button class="btn btn-primary" data-pdf="save"><i class="fa-solid fa-download"></i> Descargar PDF</button></div>`,
        box => { bindExport(box); $$('[data-pdf]', box).forEach(b => b.addEventListener('click', () => closeModal(null), { capture: true })); });
}
function openAuditsModal() {
    openModal(`<h2>Auditorías</h2><p>Cada cliente se guarda por separado en este navegador.</p><div class="audits-list" id="mAudits"></div>
        <div class="modal-actions"><button class="btn btn-ghost" id="mImport"><i class="fa-solid fa-upload"></i> Importar</button><button class="btn btn-primary" id="mNew"><i class="fa-solid fa-plus"></i> Nueva auditoría</button></div>`,
        box => {
            renderAuditsList($('#mAudits', box));
            $('#mAudits', box).addEventListener('click', e => { if (e.target.closest('[data-act="open"]')) closeModal(null); });
            $('#mNew', box).onclick = () => { closeModal(null); setTimeout(newAuditFlow, 250); };
            $('#mImport', box).onclick = () => { closeModal(null); $('#importInput').click(); };
        });
}

async function downloadBackup(id) {
    const json = await store.exportJSON(id);
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Respaldo_${(json.audit.name || 'auditoria').replace(/[^\wÀ-ſ]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Respaldo descargado');
}

// ---------- Toasts y efectos ----------
function toast(msg, type = 'ok', action) {
    const icons = { ok: 'fa-circle-check', warn: 'fa-triangle-exclamation', error: 'fa-circle-xmark' };
    const t = document.createElement('div'); t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa-solid ${icons[type] || icons.ok}"></i><span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
    if (action) $('button', t).onclick = () => { action.fn(); kill(); };
    $('#toasts').append(t);
    const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 300); };
    setTimeout(kill, action ? 5200 : 2800);
    const all = $$('#toasts .toast'); if (all.length > 3) all[0].remove();
}

function burst(el) {
    const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ['#8b3dff', '#4cc9f0', '#ff5d8f', '#3ddc97', '#ffb547'];
    for (let i = 0; i < 26; i++) {
        const p = document.createElement('i'); p.className = 'burst';
        const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
        p.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % 5]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;--r:${Math.random() * 540}deg`;
        document.body.append(p); setTimeout(() => p.remove(), 950);
    }
}
