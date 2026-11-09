const fs = require('node:fs/promises');
const path = require('node:path');
const {revision, findBlock, applyBlockChanges} = require('./blocks');

const API_PATH = '/__telemark/local-markdown-editor';
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const DOC_ROOTS = new Set(['docs', 'mechanical', 'blocks', 'fll']);

function sourcePath(siteDir, source) {
  if (typeof source !== 'string' || !source.startsWith('@site/')) return null;
  const parts = source.slice('@site/'.length).split('/');
  if (
    parts.length < 2
    || !DOC_ROOTS.has(parts[0])
    || parts.some((part) => !part || part === '.' || part === '..' || part.includes('\\'))
    || !/\.mdx?$/.test(parts.at(-1))
  ) return null;
  return path.join(siteDir, ...parts);
}

async function resolveSource(siteDir, source) {
  const requestedPath = sourcePath(siteDir, source);
  if (!requestedPath) return null;
  const [realPath, rootPath] = await Promise.all([
    fs.realpath(requestedPath).catch(() => null),
    fs.realpath(path.join(siteDir, source.slice('@site/'.length).split('/')[0])),
  ]);
  if (!realPath || !realPath.startsWith(rootPath + path.sep)) return null;
  return realPath;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

function sameOrigin(req) {
  // A shared development server must not turn into a LAN file editor.
  const hostname = req.headers.host?.replace(/:\d+$/, '');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) return false;
  const origin = req.headers.origin;
  if (!origin) return req.method === 'GET';
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) {
    throw Object.assign(new Error('Expected JSON.'), {status: 415});
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw Object.assign(new Error('Page is too large to save here.'), {status: 413});
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON.'), {status: 400});
  }
}

function middleware(siteDir) {
  return async (req, res, next) => {
    let url;
    try {
      url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch {
      return next();
    }
    if (url.pathname !== API_PATH) return next();

    if (!sameOrigin(req)) return sendJson(res, 403, {error: 'Open the editor from this local site.'});
    if (req.method !== 'GET' && req.method !== 'PUT') {
      res.setHeader('Allow', 'GET, PUT');
      return sendJson(res, 405, {error: 'Method not allowed.'});
    }

    try {
      const body = req.method === 'PUT' ? await readJson(req) : null;
      const source = req.method === 'GET' ? url.searchParams.get('source') : body?.source;
      const filePath = await resolveSource(siteDir, source);
      if (!filePath) return sendJson(res, 404, {error: 'Markdown page not found.'});

      const current = await fs.readFile(filePath, 'utf8');
      const currentRevision = revision(current);
      if (req.method === 'GET') {
        const selected = findBlock(current, url.searchParams.get('block'));
        if (!selected) {
          return sendJson(res, 409, {error: 'This text block changed. Reload the page before editing it.'});
        }
        return sendJson(res, 200, {content: selected.content, revision: currentRevision});
      }
      if (typeof body?.revision !== 'string') {
        return sendJson(res, 400, {error: 'Missing page revision.'});
      }
      if (body.revision !== currentRevision) {
        return sendJson(res, 409, {error: 'This page changed on disk. Your edits are still here; reload after copying them.'});
      }
      const changes = Array.isArray(body.changes)
        ? body.changes
        : [{block: body.block, content: body.content}];
      const updated = applyBlockChanges(current, changes);
      await fs.writeFile(filePath, updated, 'utf8');
      return sendJson(res, 200, {revision: revision(updated)});
    } catch (error) {
      return sendJson(res, error.status || 500, {
        error: error.status ? error.message : 'Could not read or save this page. Check the local server.',
      });
    }
  };
}

module.exports = function localMarkdownEditor(context) {
  return {
    name: 'telemark-local-markdown-editor',
    configureWebpack(_config, isServer) {
      if (isServer) return {};
      return {
        devServer: {
          setupMiddlewares(middlewares) {
            middlewares.unshift({
              name: 'telemark-local-markdown-editor',
              middleware: middleware(context.siteDir),
            });
            return middlewares;
          },
        },
      };
    },
  };
};

module.exports.middleware = middleware;
