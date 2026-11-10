const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/components/fll/pythonCompletions.ts'), 'utf8');
const {outputText} = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
});
const completionModule = {};
new Function('exports', outputText)(completionModule);
const {pythonCompletions, insertPythonCompletion} = completionModule;

const block = pythonCompletions('if', 2).find((item) => item.label === 'if');
assert.ok(block, 'typing if should offer the block preset');
assert.deepEqual(insertPythonCompletion('if', block), {code: 'if condition:\n    ', start: 3, end: 12});
for (const keyword of ['elif', 'else', 'def', 'return', 'for', 'while']) {
  assert.ok(pythonCompletions(keyword, keyword.length).some((item) => item.label === keyword), `${keyword} should be offered`);
}
const nested = 'def run():\n    el';
const elseBlock = pythonCompletions(nested, nested.length).find((item) => item.label === 'else');
assert.equal(insertPythonCompletion(nested, elseBlock).code, 'def run():\n    else:\n        ');

const studentCode = 'distance_sensor = 23\ndef route(speed):\n    for reading in values:\n        spe';
const suggestions = pythonCompletions(studentCode, studentCode.length);
assert.ok(suggestions.some((item) => item.label === 'speed' && item.detail === 'Defined name'));
assert.ok(pythonCompletions(studentCode.replace(/spe$/, 'rea'), studentCode.length).some((item) => item.label === 'reading'));
assert.ok(pythonCompletions(studentCode.replace(/spe$/, 'dis'), studentCode.length).some((item) => item.label === 'distance_sensor'));
assert.equal(pythonCompletions('"if"', 3).length, 0, 'strings should not suggest code');
assert.equal(pythonCompletions('# if ', 5, true).length, 0, 'comments should not suggest code');
assert.equal(pythonCompletions('robot.st', 8).length, 0, 'global keywords should not appear after a dot');
assert.equal(pythonCompletions('d', 1).length, 0, 'one character should not open the menu');
assert.ok(pythonCompletions('d', 1, true).some((item) => item.label === 'def'), 'Ctrl+Space should force suggestions');

const css = fs.readFileSync(path.join(root, 'src/components/fll/FllPythonPractice.module.css'), 'utf8');
assert.match(css, /\.shell:fullscreen \.workspace\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1\.1fr\) minmax\(0, \.9fr\)/);
assert.doesNotMatch(css, /\.shell:fullscreen \.workspace\s*\{[^}]*display:\s*block/);
console.log('FLL Python completions and fullscreen layout checks passed');
