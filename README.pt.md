# Pendulul

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Romance de ficção científica em nove volumes** de Alexio, em colaboração com Claude (Anthropic).

Um planeta oscila entre três estrelas e um buraco negro. Num mundo sem indústria, a civilização dispõe apenas de algumas janelas, cada vez mais curtas, em que os foguetes de pólvora podem alcançar a órbita. O período de cada pêndulo diminui quatro anos, e o leitor conta juntamente com as personagens.

## Como ler

Os volumes leem-se **por ordem, do 1 ao 9**. Cada um tem uma forma diferente.

| Vol. | Título | Forma |
| --- | --- | --- |
| 1 | [Arhivista](carte/01-arhivista.md) | romance, capítulos curtos |
| 2 | [Patru voci](carte/02-patru-voci.md) | capítulos duplos, «em cima» e «em baixo» |
| 3 | [Cinci faze](carte/03-cinci-faze.md) | cinco vozes e um atlas |
| 4 | [Arhivele](carte/04-arhivele.md) | romance epistolar, em 13 dossiês |
| 5 | [Fanarele](carte/05-fanarele.md) | crónica contada a partir de nós |
| 6 | [Cele douăzeci de pendule](carte/06-cele-douazeci-de-pendule.md) | uma cena de cada pêndulo |
| 7 | [Cel din toate pendulele](carte/07-cel-din-toate-pendulele.md) | um único narrador |
| 8 | [Cei care nu vorbesc](carte/08-cei-care-nu-vorbesc.md) | duas vozes invulgares |
| 9 | [Cel care ajustează orbita](carte/09-cel-care-ajusteaza-orbita.md) | contado por ordem inversa |

O [Guia do leitor](ghid/ghidul-cititorului.md) tem uma secção por volume, sem spoilers. Lê-o apenas até ao volume a que chegaste; a secção «Depois do volume 9» contém spoilers.

## Edições

| Formato | Ficheiro |
| --- | --- |
| EPUB (com capa) | [`dist/Pendulul.epub`](dist/Pendulul.epub) |
| PDF, formato A5, com marcadores | [`dist/Pendulul.pdf`](dist/Pendulul.pdf) |
| Simulação 3D + leitor, um único ficheiro HTML, funciona offline | [`dist/pendulul-3d.html`](dist/pendulul-3d.html) |
| Texto de todo o livro, Markdown | [`dist/Pendulul-ed-cititor.md`](dist/Pendulul-ed-cititor.md) |

Se o GitHub Pages estiver ativado para este repositório, a simulação funciona também no endereço da página do projeto (é servida a partir de `docs/`).

## A simulação 3D

Um único ficheiro HTML, sem dependências de rede: o planeta, os três sóis, o Vazio, os foguetes da Janela, o mapa dos pêndulos e o leitor dos nove volumes (com pesquisa, índice, ampliação do texto e retoma da leitura). Se o navegador não conseguir iniciar o WebGL, o leitor continua funcional.

Reconstrói-se a partir do código-fonte:

```bash
cd simulare
npm install
npm run build        # scrie ../dist/pendulul-3d.html și ../docs/index.html
```

## O aparato do mundo

Em [`seria/`](seria/) estão os materiais de trabalho: o [cânone](seria/canon.md) (números e regras do mundo), o [atlas](seria/atlas.md), a [cronologia e o glossário](seria/cronologie-glosar.md). O subdiretório [`seria/aparat/`](seria/aparat/) guarda as notas do autor, retiradas da edição do leitor. Contêm spoilers.

## Reconstrução da edição (EPUB, PDF)

Requer `pandoc` e Python 3; para o PDF, também `playwright` (Chromium).

```bash
python3 scripts/build_book.py          # EPUB + PDF în dist/
python3 scripts/build_book.py epub     # doar EPUB
```

## Sobre a colaboração com a inteligência artificial

A série foi escrita em conjunto com um modelo de inteligência artificial (Claude, Anthropic). A ideia, o mundo, a estrutura, as decisões de cânone e a seleção final pertencem ao autor; o texto foi redigido, revisto e verificado em conjunto, em várias rondas (coerência dos números, dos nomes e da cronologia entre volumes). A simulação 3D foi construída da mesma forma.

## Licença

- **Textos e código** (livro, guia, série, edições, simulação, scripts): [MIT](LICENSE). Podes usar, copiar, modificar e redistribuir livremente, mantendo o aviso de direitos de autor.
- **three.js** (incluído no HTML): MIT, ver [NOTICE.md](NOTICE.md).

Para edições impressas, áudio, traduções ou adaptações com fins comerciais, escreve ao autor através do perfil do GitHub.

## Como citar

Ver [`CITATION.cff`](CITATION.cff).
