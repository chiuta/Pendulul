// node scripts/html2pdf.mjs intrare.html iesire.pdf  (necesită: npm i playwright)
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const [,, inp, out] = process.argv;
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve(inp)).href, { waitUntil: 'load' });
await p.pdf({ path: out, format: 'A5', printBackground: true, displayHeaderFooter: true, outline: true, tagged: true,
  margin: { top: '17mm', bottom: '19mm', left: '15mm', right: '15mm' },
  headerTemplate: '<span></span>',
  footerTemplate: '<div style="font:7pt serif;width:100%;text-align:center;color:#555"><span class="pageNumber"></span></div>' });
await b.close();
