// 零依赖静态服务器：用于预览 dist/ 构建产物（生产模式）
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, 'dist');
const port = Number(process.env.PORT || 4173);
const host = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.whl': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    const ext = extname(filePath);
    const cacheControl = (urlPath.startsWith('/micropython/') || urlPath.startsWith('/monaco/'))
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': cacheControl });
    res.end(readFileSync(filePath));
  } catch (e) {
    res.writeHead(500);
    res.end('Server Error: ' + String(e));
  }
});

server.listen(port, host, () => {
  console.log('NEXUS 静态预览服务： http://' + host + ':' + port + '  （先执行 npm run build）');
});
