import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Box3, Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, 'static/simulator/models/fll');
const loader = new GLTFLoader();
const rig = JSON.parse(fs.readFileSync(path.join(folder, 'rig.json'), 'utf8'));
const closeTo = (value, target, message) => assert.ok(Math.abs(value - target) < 0.03, `${message}: ${value} vs ${target}`);
const expected = new Map([
  ['drivebase', '45601c01.dat'],
  ['wheel', '39367p01.dat'],
  ['tool', '32525.dat'],
  ['attachment-motor', '54696p01.dat'],
  ['color-sensor', '37308.dat'],
  ['distance-sensor', '37316.dat'],
  ['force-sensor', '37312.dat'],
  ['cargo', '3001.dat'],
  ['obstacle', '39790.dat'],
  ['target-base', '3958.dat'],
  ['target-lever', '32525.dat'],
]);

for (const [name, part] of expected) {
  const bytes = fs.readFileSync(path.join(folder, `${name}.glb`));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF', `${name} must be a GLB`);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  assert.ok(json.meshes?.length > 0, `${name} must contain part geometry`);
  assert.ok(json.nodes?.some((node) => node.name === part), `${name} must identify its LDraw part`);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const {scene} = await loader.parseAsync(buffer, '');
  const bounds = new Box3().setFromObject(scene);
  const size = bounds.getSize(new Vector3());
  assert.ok(size.x > 0 && size.y > 0 && size.z > 0, `${name} has empty bounds`);
  if (name === 'wheel') {
    assert.ok(Math.abs(size.x - 5.6) < 0.05 && Math.abs(size.y - 5.6) < 0.05,
      'the separately animated wheel must be the 56 mm part used by the simulator');
    assert.ok(Math.abs(bounds.getCenter(new Vector3()).length()) < 0.05,
      'the wheel must rotate about its center');
  }
  if (name === 'drivebase') {
    for (const [side, label] of [[-1, 'left'], [1, 'right']]) {
      const motor = scene.getObjectByName(`drive-motor-${label}`);
      assert.ok(motor, `the ${label} drive motor must have an independent CAD transform`);
      motor.updateWorldMatrix(true, false);
      const direction = new Vector3(0, 1, 0).transformDirection(motor.matrixWorld);
      const shaft = motor.localToWorld(new Vector3(0, 2, 0));
      closeTo(direction.y, 0, `${label} motor output must be horizontal`);
      closeTo(direction.z, side, `${label} motor output must face its wheel`);
      closeTo(shaft.x, -2.4, `${label} motor shaft x`);
      closeTo(shaft.y, 2.8, `${label} motor shaft height`);
      closeTo(shaft.z, side * 5.7, `${label} motor shaft side`);
    }
  }
  if (name === 'attachment-motor') {
    const motor = scene.getObjectByName('medium-angular-motor');
    assert.ok(motor);
    motor.updateWorldMatrix(true, false);
    const direction = new Vector3(0, 1, 0).transformDirection(motor.matrixWorld);
    const shaft = motor.localToWorld(new Vector3(0, 2, 0));
    closeTo(direction.z, 1, 'attachment motor output axis');
    closeTo(shaft.x, 2.42, 'attachment motor shaft x offset');
    closeTo(shaft.z, 1.6, 'attachment motor shaft z offset');
  }
  if (name === 'color-sensor') {
    const lensGapCm = rig.assets.colorSensor.mount[1] - bounds.max.x - 0.4;
    assert.ok(Math.abs(lensGapCm - 1.6) < 0.12,
      `the downward optical face must sit about 16 mm above the visible line: ${lensGapCm} cm`);
  }
  if (['cargo', 'obstacle', 'target-base'].includes(name)) {
    assert.ok(Math.abs(bounds.min.y) < 0.1, `${name} must sit on the field without sinking`);
  }
  if (name === 'target-lever') {
    assert.ok(bounds.min.x < 0.5 && bounds.max.x > 7,
      'the target lever must extend from its hinge pivot');
  }
}

assert.equal(rig.assets.wheel.diameterCm, 5.6);
assert.equal(rig.assets.wheel.rotationAxis, '+Z');
assert.deepEqual(rig.assets.wheel.leftMount, [-2.4, 2.8, -6.2]);
assert.deepEqual(rig.assets.wheel.rightMount, [-2.4, 2.8, 6.2]);
assert.equal(rig.assets.tool.rotationAxis, '+Z');
assert.equal(rig.assets.colorSensor.opticalDirection, '-Y');
assert.deepEqual(rig.assets.colorSensor.mountRotationDeg, [0, 0, -90]);
assert.match(fs.readFileSync(path.join(folder, 'ATTRIBUTION.txt'), 'utf8'), /official LDraw Parts Library/);
assert.match(fs.readFileSync(path.join(root, 'scripts/assets/fll-field-models-ATTRIBUTION.txt'), 'utf8'), /LDraw Parts Library/);

console.log('FLL official LDraw part exports, pivots, bounds, and attribution checks passed');
