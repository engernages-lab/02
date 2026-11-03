import { JSDOM } from 'jsdom';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const files = {
  '/p-classic.html': '<!doctype html><html><body><div id="root"></div><script src="/a-classic.js"></script></body></html>',
  '/p-module.html': '<!doctype html><html><body><div id="root"></div><script type="module" src="/a-module.js"></script></body></html>',
  '/a-classic.js': 'document.getElementById("root").dataset.ok = "CLASSIC-RAN";',
  '/a-module.js': 'document.getElementById("root").dataset.ok = "MODULE-RAN";',
};
const server = createServer((req, res) => {
  const body = files[req.url] || 'nf';
  res.writeHead(200, { 'Content-Type': req.url.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(body);
});

server.listen(4175, '127.0.0.1', async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  for (const page of ['/p-classic.html', '/p-module.html']) {
    const dom = await JSDOM.fromURL('http://127.0.0.1:4175' + page, {
      resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true,
    });
    await sleep(1500);
    console.log(page, '=>', dom.window.document.getElementById('root').dataset.ok || '(未执行)');
    dom.window.close();
  }
  server.close();
});
