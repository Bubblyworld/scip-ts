import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.lp': 'text/plain',
};

function getMimeType(path: string): string {
  return MIME_TYPES[extname(path)] || 'application/octet-stream';
}

function serveFile(filePath: string): { content: Buffer; mime: string } | null {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return null;
  }
  return {
    content: readFileSync(filePath),
    mime: getMimeType(filePath),
  };
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/api/examples') {
    const examplesDir = join(projectRoot, 'examples');
    const files = readdirSync(examplesDir)
      .filter((f) => f.endsWith('.lp'))
      .map((f) => f.replace('.lp', ''));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(files));
    return;
  }

  const staticMappings: Record<string, string> = {
    '/': join(__dirname, 'index.html'),
    '/app.js': join(__dirname, 'app.js'),
    '/styles.css': join(__dirname, 'styles.css'),
  };

  let filePath = staticMappings[pathname];

  if (!filePath) {
    const prefixes = [
      { prefix: '/dist/', dir: join(projectRoot, 'dist') },
      { prefix: '/build/', dir: join(projectRoot, 'build') },
      { prefix: '/examples/', dir: join(projectRoot, 'examples') },
    ];

    for (const { prefix, dir } of prefixes) {
      if (pathname.startsWith(prefix)) {
        filePath = join(dir, pathname.slice(prefix.length));
        break;
      }
    }
  }

  if (filePath) {
    const result = serveFile(filePath);
    if (result) {
      res.writeHead(200, { 'Content-Type': result.mime });
      res.end(result.content);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
