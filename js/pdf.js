// ===== GENERADOR DE PDF (jsPDF + AutoTable, texto vectorial) =====
import { PILLARS, DEV_TYPES, PLATFORM_KINDS, SECTIONS, AUDIT_STATUS, isOtherOption, ITEM_MAP } from './data.js';
import { store } from './store.js';
import { sectionState, itemVisible, sectionProgress, collectStats, kindOf, pillarEnabled } from './logic.js';

const W = 210, H = 297, M = 16;
const C = {
    ink: [28, 24, 48], text: [40, 38, 58], muted: [112, 108, 140], faint: [170, 167, 190], line: [226, 224, 236], soft: [246, 245, 251],
    dark: [20, 16, 46], purple: [123, 44, 191], violet: [139, 61, 255], cyan: [43, 179, 217], pink: [232, 72, 122],
    ok: [34, 160, 107], warn: [222, 146, 22], bad: [214, 69, 69], crit: [176, 30, 40], info: [70, 120, 220], na: [140, 136, 165]
};
const PILLAR_RGB = { branding: [150, 80, 220], dev: [30, 150, 200], ops: [110, 160, 20], social: [225, 70, 120], extra: [225, 150, 30] };
const STATUS_RGB = { 'Cumple': C.ok, 'Parcial': C.warn, 'No cumple': C.bad, 'Desconocido': C.info, 'No aplica': C.na };
const RISK_RGB = { 'Bajo': C.ok, 'Medio': C.warn, 'Alto': C.bad, 'Crítico': C.crit };
const tint = (rgb, k = .86) => rgb.map(v => Math.round(v + (255 - v) * k));

const fmtDate = v => { if (!v) return ''; const d = new Date(v.length <= 10 ? v + 'T12:00' : v); if (isNaN(d)) return v; return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', ...(v.length > 10 ? { hour: '2-digit', minute: '2-digit' } : {}) }); };
const clean = s => String(s ?? '').replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ–—‘’“”•…€]/g, '').trim();

function loadImage(src) {
    return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
async function imgInfo(dataUrl) {
    const i = await loadImage(dataUrl); if (!i) return null;
    const fmt = /^data:image\/png/i.test(dataUrl) ? 'PNG' : 'JPEG';
    // ¿es un logo claro? (para ponerle fondo oscuro)
    let light = false;
    try {
        const c = document.createElement('canvas'); c.width = 40; c.height = 40; const x = c.getContext('2d'); x.drawImage(i, 0, 0, 40, 40);
        const d = x.getImageData(0, 0, 40, 40).data; let sum = 0, n = 0;
        for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 120) { sum += (d[k] * .299 + d[k + 1] * .587 + d[k + 2] * .114); n++; }
        light = n > 20 && fmt === 'PNG' && sum / n > 225 && n < 1500;
    } catch (e) { }
    return { data: dataUrl, w: i.naturalWidth, h: i.naturalHeight, fmt, light };
}
async function urlToDataURL(url) {
    try { const r = await fetch(url); if (!r.ok) return null; const b = await r.blob(); if (!b.type.startsWith('image/')) return null; return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); }
    catch (e) { return null; }
}

/** Formatea la respuesta de una pregunta para el PDF */
function answerText(item) {
    const v = store.val(item.id);
    const other = store.val(item.id + '__other');
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
    switch (item.type) {
        case 'checks': return v.map(o => isOtherOption(o) && other ? `${o}: ${other}` : o).join(' • ');
        case 'select': case 'radio': return isOtherOption(v) && other ? `${v}: ${other}` : v;
        case 'days': return `${v} ${+v === 1 ? 'día hábil' : 'días hábiles'}`;
        case 'date': case 'datetime': return fmtDate(v);
        case 'repeater': {
            const rows = v.filter(r => Object.values(r).some(x => String(x || '').trim()));
            return rows.map((r, i) => `${i + 1}. ` + item.fields.map(f => r[f.k] ? (item.fields.length > 2 ? `${f.label}: ${r[f.k]}` : r[f.k]) : '').filter(Boolean).join(' · ')).join('\n');
        }
        default: return String(v);
    }
}

export async function buildPDF(opts = {}) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const audit = store.audit; const cfg = audit.config;
    const stats = collectStats();
    const client = clean(audit.name || 'Cliente');
    const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setProperties({ title: `Diagnóstico · ${client}`, subject: 'Reporte de diagnóstico integral', author: 'Partum Design', creator: 'Partum Design · Herramienta de diagnóstico' });

    const set = (size, style = 'normal', color = C.text) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); };
    const fill = c => doc.setFillColor(...c);
    const stroke = c => doc.setDrawColor(...c);
    const alpha = a => doc.setGState(new doc.GState({ opacity: a }));
    let y = M;
    const ensure = h => { if (y + h > H - 22) { doc.addPage(); y = 22; return true; } return false; };

    // ---------- Logos ----------
    const partumLogo = await urlToDataURL('assets/partum-logo.png').then(d => d && imgInfo(d));
    let clientLogo = null;
    const logoFile = store.files('ba_logo').find(f => f.isImage);
    if (logoFile) { const d = await store.fileData(logoFile.fid); if (d) clientLogo = await imgInfo(d); }

    const drawPartum = (x, yy, h, light = true) => {
        if (partumLogo) { const w = Math.min(60, h * partumLogo.w / partumLogo.h); doc.addImage(partumLogo.data, partumLogo.fmt, x, yy, w, w * partumLogo.h / partumLogo.w); return; }
        set(h * 2.1, 'bold', light ? [255, 255, 255] : C.ink); doc.text('PARTUM', x, yy + h * .75);
        const pw = doc.getTextWidth('PARTUM ');
        set(h * 2.1, 'normal', light ? [200, 196, 235] : C.muted); doc.text('DESIGN', x + pw, yy + h * .75);
    };

    // =================== PORTADA ===================
    fill(C.dark); doc.rect(0, 0, W, 132, 'F');
    alpha(.55); fill(C.purple); doc.triangle(W, 0, W, 132, W - 120, 0, 'F');
    alpha(.35); fill(C.cyan); doc.triangle(W, 60, W, 132, W - 70, 132, 'F');
    alpha(.25); fill(C.pink); doc.circle(W - 30, 30, 26, 'F');
    alpha(1);
    drawPartum(M, 18, 9);
    set(8.5, 'bold', [120, 214, 240]); doc.text('REPORTE DE DIAGNÓSTICO INTEGRAL', M, 62, { charSpace: 1.1 });
    set(30, 'bold', [255, 255, 255]);
    const nameLines = doc.splitTextToSize(client, W - 2 * M - 20).slice(0, 2);
    doc.text(nameLines, M, 76);
    let cy = 76 + nameLines.length * 11;
    set(11, 'normal', [210, 206, 240]);
    const devLabel = t => t === 'platform' && (cfg.platKinds || []).length ? `${DEV_TYPES[t].label}: ${cfg.platKinds.map(k => PLATFORM_KINDS[k].label).join(' / ')}` : DEV_TYPES[t].label;
    const svc = cfg.pillars.filter(p => PILLARS[p]).map(p => p === 'dev' ? `Desarrollo (${cfg.devTypes.map(devLabel).join(', ') || 'general'})` : PILLARS[p].label).join('  •  ');
    doc.text(doc.splitTextToSize(svc, W - 2 * M), M, cy);
    set(9, 'normal', [170, 166, 210]); doc.text(today, M, 122);

    // logo del cliente
    y = 146;
    if (clientLogo) {
        const bw = 52, bh = 34; fill(clientLogo.light ? C.dark : [255, 255, 255]); stroke(C.line); doc.setLineWidth(.3); doc.roundedRect(W - M - bw, y - 2, bw, bh, 3, 3, 'FD');
        const s = Math.min((bw - 8) / clientLogo.w, (bh - 8) / clientLogo.h);
        const iw = clientLogo.w * s, ih = clientLogo.h * s;
        doc.addImage(clientLogo.data, clientLogo.fmt, W - M - bw + (bw - iw) / 2, y - 2 + (bh - ih) / 2, iw, ih);
    }
    // datos del cliente
    const info = [
        ['Contacto', [store.val('bg_contact_name'), store.val('bg_contact_role')].filter(Boolean).join(' · ')],
        ['Correo', store.val('bg_contact_email')], ['Teléfono', store.val('bg_contact_phone') || store.val('bg_phone_official')],
        ['Sitio web', store.val('bg_website_url')], ['Régimen', store.val('bg_legal')], ['Slogan', store.val('bg_slogan')]
    ].filter(r => r[1]);
    set(8, 'bold', C.muted); doc.text('DATOS DEL CLIENTE', M, y, { charSpace: .6 }); y += 6;
    if (!info.length) { set(9.5, 'italic', C.faint); doc.text('Sin datos de contacto registrados.', M, y); y += 6; }
    info.forEach(([k, v]) => { set(9.5, 'bold', C.ink); doc.text(k, M, y); set(9.5, 'normal', C.text); doc.text(doc.splitTextToSize(clean(v), clientLogo ? 95 : 140)[0], M + 26, y); y += 6; });
    y = Math.max(y, clientLogo ? 186 : y) + 6;

    // KPIs
    const critical = stats.findings.filter(f => ['Alto', 'Crítico'].includes(f.risk)).length;
    const kpis = [[`${stats.global.pct}%`, 'Completado', C.violet], [`${stats.global.done}/${stats.global.total}`, 'Respuestas', C.cyan], [String(critical), 'Riesgos altos', critical ? C.bad : C.ok], [String(stats.pending.length), 'Pendientes', stats.pending.length ? C.warn : C.ok]];
    const kw = (W - 2 * M - 9) / 4;
    kpis.forEach(([v, l, col], i) => {
        const x = M + i * (kw + 3);
        fill(C.soft); doc.roundedRect(x, y, kw, 24, 3, 3, 'F');
        fill(col); doc.roundedRect(x, y, 1.6, 24, .8, .8, 'F');
        set(17, 'bold', col); doc.text(v, x + 6, y + 11);
        set(8.5, 'normal', C.muted); doc.text(l, x + 6, y + 18);
    });
    y += 34;

    // Avance por servicio
    set(8, 'bold', C.muted); doc.text('AVANCE POR SERVICIO', M, y, { charSpace: .6 }); y += 6;
    stats.pillars.forEach(p => {
        const col = PILLAR_RGB[p.key];
        set(9.5, 'normal', C.ink); doc.text(p.label, M, y + 3);
        fill(C.line); doc.roundedRect(M + 42, y, W - 2 * M - 58, 4, 2, 2, 'F');
        if (p.pct) { fill(col); doc.roundedRect(M + 42, y, Math.max(4, (W - 2 * M - 58) * p.pct / 100), 4, 2, 2, 'F'); }
        set(9, 'bold', C.text); doc.text(`${p.pct}%`, W - M, y + 3.2, { align: 'right' });
        y += 9;
    });

    set(8, 'normal', C.faint);
    doc.text('Documento confidencial preparado por Partum Design para uso exclusivo del cliente.', M, H - 14);

    // =================== RESUMEN EJECUTIVO ===================
    const tableBase = {
        theme: 'grid', margin: { left: M, right: M, top: 22, bottom: 22 },
        styles: { font: 'helvetica', fontSize: 8.6, cellPadding: { top: 2.4, bottom: 2.4, left: 3, right: 3 }, textColor: C.text, lineColor: C.line, lineWidth: .2, valign: 'middle', overflow: 'linebreak' },
        headStyles: { fillColor: C.ink, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.4 },
        alternateRowStyles: { fillColor: [251, 250, 254] }
    };
    const heading = (title, sub) => {
        ensure(18);
        set(15, 'bold', C.ink); doc.text(title, M, y);
        if (sub) { set(9, 'normal', C.muted); doc.text(sub, M, y + 5.5); y += 5.5; }
        y += 7;
    };

    if (opts.summary !== false) {
        doc.addPage(); y = 24;
        heading('Resumen ejecutivo', `${client} · ${today}`);
        const totalAudit = Object.values(stats.statusCount).reduce((a, b) => a + b, 0);
        if (totalAudit) {
            set(8, 'bold', C.muted); doc.text('ESTADO DE LOS PUNTOS AUDITADOS', M, y, { charSpace: .6 }); y += 4;
            let x = M; const bw = W - 2 * M;
            AUDIT_STATUS.forEach(st => { const n = stats.statusCount[st]; if (!n) return; const w = bw * n / totalAudit; fill(STATUS_RGB[st]); doc.rect(x, y, w, 6, 'F'); x += w; });
            y += 11; x = M;
            AUDIT_STATUS.forEach(st => { fill(STATUS_RGB[st]); doc.roundedRect(x, y - 2.6, 3, 3, .6, .6, 'F'); set(8.5, 'normal', C.text); const t = `${st}: ${stats.statusCount[st]}`; doc.text(t, x + 4.5, y); x += doc.getTextWidth(t) + 11; });
            y += 9;
        }

        set(11.5, 'bold', C.ink); doc.text('Hallazgos prioritarios', M, y); y += 3;
        if (stats.findings.length) {
            doc.autoTable({
                ...tableBase, startY: y,
                head: [['Elemento', 'Sección', 'Estado', 'Riesgo', 'Prioridad', 'Acción / observación']],
                body: stats.findings.map(f => [clean(f.item.label || 'Elemento'), clean(f.sec.title), f.status || '—', f.risk || '—', (f.priority || '—').replace(' · ', ' '), clean(f.obs || '') + (f.date ? `\nCompromiso: ${fmtDate(f.date)}` : '')]),
                columnStyles: { 0: { cellWidth: 34, fontStyle: 'bold' }, 1: { cellWidth: 30, textColor: C.muted }, 2: { cellWidth: 20 }, 3: { cellWidth: 17 }, 4: { cellWidth: 23 } },
                didParseCell: d => colorize(d, 2, 3)
            });
            y = doc.lastAutoTable.finalY + 10;
        } else { y += 4; set(9.5, 'italic', C.muted); doc.text('No se registraron hallazgos de riesgo.', M, y); y += 10; }

        ensure(20);
        set(11.5, 'bold', C.ink); doc.text('Pendientes del cliente', M, y); y += 3;
        if (stats.pending.length) {
            doc.autoTable({
                ...tableBase, startY: y, head: [['Elemento', 'Sección', 'Nota']],
                headStyles: { ...tableBase.headStyles, fillColor: C.warn },
                body: stats.pending.map(p => [clean(p.item.label || 'Elemento'), clean(p.sec.title), clean(p.note || '')]),
                columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 45, textColor: C.muted } }
            });
            y = doc.lastAutoTable.finalY + 10;
        } else { y += 4; set(9.5, 'italic', C.muted); doc.text('Nada marcado como pendiente.', M, y); y += 10; }

        if (stats.unanswered.length) {
            ensure(16);
            set(9, 'normal', C.muted);
            doc.text(doc.splitTextToSize(`Quedan ${stats.unanswered.length} preguntas sin responder en ${new Set(stats.unanswered.map(u => u.sec.key)).size} secciones.`, W - 2 * M), M, y);
            y += 8;
        }
    }

    // =================== DETALLE POR SERVICIO ===================
    let firstPillar = true;
    for (const p of Object.keys(PILLARS)) {
        if (!pillarEnabled(p)) continue;
        const all = SECTIONS.filter(s => s.pillar === p && ['open', 'na'].includes(sectionState(s)));
        if (!all.length) continue;
        const secs = opts.empty ? all : all.filter(s => sectionState(s) === 'na' || hasContent(s));
        const emptySecs = all.filter(s => !secs.includes(s));
        if (firstPillar || y > H * .5) { doc.addPage(); y = 22; } else { y += 8; }
        firstPillar = false;
        const col = PILLAR_RGB[p];
        fill(col); doc.roundedRect(M, y - 6, W - 2 * M, 16, 3, 3, 'F');
        alpha(.25); fill([255, 255, 255]); doc.circle(W - M - 10, y + 2, 14, 'F'); alpha(1);
        set(14, 'bold', [255, 255, 255]); doc.text(PILLARS[p].label.toUpperCase(), M + 6, y + 4.2, { charSpace: .8 });
        const pp = stats.pillars.find(x => x.key === p);
        set(9, 'normal', [255, 255, 255]); doc.text(`${pp ? pp.pct : 0}% completado`, W - M - 6, y + 4, { align: 'right' });
        y += 20;
        if (!secs.length) { set(9.5, 'italic', C.muted); doc.text('Aún no hay información registrada en este servicio.', M, y); y += 8; }

        for (const sec of secs) {
            const prog = sectionProgress(sec);
            ensure(26);
            fill(col); doc.rect(M, y - 4.2, 1.4, 6, 'F');
            set(12, 'bold', C.ink); doc.text(clean(sec.title), M + 4, y);
            set(8.5, 'normal', C.muted); doc.text(prog.state === 'na' ? 'No aplica' : `${prog.done}/${prog.total}`, W - M, y, { align: 'right' });
            y += 4;
            if (prog.state === 'na') { set(9, 'italic', C.muted); y += 3; doc.text('Esta sección se marcó como "no aplica" para este proyecto.', M + 4, y); y += 9; continue; }

            // Responsables
            const resp = (store.val(`${sec.key}_responsibles`) || []).filter(r => r.name);
            if (resp.length) {
                doc.autoTable({
                    ...tableBase, startY: y + 1, theme: 'plain',
                    styles: { ...tableBase.styles, fontSize: 8, fillColor: tint(col, .92) },
                    head: [['Responsable', 'Contacto', 'Días agencia', 'Días cliente']], headStyles: { fillColor: tint(col, .75), textColor: C.ink, fontSize: 7.8 },
                    body: resp.map(r => [clean(r.name), clean(r.contact), r.days_agency || '—', r.days_client || '—'])
                });
                y = doc.lastAutoTable.finalY + 2;
            }

            const customs = store.custom(sec.key);
            const isAudit = kindOf(sec) === 'audit';
            const items = sec.items.filter(itemVisible);

            if (isAudit) {
                const rows = [...items, ...customs.map(c => ({ ...c, id: c.uid, custom: true }))].map(it => {
                    const f = store.flag(it.id);
                    const st = store.val(`${it.id}_status`) || (f === 'pending' ? 'Pendiente' : '');
                    if (!st && !opts.empty) return null;
                    const obs = [store.val(`${it.id}_obs`), f === 'pending' && store.val(it.id + '__note') ? `Pendiente: ${store.val(it.id + '__note')}` : ''].filter(Boolean).join('\n');
                    return [{ content: clean(it.label || 'Elemento') + (it.custom ? ' (adicional)' : ''), desc: clean(it.desc || '') }, st || '—', store.val(`${it.id}_risk`) || '—', (store.val(`${it.id}_priority`) || '—').replace(' · ', ' '), fmtDate(store.val(`${it.id}_date`)) || '—', clean(obs)];
                }).filter(Boolean);
                if (rows.length) {
                    doc.autoTable({
                        ...tableBase, startY: y + 1,
                        head: [['Elemento', 'Estado', 'Riesgo', 'Prioridad', 'Fecha', 'Observaciones']],
                        body: rows.map(r => {
                            doc.setFontSize(7.2); const dl = r[0].desc ? doc.splitTextToSize(r[0].desc, 40).length : 0;
                            return [{ content: r[0].content + '\n'.repeat(dl), desc: r[0].desc, dl }, ...r.slice(1)];
                        }),
                        columnStyles: { 0: { cellWidth: 46 }, 1: { cellWidth: 22 }, 2: { cellWidth: 17 }, 3: { cellWidth: 22 }, 4: { cellWidth: 21 } },
                        didParseCell: d => {
                            colorize(d, 1, 2);
                            if (d.section === 'body' && d.column.index === 0) { d.cell.styles.fontStyle = 'bold'; }
                        },
                        didDrawCell: d => {
                            // descripción en gris debajo del título
                            const raw = d.cell.raw;
                            if (d.section === 'body' && d.column.index === 0 && raw && raw.desc) {
                                const lines = d.cell.text.length - raw.dl;
                                set(7.2, 'normal', C.muted);
                                doc.text(doc.splitTextToSize(raw.desc, 40), d.cell.x + 3, d.cell.y + 2.4 + lines * 3.5 + 2.4);
                            }
                        }
                    });
                    y = doc.lastAutoTable.finalY + 2;
                } else { set(9, 'italic', C.faint); y += 4; doc.text('Sin evaluaciones registradas.', M + 4, y); y += 2; }
            } else {
                const rows = [];
                items.forEach(it => {
                    const f = store.flag(it.id);
                    let ans = answerText(it), style = null;
                    if (f === 'na') { ans = 'No aplica'; style = 'na'; }
                    else if (f === 'pending') { ans = 'Pendiente' + (store.val(it.id + '__note') ? `: ${store.val(it.id + '__note')}` : '') + (ans ? `\n${ans}` : ''); style = 'pending'; }
                    else if (!ans) { if (!opts.empty) return; ans = '—'; style = 'empty'; }
                    if (it.type === 'checks' && store.val(it.id + '__custom')?.length && !f) { /* opciones propias ya incluidas */ }
                    rows.push({ q: clean(it.label), a: clean(ans), style });
                });
                customs.forEach(c => {
                    const f = store.flag(c.uid); let ans = store.val(c.uid) || '', style = null;
                    if (f === 'na') { ans = 'No aplica'; style = 'na'; } else if (f === 'pending') { ans = 'Pendiente' + (store.val(c.uid + '__note') ? `: ${store.val(c.uid + '__note')}` : ''); style = 'pending'; }
                    else if (!ans) { if (!opts.empty) return; ans = '—'; style = 'empty'; }
                    rows.push({ q: clean((c.label || 'Elemento adicional') + ' (adicional)' + (c.desc ? `\n${c.desc}` : '')), a: clean(ans), style });
                });
                if (rows.length) {
                    doc.autoTable({
                        ...tableBase, startY: y + 1, theme: 'plain',
                        styles: { ...tableBase.styles, lineWidth: 0 },
                        body: rows.map(r => [r.q, r.a]),
                        columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold', textColor: C.ink }, 1: { textColor: C.text } },
                        didParseCell: d => {
                            if (d.section !== 'body') return;
                            const r = rows[d.row.index];
                            if (d.column.index === 1 && r.style === 'na') { d.cell.styles.textColor = C.na; d.cell.styles.fontStyle = 'italic'; }
                            if (d.column.index === 1 && r.style === 'pending') { d.cell.styles.textColor = C.warn; d.cell.styles.fontStyle = 'bold'; }
                            if (d.column.index === 1 && r.style === 'empty') { d.cell.styles.textColor = C.faint; }
                        },
                        willDrawCell: d => { if (d.section === 'body' && d.column.index === 0) { stroke(C.line); doc.setLineWidth(.2); doc.line(M, d.cell.y, W - M, d.cell.y); } }
                    });
                    y = doc.lastAutoTable.finalY + 2;
                } else { set(9, 'italic', C.faint); y += 4; doc.text('Sin respuestas registradas.', M + 4, y); y += 2; }
            }

            // Archivos adjuntos
            const ids = [...items.map(i => i.id), ...customs.map(c => c.uid)];
            const imgs = [], others = [];
            for (const id of ids) for (const f of store.files(id)) {
                const label = ITEM_MAP[id]?.label || customs.find(c => c.uid === id)?.label || '';
                if (f.isImage && opts.images !== false) { const d = await store.fileData(f.fid); const inf = d && await imgInfo(d); if (inf) { imgs.push({ ...inf, cap: label || f.name }); continue; } }
                others.push(f.name);
            }
            if (imgs.length) {
                const cols = 3, gap = 4, cw = (W - 2 * M - gap * (cols - 1)) / cols, ch = 38;
                y += 3;
                for (let i = 0; i < imgs.length; i++) {
                    if (i % cols === 0) { if (i) y += ch + 10; ensure(ch + 10); }
                    const im = imgs[i]; const x = M + (i % cols) * (cw + gap);
                    fill(im.light ? C.dark : C.soft); doc.roundedRect(x, y, cw, ch, 2, 2, 'F');
                    const s = Math.min((cw - 6) / im.w, (ch - 6) / im.h); const iw = im.w * s, ih = im.h * s;
                    try { doc.addImage(im.data, im.fmt, x + (cw - iw) / 2, y + (ch - ih) / 2, iw, ih, undefined, 'FAST'); } catch (e) { }
                    set(7.4, 'normal', C.muted); doc.text(doc.splitTextToSize(clean(im.cap), cw)[0], x, y + ch + 4);
                }
                y += ch + 9;
            }
            if (others.length) { ensure(8); set(8, 'normal', C.muted); doc.text(doc.splitTextToSize(`Archivos adjuntos: ${others.map(clean).join(', ')}`, W - 2 * M), M + 4, y + 3); y += 7; }
            y += 7;
        }
        if (emptySecs.length && secs.length) {
            ensure(12); set(8.5, 'italic', C.muted);
            const t = doc.splitTextToSize(`Sin información registrada: ${emptySecs.map(s => clean(s.title)).join(', ')}.`, W - 2 * M);
            doc.text(t, M, y); y += t.length * 4 + 6;
        }
    }

    // ---------- Encabezado y pie ----------
    const total = doc.getNumberOfPages();
    for (let i = 2; i <= total; i++) {
        doc.setPage(i);
        set(7.5, 'bold', C.faint); doc.text('PARTUM DESIGN', M, 11, { charSpace: .8 });
        set(7.5, 'normal', C.faint); doc.text(`Diagnóstico · ${client}`, W - M, 11, { align: 'right' });
        stroke(C.line); doc.setLineWidth(.2); doc.line(M, 13.5, W - M, 13.5); doc.line(M, H - 13, W - M, H - 13);
        set(7.5, 'normal', C.faint); doc.text(today, M, H - 8.5);
        doc.text(`Página ${i} de ${total}`, W - M, H - 8.5, { align: 'right' });
    }
    return doc;
}

function colorize(d, statusCol, riskCol) {
    if (d.section !== 'body') return;
    const v = d.cell.raw;
    const rgb = d.column.index === statusCol ? (STATUS_RGB[v] || (v === 'Pendiente' ? C.warn : null)) : d.column.index === riskCol ? RISK_RGB[v] : null;
    if (rgb) { d.cell.styles.fillColor = tint(rgb, .82); d.cell.styles.textColor = rgb.map(x => Math.round(x * .7)); d.cell.styles.fontStyle = 'bold'; d.cell.styles.halign = 'center'; }
    else if (d.column.index === statusCol || d.column.index === riskCol) d.cell.styles.halign = 'center';
}

function hasContent(sec) {
    const ids = [...sec.items.filter(itemVisible).map(i => i.id), ...store.custom(sec.key).map(c => c.uid)];
    if ((store.val(`${sec.key}_responsibles`) || []).some(r => r.name)) return true;
    return ids.some(id => store.flag(id) || store.files(id).length || (kindOf(sec) === 'audit' ? store.val(`${id}_status`) : (() => { const v = store.val(id); return Array.isArray(v) ? v.some(x => typeof x === 'object' ? Object.values(x).some(Boolean) : x) : v; })()));
}
