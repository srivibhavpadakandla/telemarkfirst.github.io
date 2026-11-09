const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/components/fll/sceneMotion.ts'), 'utf8');
const {outputText} = ts.transpileModule(source, {compilerOptions: {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
}});
const motion = {};
new Function('exports', outputText)(motion);

const start = {xCm: -100, zCm: 38, headingDeg: 0, attachmentDeg: 0, objectX: -5, objectZ: 20, cargoLiftCm: 0, targetProgress: 0};
const end = {...start, xCm: -70, headingDeg: 360, attachmentDeg: 90, objectX: 10, cargoLiftCm: 3, targetProgress: 1};
assert.deepEqual(motion.interpolatePose(start, end, 0), start);
assert.deepEqual(motion.interpolatePose(start, end, 1), end);
const middle = motion.interpolatePose(start, end, 0.5);
assert.equal(middle.xCm, -85);
assert.equal(middle.headingDeg, 180, 'a full turn must not collapse to zero rotation');
assert.equal(middle.attachmentDeg, 45);
assert.equal(middle.cargoLiftCm, 1.5);
assert.equal(middle.targetProgress, 0.5);
assert.equal(motion.wheelTravelCm(start, {...start, xCm: -90}).left, 10);
const turning = motion.wheelTravelCm(start, {...start, headingDeg: 90});
assert.ok(turning.left > 0 && turning.right < 0, 'a point turn rotates wheels in opposite directions');

console.log('FLL pose interpolation and wheel travel checks passed');
