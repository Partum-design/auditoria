// ===== LÓGICA: reglas condicionales, progreso y estadísticas =====
import { SECTIONS, PILLARS, AUDIT_STATUS } from './data.js';
import { store } from './store.js';

export function evalRule(rule) {
    if (!rule) return true;
    if (rule.any) return rule.any.some(evalRule);
    if (rule.all) return rule.all.every(evalRule);
    const v = store.val(rule.id);
    const arr = Array.isArray(v) ? v : (v ? [v] : []);
    if ('eq' in rule) return v === rule.eq;
    if ('ne' in rule) return v !== rule.ne;
    if ('in' in rule) return rule.in.includes(v);
    if ('has' in rule) return arr.includes(rule.has);
    if ('notHas' in rule) return !arr.includes(rule.notHas);
    if ('filled' in rule) return arr.length > 0 === rule.filled;
    return true;
}

const typesOf = () => store.audit.config.devTypes || [];
const matchesTypes = t => !t || t.some(x => typesOf().includes(x));
const kindsOf = () => store.audit.config.platKinds || [];
const matchesKinds = k => !k || k.some(x => kindsOf().includes(x));
export const expressOn = () => !!store.audit.config.express;

/** En modo exprés las preguntas de detalle se ocultan, salvo que ya tengan respuesta. */
export function expressHidden(item) {
    return !!item.opt && expressOn() && !filledValue(store.val(item.id)) && !store.flag(item.id);
}

export function pillarEnabled(p) { return store.audit.config.pillars.includes(p); }

/** Estado de una sección: hidden (no corresponde) | locked (falta una respuesta) | na | open */
export function sectionState(sec) {
    if (!pillarEnabled(sec.pillar)) return 'hidden';
    if (sec.pillar === 'dev' && !matchesTypes(sec.devTypes)) return 'hidden';
    if (sec.platKinds && !matchesKinds(sec.platKinds)) return 'hidden';
    if (!evalRule(sec.showIf)) return 'locked';
    if (store.sectionNA(sec.key)) return 'na';
    return 'open';
}

export function visibleSections(pillar) {
    return SECTIONS.filter(s => (!pillar || s.pillar === pillar) && sectionState(s) !== 'hidden');
}
export function activeSections() { return SECTIONS.filter(s => ['open', 'na'].includes(sectionState(s))); }

export function itemVisible(item) {
    return evalRule(item.showIf) && matchesTypes(item.devTypes) && !expressHidden(item);
}

export const kindOf = sec => sec.kind || 'form';

function filledValue(v) {
    if (v == null) return false;
    if (Array.isArray(v)) return v.some(x => typeof x === 'object' ? Object.values(x).some(y => String(y || '').trim()) : String(x).trim());
    return String(v).trim() !== '';
}

export function itemAnswered(sec, item) {
    if (store.flag(item.id)) return true;
    if (kindOf(sec) === 'audit') return !!store.val(`${item.id}_status`);
    return filledValue(store.val(item.id));
}

export function sectionProgress(sec) {
    const st = sectionState(sec);
    if (st === 'na') return { total: 1, done: 1, pct: 100, state: st };
    if (st !== 'open') return { total: 0, done: 0, pct: 0, state: st };
    const items = sec.items.filter(itemVisible);
    const done = items.filter(i => itemAnswered(sec, i)).length;
    return { total: items.length, done, pct: items.length ? Math.round(done / items.length * 100) : 100, state: st };
}

export function pillarProgress(p) {
    let total = 0, done = 0;
    activeSections().filter(s => s.pillar === p).forEach(s => { const r = sectionProgress(s); total += r.total; done += r.done; });
    return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}

export function globalProgress() {
    let total = 0, done = 0;
    activeSections().forEach(s => { const r = sectionProgress(s); total += r.total; done += r.done; });
    return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}

/** Resumen para el panel y el PDF */
export function collectStats() {
    const statusCount = Object.fromEntries(AUDIT_STATUS.map(s => [s, 0]));
    const findings = [], pending = [], unanswered = [];
    activeSections().forEach(sec => {
        if (sectionState(sec) === 'na') return;
        const items = [...sec.items.filter(itemVisible), ...store.custom(sec.key).map(c => ({ ...c, id: c.uid, custom: true }))];
        items.forEach(item => {
            const flag = store.flag(item.id);
            if (flag === 'pending') pending.push({ sec, item, note: store.val(`${item.id}__note`) });
            if (kindOf(sec) === 'audit') {
                const st = store.val(`${item.id}_status`);
                if (st) statusCount[st]++;
                const risk = store.val(`${item.id}_risk`);
                if ((st === 'No cumple' || st === 'Parcial' || ['Alto', 'Crítico'].includes(risk)) && st !== 'No aplica') {
                    findings.push({ sec, item, status: st, risk, priority: store.val(`${item.id}_priority`), date: store.val(`${item.id}_date`), obs: store.val(`${item.id}_obs`) });
                }
            }
            if (!item.custom && !itemAnswered(sec, item)) unanswered.push({ sec, item });
        });
    });
    const riskRank = { 'Crítico': 0, 'Alto': 1, 'Medio': 2, 'Bajo': 3 };
    findings.sort((a, b) => (riskRank[a.risk] ?? 4) - (riskRank[b.risk] ?? 4) || String(a.priority || '9').localeCompare(String(b.priority || '9')));
    const pillars = Object.keys(PILLARS).filter(pillarEnabled).map(p => ({ key: p, ...PILLARS[p], ...pillarProgress(p) }));
    return { statusCount, findings, pending, unanswered, pillars, global: globalProgress() };
}
