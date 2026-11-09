const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {Readable} = require('node:stream');
const ts = require('typescript');
const {JSDOM} = require('jsdom');
const {middleware} = require('../plugins/local-markdown-editor');
const {blockId} = require('../plugins/local-markdown-editor/blocks');
const remarkLocalEditableBlocks = require('../plugins/local-markdown-editor/remark');

async function request(handler, method, source, body, origin = 'http://localhost:3000', host = 'localhost:3000', block = body?.block) {
  const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
  req.method = method;
  req.url = `/__telemark/local-markdown-editor?source=${encodeURIComponent(source)}&block=${encodeURIComponent(block)}`;
  req.headers = {
    host,
    ...(method === 'PUT' ? {'content-type': 'application/json', origin} : {}),
  };
  const res = {
    status: 0,
    setHeader() {},
    writeHead(status) {this.status = status;},
    end(data) {this.body = JSON.parse(data);},
  };
  await handler(req, res, () => {throw new Error('Unexpected next middleware');});
  return res;
}

async function main() {
  const {unified} = await import('unified');
  const {default: remarkParse} = await import('remark-parse');
  const {default: remarkMdx} = await import('remark-mdx');
  const {VFile} = await import('vfile');
  const sample = '# Heading\n\nA paragraph.\n\n- A list item\n\n```js\nconst x = 1;\n```\n';
  const processor = unified().use(remarkParse).use(remarkMdx).use(remarkLocalEditableBlocks);
  const tree = processor.parse(sample);
  await processor.run(tree, new VFile(sample));
  assert.ok(tree.children[0].data.hProperties['data-telemark-edit-block']);
  assert.ok(tree.children[1].data.hProperties['data-telemark-edit-block']);
  assert.ok(tree.children[2].children[0].data.hProperties['data-telemark-edit-block']);
  assert.equal(tree.children[3].data?.hProperties?.['data-telemark-edit-block'], undefined);

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'telemark-local-editor-'));
  const docDir = path.join(root, 'docs');
  const docPath = path.join(docDir, 'unit-00', 'lesson.mdx');
  const outsidePath = path.join(root, 'outside.mdx');
  const original = '# First version\n\nFirst paragraph.\n\nSecond paragraph.\n';
  const selectedText = 'First paragraph.';
  const block = blockId(original.indexOf(selectedText), original.indexOf(selectedText) + selectedText.length, selectedText);
  await fs.mkdir(path.dirname(docPath), {recursive: true});
  await fs.writeFile(docPath, original);
  await fs.writeFile(outsidePath, '# Outside\n');
  await fs.symlink(outsidePath, path.join(docDir, 'escape.mdx'));

  const handler = middleware(root);
  const source = '@site/docs/unit-00/lesson.mdx';
  const read = (name, selectedBlock = block) => request(handler, 'GET', name, null, undefined, undefined, selectedBlock);
  const save = (body, origin) => request(handler, 'PUT', body.source, body, origin);

  try {
    const initial = await read(source);
    assert.equal(initial.status, 200);
    const page = initial.body;
    assert.equal(page.content, selectedText);

    const saved = await save({source, block, content: 'Edited in browser.', revision: page.revision});
    assert.equal(saved.status, 200);
    const updated = original.replace(selectedText, 'Edited in browser.');
    assert.equal(await fs.readFile(docPath, 'utf8'), updated);

    const stale = await save({source, block, content: 'Stale edit.', revision: page.revision});
    assert.equal(stale.status, 409);
    assert.equal(await fs.readFile(docPath, 'utf8'), updated);

    const selected = (text, sourceText = updated) => blockId(
      sourceText.indexOf(text), sourceText.indexOf(text) + text.length, text,
    );
    const currentRevision = (await read(source, selected('Second paragraph.'))).body.revision;
    const headingBlock = selected('# First version');
    const firstBlock = selected('Edited in browser.');
    const secondBlock = selected('Second paragraph.');
    const batch = await save({source, revision: currentRevision, changes: [
      {block: headingBlock, content: '# Revised version'},
      {block: firstBlock, delete: true},
      {block: secondBlock, content: 'Second revised.'},
    ]});
    assert.equal(batch.status, 200);
    const batchResult = updated.replace('# First version', '# Revised version')
      .replace('Edited in browser.\n', '').replace('Second paragraph.', 'Second revised.');
    assert.equal(await fs.readFile(docPath, 'utf8'), batchResult);

    const freshRevision = (await read(source, selected('Second revised.', batchResult))).body.revision;
    const validEdit = {block: selected('Second revised.', batchResult), content: 'Another edit.'};
    const badBatch = await save({source, revision: freshRevision, changes: [
      validEdit, {block: '0:5:invalid', content: 'Bad edit.'},
    ]});
    assert.equal(badBatch.status, 409);
    assert.equal(await fs.readFile(docPath, 'utf8'), batchResult);
    const duplicate = await save({source, revision: freshRevision, changes: [validEdit, validEdit]});
    assert.equal(duplicate.status, 400);
    assert.equal(await fs.readFile(docPath, 'utf8'), batchResult);

    assert.equal((await read(source, '0:5:invalid')).status, 409);

    assert.equal((await read('@site/docs/../outside.mdx')).status, 404);
    assert.equal((await read('@site/docs/escape.mdx')).status, 404);
    assert.equal((await read('@site/src/pages/index.tsx')).status, 404);
    assert.equal((await save(
      {source, block, content: 'Attack', revision: page.revision},
      'https://unrelated.example',
    )).status, 403);
    assert.equal((await request(handler, 'GET', source, null, undefined, 'workshop.example:3000')).status, 403);
    assert.equal(await fs.readFile(outsidePath, 'utf8'), '# Outside\n');
  } finally {
    await fs.rm(root, {recursive: true, force: true});
  }
}

async function testStagedEditing() {
  const original = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
  const texts = ['First paragraph.', 'Second paragraph.', 'Third paragraph.'];
  const ids = texts.map((text) => blockId(
    original.indexOf(text), original.indexOf(text) + text.length, text,
  ));
  const html = '<!doctype html><html><body><div id="app"></div><div class="theme-doc-markdown">'
    + texts.map((text, index) => `<p data-telemark-edit-block="${ids[index]}">${text}</p>`).join('')
    + '</div></body></html>';
  const dom = new JSDOM(html, {url: 'http://localhost:3000/'});
  for (const key of ['window', 'document', 'HTMLElement', 'Element', 'MutationObserver', 'MouseEvent', 'Event', 'navigator']) {
    global[key] = dom.window[key];
  }
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const React = require('react');
  const {act} = React;
  const {createRoot} = require('react-dom/client');
  const {revision} = require('../plugins/local-markdown-editor/blocks');
  const savedRequests = [];
  global.fetch = async (url, options = {}) => {
    if (options.method === 'PUT') {
      savedRequests.push(JSON.parse(options.body));
      return {ok: true, json: async () => ({revision: 'saved'})};
    }
    const id = new URL(url, 'http://localhost:3000').searchParams.get('block');
    return {ok: true, json: async () => ({content: texts[ids.indexOf(id)], revision: revision(original)})};
  };
  const editorSource = await fs.readFile(path.join(__dirname, '../src/components/LocalMarkdownEditor.tsx'), 'utf8');
  const compiled = ts.transpileModule(editorSource, {compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
  const editorModule = {exports: {}};
  const mockRequire = (name) => name === '@docusaurus/useBaseUrl'
    ? {default: (value) => value}
    : name.endsWith('.module.css')
      ? {default: new Proxy({}, {get: (_, key) => key})}
      : require(name);
  new Function('require', 'module', 'exports', compiled)(mockRequire, editorModule, editorModule.exports);
  const root = createRoot(document.getElementById('app'));
  const click = async (element) => act(async () => {
    element.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
  });
  const button = (label) => Array.from(document.querySelectorAll('button'))
    .find((element) => element.textContent === label);
  const edit = async (text) => {
    const textarea = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    await act(async () => {
      setter.call(textarea, text);
      textarea.dispatchEvent(new Event('input', {bubbles: true}));
    });
  };

  try {
    await act(async () => root.render(React.createElement(editorModule.exports.default, {source: '@site/fll/test.mdx'})));
    await click(button('Enter Edit Mode'));
    const paragraphs = Array.from(document.querySelectorAll('.theme-doc-markdown p'));
    await click(paragraphs[0]);
    await edit('First edited.');
    await click(paragraphs[1]);
    await edit('Second edited.');
    await click(paragraphs[2]);
    await click(button('Delete block'));
    assert.equal(document.querySelector('.pending').textContent, '3 unsaved');
    assert.equal(savedRequests.length, 0);
    await click(button('Save Changes'));
    assert.equal(savedRequests.length, 1);
    assert.deepEqual(savedRequests[0].changes.map(({content, delete: deleted}) => ({content, deleted})), [
      {content: 'First edited.', deleted: undefined},
      {content: 'Second edited.', deleted: undefined},
      {content: undefined, deleted: true},
    ]);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
}

main().then(testStagedEditing).then(() => console.log('Local Markdown editor checks passed')).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
