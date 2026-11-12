// Build de producción: une y minifica JS/CSS con nombres con hash -> dist/
// Local:  npm install && npm run build   (Vercel lo corre solo en cada deploy)
// Sin build también funciona: abre index.html desde un servidor estático.
import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

const out = 'dist';
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const result = await build({
    entryPoints: ['js/app.js', 'css/app.css'],
    outdir: out,
    outbase: '.',
    bundle: true,
    splitting: true,
    format: 'esm',
    minify: true,
    target: ['es2020', 'chrome100', 'safari15', 'firefox100'],
    entryNames: '[dir]/[name]-[hash]',
    chunkNames: 'js/[name]-[hash]',
    assetNames: 'assets/fonts/[name]-[hash]',
    loader: { '.woff2': 'file' },
    metafile: true,
    legalComments: 'none',
    logLevel: 'warning'
});

const outputs = Object.keys(result.metafile.outputs).map(p => p.slice(out.length + 1));
const find = re => { const f = outputs.find(o => re.test(o)); if (!f) throw new Error('No se generó ' + re); return f; };
const js = find(/^js\/app-\w+\.js$/);
const css = find(/^css\/app-\w+\.css$/);

let html = await readFile('index.html', 'utf8');
const swap = (from, to) => { if (!html.includes(from)) throw new Error('No está en index.html: ' + from); html = html.replace(from, to); };
swap('href="css/app.css"', `href="${css}"`);
swap('src="js/app.js"', `src="${js}"`);
for (const f of ['outfit', 'fa-solid-900']) swap(`href="assets/fonts/${f}.woff2"`, `href="${find(new RegExp(`^assets/fonts/${f}-\\w+\\.woff2$`))}"`);
// Precarga del chunk de datos compartido para evitar una cascada de peticiones
const chunks = outputs.filter(o => /^js\/chunk-\w+\.js$/.test(o) && result.metafile.outputs[`${out}/${js}`].imports.some(i => i.path.endsWith(basename(o))));
html = html.replace('</head>', chunks.map(c => `    <link rel="modulepreload" href="${c}">\n`).join('') + '</head>');
await writeFile(`${out}/index.html`, html);

await cp('vendor', `${out}/vendor`, { recursive: true });
await cp('assets/styles', `${out}/assets/styles`, { recursive: true });
await cp('assets/favicon.svg', `${out}/assets/favicon.svg`);

for (const o of outputs) console.log(String(result.metafile.outputs[`${out}/${o}`].bytes).padStart(8), o);
