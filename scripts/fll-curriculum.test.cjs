const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cache = new Map();
function loadTs(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const loaded = {exports: {}};
  cache.set(file, loaded);
  const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}});
  const localRequire = (id) => id.startsWith('.')
    ? loadTs(path.relative(root, path.resolve(path.dirname(file), `${id}.ts`)))
    : require(id);
  new Function('exports', 'require', 'module', outputText)(loaded.exports, localRequire, loaded);
  return loaded.exports;
}

const curriculum = loadTs('src/telemark/fllCurriculum.ts');
const runtime = loadTs('src/telemark/blocks/fllInterpreter.ts');
const sceneProfiles = loadTs('src/telemark/fllSceneProfiles.ts');
const pythonConfig = loadTs('src/telemark/fllPythonPractice.ts');

const rangeStarter = pythonConfig.fllPythonPracticeConfig('fll-unit-01/distance-and-wait-until').starter;
assert.match(rangeStarter, /while distance_sensor\.distance\(\) > 150/);
assert.match(rangeStarter, /robot\.stop\(\)/);
assert.match(pythonConfig.fllPythonPracticeConfig('fll-unit-01/distance-and-wait-until').goal, /obstacle/);
const lightStarter = pythonConfig.fllPythonPracticeConfig('fll-unit-01/color-and-reflected-light').starter;
assert.match(lightStarter, /robot\.straight\(750\)/);
assert.match(lightStarter, /print\("Line:", color_sensor\.reflection\(\)\)/);
const attachmentStarter = pythonConfig.fllPythonPracticeConfig('fll-unit-07/motor-angles').starter;
assert.match(attachmentStarter, /attachment\.run_angle/);
assert.doesNotMatch(attachmentStarter, /robot\.straight\(/);
const planningStarter = pythonConfig.fllPythonPracticeConfig('fll-unit-13/mission-value').starter;
assert.doesNotMatch(planningStarter, /robot\.straight\(/);

assert.equal(curriculum.FLL_UNITS.length, 15);
assert.equal(curriculum.FLL_LESSONS.length, 80);
assert.equal(curriculum.FLL_LESSONS.filter((lesson) => curriculum.isFllChallenge(lesson.id)).length, 15);
assert.equal(new Set(curriculum.FLL_LESSONS.map((lesson) => lesson.id)).size, 80);

const mechanicalSlugs = [
  'design-as-simple-machines',
  'what-simple-machines-do',
  'read-missions-as-machines',
  'build-a-mission-mechanism',
  'secure-and-support-the-robot',
];
assert.deepEqual(
  curriculum.FLL_LESSONS.slice(0, 6).map((lesson) => lesson.id),
  [...mechanicalSlugs, 'what-is-fll-challenge'].map((slug) => `fll-unit-00/${slug}`),
);
assert.equal(curriculum.FLL_UNITS[0].startPath, '/fll/unit-00/design-as-simple-machines');
assert.equal(curriculum.FLL_UNITS[0].lessonCount, 10);
assert.match(curriculum.FLL_LESSONS[5].label, /^F0\.1 ·/);

for (const unit of curriculum.FLL_UNITS) {
  const directory = path.join(root, 'fll', unit.slug);
  const categoryPath = path.join(directory, '_category_.json');
  assert.ok(fs.existsSync(categoryPath));
  const category = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
  assert.equal(category.link, undefined, `${unit.slug} category header must only toggle lessons`);
  assert.equal(fs.readdirSync(directory).some((file) => file.endsWith('overview.mdx')), false);
}
for (const [index, lesson] of curriculum.FLL_LESSONS.entries()) {
  const directory = path.join(root, 'fll', lesson.unitSlug);
  const source = fs.readdirSync(directory).filter((file) => file.endsWith('.mdx'))
    .map((file) => fs.readFileSync(path.join(directory, file), 'utf8'))
    .find((text) => text.includes(`lessonId="${lesson.id}"`));
  assert.ok(source, `${lesson.id} has no FLL lesson`);
  if (mechanicalSlugs.includes(lesson.id.split('/')[1])) {
    assert.doesNotMatch(source, /<FllPythonPractice/);
    assert.match(source, /## Check and adjust/);
    assert.match(source, /<MarkComplete/);
    assert.match(source, new RegExp(`sidebar_position: ${index + 1}\\b`));
    const next = curriculum.FLL_LESSONS[index + 1];
    assert.ok(source.includes(`nextUnit="${next.path}"`), `${lesson.id} must lead to ${next.id}`);
  } else {
    assert.match(source, /<FllPythonPractice/);
    assert.match(source, /## Simulator practice/);
    if (!curriculum.isFllChallenge(lesson.id)) {
      assert.match(source, /## On the robot/);
      assert.match(source, /<MarkComplete/);
    }
  }
  assert.doesNotMatch(source, /—/, `${lesson.id} contains an em dash`);
}

const mechanicalSources = mechanicalSlugs.map((slug) => fs.readFileSync(
  path.join(root, 'fll/fll-unit-00', `0.0${mechanicalSlugs.indexOf(slug) + 1}-${slug}.mdx`), 'utf8',
));
assert.match(mechanicalSources[0], /input.*output/s);
for (const name of ['Lever', 'Wheel and axle', 'Pulley', 'Inclined plane', 'Wedge', 'Screw']) {
  assert.ok(mechanicalSources[1].includes(name), `missing simple machine ${name}`);
}
assert.match(mechanicalSources[2], /model itself and the robot's tool/);
assert.match(mechanicalSources[3], /three trials/);
assert.match(mechanicalSources[4], /cantilever/i);
assert.match(mechanicalSources[4], /second frame support/);

const references = fs.readFileSync(path.join(root, 'fll/references.mdx'), 'utf8');
for (const required of ['docs.pybricks.com', 'pybricks.com', 'Robot Game']) assert.ok(references.includes(required));
assert.doesNotMatch(references, /—/);

let nextId = 0;
function block(type, fields = {}, inputs = {}) {
  return {id: `fll-test-${nextId += 1}`, type, fields, inputs, next: null,
    getFieldValue(name) { return this.fields[name] ?? null; },
    getInputTargetBlock(name) { return this.inputs[name] ?? null; },
    getNextBlock() { return this.next; }};
}
function chain(...items) { items.slice(0, -1).forEach((item, index) => { item.next = items[index + 1]; }); return items[0]; }
const num = (value) => block('math_number', {NUM: String(value)});
const drive = (value) => block('fll_drive', {DIRECTION: 'FORWARD'}, {DISTANCE: num(value)});
const start = block('fll_start');
start.next = chain(
  block('fll_set_speed', {}, {SPEED: num(40)}),
  drive(90),
  block('fll_turn', {DIRECTION: 'RIGHT'}, {ANGLE: num(180)}),
  drive(90),
);
const roundTrip = runtime.runFllProgram({getTopBlocks: () => [start]});
assert.equal(roundTrip.error, null);
assert.equal(roundTrip.scene.missions.crossedLine, true);
assert.equal(roundTrip.scene.missions.atHome, true);
assert.equal(roundTrip.repeatabilityPasses, 3);
assert.ok(roundTrip.scene.elapsedSeconds > 0 && roundTrip.scene.elapsedSeconds < 150);
assert.ok(roundTrip.playback.some((frame) => frame.kind === 'drive'));
assert.ok(roundTrip.playback.some((frame) => frame.kind === 'turn'));

const lineStart = block('fll_start');
lineStart.next = block('fll_wait_line', {}, {REFLECTION: num(35)});
const lineResult = runtime.runFllProgram({getTopBlocks: () => [lineStart]});
assert.equal(lineResult.error, null);
assert.ok(lineResult.scene.reflection < 35);
assert.ok(Math.abs(sceneProfiles.fllColorSensorFootprint(lineResult.scene).x + 20) < 3);
assert.ok(lineResult.scene.xCm < -20, 'the front color sensor reaches the line before the robot center');

const collisionStart = block('fll_start'); collisionStart.next = drive(500);
const collision = runtime.runFllProgram({getTopBlocks: () => [collisionStart]});
assert.match(collision.error, /collided/i);
assert.equal(collision.scene.collision, true);

const focusedStart = block('fll_start'); focusedStart.next = drive(30);
const clearLane = runtime.runFllProgram({getTopBlocks: () => [focusedStart]}, []);
assert.equal(clearLane.error, null, 'hidden mission pieces must not cause collisions');
assert.equal(clearLane.scene.missions.atHome, false, 'hidden home must not count as a mission state');
const focusedObstacle = runtime.runFllProgram({getTopBlocks: () => [focusedStart]}, ['obstacle']);
assert.match(focusedObstacle.error, /collided/i, 'focused obstacle should be in the launch lane');
assert.equal(runtime.initialFllScene(['obstacle']).distanceCm, 23);
assert.equal(runtime.initialFllScene([]).distanceCm, 200);
const lineCrossingStart = block('fll_start'); lineCrossingStart.next = drive(90);
assert.equal(runtime.runFllProgram({getTopBlocks: () => [lineCrossingStart]}, ['line']).scene.score, 10);
assert.equal(runtime.runFllProgram({getTopBlocks: () => [lineCrossingStart]}, []).scene.score, 0);
const lineAtSensorStart = block('fll_start'); lineAtSensorStart.next = drive(75);
assert.equal(runtime.runFllProgram({getTopBlocks: () => [lineAtSensorStart]}, ['line']).scene.reflection, 18);

const practice = fs.readFileSync(path.join(root, 'src/components/blocks/FllPractice.tsx'), 'utf8');
const scene = fs.readFileSync(path.join(root, 'src/components/fll/FllRobotScene3D.tsx'), 'utf8');
assert.doesNotMatch(practice, /window\.(?:alert|confirm|prompt)\s*\(/, 'FLL practice uses in-page confirmation cards');
for (const required of ['telemark:fll:workspace:v1:', 'Download', 'Import', 'requestFullscreen', 'prefers-reduced-motion', 'fll_challenge_pass']) assert.ok(practice.includes(required));
for (const required of ['OrbitControls', 'WebGLRenderer', 'disposeObject', 'ResizeObserver', 'FLL practice scene', 'BIOGLOW field preview', 'WebGL is unavailable']) assert.ok(scene.includes(required));

const homepage = fs.readFileSync(path.join(root, 'src/pages/index.tsx'), 'utf8');
assert.match(homepage, /Learn FTC/);
assert.match(homepage, /Begin Software/);
assert.match(homepage, /Begin Mechanical/);
assert.match(homepage, /Learn Pybricks/);

const pythonPractice = fs.readFileSync(path.join(root, 'src/components/fll/FllPythonPractice.tsx'), 'utf8');
const mdxComponents = fs.readFileSync(path.join(root, 'src/theme/MDXComponents.tsx'), 'utf8');
assert.match(pythonPractice, /Worker/);
assert.match(mdxComponents, /FllPythonPractice/);

const siteConfig = fs.readFileSync(path.join(root, 'docusaurus.config.ts'), 'utf8');
const fllSidebar = fs.readFileSync(path.join(root, 'sidebarsFll.ts'), 'utf8');
const blocksSidebar = fs.readFileSync(path.join(root, 'sidebarsBlocks.ts'), 'utf8');
const search = fs.readFileSync(path.join(root, 'plugins/telemark-search/index.js'), 'utf8');
assert.match(siteConfig, /id: 'fll',[\s\S]*?path: 'fll',[\s\S]*?routeBasePath: 'fll'/);
assert.match(siteConfig, /to: '\/fll',[\s\S]*?label: 'FLL Robotics'/);
assert.match(fllSidebar, /fllSidebar/);
assert.doesNotMatch(blocksSidebar, /fll/i);
assert.match(search, /track: 'fll',[\s\S]*?routeBase: '\/fll'/);
assert.equal(fs.existsSync(path.join(root, 'blocks/fll')), false);
assert.equal(fs.existsSync(path.join(root, 'fll/index.mdx')), false);
assert.match(fs.readFileSync(path.join(root, 'src/pages/fll.tsx'), 'utf8'), /\/fll\/unit-00\/design-as-simple-machines/);

console.log('FLL curriculum, runtime, and simulator integration checks passed');
