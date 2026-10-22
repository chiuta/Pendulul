# Pendulul

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versión:** 1.0.1 · **Última actualización:** 2026-10-22

**Novela de ciencia ficción en nueve volúmenes** de Alexio, en colaboración con Claude (Anthropic).

Un planeta oscila entre tres estrellas y un agujero negro. En un mundo sin industria, la civilización dispone solo de unas pocas ventanas, cada vez más cortas, en las que los cohetes de pólvora pueden alcanzar la órbita. El período de cada péndulo disminuye en cuatro años, y el lector cuenta junto con los personajes.

Idiomas de la interfaz: **rumano**.

## Cómo se lee

Los volúmenes se leen **en orden, del 1 al 9**. Cada uno tiene una forma distinta.

| Vol. | Título | Forma |
| --- | --- | --- |
| 1 | [Arhivista](carte/01-arhivista.md) | novela, capítulos breves |
| 2 | [Patru voci](carte/02-patru-voci.md) | capítulos dobles, «arriba» y «abajo» |
| 3 | [Cinci faze](carte/03-cinci-faze.md) | cinco voces y un atlas |
| 4 | [Arhivele](carte/04-arhivele.md) | novela epistolar, en 13 expedientes |
| 5 | [Fanarele](carte/05-fanarele.md) | crónica contada desde los nodos |
| 6 | [Cele douăzeci de pendule](carte/06-cele-douazeci-de-pendule.md) | una escena de cada péndulo |
| 7 | [Cel din toate pendulele](carte/07-cel-din-toate-pendulele.md) | un único narrador |
| 8 | [Cei care nu vorbesc](carte/08-cei-care-nu-vorbesc.md) | dos voces inusuales |
| 9 | [Cel care ajustează orbita](carte/09-cel-care-ajusteaza-orbita.md) | contado en orden inverso |

La [Guía del lector](ghid/ghidul-cititorului.md) tiene una sección por volumen, sin spoilers. Léela solo hasta el volumen al que hayas llegado; la sección «Después del volumen 9» contiene spoilers.

## Ediciones

| Formato | Archivo |
| --- | --- |
| EPUB (con cubierta) | [`dist/Pendulul.epub`](dist/Pendulul.epub) |
| PDF, formato A5, con marcadores | [`dist/Pendulul.pdf`](dist/Pendulul.pdf) |
| Simulación 3D + lector, un único archivo HTML, funciona sin conexión | [`dist/pendulul-3d.html`](dist/pendulul-3d.html) |
| Texto de todo el libro, Markdown | [`dist/Pendulul-ed-cititor.md`](dist/Pendulul-ed-cititor.md) |

Si GitHub Pages está activado para este repositorio, la simulación también funciona en la dirección de la página del proyecto (se sirve desde `docs/`).

## La simulación 3D

Un único archivo HTML, sin dependencias de red: el planeta, los tres soles, el Vacío, los cohetes de la Ventana, el mapa de los péndulos y el lector de los nueve volúmenes (con búsqueda, índice, ampliación del texto y reanudación de la lectura). Si el navegador no puede iniciar WebGL, el lector sigue siendo funcional.

Se reconstruye a partir del código fuente:

```bash
cd simulare
npm install
npm run build        # scrie ../dist/pendulul-3d.html și ../docs/index.html
```

## El aparato del mundo

En [`seria/`](seria/) están los materiales de trabajo: el [canon](seria/canon.md) (cifras y reglas del mundo), el [atlas](seria/atlas.md), la [cronología y el glosario](seria/cronologie-glosar.md). El subdirectorio [`seria/aparat/`](seria/aparat/) conserva las notas del autor, retiradas de la edición del lector. Contienen spoilers.

## Reconstrucción de la edición (EPUB, PDF)

Requiere `pandoc` y Python 3; para el PDF, también `playwright` (Chromium).

```bash
python3 scripts/build_book.py          # EPUB + PDF în dist/
python3 scripts/build_book.py epub     # doar EPUB
```

## Sobre la colaboración con la inteligencia artificial

La serie se escribió junto con un modelo de inteligencia artificial (Claude, Anthropic). La idea, el mundo, la estructura, las decisiones de canon y la selección final pertenecen al autor; el texto fue redactado, revisado y verificado en conjunto, en varias rondas (coherencia de cifras, nombres y cronología entre los volúmenes). La simulación 3D se construyó del mismo modo.

## Licencia

- **Textos y código** (libro, guía, serie, ediciones, simulación, scripts): [MIT](LICENSE). Puedes usar, copiar, modificar y redistribuir libremente, conservando el aviso de derechos de autor.
- **three.js** (incluido en el HTML): MIT, véase [NOTICE.md](NOTICE.md).

Para ediciones impresas, audio, traducciones o adaptaciones con fines comerciales, escribe al autor a través del perfil de GitHub.

## Historial / Changelog

### 1.0.1 — 2026-10-22
- La página de la simulación 3D (`docs/index.html`, publicada también por GitHub Pages) tiene ahora un service worker real y un manifiesto de aplicación web con iconos: es instalable y se abre sin conexión tras la primera visita. El archivo independiente `dist/pendulul-3d.html` no cambia de funcionamiento.
- Accesibilidad: exactamente un H1 y un punto de referencia main; ninguna infracción de axe-core a 360 px; todo el texto a un mínimo de 12 px; áreas táctiles mayores para los botones pequeños, los controles deslizantes y la casilla.
- Una Content-Security-Policy estricta (scripts solo por hash, sin red) está integrada en la página; la página no carga nada de terceros (sin CDN).

## Cómo citar

Véase [`CITATION.cff`](CITATION.cff).
