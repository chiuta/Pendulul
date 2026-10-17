#!/usr/bin/env python3
"""Asamblează cartea (EPUB, PDF, DOCX) din carte/*.md și ghid/. Necesită pandoc (+ xelatex pentru PDF)."""
import re, subprocess, sys, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
OUT = R / 'dist'; OUT.mkdir(exist_ok=True)
TITLES = ["Arhivista","Patru voci","Cinci faze","Arhivele","Fanarele","Cele douăzeci de pendule","Cel din toate pendulele","Cei care nu vorbesc","Cel care ajustează orbita"]
FRONT = """© 2026 Alexandru-Ionuț Chiuță (Alexio). Text sub licența MIT (vezi fișierul LICENSE din depozit: https://github.com/chiuta/Pendulul).

Cartea a fost scrisă în colaborare cu un model de inteligență artificială (Claude, Anthropic): ideea, structura, deciziile de canon și revizia aparțin autorului; textul a fost redactat și revizuit împreună.

Ediția cititorului: fără aparatul de lucru al autorului. Simularea 3D a lumii și materialele seriei sunt în depozitul proiectului.

&nbsp;

**Despre ordine.** Volumele se citesc de la 1 la 9. Ghidul cititorului, de la sfârșit, este făcut să nu strice nimic până la volumul la care ai ajuns; secțiunea „După volumul 9” conține spoilere.

"""
def vol(n):
    f = next((R/'carte').glob(f'0{n}-*.md'))
    t = f.read_text(encoding='utf8')
    lines = t.split('\n')
    while lines and (not lines[0].strip() or re.match(r'^#{1,2}\s+(PENDULUL|Pendulul|Volumul\b|[A-ZĂÂÎȘȚ ]+$)', lines[0])):
        lines.pop(0)
    t = '\n'.join(lines)
    t = re.sub(r'^# (?!\s)', '## ', t, flags=re.M)
    return f'# Volumul {n} — {TITLES[n-1]}\n\n' + t.strip() + '\n'
def toc():
    items = [f"- [Volumul {n} — {TITLES[n-1]}](#volumul-{n}-{slug(TITLES[n-1])})" for n in range(1, 10)] + ["- [Ghidul cititorului](#ghidul-cititorului)"]
    return "# Cuprins {.unnumbered}\n\n" + "\n".join(items) + "\n"
def slug(t):
    import unicodedata
    t = unicodedata.normalize('NFKD', t.lower()); t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')
g = (R/'ghid'/'ghidul-cititorului.md').read_text(encoding='utf8')
g = re.sub(r'^# Ghidul cititorului – Pendulul', '# Ghidul cititorului', g, count=1)
def assemble(with_toc):
    parts = [FRONT] + ([toc()] if with_toc else []) + [vol(n) for n in range(1, 10)] + [g.strip() + '\n']
    return '\n\n'.join(parts)
want = set(sys.argv[1:]) or {'epub', 'pdf'}
src = OUT / 'Pendulul-ed-cititor.md'; src.write_text(assemble(False), encoding='utf8')
meta = ['-M','title=Pendulul','-M','subtitle=Roman în nouă volume','-M','author=Alexio','-M','lang=ro-RO',
        '-M','rights=MIT','-M','date=2026','-M','description=Serie SF în nouă volume despre o planetă care oscilează între trei stele și o gaură neagră.']
base = ['pandoc','-f','markdown-yaml_metadata_block','-s',str(src)] + meta
if 'epub' in want:
    css = OUT / '_epub.css'
    css.write_text('body{font-family:serif;line-height:1.5;margin:0 .6em}h1{page-break-before:always;margin:1.5em 0 .8em}h2,h3{margin:1.2em 0 .4em}p{margin:.45em 0;text-align:justify;text-indent:0}hr{border:0;text-align:center;margin:1.2em 0}hr::before{content:"* * *"}table{border-collapse:collapse;font-size:.9em}td,th{border:1px solid #999;padding:.2em .4em}',encoding='utf8')
    subprocess.run(base+['-o',str(OUT/'Pendulul.epub'),'--toc','--toc-depth=2','--split-level=1','--epub-cover-image',str(OUT/'coperta.jpg'),'--css',str(css)],check=True)
    css.unlink()
if 'pdf' in want:
    src = OUT / '_pdf.md'; src.write_text(assemble(True), encoding='utf8')
    base = ['pandoc','-f','markdown-yaml_metadata_block','-s',str(src)] + meta
    css = OUT / '_print.css'
    css.write_text("""@page{size:A5;margin:17mm 15mm 19mm 15mm}
html{font-family:'Noto Serif','DejaVu Serif',Georgia,serif;font-size:10pt;line-height:1.5;color:#111}
body{margin:0;max-width:none}
header#title-block-header{page-break-after:always;text-align:center;padding-top:42mm}header#title-block-header p{text-indent:0;text-align:center}
h1.title{font-size:34pt;letter-spacing:.3em;margin:0 0 6mm}p.subtitle{font-size:13pt}p.author{font-size:12pt;margin-top:20mm}p.date{display:none}
section.level1.unnumbered:first-of-type{}
nav#TOC{page-break-after:always}nav#TOC ul{list-style:none;padding-left:1.2em}nav#TOC>ul{padding-left:0}a{color:inherit;text-decoration:none}
h1{page-break-before:always;font-size:19pt;margin:30mm 0 8mm;text-align:center;line-height:1.2}
h1.unnumbered{page-break-before:auto;margin-top:0;font-size:22pt}
h2{font-size:13pt;margin:1.6em 0 .5em;page-break-after:avoid}h3,h4{font-size:11pt;margin:1.2em 0 .4em;page-break-after:avoid}
p{margin:0;text-indent:1.1em;text-align:justify;hyphens:auto;orphans:2;widows:2}h1+p,h2+p,h3+p,h4+p,hr+p,p:first-child{text-indent:0}
hr{border:0;margin:1.1em 0;text-align:center;height:1em}hr::before{content:"*\\00a0\\00a0*\\00a0\\00a0*"}
table{border-collapse:collapse;font-size:8.5pt;margin:.8em 0;width:100%;page-break-inside:auto}td,th{border:.5pt solid #888;padding:1.2mm 1.6mm;vertical-align:top}tr{page-break-inside:avoid}
em{font-style:italic}ul,ol{margin:.4em 0;padding-left:1.4em}li{margin:.15em 0;text-align:left}
""",encoding='utf8')
    html = OUT / '_book.html'
    subprocess.run(base+['-t','html5','--css',str(css),'--embed-resources','-o',str(html)],check=True)
    subprocess.run(['node',str(R/'scripts'/'html2pdf.mjs'),str(html),str(OUT/'Pendulul.pdf')],check=True)
    css.unlink(); html.unlink(); src.unlink()
