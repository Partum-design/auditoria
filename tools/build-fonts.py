"""Genera los archivos de fuentes autoalojados (se corre a mano, no en Vercel).

- Font Awesome: solo los íconos que usa la app -> assets/fonts/fa-*.woff2 + css/icons.css
- Outfit (Google Fonts, variable 300-800, latin) -> assets/fonts/outfit.woff2

Uso:  pip install fonttools brotli && python3 tools/build-fonts.py
Vuelve a correrlo si agregas un ícono nuevo (fa-algo) en el HTML/JS/CSS.
"""
import glob
import os
import re
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'assets', 'fonts')
TMP = os.path.join(ROOT, '.fontcache')
FA = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2'
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'}
os.makedirs(FONTS, exist_ok=True)
os.makedirs(TMP, exist_ok=True)


def fetch(url, name=None):
    path = os.path.join(TMP, name or url.rsplit('/', 1)[-1])
    if not os.path.exists(path):
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(path, 'wb') as f:
            f.write(r.read())
    return path


# ---------- íconos usados ----------
src = ''
for f in ['index.html', *glob.glob(os.path.join(ROOT, 'js', '*.js')), os.path.join(ROOT, 'css', 'app.css')]:
    src += open(os.path.join(ROOT, f), encoding='utf-8').read()
used = sorted(set(re.findall(r'fa-[a-z0-9]+(?:-[a-z0-9]+)*', src)) - {'fa-solid', 'fa-regular', 'fa-spin'})

css = open(fetch(f'{FA}/css/all.min.css'), encoding='utf-8').read()
cp = {}
for sel, code in re.findall(r'((?:\.fa-[a-z0-9-]+:before,?)+)\{content:"\\([0-9a-f]+)"\}', css):
    for name in re.findall(r'\.(fa-[a-z0-9-]+):before', sel):
        cp[name] = code
missing = [u for u in used if u not in cp]
used = [u for u in used if u in cp]
if missing:
    print('Sin glifo (ignorados):', missing)
codes = sorted({cp[u] for u in used} | {'f00c'})  # f00c: palomita usada en app.css

for style, file in [('solid', 'fa-solid-900'), ('regular', 'fa-regular-400')]:
    font = TTFont(fetch(f'{FA}/webfonts/{file}.woff2'))
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = []; opts.name_IDs = []
    s = subset.Subsetter(opts)
    avail = set(font.getBestCmap())
    s.populate(unicodes=[int(c, 16) for c in codes if int(c, 16) in avail])
    s.subset(font)
    font.flavor = 'woff2'
    font.save(os.path.join(FONTS, f'{file}.woff2'))

rules = '\n'.join(f'.{u}:before{{content:"\\{cp[u]}"}}' for u in used)
open(os.path.join(ROOT, 'css', 'icons.css'), 'w', encoding='utf-8').write(f"""/* Generado por tools/build-fonts.py: subconjunto de Font Awesome 6.5.2 Free (CC BY 4.0 / OFL) */
@font-face{{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:900;font-display:block;src:url(../assets/fonts/fa-solid-900.woff2) format("woff2")}}
@font-face{{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:400;font-display:block;src:url(../assets/fonts/fa-regular-400.woff2) format("woff2")}}
.fa-solid,.fa-regular{{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:var(--fa-display,inline-block);font-style:normal;font-variant:normal;line-height:1;text-rendering:auto;font-family:"Font Awesome 6 Free"}}
.fa-solid{{font-weight:900}}.fa-regular{{font-weight:400}}
.fa-spin{{animation:fa-spin 1s linear infinite}}@keyframes fa-spin{{to{{transform:rotate(360deg)}}}}
{rules}
""")

# ---------- Outfit ----------
gcss = urllib.request.urlopen(urllib.request.Request('https://fonts.googleapis.com/css2?family=Outfit:wght@300..800&display=swap', headers=UA)).read().decode()
blocks = re.findall(r'/\* (\S+) \*/\s*@font-face \{(.*?)\}', gcss, re.S)
latin = next(b for name, b in blocks if name == 'latin')
url = re.search(r'url\((https://[^)]+\.woff2)\)', latin).group(1)
with open(fetch(url, 'outfit.woff2'), 'rb') as f, open(os.path.join(FONTS, 'outfit.woff2'), 'wb') as o:
    o.write(f.read())

for f in sorted(os.listdir(FONTS)):
    print(f'{os.path.getsize(os.path.join(FONTS, f)):>8}  assets/fonts/{f}')
print(f'{len(used)} íconos')
