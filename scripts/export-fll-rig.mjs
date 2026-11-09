// Export articulated FLL teaching assets from the official LDraw Parts Library.
// Usage:
//   node scripts/export-fll-rig.mjs /path/to/ldraw
//   node scripts/export-fll-rig.mjs /path/to/ldraw --input scripts/assets/fll-field-cargo.ldr --output cargo
// The library directory must contain LDConfig.ldr, parts/, and p/.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Box3, Group, LoadingManager, Vector3} from 'three';
import {LDrawLoader} from 'three/examples/jsm/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const library = path.resolve(process.argv[2] || '');
const inputFlag = process.argv.indexOf('--input');
const outputFlag = process.argv.indexOf('--output');
const customInput = inputFlag < 0 ? null : path.resolve(process.argv[inputFlag + 1] || '');
const customOutput = outputFlag < 0 ? null : process.argv[outputFlag + 1];
const outputDir = path.join(repo, 'static/simulator/models/fll');
const scale = 0.04; // One LDraw unit is 0.4 mm. Three.js field coordinates are centimeters.

if (!fs.existsSync(path.join(library, 'LDConfig.ldr'))) {
  throw new Error('Pass the official LDraw library directory containing LDConfig.ldr.');
}
if ((customInput && !customOutput) || (!customInput && customOutput)) {
  throw new Error('Use --input FILE and --output NAME together.');
}
if (customOutput && !/^[a-z0-9-]+$/.test(customOutput)) {
  throw new Error('Output name must contain only lowercase letters, digits, and hyphens.');
}
if (customInput && !fs.existsSync(customInput)) throw new Error(`Input does not exist: ${customInput}`);

// GLTFExporter reads its final Blob through FileReader even in Node.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); }, (error) => { this.error = error; this.onerror?.(); });
  }
};
globalThis.ProgressEvent ??= class {
  constructor(type, values) { this.type = type; Object.assign(this, values); }
};

const unresolved = new Set();
const fileCache = new Map();
const manager = new LoadingManager();
manager.setURLModifier((url) => {
  if (!url.startsWith('ldraw/')) return url;
  const requested = url.slice('ldraw/'.length);
  const bare = requested.replace(/^(?:(?:parts|p)\/)+/, '');
  for (const candidate of [requested, bare, `parts/${bare}`, `p/${bare}`]) {
    const file = path.resolve(library, candidate);
    if (!file.startsWith(`${library}${path.sep}`) || !fs.existsSync(file)) continue;
    let data = fileCache.get(file);
    if (!data) { data = `data:text/plain;base64,${fs.readFileSync(file).toString('base64')}`; fileCache.set(file, data); }
    return data;
  }
  unresolved.add(requested);
  return 'data:text/plain,0%20Missing%20official%20LDraw%20part';
});
const loader = new LDrawLoader(manager).setPartsLibraryPath('ldraw/').setConditionalLineMaterial(LDrawConditionalLineMaterial);
await loader.preloadMaterials(`data:text/plain;base64,${fs.readFileSync(path.join(library, 'LDConfig.ldr')).toString('base64')}`);
loader.addDefaultMaterials();

async function parseLDraw(source, label) {
  const before = unresolved.size;
  const model = await new Promise((resolve, reject) => loader.parse(source.replace(/^\uFEFF/, ''), resolve, reject));
  if (unresolved.size > before) throw new Error(`${label} uses unavailable parts: ${[...unresolved].join(', ')}`);
  const outlines = [];
  model.traverse((item) => { if (item.isLineSegments) outlines.push(item); });
  outlines.forEach((item) => item.parent.remove(item));
  return model;
}

async function part(id, color = 16) {
  return parseLDraw(`0 FILE ${id}.ldr\n1 ${color} 0 0 0 1 0 0 0 1 0 0 0 1 ${id}\n0 NOFILE\n`, id);
}

// Rotation through X=pi converts LDraw's downward Y into Three.js upward Y.
function place(model, parent, name, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const pose = new Group();
  pose.name = name;
  pose.position.set(...position);
  pose.rotation.set(...rotation);
  const ldrawFrame = new Group();
  ldrawFrame.rotation.x = Math.PI;
  ldrawFrame.scale.setScalar(scale);
  ldrawFrame.add(model);
  pose.add(ldrawFrame);
  parent.add(pose);
  return pose;
}

async function exportGLB(name, root) {
  fs.mkdirSync(outputDir, {recursive: true});
  root.updateMatrixWorld(true);
  const glb = await new GLTFExporter().parseAsync(root, {binary: true, onlyVisible: true});
  const destination = path.join(outputDir, `${name}.glb`);
  fs.writeFileSync(destination, Buffer.from(glb));
  const bounds = new Box3().setFromObject(root);
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  console.log(`${name}: ${(fs.statSync(destination).size / 1024).toFixed(0)} KiB; center ${center.toArray().map((x) => x.toFixed(2))}; size ${size.toArray().map((x) => x.toFixed(2))} cm`);
}

if (customInput) {
  const source = fs.readFileSync(customInput, 'utf8');
  const root = new Group(); root.name = `fll-${customOutput}`;
  place(await parseLDraw(source, customInput), root, `official-ldraw-${customOutput}`);
  await exportGLB(customOutput, root);
} else {
  // The body is a minimal, supported SPIKE Prime assembly. Each visible piece
  // comes from the official library; the two 56 mm wheels and the lever are
  // separate assets so lessons can move only the mechanism they teach.
  const body = new Group(); body.name = 'fll-drivebase';
  place(await part('45601c01.dat'), body, 'prime-hub', [0, 3.0, 0], [0, -Math.PI / 2, 0]);
  for (const side of [-1, 1]) {
    // The LDraw motor output points along its local Y axis. Tip the two
    // motors toward their wheels so the output hubs share the wheel axles.
    place(await part('54675.dat', 322), body, `drive-motor-${side < 0 ? 'left' : 'right'}`, [-2.4, 2.8, side * 3.7], [side * Math.PI / 2, -Math.PI / 2, 0]);
    place(await part('32525.dat', 1), body, `side-beam-${side < 0 ? 'left' : 'right'}`, [0, 5.4, side * 3.2], [0, -Math.PI / 2, 0]);
  }
  for (const x of [-3.5, 3.5]) {
    place(await part('32525.dat', 1), body, `cross-beam-${x < 0 ? 'rear' : 'front'}`, [x, 5.2, 0]);
  }
  await exportGLB('drivebase', body);

  const wheel = new Group(); wheel.name = 'fll-wheel';
  place(await part('39367p01.dat', 0), wheel, '56mm-wheel');
  await exportGLB('wheel', wheel);

  // Pivot is at local (0,0,0); the beam and contact tip extend toward +X.
  const tool = new Group(); tool.name = 'fll-lever-tool';
  place(await part('32525.dat', 1), tool, 'lever-beam-11', [4.4, 0, 0], [0, -Math.PI / 2, 0]);
  place(await part('32523.dat', 322), tool, 'contact-tip-beam-3', [8.4, -0.8, 0], [Math.PI / 2, 0, 0]);
  await exportGLB('tool', tool);

  const attachmentMotor = new Group(); attachmentMotor.name = 'fll-attachment-motor';
  // Put the output shaft on +Z, the same axis used by the lever animation.
  const motorPose = place(await part('54696p01.dat'), attachmentMotor, 'medium-angular-motor', [0, 0, 0], [Math.PI / 2, Math.PI / 2, 0]);
  motorPose.updateMatrixWorld(true);
  motorPose.position.sub(new Box3().setFromObject(attachmentMotor).getCenter(new Vector3()));
  await exportGLB('attachment-motor', attachmentMotor);

  for (const [name, id] of [
    ['color-sensor', '37308.dat'],
    ['distance-sensor', '37316.dat'],
    ['force-sensor', '37312.dat'],
  ]) {
    const sensor = new Group(); sensor.name = `fll-${name}`;
    // In LDraw these sensors look toward -Z. The Y rotation makes their
    // optical or force face look toward the robot's +X forward direction.
    const pose = place(await part(id), sensor, name, [0, 0, 0], [0, Math.PI / 2, 0]);
    pose.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(sensor);
    const center = bounds.getCenter(new Vector3());
    pose.position.sub(center);
    await exportGLB(name, sensor);
  }

  // Practice props are authored as small assemblies of official library parts.
  // Keep the cargo at ground level and the target lever at its hinge pivot so
  // the lesson renderer can animate them independently.
  for (const name of ['cargo', 'obstacle', 'target-base', 'target-lever']) {
    const sourceFile = path.join(repo, `scripts/assets/fll-field-${name}.ldr`);
    const root = new Group(); root.name = `fll-${name}`;
    place(await parseLDraw(fs.readFileSync(sourceFile, 'utf8'), sourceFile), root, `official-ldraw-${name}`);
    await exportGLB(name, root);
  }
}
