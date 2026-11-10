// Build the local practice robot asset from the attributed BrickLink Studio LDraw export.
// Usage: node scripts/export-fll-robot.mjs /path/to/ldraw/library
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Box3, LoadingManager} from 'three';
import {LDrawLoader} from 'three/examples/jsm/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const library = path.resolve(process.argv[2] ?? '');
if (!fs.existsSync(path.join(library, 'LDConfig.ldr'))) {
  throw new Error('Pass the directory containing the official LDraw LDConfig.ldr file.');
}

// Three.js uses FileReader for the final Blob even when exporting only geometry.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); }, (error) => { this.error = error; this.onerror?.(); });
  }
};
globalThis.ProgressEvent ??= class {
  constructor(type, values) { this.type = type; Object.assign(this, values); }
};

const manager = new LoadingManager();
const unresolved = new Set();
const packed = fs.readFileSync(path.join(root, 'scripts/assets/fll-practice-robot-parts.ldr'), 'utf8').replace(/^\uFEFF/, '');
const embedded = new Map();
for (const section of packed.split(/^0 FILE /m).slice(1)) {
  const newline = section.indexOf('\n');
  const name = section.slice(0, newline).trim().toLowerCase();
  let body = section.slice(newline + 1).split(/^0 NOFILE/m)[0];
  // Studio's packed meshes use negative material slots. Restore LDraw's inherited color.
  body = body.replace(/^([1-5]) -(?:1|2|11) /gm, '$1 16 ');
  // Studio assigns its own internal white to the SPIKE hub lid as color 1.
  if (name === 'bb1142c01.dat') body = body.replace(/^([1-5]) 1 /gm, '$1 15 ');
  embedded.set(name, body);
}
const originalWarn = console.warn;
console.warn = (...args) => {
  if (/^(LDrawLoader|THREE\.GLTFExporter)/.test(String(args[0]))) return;
  originalWarn(...args);
};
manager.setURLModifier((url) => {
  if (!url.startsWith('ldraw/')) return url;
  const name = url.slice('ldraw/'.length);
  const bare = name.replace(/^(?:(?:parts|p)\/)+/, '');
  const candidates = [name, bare, `parts/${bare}`, `p/${bare}`];
  for (const candidate of candidates) {
    const file = path.resolve(library, candidate);
    if (file.startsWith(`${library}${path.sep}`) && fs.existsSync(file)) {
      return `data:text/plain;base64,${fs.readFileSync(file).toString('base64')}`;
    }
  }
  const embeddedPart = embedded.get(path.basename(name).toLowerCase());
  if (embeddedPart) return `data:text/plain;base64,${Buffer.from(embeddedPart).toString('base64')}`;
  unresolved.add(name);
  return 'data:text/plain,0%20Missing%20part';
});
const loader = new LDrawLoader(manager).setPartsLibraryPath('ldraw/').setConditionalLineMaterial(LDrawConditionalLineMaterial);
loader.missingColorMaterial.color.setHex(0x343b45);
loader.missingEdgeColorMaterial.color.setHex(0x343b45);
const colors = fs.readFileSync(path.join(library, 'LDConfig.ldr'));
await loader.preloadMaterials(`data:text/plain;base64,${colors.toString('base64')}`);
const source = fs.readFileSync(path.join(root, 'scripts/assets/fll-practice-robot.ldr'));
loader.addDefaultMaterials();
const model = await new Promise((resolve, reject) => loader.parse(source.toString().replace(/^\uFEFF/, ''), resolve, reject));

// Outline segments are useful in a CAD editor but substantially increase the game asset.
const outlineObjects = [];
model.traverse((object) => { if (object.isLineSegments) outlineObjects.push(object); });
outlineObjects.forEach((object) => object.parent.remove(object));
const bounds = new Box3().setFromObject(model);
console.log('LDraw bounds:', bounds.min.toArray(), bounds.max.toArray());
console.log('Missing part URLs:', [...unresolved]);
const unitCm = 0.04; // One LDraw unit is 0.4 mm, and the field uses centimeters.
model.rotation.x = Math.PI; // LDraw's vertical axis points down; Three.js uses up.
model.scale.setScalar(unitCm);
model.position.set(-(bounds.min.x + bounds.max.x) / 2 * unitCm, bounds.max.y * unitCm, (bounds.min.z + bounds.max.z) / 2 * unitCm);
model.updateMatrixWorld(true);

const glb = await new GLTFExporter().parseAsync(model, {binary: true, onlyVisible: true});
const target = path.join(os.tmpdir(), 'telemark-fll-practice-robot-raw.glb');
fs.writeFileSync(target, Buffer.from(glb));
console.log(`Wrote ${target} (${(fs.statSync(target).size / 1024 / 1024).toFixed(2)} MiB)`);
console.log('Optimize the raw file with: gltf-transform optimize RAW.glb static/simulator/models/fll-spike-practice-robot.glb --compress meshopt --simplify-ratio 0.45 --simplify-error 0.001 --palette false');
