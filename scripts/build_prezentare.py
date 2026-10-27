#!/usr/bin/env python3
"""Generează docs/prezentare.html: pagină de prezentare a cărții (copertă, sinopsis, volume, ediții, capitol gratuit).
Un singur fișier HTML, fără JavaScript, fără cereri externe la încărcare (coperta e încorporată ca data URI).
Textul provine doar din depozit: README.ro.md (sinopsis), carte/01-arhivista.md (capitol gratuit), dist/coperta.jpg.
Utilizare: python3 scripts/build_prezentare.py        (necesită doar biblioteca standard Python)"""
import re, base64, html, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
VERSION, UPDATED = '2.2.0', '2026-10-27'
GH = 'https://github.com/chiuta/Pendulul'
TITLES = [("Arhivista", "roman, capitole scurte"), ("Patru voci", "capitole duble: „sus” și „jos”"), ("Cinci faze", "cinci voci și un atlas"),
          ("Arhivele", "roman epistolar, în 13 dosare"), ("Fanarele", "cronică din noduri"), ("Cele douăzeci de pendule", "o scenă din fiecare pendul"),
          ("Cel din toate pendulele", "un singur narator"), ("Cei care nu vorbesc", "două voci neobișnuite"), ("Cel care ajustează orbita", "povestit în ordine inversă")]

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'\*(.+?)\*', r'<em>\1</em>', t)
    return t

def md_free(md):
    """Prolog + capitolele 1-2 (până la „## Capitolul 3”) -> HTML minimal."""
    i = md.index('## Prolog'); j = md.index('## Capitolul 3')
    out = []
    for blk in re.split(r'\n\s*\n', md[i:j].strip()):
        blk = blk.strip()
        if blk.startswith('## '): out.append('<h3>%s</h3>' % inline(blk[3:]))
        elif blk == '---': out.append('<hr>')
        else: out.append('<p>%s</p>' % inline(blk.replace('\n', ' ')))
    return '\n'.join(out)

def readme_synopsis():
    t = (R / 'README.ro.md').read_text(encoding='utf8')
    return re.search(r'O planetă oscilează[^\n]*', t).group(0)

cover = base64.b64encode((R / 'dist' / 'coperta.jpg').read_bytes()).decode()
free = md_free((R / 'carte' / '01-arhivista.md').read_text(encoding='utf8'))
rows = ''.join('<tr><td>%d</td><td>%s</td><td>%s</td></tr>' % (n + 1, html.escape(t), html.escape(f)) for n, (t, f) in enumerate(TITLES))
SYN = readme_synopsis()
page = '''<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<meta name="description" content="Pendulul: roman SF în nouă volume, de Alexio în colaborare cu Claude. Copertă, sinopsis, ediții de descărcat și primul capitol gratuit.">
<meta name="application-version" content="%(v)s">
<meta name="last-updated" content="%(u)s">
<meta name="author" content="Alexio">
<title>Pendulul — prezentarea cărții</title>
<style>
:root{color-scheme:dark light;--bg:#0b0f1a;--ink:#ece7da;--mut:#a9b2c6;--line:rgba(236,231,218,.18);--amber:#ffbd5a;--card:#111827}
@media (prefers-color-scheme:light){:root{--bg:#faf7ef;--ink:#1d1b16;--mut:#4d5160;--line:rgba(29,27,22,.2);--amber:#8a4b00;--card:#fff}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 Georgia,"Iowan Old Style","Palatino Linotype",serif}
main{max-width:46rem;margin:0 auto;padding:1.5rem 16px 4rem}
h1{font-size:2.4rem;line-height:1.15;margin:.2em 0 .1em;letter-spacing:.02em}
h2{font-size:1.4rem;margin:2.2em 0 .5em;color:var(--amber)}
h3{font-size:1.15rem;margin:1.8em 0 .4em}
a{color:var(--amber)}
.hero{display:grid;grid-template-columns:minmax(0,1fr);gap:1.5rem;align-items:start}
@media(min-width:40rem){.hero{grid-template-columns:13rem minmax(0,1fr)}}
.hero img{width:100%%;max-width:13rem;height:auto;border-radius:6px;box-shadow:0 8px 30px rgba(0,0,0,.45)}
.sub{color:var(--mut);margin:0 0 1rem}
.badges span{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:.1rem .7rem;margin:0 .4rem .4rem 0;font:14px/1.6 system-ui,sans-serif;color:var(--mut)}
table{border-collapse:collapse;width:100%%;font:15px/1.5 system-ui,sans-serif}
th,td{border-bottom:1px solid var(--line);padding:.4rem .5rem;text-align:left;vertical-align:top}
td:first-child,th:first-child{width:2.5rem}
.dl a{display:inline-block;margin:.2rem .5rem .2rem 0;padding:.45rem .9rem;border:1px solid var(--amber);border-radius:8px;text-decoration:none;font:15px system-ui,sans-serif}
.free{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.5rem 1.2rem 1.2rem}
.free hr{border:0;border-top:1px solid var(--line);margin:1.5rem 0}
.note{font:14px/1.6 system-ui,sans-serif;color:var(--mut)}
footer{margin-top:3rem;border-top:1px solid var(--line);padding-top:1rem}
</style>
</head>
<body>
<main>
<div class="hero">
<img src="data:image/jpeg;base64,%(cover)s" alt="Coperta romanului Pendulul" width="1200" height="1800">
<div>
<h1>Pendulul</h1>
<p class="sub">Roman SF în nouă volume, de Alexio, în colaborare cu Claude (Anthropic).</p>
<p>%(syn)s</p>
<div class="badges"><span>Stare: stabil</span><span>Offline: complet (pagina nu face cereri în rețea)</span><span>Limba: română</span><span>Licență: MIT</span></div>
</div>
</div>

<h2>Cum se citește</h2>
<p>Volumele se citesc <strong>în ordine, de la 1 la 9</strong>; fiecare are altă formă. <a href="%(gh)s/blob/main/ghid/ghidul-cititorului.md">Ghidul cititorului</a> are câte o secțiune pe volum, fără spoilere; citește-l doar până la volumul la care ai ajuns.</p>
<table><thead><tr><th>Vol.</th><th>Titlu</th><th>Forma</th></tr></thead><tbody>%(rows)s</tbody></table>

<h2>Ediții de descărcat</h2>
<p class="dl">
<a href="%(gh)s/raw/main/dist/Pendulul.epub">EPUB (cu copertă)</a>
<a href="%(gh)s/raw/main/dist/Pendulul.pdf">PDF, format A5, cu semne de carte</a>
<a href="%(gh)s/raw/main/dist/pendulul-3d.html">Simulare 3D + cititor (un singur fișier HTML, funcționează offline)</a>
<a href="%(gh)s/blob/main/dist/Pendulul-ed-cititor.md">Textul integral, Markdown</a>
</p>
<p class="note">Linkurile se deschid doar la clic și duc la depozitul proiectului pe GitHub; pagina de față nu încarcă nimic extern.</p>

<h2>Primul capitol, gratuit</h2>
<p class="note">Volumul 1, <em>Arhivista</em>: prologul și capitolele 1–2, aduse neschimbate din <code>carte/01-arhivista.md</code>. Restul volumului și cele opt volume următoare sunt în edițiile de mai sus.</p>
<article class="free">
%(free)s
</article>

<footer class="note">
<p><strong>Despre colaborarea cu inteligența artificială.</strong> Seria a fost scrisă împreună cu un model de inteligență artificială (Claude, Anthropic). Ideea, lumea, structura, deciziile de canon și selecția finală aparțin autorului; textul a fost redactat, revizuit și verificat împreună.</p>
<p>Texte și cod: licență MIT (vezi <a href="%(gh)s/blob/main/LICENSE">LICENSE</a>). Pentru ediții tipărite, audio, traduceri sau adaptări comerciale, scrie autorului prin profilul GitHub. <a href="./">Simularea 3D a lumii</a> · <a href="%(gh)s">depozitul proiectului</a>.</p>
<p>Pagină generată cu <code>scripts/build_prezentare.py</code>; versiunea %(v)s, %(u)s.</p>
</footer>
</main>
</body>
</html>
''' % dict(v=VERSION, u=UPDATED, cover=cover, syn=html.escape(SYN), rows=rows, free=free, gh=GH)
(R / 'docs' / 'prezentare.html').write_text(page, encoding='utf8')
print('docs/prezentare.html', len(page))
