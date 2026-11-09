const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/telemark/fllSceneProfiles.ts'), 'utf8');
const {outputText} = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
});
const loadedModule = {exports: {}};
new Function('exports', 'module', outputText)(loadedModule.exports, loadedModule);
const {FLL_SCENE_PROFILES, getFllSceneProfile, getFllObstaclePosition, FLL_COLOR_SENSOR_MOUNT, FLL_COLOR_SENSOR_TILT_RAD, fllColorSensorFootprint} = loadedModule.exports;

const lessonIds = [];
for (let unit = 0; unit <= 14; unit += 1) {
  const directory = path.join(root, 'fll', `fll-unit-${String(unit).padStart(2, '0')}`);
  for (const name of fs.readdirSync(directory).filter((file) => file.endsWith('.mdx'))) {
    const mdx = fs.readFileSync(path.join(directory, name), 'utf8');
    const match = mdx.match(/<FllPythonPractice lessonId="([^"]+)"/);
    if (match) lessonIds.push(match[1]);
  }
}
assert.equal(lessonIds.length, 75, 'all Python FLL lessons should be counted');
assert.deepEqual(Object.keys(FLL_SCENE_PROFILES).sort(), lessonIds.sort(),
  'every Python lesson needs exactly one explicit scene profile');

const fieldNames = new Set(['home', 'line', 'obstacle', 'target', 'cargo', 'delivery']);
const robotNames = new Set(['drivebase', 'colorSensor', 'ultrasonicSensor', 'forceSensor', 'attachment', 'imu']);
const fullMissions = new Set([
  'fll-unit-02/mission-run-capstone',
  'fll-unit-11/mission-cycle-challenge',
  'fll-unit-13/match-plan-challenge',
  'fll-unit-14/full-match-capstone',
]);
for (const lessonId of lessonIds) {
  const profile = getFllSceneProfile(lessonId);
  assert.equal(profile.lessonId, lessonId);
  assert.equal(typeof profile.fullMission, 'boolean');
  for (const [key, allowed] of [['fieldObjects', fieldNames], ['robotParts', robotNames]]) {
    assert.ok(Array.isArray(profile[key]), `${lessonId}: ${key} must be an array`);
    assert.equal(new Set(profile[key]).size, profile[key].length, `${lessonId}: duplicate ${key}`);
    for (const value of profile[key]) assert.ok(allowed.has(value), `${lessonId}: unknown ${key} ${value}`);
  }
  assert.equal(profile.fullMission, fullMissions.has(lessonId), `${lessonId}: incorrect full mission flag`);
  if (profile.fullMission) assert.deepEqual(new Set(profile.fieldObjects), fieldNames,
    `${lessonId}: a full mission needs the complete practice field`);
}

assert.deepEqual(getFllSceneProfile('fll-unit-01/color-and-reflected-light').fieldObjects, ['line']);
assert.deepEqual(getFllSceneProfile('fll-unit-01/color-and-reflected-light').robotParts, ['drivebase', 'colorSensor']);
assert.deepEqual(getFllSceneProfile('fll-unit-01/distance-and-wait-until').fieldObjects, ['obstacle']);
assert.deepEqual(getFllSceneProfile('fll-unit-07/motor-angles').robotParts, ['attachment']);
assert.deepEqual(getFllSceneProfile('fll-unit-07/motor-angles').fieldObjects, []);
assert.deepEqual(getFllSceneProfile('fll-unit-10/force-contact').robotParts,
  ['drivebase', 'forceSensor', 'attachment']);
assert.deepEqual(getFllSceneProfile('fll-unit-13/mission-value').robotParts, []);
assert.deepEqual(getFllSceneProfile('fll-unit-13/time-budget').fieldObjects, []);
assert.deepEqual(getFllObstaclePosition(getFllSceneProfile('fll-unit-01/distance-and-wait-until')), {x: -65, z: 38});
assert.deepEqual(getFllObstaclePosition(getFllSceneProfile('fll-unit-10/ultrasonic-range')), {x: -65, z: 38});
assert.deepEqual(getFllObstaclePosition(getFllSceneProfile('fll-unit-04/decision-challenge')), {x: 20, z: 0});
assert.deepEqual(getFllObstaclePosition(getFllSceneProfile('fll-unit-14/full-match-capstone')), {x: 20, z: 0});
assert.deepEqual(FLL_COLOR_SENSOR_MOUNT, {xCm: 4.8, yCm: 3.2, zCm: -2.4});
assert.ok(Math.abs(Math.cos(FLL_COLOR_SENSOR_TILT_RAD)) < 1e-9 && Math.sin(FLL_COLOR_SENSOR_TILT_RAD) < -0.99,
  'the exported sensor optical +X direction must tilt down toward the field');
const sensorAtStart = fllColorSensorFootprint({xCm: -100, zCm: 38, headingDeg: 0});
assert.deepEqual(sensorAtStart, {x: -95.2, z: 35.6});
const sensorAfterTurn = fllColorSensorFootprint({xCm: 0, zCm: 0, headingDeg: 90});
assert.ok(Math.abs(sensorAfterTurn.x - 2.4) < 1e-9 && Math.abs(sensorAfterTurn.z - 4.8) < 1e-9);
assert.throws(() => getFllSceneProfile('fll-unit-00/design-as-simple-machines'), /No FLL simulator scene profile/);
assert.throws(() => getFllSceneProfile('fll-unit-99/unknown'), /No FLL simulator scene profile/);

console.log('FLL lesson scene profile coverage and isolation checks passed');
